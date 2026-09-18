import { CatalogService } from '../src/modules/catalog/catalog.service';
import { CategoryService } from '../src/modules/categories/category.service';
import { AdminService } from '../src/modules/admin/admin.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { prisma } from '../src/config/database';
import { PricingType, VendorStatus } from '@prisma/client';
import { BadRequestError } from '../src/common/utils/app-error';

async function runCatalogTests() {
  console.log('===================================================');
  console.log('🚀 Running Shubh Ausar Phase 5 Catalog Tests');
  console.log('===================================================');

  const catalogService = new CatalogService();
  const categoryService = new CategoryService();
  const adminService = new AdminService();
  const authService = new AuthService();

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  const ts = Date.now();
  const providerEmailA = `vendor.cat.a.${ts}@test.local`;
  const providerEmailB = `vendor.cat.b.${ts}@test.local`;
  const testPhoneA = `+9195${ts.toString().slice(-8)}`;
  const testPhoneB = `+9194${ts.toString().slice(-8)}`;

  try {
    // -------------------------------------------------------------
    // Setup: Create 2 vendors (A will be approved, B will remain pending)
    // -------------------------------------------------------------
    console.log('\n[Setup: Test Providers & Category]');
    const regA = await authService.registerProvider({
      name: 'Vendor A Decor & Food',
      email: providerEmailA,
      phone: testPhoneA,
      password: 'password',
      businessName: 'Royal Celebrations A',
      city: 'Delhi',
    });

    const regB = await authService.registerProvider({
      name: 'Vendor B Sound',
      email: providerEmailB,
      phone: testPhoneB,
      password: 'password',
      businessName: 'DJ Beats B',
      city: 'Gurugram',
    });

    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });
    assert(adminUser !== null, 'Admin user exists in database');
    const adminId = adminUser!.id;

    // Approve Vendor A
    const vendorA = await prisma.vendor.findUnique({ where: { userId: regA.user.id } });
    assert(vendorA !== null, 'Vendor A profile created');
    await adminService.moveToUnderReview(vendorA!.id, adminId);
    await adminService.approveVendor(vendorA!.id, adminId);
    const approvedVendorA = await prisma.vendor.findUnique({ where: { id: vendorA!.id } });
    assert(approvedVendorA?.status === VendorStatus.APPROVED, 'Vendor A is approved by admin');

    // Vendor B profile
    const vendorB = await prisma.vendor.findUnique({ where: { userId: regB.user.id } });
    assert(vendorB !== null, 'Vendor B profile created');

    // Create a base category via Admin
    const category = await categoryService.createCategory({
      name: `Wedding Stage Decor ${ts}`,
      description: 'Stage decoration services',
    }, adminId);
    assert(Boolean(category.id), 'Admin created stage decor category');

    // -------------------------------------------------------------
    // Test 1: Service Creation with Pricing Types
    // -------------------------------------------------------------
    console.log('\n[Group 1: Service Creation & Pricing Types]');

    // 1.1 FIXED pricing service
    const fixedService = await catalogService.createService(vendorA!.id, {
      categoryId: category.id,
      name: 'Premium Flower Mandap',
      description: 'Exotic fresh flowers mandap setup',
      pricingType: PricingType.FIXED,
      basePrice: 50000,
    }, regA.user.id);
    assert(fixedService.basePrice === 50000, 'FIXED pricing service created with correct basePrice');
    assert(fixedService.slug.startsWith('premium-flower-mandap'), 'Deterministic slug generated for service');

    // 1.2 PER_PERSON pricing service
    const perPersonService = await catalogService.createService(vendorA!.id, {
      categoryId: category.id,
      name: 'Royal Shahi Buffet',
      description: '5-course vegetarian royal feast',
      pricingType: PricingType.PER_PERSON,
      basePrice: 1200,
      minQuantity: 150,
    }, regA.user.id);
    assert(perPersonService.pricingType === PricingType.PER_PERSON, 'PER_PERSON service created');
    assert(perPersonService.minQuantity === 150, 'PER_PERSON minimum guest quantity saved');

    // 1.3 PER_DAY pricing service
    const perDayService = await catalogService.createService(vendorA!.id, {
      categoryId: category.id,
      name: 'Vintage Rolls Royce Wedding Car',
      pricingType: PricingType.PER_DAY,
      basePrice: 25000,
    }, regA.user.id);
    assert(perDayService.pricingType === PricingType.PER_DAY, 'PER_DAY service created');

    // 1.4 PER_HOUR pricing service
    const perHourService = await catalogService.createService(vendorA!.id, {
      categoryId: category.id,
      name: 'Sangeet Choreography Session',
      pricingType: PricingType.PER_HOUR,
      basePrice: 3000,
    }, regA.user.id);
    assert(perHourService.pricingType === PricingType.PER_HOUR, 'PER_HOUR service created');

    // 1.5 PER_UNIT pricing service
    const perUnitService = await catalogService.createService(vendorA!.id, {
      categoryId: category.id,
      name: 'Handcrafted Mithai Boxes',
      pricingType: PricingType.PER_UNIT,
      basePrice: 450,
      minQuantity: 50,
    }, regA.user.id);
    assert(perUnitService.pricingType === PricingType.PER_UNIT, 'PER_UNIT service created');

    // 1.6 CUSTOM_QUOTE pricing service
    const quoteService = await catalogService.createService(vendorA!.id, {
      categoryId: category.id,
      name: 'Complete Bespoke Destination Theme Decor',
      pricingType: PricingType.CUSTOM_QUOTE,
      minPrice: 150000,
      maxPrice: 500000,
    }, regA.user.id);
    assert(quoteService.pricingType === PricingType.CUSTOM_QUOTE, 'CUSTOM_QUOTE service created');
    assert(quoteService.minPrice === 150000 && quoteService.maxPrice === 500000, 'CUSTOM_QUOTE price bounds saved');

    // -------------------------------------------------------------
    // Test 2: Pricing Validations
    // -------------------------------------------------------------
    console.log('\n[Group 2: Pricing Validation Safeguards]');

    let fixedPriceErrorCaught = false;
    try {
      await catalogService.createService(vendorA!.id, {
        categoryId: category.id,
        name: 'Invalid Fixed Service',
        pricingType: PricingType.FIXED,
        // Missing basePrice
      });
    } catch (err: any) {
      fixedPriceErrorCaught = true;
    }
    assert(fixedPriceErrorCaught, 'Rejects FIXED service without basePrice');

    let quoteBoundsErrorCaught = false;
    try {
      await catalogService.createService(vendorA!.id, {
        categoryId: category.id,
        name: 'Inverted Quote Bounds',
        pricingType: PricingType.CUSTOM_QUOTE,
        minPrice: 500000,
        maxPrice: 100000, // min > max
      });
    } catch (err: any) {
      quoteBoundsErrorCaught = true;
    }
    assert(quoteBoundsErrorCaught, 'Rejects CUSTOM_QUOTE when minPrice > maxPrice');

    // -------------------------------------------------------------
    // Test 3: Gallery & Primary Image Swapping Atomicity
    // -------------------------------------------------------------
    console.log('\n[Group 3: Service Image Gallery & Primary Swapping]');

    // Add first image as primary
    const img1 = await catalogService.addServiceImage(vendorA!.id, fixedService.id, {
      url: 'https://images.unsplash.com/photo-mandap-1.jpg',
      isPrimary: true,
      sortOrder: 1,
    });
    assert(img1.isPrimary === true, 'First image set as primary');

    // Add second image NOT as primary
    const img2 = await catalogService.addServiceImage(vendorA!.id, fixedService.id, {
      url: 'https://images.unsplash.com/photo-mandap-2.jpg',
      isPrimary: false,
      sortOrder: 2,
    });
    assert(img2.isPrimary === false, 'Second image initially secondary');

    // Swap primary: make img2 primary
    await catalogService.setPrimaryServiceImage(vendorA!.id, fixedService.id, img2.id);

    // Verify img1 was atomically demoted and img2 is now primary
    const imagesAfterSwap = await catalogService.listServiceImages(vendorA!.id, fixedService.id);
    const img1After = imagesAfterSwap.find((i) => i.id === img1.id);
    const img2After = imagesAfterSwap.find((i) => i.id === img2.id);

    assert(img2After?.isPrimary === true, 'Image 2 successfully promoted to primary');
    assert(img1After?.isPrimary === false, 'Image 1 atomically demoted to secondary');

    // -------------------------------------------------------------
    // Test 4: Package Bundles & Discount Calculation
    // -------------------------------------------------------------
    console.log('\n[Group 4: Package Bundles & Auto Discount]');

    const weddingPackage = await catalogService.createPackage(vendorA!.id, {
      name: 'Grand Wedding Mandap & Banquet Combo',
      description: 'Includes Stage Mandap and Royal Buffet',
      price: 150000,
      originalPrice: 200000,
      services: [
        { serviceId: fixedService.id, quantity: 1 },
        { serviceId: perPersonService.id, quantity: 100 },
      ],
    }, regA.user.id);

    assert(weddingPackage.price === 150000, 'Package price saved');
    assert(weddingPackage.originalPrice === 200000, 'Package original price saved');
    assert(weddingPackage.discountPercent === 25, 'Discount percent automatically calculated (25%)');
    assert(weddingPackage.services.length === 2, 'Package bundles 2 owned services');

    // -------------------------------------------------------------
    // Test 5: Cross-Vendor Security Check
    // -------------------------------------------------------------
    console.log('\n[Group 5: Cross-Vendor Packaging Prohibition]');

    // Approve Vendor B so they can create a service
    await adminService.moveToUnderReview(vendorB!.id, adminId);
    await adminService.approveVendor(vendorB!.id, adminId);
    const vendorBService = await catalogService.createService(vendorB!.id, {
      categoryId: category.id,
      name: 'DJ Beats Sound Rig',
      pricingType: PricingType.FIXED,
      basePrice: 20000,
    }, regB.user.id);

    let crossVendorCaught = false;
    try {
      // Vendor A attempts to package Vendor B's service
      await catalogService.createPackage(vendorA!.id, {
        name: 'Malicious Cross-Vendor Package',
        price: 60000,
        services: [
          { serviceId: fixedService.id, quantity: 1 },
          { serviceId: vendorBService.id, quantity: 1 }, // Vendor B's service!
        ],
      });
    } catch (err: any) {
      if (err instanceof BadRequestError && err.message.includes('Cross-vendor packaging is prohibited')) {
        crossVendorCaught = true;
      }
    }
    assert(crossVendorCaught, 'Cross-vendor packaging strictly blocked');

    // -------------------------------------------------------------
    // Test 6: Granular Package Services Management
    // -------------------------------------------------------------
    console.log('\n[Group 6: Granular Package Services Management]');

    // Add perDayService to weddingPackage
    await catalogService.addServiceToPackage(vendorA!.id, weddingPackage.id, perDayService.id, 1);
    const pkgWithAdded = await catalogService.getVendorPackage(vendorA!.id, weddingPackage.id);
    assert(pkgWithAdded.services.some((s) => s.serviceId === perDayService.id), 'Service added to package');

    // Update quantity of perPersonService in package
    await catalogService.updatePackageService(vendorA!.id, weddingPackage.id, perPersonService.id, 200);
    const pkgWithUpdated = await catalogService.getVendorPackage(vendorA!.id, weddingPackage.id);
    const updatedSvc = pkgWithUpdated.services.find((s) => s.serviceId === perPersonService.id);
    assert(updatedSvc?.quantity === 200, 'Package service quantity updated to 200');

    // Remove perDayService from package
    await catalogService.removeServiceFromPackage(vendorA!.id, weddingPackage.id, perDayService.id);
    const pkgWithRemoved = await catalogService.getVendorPackage(vendorA!.id, weddingPackage.id);
    assert(!pkgWithRemoved.services.some((s) => s.serviceId === perDayService.id), 'Service removed from package');

    // -------------------------------------------------------------
    // Test 7: Public Discovery & Filtering
    // -------------------------------------------------------------
    console.log('\n[Group 7: Public Discovery & Filtering]');

    const publicServices = await catalogService.listPublicServices({
      categoryId: category.id,
      city: 'Delhi',
    });
    assert(publicServices.services.length >= 1, 'Public discovery finds services in Delhi under category');
    assert(publicServices.services.every((s) => s.isActive && s.isAvailable), 'Public discovery only returns active/available items');

    const searchResult = await catalogService.listPublicServices({
      search: 'Mandap',
    });
    assert(searchResult.services.some((s) => s.id === fixedService.id), 'Search by keyword finds target service');

    // -------------------------------------------------------------
    // Test 8: Admin Moderation
    // -------------------------------------------------------------
    console.log('\n[Group 8: Admin Moderation]');

    // Admin deactivates fixedService
    await catalogService.moderateServiceStatus(fixedService.id, false, adminId);
    const moderatedSvc = await prisma.service.findUnique({ where: { id: fixedService.id } });
    assert(moderatedSvc?.isActive === false, 'Admin deactivated service');

    // Public search must no longer return fixedService
    const publicAfterDeactivation = await catalogService.listPublicServices({ search: 'Mandap' });
    assert(!publicAfterDeactivation.services.some((s) => s.id === fixedService.id), 'Deactivated service is hidden from public discovery');

    // Admin reactivates service
    await catalogService.moderateServiceStatus(fixedService.id, true, adminId);
    const reactivatedSvc = await prisma.service.findUnique({ where: { id: fixedService.id } });
    assert(reactivatedSvc?.isActive === true, 'Admin reactivated service');

    // -------------------------------------------------------------
    // Test 9: End-to-End Step 57 Dynamic Verification
    // Admin creates Category -> Provider creates Service -> Customer discovers it
    // -------------------------------------------------------------
    console.log('\n[Group 9: End-to-End Step 57 Verification Flow]');

    const step57Category = await categoryService.createCategory({
      name: `Traditional Shehnai & Folk ${ts}`,
      description: 'Auspicious live musical accompaniments',
    }, adminId);
    assert(Boolean(step57Category.id), 'Step 57: Admin dynamically created new category');

    const step57Service = await catalogService.createService(vendorA!.id, {
      categoryId: step57Category.id,
      name: `Varanasi Shubh Shehnai Vadan ${ts}`,
      description: 'Auspicious wedding welcoming shehnai melody',
      pricingType: PricingType.PER_DAY,
      basePrice: 18000,
    }, regA.user.id);
    assert(Boolean(step57Service.id), 'Step 57: Provider created service under the newly created category');

    const step57Discovery = await catalogService.listPublicServices({
      categoryId: step57Category.id,
    });
    const foundStep57 = step57Discovery.services.find((s) => s.id === step57Service.id);
    assert(Boolean(foundStep57), 'Step 57: Customer public discovery dynamically retrieves newly created service');
    assert(foundStep57?.category.name === step57Category.name, 'Step 57: Service category metadata properly populated');
    assert(foundStep57?.vendor?.businessName === 'Royal Celebrations A', 'Step 57: Service vendor metadata properly populated');

  } catch (error: any) {
    console.error('Fatal error during catalog tests:', error);
    failed++;
  }

  console.log('\n===================================================');
  console.log(`Test Results: ${passed} PASSED | ${failed} FAILED`);
  console.log('===================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCatalogTests()
  .catch((err) => {
    console.error('Catalog test suite unhandled exception:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

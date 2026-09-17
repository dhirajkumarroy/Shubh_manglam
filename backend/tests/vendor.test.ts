import { VendorService } from '../src/modules/vendors/vendor.service';
import { CategoryService } from '../src/modules/categories/category.service';
import { AdminService } from '../src/modules/admin/admin.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { prisma } from '../src/config/database';
import { VendorStatus, DocumentType, DocumentStatus } from '@prisma/client';
import { BadRequestError, ForbiddenError } from '../src/common/utils/app-error';


async function runVendorTests() {
  console.log('===================================================');
  console.log('🚀 Running Shubh Mangalam Phase 4 Vendor Tests');
  console.log('===================================================');

  const vendorService = new VendorService();
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
  const providerEmailA = `vendor.a.${ts}@test.local`;
  const providerEmailB = `vendor.b.${ts}@test.local`;
  const adminEmail = 'admin@gmail.com'; // from seed
  const testPhoneA = `+9197${ts.toString().slice(-8)}`;
  const testPhoneB = `+9196${ts.toString().slice(-8)}`;

  try {
    // -------------------------------------------------------------
    // Setup: Create 2 test vendors and fetch admin
    // -------------------------------------------------------------
    console.log('\n[Setup: Test Providers]');
    const regA = await authService.registerProvider({
      name: 'Vendor Owner A',
      email: providerEmailA,
      phone: testPhoneA,
      password: 'password',
      businessName: 'Apex Wedding Planners',
      city: 'Panipat',
    });

    const regB = await authService.registerProvider({
      name: 'Vendor Owner B',
      email: providerEmailB,
      phone: testPhoneB,
      password: 'password',
      businessName: 'Bliss Decorators',
      city: 'Sonipat',
    });

    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    assert(adminUser !== null, 'Admin user exists in database');
    const adminId = adminUser!.id;

    // -------------------------------------------------------------
    // Test 1: Vendor Profile & Completeness Calculation
    // -------------------------------------------------------------
    console.log('\n[Group 1: Vendor Profile & Completeness]');
    const profileA = await vendorService.getOwnProfile(regA.user.id);
    assert(
      profileA.businessName === 'Apex Wedding Planners' &&
      profileA.status === VendorStatus.PENDING &&
      profileA.completeness.profileCompleted === false,
      'Initial vendor profile has PENDING status and is incomplete'
    );

    // Update profile fields
    const updatedProfileA = await vendorService.updateOwnProfile(regA.user.id, {
      description: 'Premier wedding and event management team.',
      addressLine1: '45 Ring Road, Model Town',
      state: 'Haryana',
      pincode: '132103',
      latitude: 29.3909,
      longitude: 76.9635,
      operatingRadiusKm: 30,
    });
    assert(
      updatedProfileA.latitude === 29.3909 &&
      updatedProfileA.state === 'Haryana' &&
      updatedProfileA.completeness.completionPercentage > profileA.completeness.completionPercentage,
      'Updating profile fields increases completion score'
    );

    // -------------------------------------------------------------
    // Test 2: Dynamic Categories & Vendor Category Sync
    // -------------------------------------------------------------
    console.log('\n[Group 2: Dynamic Categories]');
    const activeCategories = await categoryService.listActiveCategories();
    assert(activeCategories.length > 0, 'Active categories loaded dynamically from database');

    const selectedCategoryIds = activeCategories.slice(0, 2).map((c) => c.id);
    const syncedProfile = await vendorService.syncOwnCategories(regA.user.id, selectedCategoryIds);
    assert(
      syncedProfile.categories.length === 2,
      'Vendor successfully synced 2 categories'
    );

    // Admin Category Management
    const testCatName = `Test Category ${ts}`;
    const newCategory = await adminService.createCategory({
      name: testCatName,
      description: 'Specialized celebration niche',
      icon: '✨',
      sortOrder: 99,
      isActive: true,
    }, adminId);
    assert(newCategory.name === testCatName, 'Admin successfully created dynamic category');

    const updatedCategory = await adminService.updateCategory(newCategory.id, {
      description: 'Updated niche description',
    }, adminId);
    assert(updatedCategory.description === 'Updated niche description', 'Admin successfully updated category');

    // -------------------------------------------------------------
    // Test 3: Vendor Documents
    // -------------------------------------------------------------
    console.log('\n[Group 3: Vendor Documents]');
    const docA = await vendorService.addDocument(
      regA.user.id,
      DocumentType.IDENTITY_PROOF,
      '/uploads/documents/test-id-proof.pdf'
    );
    assert(
      docA.documentType === DocumentType.IDENTITY_PROOF &&
      docA.status === DocumentStatus.PENDING,
      'Vendor uploads document with PENDING status'
    );

    // Document Isolation: Vendor B cannot delete Vendor A's document
    let isolationPassed = false;
    try {
      await vendorService.deleteDocument(regB.user.id, docA.id);
    } catch (err) {
      if (err instanceof ForbiddenError) isolationPassed = true;
    }
    assert(isolationPassed, 'Vendor B is forbidden from deleting Vendor A document');

    // -------------------------------------------------------------
    // Test 4: Submit For Review & State Machine
    // -------------------------------------------------------------
    console.log('\n[Group 4: State Machine Transitions]');
    // Check submission for review
    const reviewSubmission = await vendorService.submitForReview(regA.user.id);
    assert(
      reviewSubmission.status === VendorStatus.UNDER_REVIEW,
      'Vendor submits complete profile moving to UNDER_REVIEW'
    );

    // Admin Rejection requires rejection reason
    let rejectionValidationPassed = false;
    try {
      await adminService.rejectVendor(reviewSubmission.id, '', adminId);
    } catch (err) {
      if (err instanceof BadRequestError) rejectionValidationPassed = true;
    }
    assert(rejectionValidationPassed, 'Admin rejection without reason is rejected with BadRequestError');

    // Admin rejects with reason
    const rejectedVendor = await adminService.rejectVendor(
      reviewSubmission.id,
      'Please re-upload a clearer image of your government ID.',
      adminId
    );
    assert(
      rejectedVendor.status === VendorStatus.REJECTED,
      'Admin rejects vendor with mandatory reason'
    );

    // Vendor can resubmit after rejection
    const resubmitted = await vendorService.submitForReview(regA.user.id);
    assert(
      resubmitted.status === VendorStatus.UNDER_REVIEW,
      'Vendor can resubmit after resolving rejection reason'
    );

    // Admin Approves Vendor
    const approvedVendor = await adminService.approveVendor(resubmitted.id, adminId);
    assert(
      approvedVendor.status === VendorStatus.APPROVED &&
      approvedVendor.isVerified === true,
      'Admin approves vendor and sets isVerified = true'
    );

    // Admin Suspends Vendor
    const suspendedVendor = await adminService.suspendVendor(approvedVendor.id, 'Routine quality audit', adminId);
    assert(
      suspendedVendor.status === VendorStatus.SUSPENDED,
      'Admin suspends active vendor'
    );

    // Admin Reactivates Vendor
    const reactivatedVendor = await adminService.reactivateVendor(suspendedVendor.id, adminId);
    assert(
      reactivatedVendor.status === VendorStatus.APPROVED,
      'Admin reactivates suspended vendor'
    );

    // Document Review
    const reviewedDoc = await adminService.reviewVendorDocument(
      resubmitted.id,
      docA.id,
      'APPROVED',
      undefined,
      adminId
    );
    assert(
      reviewedDoc.status === DocumentStatus.APPROVED,
      'Admin successfully approves vendor document'
    );

    // -------------------------------------------------------------
    // Test 5: Admin Vendor Listing & Filtering
    // -------------------------------------------------------------
    console.log('\n[Group 5: Admin Vendor Queries]');
    const vendorList = await adminService.listVendors({
      page: 1,
      limit: 10,
      search: 'Apex Wedding',
    });
    assert(
      vendorList.vendors.length >= 1 &&
      vendorList.pagination.total >= 1,
      'Admin searches and paginates vendors server-side'
    );

    const vendorDetails = await adminService.getVendorDetails(resubmitted.id);
    assert(
      vendorDetails.businessName === 'Apex Wedding Planners' &&
      vendorDetails.documents.length >= 1 &&
      vendorDetails.categories.length >= 2,
      'Admin retrieves full vendor details including documents and categories'
    );

    // Clean up test category
    await adminService.removeCategory(newCategory.id, adminId);
    console.log('Cleaned up temporary test category');

  } catch (error) {
    console.error('Test run failed with unexpected error:', error);
    failed++;
  } finally {
    console.log('\n===================================================');
    console.log(`Phase 4 Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('===================================================');
    await prisma.$disconnect();
    if (failed > 0) {
      process.exit(1);
    }
    process.exit(0);
  }
}

runVendorTests();

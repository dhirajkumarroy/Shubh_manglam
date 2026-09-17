import { EventService } from '../src/modules/events/event.service';
import { AddressService } from '../src/modules/addresses/address.service';
import { MarketplaceService } from '../src/modules/marketplace/marketplace.service';
import { CategoryService } from '../src/modules/categories/category.service';
import { CatalogService } from '../src/modules/catalog/catalog.service';
import { AdminService } from '../src/modules/admin/admin.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { prisma } from '../src/config/database';
import { PricingType } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../src/common/utils/app-error';

async function runMarketplaceTests() {
  console.log('===================================================');
  console.log('🚀 Running Shubh Mangalam Phase 6 Marketplace Tests');
  console.log('===================================================');

  const eventService = new EventService();
  const addressService = new AddressService();
  const marketplaceService = new MarketplaceService();
  const categoryService = new CategoryService();
  const catalogService = new CatalogService();
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
  const custEmailA = `cust.p6.a.${ts}@test.local`;
  const custEmailB = `cust.p6.b.${ts}@test.local`;
  const providerEmailA = `vendor.p6.a.${ts}@test.local`;
  const providerEmailB = `vendor.p6.b.${ts}@test.local`;

  try {
    // -------------------------------------------------------------
    // Setup Test Accounts
    // -------------------------------------------------------------
    console.log('\n[Setup: Customers & Providers]');
    const custA = await authService.registerCustomer({
      name: 'Customer A',
      email: custEmailA,
      phone: `+9191${ts.toString().slice(-8)}`,
      password: 'password',
    });

    const custB = await authService.registerCustomer({
      name: 'Customer B',
      email: custEmailB,
      phone: `+9192${ts.toString().slice(-8)}`,
      password: 'password',
    });

    // Provider A in Mohali / Chandigarh (lat: 30.7046, lon: 76.7179, operatingRadius: 15km)
    const provRegA = await authService.registerProvider({
      name: 'Vendor A Chandigarh',
      email: providerEmailA,
      phone: `+9193${ts.toString().slice(-8)}`,
      password: 'password',
      businessName: `Royal Decorators ${ts}`,
      city: 'Chandigarh',
    });

    // Provider B in Ludhiana (~90km away, lat: 30.9010, lon: 75.8573, operatingRadius: 20km)
    const provRegB = await authService.registerProvider({
      name: 'Vendor B Ludhiana',
      email: providerEmailB,
      phone: `+9194${ts.toString().slice(-8)}`,
      password: 'password',
      businessName: `Grand Lights ${ts}`,
      city: 'Ludhiana',
    });

    const vendorA = await prisma.vendor.findUnique({ where: { userId: provRegA.user.id } });
    const vendorB = await prisma.vendor.findUnique({ where: { userId: provRegB.user.id } });

    // Set deterministic coordinates & operating radius
    await prisma.vendor.update({
      where: { id: vendorA!.id },
      data: {
        latitude: 30.7046,
        longitude: 76.7179,
        operatingRadiusKm: 15.0,
      },
    });

    await prisma.vendor.update({
      where: { id: vendorB!.id },
      data: {
        latitude: 30.901,
        longitude: 75.8573,
        operatingRadiusKm: 20.0,
      },
    });

    // Approve both vendors (transitions: PENDING -> UNDER_REVIEW -> APPROVED)
    await adminService.moveToUnderReview(vendorA!.id);
    await adminService.approveVendor(vendorA!.id);
    await adminService.moveToUnderReview(vendorB!.id);
    await adminService.approveVendor(vendorB!.id);

    console.log('  Setup completed successfully.');

    // -------------------------------------------------------------
    // Test Suite 1: Dynamic Data Flow (Requirement 33)
    // -------------------------------------------------------------
    console.log('\n[Suite 1: Dynamic Data Flow — Requirement 33]');
    // 1. Admin creates Event Type: Corporate Meetup
    const eventType = await eventService.createEventType({
      name: `Corporate Meetup ${ts}`,
      description: 'Corporate conferences and business meetups',
      sortOrder: 100,
    });
    assert(eventType.name.startsWith('Corporate Meetup'), '1. Admin creates dynamic Event Type');

    // 2. Admin creates Category: Stage Design
    const category = await categoryService.createCategory({
      name: `Stage Design ${ts}`,
      description: 'Professional conference stage setups',
      sortOrder: 100,
    });
    assert(category.name.startsWith('Stage Design'), '2. Admin creates dynamic Category');

    // 3. Admin maps: Corporate Meetup -> Stage Design
    const mapping = await eventService.mapCategoryToEventType(eventType.id, {
      categoryId: category.id,
      isRecommended: true,
      sortOrder: 1,
    });
    assert(mapping.categoryId === category.id, '3. Admin maps Event Type -> Category');

    // 4. Approved Provider creates service: Corporate Stage Design
    const service = await catalogService.createService(vendorA!.id, {
      categoryId: category.id,
      name: `Corporate Stage Design ${ts}`,
      description: 'LED wall and podium stage setup',
      pricingType: PricingType.FIXED,
      basePrice: 45000,
    });
    assert(service.name.startsWith('Corporate Stage Design'), '4. Approved Vendor creates catalog service');

    // 5. Customer requests Corporate Meetup categories
    const recommendedCategories = await eventService.getRecommendedCategories(eventType.id);
    // 6. Customer receives Stage Design
    const hasCategory = recommendedCategories.some((c) => c.id === category.id);
    assert(hasCategory, '5 & 6. Customer receives dynamically mapped category');

    // 7. Customer searches marketplace for Corporate Stage Design
    const searchResults = await marketplaceService.listServices({
      search: `Corporate Stage Design ${ts}`,
    });
    // 8. Customer receives Corporate Stage Design
    const hasService = searchResults.services.some((s) => s.id === service.id);
    assert(hasService, '7 & 8. Customer discovers dynamic service without code changes');

    // -------------------------------------------------------------
    // Test Suite 2: Location-Based Discovery & Haversine (Requirement 34)
    // -------------------------------------------------------------
    console.log('\n[Suite 2: Location-Based Discovery & Haversine — Requirement 34]');
    // Customer coordinates near Chandigarh: lat: 30.7100, lon: 76.7200 (~0.6 km from Vendor A, ~90km from Vendor B)
    const nearbySearch = await marketplaceService.listVendors({
      latitude: 30.71,
      longitude: 76.72,
      sort: 'nearest',
    });

    const foundA = nearbySearch.vendors.find((v) => v.id === vendorA!.id);
    const foundB = nearbySearch.vendors.find((v) => v.id === vendorB!.id);

    assert(foundA !== undefined, 'Vendor A within operating radius is visible to customer');
    assert(foundA !== undefined && foundA.distanceKm !== null && foundA.distanceKm < 2.0, 'Vendor A distance calculated accurately (< 2 km)');
    assert(foundB === undefined, 'Vendor B outside operating radius is excluded from nearby search');

    // Search without coordinates returns both approved vendors
    const allVendors = await marketplaceService.listVendors({ page: 1, limit: 100 });
    const allFoundA = allVendors.vendors.some((v) => v.id === vendorA!.id);
    const allFoundB = allVendors.vendors.some((v) => v.id === vendorB!.id);
    assert(allFoundA && allFoundB, 'Missing coordinates search returns approved vendors regardless of distance');

    // -------------------------------------------------------------
    // Test Suite 3: Customer Event Planning & Management
    // -------------------------------------------------------------
    console.log('\n[Suite 3: Customer Event Planning & Management]');
    const event = await eventService.createEvent(custA.user.id, {
      eventTypeId: eventType.id,
      title: 'Annual Tech Meetup 2026',
      eventDate: '2026-12-15',
      startTime: '10:00',
      endTime: '18:00',
      guestCount: 200,
      budgetMin: 50000,
      budgetMax: 200000,
      addressLine1: 'Plot 42, Sector 62',
      city: 'Mohali',
      pincode: '160062',
      latitude: 30.7046,
      longitude: 76.7179,
    });
    assert(event.title === 'Annual Tech Meetup 2026', 'Customer creates event successfully');

    const customerEvents = await eventService.listCustomerEvents(custA.user.id);
    assert(customerEvents.length >= 1 && customerEvents.some((e) => e.id === event.id), 'Customer lists their own events');

    const eventDetails = await eventService.getEventById(custA.user.id, event.id);
    assert(eventDetails.id === event.id, 'Customer fetches event details');

    const updatedEvent = await eventService.updateEvent(custA.user.id, event.id, {
      guestCount: 250,
      title: 'Annual Tech Conference 2026',
    });
    assert(updatedEvent.guestCount === 250, 'Customer updates event details');

    // Ownership security check: Customer B must not access Customer A's event
    let unauthorizedAccessBlocked = false;
    try {
      await eventService.getEventById(custB.user.id, event.id);
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        unauthorizedAccessBlocked = true;
      }
    }
    assert(unauthorizedAccessBlocked, 'Ownership Security: Customer B cannot view Customer A event (403)');

    let unauthorizedUpdateBlocked = false;
    try {
      await eventService.updateEvent(custB.user.id, event.id, { title: 'Hacked Event' });
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        unauthorizedUpdateBlocked = true;
      }
    }
    assert(unauthorizedUpdateBlocked, 'Ownership Security: Customer B cannot update Customer A event (403)');

    // -------------------------------------------------------------
    // Test Suite 4: Event Requirements CRUD
    // -------------------------------------------------------------
    console.log('\n[Suite 4: Event Requirements CRUD]');
    const requirement = await eventService.createEventRequirement(custA.user.id, event.id, {
      categoryId: category.id,
      quantity: 2,
      budgetMin: 10000,
      budgetMax: 20000,
      notes: 'Need LED backdrop and stage lighting',
    });
    assert(requirement.categoryId === category.id && requirement.quantity === 2, 'Customer adds requirement to event');

    const requirements = await eventService.listEventRequirements(custA.user.id, event.id);
    assert(requirements.length === 1 && requirements[0].id === requirement.id, 'Customer lists event requirements');

    const updatedReq = await eventService.updateEventRequirement(custA.user.id, event.id, requirement.id, {
      notes: 'Updated: 4K LED backdrop required',
    });
    assert(updatedReq.notes === 'Updated: 4K LED backdrop required', 'Customer updates event requirement');

    let unauthorizedReqBlocked = false;
    try {
      await eventService.deleteEventRequirement(custB.user.id, event.id, requirement.id);
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        unauthorizedReqBlocked = true;
      }
    }
    assert(unauthorizedReqBlocked, 'Ownership Security: Customer B cannot delete Customer A requirement (403)');

    await eventService.deleteEventRequirement(custA.user.id, event.id, requirement.id);
    const reqsAfterDelete = await eventService.listEventRequirements(custA.user.id, event.id);
    assert(reqsAfterDelete.length === 0, 'Customer deletes event requirement');

    // -------------------------------------------------------------
    // Test Suite 5: Customer Address Management
    // -------------------------------------------------------------
    console.log('\n[Suite 5: Customer Address Management]');
    const addr1 = await addressService.createAddress(custA.user.id, {
      label: 'Home',
      addressLine1: 'House 123, Phase 7',
      city: 'Mohali',
      state: 'Punjab',
      pincode: '160062',
      latitude: 30.7046,
      longitude: 76.7179,
      isDefault: true,
    });
    assert(addr1.isDefault === true, 'First address is default');

    const addr2 = await addressService.createAddress(custA.user.id, {
      label: 'Office',
      addressLine1: 'IT Park Tower B',
      city: 'Chandigarh',
      state: 'Chandigarh',
      pincode: '160101',
      latitude: 30.725,
      longitude: 76.845,
      isDefault: true,
    });
    assert(addr2.isDefault === true, 'Second address created as default');

    // Verify first address is now NOT default
    const reloadedAddr1 = await addressService.getAddressById(custA.user.id, addr1.id);
    assert(reloadedAddr1.isDefault === false, 'Setting new default address unsets previous default');

    let unauthorizedAddrBlocked = false;
    try {
      await addressService.getAddressById(custB.user.id, addr1.id);
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        unauthorizedAddrBlocked = true;
      }
    }
    assert(unauthorizedAddrBlocked, 'Ownership Security: Customer B cannot access Customer A address (403)');

    await addressService.deleteAddress(custA.user.id, addr2.id);
    const addressesAfterDelete = await addressService.listAddresses(custA.user.id);
    assert(addressesAfterDelete.length === 1, 'Customer deletes address');
    assert(addressesAfterDelete[0].isDefault === true, 'Deleting default promotes remaining address to default');

    // Clean up event
    await eventService.deleteEvent(custA.user.id, event.id);
    let eventDeleted = false;
    try {
      await eventService.getEventById(custA.user.id, event.id);
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        eventDeleted = true;
      }
    }
    assert(eventDeleted, 'Customer deletes event');

    // -------------------------------------------------------------
    // Test Suite 6: Marketplace Discovery Filtering & Pagination
    // -------------------------------------------------------------
    console.log('\n[Suite 6: Marketplace Discovery Filtering & Pagination]');
    const vendorDetail = await marketplaceService.getVendorDetails(vendorA!.id, {
      latitude: 30.71,
      longitude: 76.72,
    });
    assert(vendorDetail.id === vendorA!.id, 'Retrieve complete public vendor details');
    assert(vendorDetail.services.length >= 1, 'Vendor details include active public services');
    assert(vendorDetail.distanceKm !== null && vendorDetail.distanceKm < 2.0, 'Vendor details include calculated distance');

    const serviceDetail = await marketplaceService.getServiceById(service.id);
    assert(serviceDetail.id === service.id && serviceDetail.basePrice === 45000, 'Retrieve service details');

    const categoryList = await marketplaceService.listCategories({ eventTypeId: eventType.id });
    assert(categoryList.some((c) => c.id === category.id), 'Marketplace lists categories filtered by event type');
  } catch (error) {
    console.error('Fatal test error:', error);
    failed++;
  } finally {
    console.log('\n===================================================');
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('===================================================');

    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runMarketplaceTests();

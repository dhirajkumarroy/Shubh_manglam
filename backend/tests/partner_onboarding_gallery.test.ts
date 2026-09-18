import { prisma } from '../src/config/database';
import { documentRequirementService } from '../src/modules/vendors/document-requirement.service';
import { galleryService } from '../src/modules/vendors/gallery.service';
import { reviewService } from '../src/modules/reviews/review.service';
import { AdminService } from '../src/modules/admin/admin.service';
import { VendorService } from '../src/modules/vendors/vendor.service';
import { UserRole, VendorStatus, MediaType } from '@prisma/client';
import bcrypt from 'bcrypt';

async function runPartnerOnboardingAndGalleryTests() {
  console.log('\n===================================================');
  console.log('SHUBH AUSAR — PARTNER ONBOARDING & GALLERY TESTS');
  console.log('===================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const adminService = new AdminService();
  const vendorService = new VendorService();

  const timestamp = Date.now();
  const testEmail = `partner.test.${timestamp}@example.com`;
  const passwordHash = await bcrypt.hash('Partner@1234', 10);

  // 1. Create a test partner user & pending vendor
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test Partner Enterprise',
      phone: `+919999${String(timestamp).slice(-6)}`,
      passwordHash,
      role: UserRole.VENDOR,
    },
  });

  const vendor = await prisma.vendor.create({
    data: {
      userId: user.id,
      businessName: `Star Wedding Decorators ${timestamp}`,
      slug: `star-decor-${timestamp}`,
      description: 'Grand mandap decor, luxury stage setup, and celebration lighting.',
      phone: user.phone,
      email: user.email,
      addressLine1: 'Shop 14, Celebration Complex',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      latitude: 28.6139,
      longitude: 77.209,
      status: VendorStatus.PENDING,
    },
  });

  // Test 1: Dynamic Document Requirements Fetching
  const activeRequirements = await documentRequirementService.listActiveRequirements();
  assert(activeRequirements.length >= 3, 'Dynamic document requirements retrieved from database');
  assert(
    activeRequirements.some((r) => r.code === 'GST_CERTIFICATE' && r.isRequired === true),
    'GST Certificate requirement is marked as REQUIRED'
  );
  assert(
    activeRequirements.some((r) => r.code === 'IDENTITY_PROOF' && r.isRequired === false),
    'Identity Proof requirement is marked as OPTIONAL'
  );

  // Test 2: Incomplete Submission Rejected
  let submissionError = false;
  try {
    await vendorService.submitForReview(user.id);
  } catch (err: any) {
    submissionError = true;
    assert(err.message.includes('Missing required') || err.message.includes('incomplete'), 'Submission rejected when required documents are missing');
  }
  if (!submissionError) {
    assert(false, 'Should reject submission when required documents are missing');
  }

  // Test 3: Upload Required Documents & Resubmit
  const gstReq = activeRequirements.find((r) => r.code === 'GST_CERTIFICATE');
  const busReq = activeRequirements.find((r) => r.code === 'BUSINESS_REGISTRATION');
  const panReq = activeRequirements.find((r) => r.code === 'PAN_CARD');

  // Also attach a category to satisfy completeness
  const firstCat = await prisma.category.findFirst({ where: { isActive: true } });
  if (firstCat) {
    await prisma.vendorCategory.create({
      data: { vendorId: vendor.id, categoryId: firstCat.id },
    });
  }

  if (gstReq) {
    await vendorService.addDocument(user.id, {
      requirementId: gstReq.id,
      documentType: gstReq.documentType,
      documentUrl: 'uploads/documents/test_gst.pdf',
      originalFileName: 'gst_certificate.pdf',
      fileSize: 102400,
      mimeType: 'application/pdf',
    });
  }
  if (busReq) {
    await vendorService.addDocument(user.id, {
      requirementId: busReq.id,
      documentType: busReq.documentType,
      documentUrl: 'uploads/documents/test_bus.pdf',
      originalFileName: 'business_reg.pdf',
      fileSize: 204800,
      mimeType: 'application/pdf',
    });
  }
  if (panReq) {
    await vendorService.addDocument(user.id, {
      requirementId: panReq.id,
      documentType: panReq.documentType,
      documentUrl: 'uploads/documents/test_pan.jpg',
      originalFileName: 'pan_card.jpg',
      fileSize: 85000,
      mimeType: 'image/jpeg',
    });
  }

  const reviewSubmission = await vendorService.submitForReview(user.id);
  assert(reviewSubmission.status === VendorStatus.UNDER_REVIEW, 'Profile successfully moved to UNDER_REVIEW state');

  // Test 4: Admin Approval Generates Unique Partner Account ID
  const approvedVendor = await adminService.approveVendor(vendor.id);
  assert(approvedVendor.status === VendorStatus.APPROVED, 'Partner status transitioned to APPROVED');
  assert(approvedVendor.isVerified === true, 'Partner marked as isVerified');
  assert(
    typeof approvedVendor.partnerAccountId === 'string' && approvedVendor.partnerAccountId.startsWith('SA-P-'),
    `Unique public Partner Account ID assigned: ${approvedVendor.partnerAccountId}`
  );

  // Test 5: Search Partner by Account ID
  const lookupByAccountId = await prisma.vendor.findUnique({
    where: { partnerAccountId: approvedVendor.partnerAccountId! },
  });
  assert(lookupByAccountId !== null && lookupByAccountId.id === vendor.id, 'Partner found via public partnerAccountId');

  // Test 6: Gallery Limits — Photos (Max 10)
  for (let i = 1; i <= 10; i++) {
    await galleryService.addMediaItem(user.id, {
      mediaType: MediaType.IMAGE,
      url: `uploads/gallery/images/photo_${i}.jpg`,
      caption: `Mandap setup ${i}`,
    });
  }

  let photoLimitError = false;
  try {
    await galleryService.addMediaItem(user.id, {
      mediaType: MediaType.IMAGE,
      url: 'uploads/gallery/images/photo_11.jpg',
      caption: '11th photo',
    });
  } catch (err: any) {
    photoLimitError = true;
    assert(err.message.includes('maximum of 10 photos'), '11th photo upload rejected by backend limit');
  }
  if (!photoLimitError) {
    assert(false, 'Should reject 11th photo');
  }

  // Test 7: Gallery Limits — Videos (Max 5)
  for (let i = 1; i <= 5; i++) {
    await galleryService.addMediaItem(user.id, {
      mediaType: MediaType.VIDEO,
      url: `uploads/gallery/videos/video_${i}.mp4`,
      caption: `Wedding drone highlight ${i}`,
    });
  }

  let videoLimitError = false;
  try {
    await galleryService.addMediaItem(user.id, {
      mediaType: MediaType.VIDEO,
      url: 'uploads/gallery/videos/video_6.mp4',
      caption: '6th video',
    });
  } catch (err: any) {
    videoLimitError = true;
    assert(err.message.includes('maximum of 5 videos'), '6th video upload rejected by backend limit');
  }
  if (!videoLimitError) {
    assert(false, 'Should reject 6th video');
  }

  // Test 8: Reorder Gallery
  const ownGallery = await galleryService.getOwnGallery(user.id);
  assert(ownGallery.photosCount === 10, 'Own gallery reports exactly 10 photos');
  assert(ownGallery.videosCount === 5, 'Own gallery reports exactly 5 videos');
  assert(ownGallery.totalCount === 15, 'Own gallery reports exactly 15 total items');

  const itemsToReorder = [
    { id: ownGallery.items[0].id, sortOrder: 99 },
    { id: ownGallery.items[1].id, sortOrder: 1 },
  ];
  const reordered = await galleryService.reorderGallery(user.id, itemsToReorder);
  assert(reordered.totalCount === 15, 'Reordered gallery preserves item count');

  // Test 9: Public Gallery View
  const publicGallery = await galleryService.getPublicGallery(approvedVendor.partnerAccountId!);
  assert(publicGallery.partner.partnerAccountId === approvedVendor.partnerAccountId, 'Public gallery accessible via partnerAccountId');
  assert(publicGallery.photos.length === 10, 'Public gallery contains 10 photos');
  assert(publicGallery.videos.length === 5, 'Public gallery contains 5 videos');

  // Test 10: Delete Gallery Item
  const itemToDelete = ownGallery.items[0];
  const deleteResult = await galleryService.deleteMediaItem(user.id, itemToDelete.id);
  assert(deleteResult.message.includes('successfully'), 'Gallery item deleted successfully');

  const galleryAfterDelete = await galleryService.getOwnGallery(user.id);
  assert(galleryAfterDelete.totalCount === 14, 'Gallery count decremented to 14 after deletion');

  // Test 11: Reviews Breakdown
  const reviewBreakdown = await reviewService.getVendorReviews(approvedVendor.partnerAccountId!);
  assert(reviewBreakdown.distribution !== undefined, 'Reviews breakdown includes star distribution object');
  assert(typeof reviewBreakdown.ratingAverage === 'number', 'Reviews return numeric ratingAverage');

  // Cleanup test records
  await prisma.vendorGalleryMedia.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendorDocument.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendorCategory.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendor.delete({ where: { id: vendor.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log('\n===================================================');
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPartnerOnboardingAndGalleryTests()
  .catch((err) => {
    console.error('Test runner failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

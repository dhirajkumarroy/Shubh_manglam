import { PrismaClient, DocumentType, VendorStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Document Requirements...');
  const defaults = [
    {
      code: 'BUSINESS_REGISTRATION',
      name: 'Business Registration / Gumasta',
      description: 'Valid registration certificate, MSME/Udyam, or shop establishment certificate.',
      documentType: DocumentType.BUSINESS_REGISTRATION,
      isRequired: true,
      acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMb: 10,
      isActive: true,
      sortOrder: 1,
    },
    {
      code: 'GST_CERTIFICATE',
      name: 'GST Certificate',
      description: 'Government-issued GST registration certificate (Form REG-06).',
      documentType: DocumentType.TAX_DOCUMENT,
      isRequired: true,
      acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMb: 5,
      isActive: true,
      sortOrder: 2,
    },
    {
      code: 'PAN_CARD',
      name: 'PAN Card / Tax ID',
      description: 'Permanent Account Number card of proprietor or registered enterprise.',
      documentType: DocumentType.TAX_DOCUMENT,
      isRequired: true,
      acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMb: 5,
      isActive: true,
      sortOrder: 3,
    },
    {
      code: 'IDENTITY_PROOF',
      name: 'Aadhaar / Identity Proof',
      description: 'Government photo identity proof (Aadhaar Card, Voter ID, or Passport).',
      documentType: DocumentType.IDENTITY_PROOF,
      isRequired: false,
      acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMb: 5,
      isActive: true,
      sortOrder: 4,
    },
    {
      code: 'TRADE_LICENSE',
      name: 'Trade License / FSSAI / Other',
      description: 'Municipal trade license, health license, or FSSAI certificate (if food/catering).',
      documentType: DocumentType.CERTIFICATE,
      isRequired: false,
      acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMb: 10,
      isActive: true,
      sortOrder: 5,
    },
  ];

  for (const d of defaults) {
    await prisma.documentRequirement.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
    console.log(`✓ Requirement [${d.code}] verified`);
  }

  console.log('Assigning Partner Account IDs to approved partners without one...');
  const vendorsWithoutId = await prisma.vendor.findMany({
    where: {
      partnerAccountId: null,
      status: VendorStatus.APPROVED,
    },
    orderBy: { createdAt: 'asc' },
  });

  let seq = 100001;
  for (const v of vendorsWithoutId) {
    const partnerAccountId = `SA-P-${String(seq).padStart(6, '0')}`;
    await prisma.vendor.update({
      where: { id: v.id },
      data: { partnerAccountId },
    });
    console.log(`✓ Assigned ${partnerAccountId} to ${v.businessName}`);
    seq++;
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

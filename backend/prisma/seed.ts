import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EVENT_TYPES = [
  { name: 'Wedding', description: 'Traditional and modern wedding celebrations', sortOrder: 1 },
  { name: 'Birthday', description: 'Birthday parties for kids, teens, and adults', sortOrder: 2 },
  { name: 'Engagement', description: 'Ring ceremony and pre-wedding engagement functions', sortOrder: 3 },
  { name: 'Reception', description: 'Post-wedding dinner and celebratory receptions', sortOrder: 4 },
  { name: 'Teej', description: 'Haryali, Kajari, and Hartalika Teej celebrations', sortOrder: 5 },
  { name: 'Karwa Chauth', description: 'Traditional Karwa Chauth celebration and gatherings', sortOrder: 6 },
  { name: 'Mundan', description: 'Sacred first haircut ceremony for children', sortOrder: 7 },
  { name: 'Puja', description: 'Religious prayers, havans, and spiritual rituals', sortOrder: 8 },
  { name: 'Jagran', description: 'Mata ka Jagran, Chowki, and overnight devotional singing', sortOrder: 9 },
  { name: 'Anniversary', description: 'Wedding milestone and celebration dinners', sortOrder: 10 },
  { name: 'Baby Shower', description: 'Godh Bharai and baby shower celebrations', sortOrder: 11 },
  { name: 'Housewarming', description: 'Griha Pravesh and blessing ceremony for new homes', sortOrder: 12 },
  { name: 'Festival', description: 'Diwali, Holi, Navratri, Eid, and community festivals', sortOrder: 13 },
  { name: 'Corporate Event', description: 'Conferences, product launches, annual days, and team retreats', sortOrder: 14 },
  { name: 'Party', description: 'Cocktail, farewell, bachelor/bachelorette, and private parties', sortOrder: 15 },
  { name: 'Other', description: 'Custom and specialized local functions', sortOrder: 16 },
];

const CATEGORIES = [
  { name: 'Decoration', description: 'Stage, floral, balloon, theme, and backdrop decorations', sortOrder: 1 },
  { name: 'Tent', description: 'Shamiyana, water-proof tents, marquees, and canopy setups', sortOrder: 2 },
  { name: 'Lighting', description: 'Fairytale lights, ambient illumination, and stage spotlights', sortOrder: 3 },
  { name: 'Makeup', description: 'Bridal, party, and groom grooming services', sortOrder: 4 },
  { name: 'Mehndi', description: 'Bridal, Arabic, Rajasthani, and group mehndi artists', sortOrder: 5 },
  { name: 'Catering', description: 'Buffet, seated dining, snacks, and full meal catering', sortOrder: 6 },
  { name: 'Halwai', description: 'Traditional sweet makers and live sweet preparation counters', sortOrder: 7 },
  { name: 'DJ', description: 'Professional disc jockeys, dance floors, and sound mixing', sortOrder: 8 },
  { name: 'Band', description: 'Traditional brass bands, dhol players, and wedding processions', sortOrder: 9 },
  { name: 'Photography', description: 'Candid, portrait, drone, and traditional photography', sortOrder: 10 },
  { name: 'Videography', description: 'Cinematography, 4K video recording, and live streaming', sortOrder: 11 },
  { name: 'Venue', description: 'Marriage lawns, banquets, open party plots, and farms', sortOrder: 12 },
  { name: 'Hotel', description: 'Accommodations, guest room blocks, and hotel halls', sortOrder: 13 },
  { name: 'Resort', description: 'Destination resorts, pool lawns, and weekend retreats', sortOrder: 14 },
  { name: 'Furniture', description: 'Sofa sets, banquet chairs, VIP lounge seating, and tables', sortOrder: 15 },
  { name: 'Sound', description: 'Microphones, PA sound systems, amplifiers, and monitors', sortOrder: 16 },
  { name: 'Generator', description: 'Silent power backup generators of various KVA capacities', sortOrder: 17 },
  { name: 'Transportation', description: 'Guest buses, luxury cars, vintage cars, and logistics', sortOrder: 18 },
  { name: 'Florist', description: 'Fresh flower garlands, varmala, and flower arrangements', sortOrder: 19 },
  { name: 'Pandit', description: 'Experienced Vedic priests and acharyas for rituals', sortOrder: 20 },
  { name: 'Choreography', description: 'Sangeet choreographers, dance troupes, and stage trainers', sortOrder: 21 },
  { name: 'Security', description: 'Bouncers, event security guards, and crowd management', sortOrder: 22 },
  { name: 'Other', description: 'Specialized and custom celebration services', sortOrder: 23 },
];

const EVENT_RECOMMENDED_CATEGORIES: Record<string, string[]> = {
  Wedding: [
    'Decoration',
    'Tent',
    'Lighting',
    'Catering',
    'Halwai',
    'Makeup',
    'Mehndi',
    'Photography',
    'Videography',
    'DJ',
    'Band',
    'Venue',
    'Pandit',
    'Florist',
    'Choreography',
    'Furniture',
    'Sound',
    'Generator',
    'Transportation',
    'Security',
  ],
  Birthday: ['Decoration', 'Catering', 'DJ', 'Photography', 'Sound', 'Furniture', 'Lighting'],
  Engagement: [
    'Decoration',
    'Catering',
    'Photography',
    'Videography',
    'Makeup',
    'Mehndi',
    'DJ',
    'Venue',
    'Lighting',
    'Sound',
  ],
  Reception: [
    'Decoration',
    'Catering',
    'Lighting',
    'Photography',
    'Videography',
    'DJ',
    'Venue',
    'Furniture',
    'Sound',
  ],
  Teej: ['Decoration', 'Mehndi', 'Music', 'Catering', 'Halwai', 'Photography', 'Sound'],
  'Karwa Chauth': ['Mehndi', 'Makeup', 'Decoration', 'Photography', 'Florist'],
  Mundan: ['Pandit', 'Decoration', 'Catering', 'Halwai', 'Photography', 'Sound'],
  Puja: ['Pandit', 'Florist', 'Sound', 'Lighting', 'Decoration', 'Catering'],
  Jagran: ['Band', 'Sound', 'Lighting', 'Singer', 'Tent', 'Decoration', 'Catering', 'Halwai', 'Pandit'],
  Anniversary: ['Decoration', 'Catering', 'Photography', 'DJ', 'Venue', 'Lighting', 'Sound'],
  'Baby Shower': ['Decoration', 'Catering', 'Photography', 'Mehndi', 'Makeup', 'Sound'],
  Housewarming: ['Pandit', 'Decoration', 'Catering', 'Halwai', 'Florist', 'Lighting'],
  Festival: ['Decoration', 'Lighting', 'Sound', 'Tent', 'Security', 'Generator', 'Catering'],
  'Corporate Event': [
    'Venue',
    'Catering',
    'Sound',
    'Lighting',
    'Photography',
    'Videography',
    'Security',
    'Transportation',
  ],
  Party: ['DJ', 'Sound', 'Lighting', 'Catering', 'Decoration', 'Photography', 'Venue'],
  Other: ['Decoration', 'Catering', 'Sound', 'Photography'],
};

async function main() {
  console.log('--- PURGING ALL DUMMY DATA & INITIALIZING CLEAN PRODUCTION SEED ---');

  // 1. Truncate all dynamic business & user tables using CASCADE
  console.log('1. Clearing dummy tables in PostgreSQL...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "public"."audit_logs",
      "public"."notifications",
      "public"."payments",
      "public"."refunds",
      "public"."commissions",
      "public"."vendor_payouts",
      "public"."reviews",
      "public"."favorites",
      "public"."coupons",
      "public"."coupon_usages",
      "public"."booking_items",
      "public"."bookings",
      "public"."quote_items",
      "public"."quotes",
      "public"."event_requirements",
      "public"."events",
      "public"."addresses",
      "public"."availabilities",
      "public"."time_slots",
      "public"."package_services",
      "public"."packages",
      "public"."service_images",
      "public"."services",
      "public"."vendor_documents",
      "public"."vendor_categories",
      "public"."vendors",
      "public"."user_sessions",
      "public"."oauth_accounts",
      "public"."email_verification_tokens",
      "public"."password_reset_tokens",
      "public"."admin_mfa",
      "public"."users",
      "public"."event_type_categories",
      "public"."categories",
      "public"."event_types"
    CASCADE;
  `);

  console.log('All dummy records deleted successfully.');

  // 2. Seed Clean Official Event Types
  console.log('\n2. Seeding 16 Official Celebration Event Types...');
  const eventTypeMap = new Map<string, string>();
  for (const et of EVENT_TYPES) {
    const slug = toSlug(et.name);
    const created = await prisma.eventType.create({
      data: {
        name: et.name,
        slug,
        description: et.description,
        sortOrder: et.sortOrder,
        isActive: true,
      },
    });
    eventTypeMap.set(et.name, created.id);
  }
  console.log(`Seeded ${eventTypeMap.size} event types.`);

  // 3. Seed Clean Official Categories
  console.log('\n3. Seeding 23 Official Celebration Categories...');
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const slug = toSlug(cat.name);
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryMap.set(cat.name, created.id);
  }
  console.log(`Seeded ${categoryMap.size} categories.`);

  // 4. Map Event Types to Recommended Categories
  console.log('\n4. Mapping Event Types to Recommended Categories...');
  let mappingCount = 0;
  for (const [eventTypeName, categoryNames] of Object.entries(EVENT_RECOMMENDED_CATEGORIES)) {
    const eventTypeId = eventTypeMap.get(eventTypeName);
    if (!eventTypeId) continue;

    for (let i = 0; i < categoryNames.length; i++) {
      const catName = categoryNames[i];
      const categoryId = categoryMap.get(catName);
      if (!categoryId) continue;

      await prisma.eventTypeCategory.create({
        data: {
          eventTypeId,
          categoryId,
          isRecommended: true,
          sortOrder: i + 1,
        },
      });
      mappingCount++;
    }
  }
  console.log(`Created ${mappingCount} EventType <-> Category recommended relationships.`);

  // 5. Seed Official Accounts for Manual Testing
  console.log('\n5. Seeding Standard Accounts (Admin, Customer, Provider)...');
  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // 5.1 Admin Account
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@gmail.com',
      phone: '+919833333333',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log(`Admin created:     ${admin.email} (Password: Password@123)`);

  // 5.2 Customer Account
  const customer = await prisma.user.create({
    data: {
      name: 'Dhiraj Customer',
      email: 'customer@gmail.com',
      phone: '+919811111111',
      passwordHash: defaultPasswordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log(`Customer created:  ${customer.email} (Password: Password@123)`);

  // 5.3 Provider Account (Approved Vendor)
  const provider = await prisma.user.create({
    data: {
      name: 'Royal Events Partner',
      email: 'provider@gmail.com',
      phone: '+919822222222',
      passwordHash: defaultPasswordHash,
      role: 'VENDOR',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  await prisma.vendor.create({
    data: {
      userId: provider.id,
      businessName: 'Royal Celebrations & Decor',
      slug: 'royal-celebrations-decor',
      phone: '+919822222222',
      email: 'provider@gmail.com',
      addressLine1: 'Main Market, GT Road',
      city: 'Panipat',
      state: 'Haryana',
      pincode: '132103',
      latitude: 29.3909,
      longitude: 76.9635,
      status: 'APPROVED',
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`Provider created:  ${provider.email} (Password: Password@123) [APPROVED]`);

  console.log('\n======================================================');
  console.log('✅ DATABASE PURGE & CLEAN PRODUCTION SEED COMPLETED!');
  console.log('======================================================');
  const userCount = await prisma.user.count();
  const vendorCount = await prisma.vendor.count();
  const categoryCount = await prisma.category.count();
  const eventTypeCount = await prisma.eventType.count();
  console.log(`Registered Accounts: ${userCount} (Admin, Customer, Provider)`);
  console.log(`Registered Vendors:  ${vendorCount} (Royal Celebrations & Decor)`);
  console.log(`Categories:          ${categoryCount} (official celebration categories)`);
  console.log(`Event Types:         ${eventTypeCount} (official celebration types)`);
}

main()
  .catch((e) => {
    console.error('Clean seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

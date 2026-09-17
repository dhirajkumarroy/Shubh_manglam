import { PrismaClient } from '@prisma/client';

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

// Recommended category names per event type
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
    'Security',
  ],
  Teej: ['Mehndi', 'Decoration', 'Catering', 'Sound', 'Halwai', 'Photography', 'Lighting'],
  'Karwa Chauth': ['Mehndi', 'Makeup', 'Decoration', 'Photography', 'Catering'],
  Mundan: ['Pandit', 'Decoration', 'Catering', 'Photography', 'Tent', 'Sound'],
  Puja: ['Pandit', 'Florist', 'Decoration', 'Catering', 'Sound', 'Tent', 'Halwai'],
  Jagran: ['Sound', 'Lighting', 'Decoration', 'Tent', 'Catering', 'Halwai', 'Generator'],
  Anniversary: ['Decoration', 'Catering', 'Photography', 'Lighting', 'Sound', 'Venue', 'DJ'],
  'Baby Shower': ['Decoration', 'Catering', 'Photography', 'Sound', 'Mehndi'],
  Housewarming: ['Pandit', 'Decoration', 'Catering', 'Florist', 'Sound', 'Lighting'],
  Festival: ['Lighting', 'Decoration', 'Sound', 'Catering', 'Tent', 'Generator', 'Security'],
  'Corporate Event': [
    'Venue',
    'Catering',
    'Sound',
    'Lighting',
    'Photography',
    'Videography',
    'Generator',
    'Security',
    'Furniture',
  ],
  Party: ['DJ', 'Sound', 'Lighting', 'Catering', 'Decoration', 'Venue', 'Security'],
  Other: ['Decoration', 'Catering', 'Sound', 'Tent', 'Lighting'],
};

async function main() {
  console.log('--- Seeding Shubh Mangalam Marketplace Foundation ---');

  // 1. Seed Event Types
  console.log('Seeding Event Types...');
  const eventTypeMap = new Map<string, string>(); // name -> id
  for (const item of EVENT_TYPES) {
    const slug = toSlug(item.name);
    const eventType = await prisma.eventType.upsert({
      where: { slug },
      update: {
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        name: item.name,
        slug,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
    eventTypeMap.set(item.name, eventType.id);
  }
  console.log(`Seeded ${eventTypeMap.size} Event Types.`);

  // 2. Seed Categories
  console.log('Seeding Categories...');
  const categoryMap = new Map<string, string>(); // name -> id
  for (const item of CATEGORIES) {
    const slug = toSlug(item.name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: {
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        name: item.name,
        slug,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
    categoryMap.set(item.name, category.id);
  }
  console.log(`Seeded ${categoryMap.size} Categories.`);

  // 3. Seed EventTypeCategory Mappings
  console.log('Seeding EventType ↔ Category Mappings...');
  let mappingCount = 0;
  for (const [eventTypeName, categoryNames] of Object.entries(EVENT_RECOMMENDED_CATEGORIES)) {
    const eventTypeId = eventTypeMap.get(eventTypeName);
    if (!eventTypeId) continue;

    for (let i = 0; i < categoryNames.length; i++) {
      const categoryName = categoryNames[i];
      const categoryId = categoryMap.get(categoryName);
      if (!categoryId) continue;

      await prisma.eventTypeCategory.upsert({
        where: {
          eventTypeId_categoryId: {
            eventTypeId,
            categoryId,
          },
        },
        update: {
          isRecommended: true,
          sortOrder: i + 1,
        },
        create: {
          eventTypeId,
          categoryId,
          isRecommended: true,
          sortOrder: i + 1,
        },
      });
      mappingCount++;
    }
  }
  console.log(`Seeded ${mappingCount} EventType ↔ Category Mappings.`);

  // 4. Seed Development Demo Accounts
  console.log('Seeding Development Demo Accounts...');
  const bcrypt = await import('bcrypt');
  // Simple password for fast mobile & web development testing
  const easyPassword = 'password';
  const hashedPassword = await bcrypt.hash(easyPassword, 10);

  // 4.1 Dhiraj Kumar Customer Account
  const dhiraj = await prisma.user.upsert({
    where: { email: 'dhiraj@gmail.com' },
    update: {
      name: 'Dhiraj Kumar',
      phone: '+919811111111',
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      name: 'Dhiraj Kumar',
      email: 'dhiraj@gmail.com',
      phone: '+919811111111',
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('Seeded easy customer account:', dhiraj.email, '(password: password)');

  // 4.2 Demo Customer
  const customerEmail = 'customer.demo@shubhmangalam.local';
  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {
      name: 'Demo Customer',
      phone: '+919800000001',
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      name: 'Demo Customer',
      email: customerEmail,
      phone: '+919800000001',
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('Seeded demo customer:', customer.email, '(password: password)');

  // 4.3 Easy Provider Account (provider@gmail.com)
  const easyProvider = await prisma.user.upsert({
    where: { email: 'provider@gmail.com' },
    update: {
      name: 'Dhiraj Events & Decorations',
      phone: '+919822222222',
      passwordHash: hashedPassword,
      role: 'VENDOR',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      name: 'Dhiraj Events & Decorations',
      email: 'provider@gmail.com',
      phone: '+919822222222',
      passwordHash: hashedPassword,
      role: 'VENDOR',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  await prisma.vendor.upsert({
    where: { userId: easyProvider.id },
    update: {
      businessName: 'Dhiraj Events & Tent House',
      slug: 'dhiraj-events',
      phone: '+919822222222',
      email: 'provider@gmail.com',
      addressLine1: 'Main Market, Model Town',
      city: 'Panipat',
      state: 'Haryana',
      pincode: '132103',
      latitude: 29.3909,
      longitude: 76.9635,
      status: 'APPROVED',
      isVerified: true,
      isActive: true,
    },
    create: {
      userId: easyProvider.id,
      businessName: 'Dhiraj Events & Tent House',
      slug: 'dhiraj-events',
      phone: '+919822222222',
      email: 'provider@gmail.com',
      addressLine1: 'Main Market, Model Town',
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
  console.log('Seeded easy provider:', easyProvider.email, '(password: password)');

  // 4.4 Demo Provider (Approved Vendor for provider testing)
  const providerEmail = 'provider.demo@shubhmangalam.local';
  const provider = await prisma.user.upsert({
    where: { email: providerEmail },
    update: {
      name: 'Royal Events (Demo Provider)',
      phone: '+919800000002',
      passwordHash: hashedPassword,
      role: 'VENDOR',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      name: 'Royal Events (Demo Provider)',
      email: providerEmail,
      phone: '+919800000002',
      passwordHash: hashedPassword,
      role: 'VENDOR',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  await prisma.vendor.upsert({
    where: { userId: provider.id },
    update: {
      businessName: 'Royal Events & Celebrations',
      slug: 'royal-events-demo',
      phone: '+919800000002',
      email: providerEmail,
      addressLine1: 'GT Road, Near City Mall',
      city: 'Panipat',
      state: 'Haryana',
      pincode: '132103',
      latitude: 29.3909,
      longitude: 76.9635,
      status: 'APPROVED',
      isVerified: true,
      isActive: true,
    },
    create: {
      userId: provider.id,
      businessName: 'Royal Events & Celebrations',
      slug: 'royal-events-demo',
      phone: '+919800000002',
      email: providerEmail,
      addressLine1: 'GT Road, Near City Mall',
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
  console.log('Seeded demo provider (APPROVED):', provider.email, '(password: password)');

  // 4.5 Easy Admin Account (admin@gmail.com)
  const easyAdmin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      name: 'System Admin',
      phone: '+919833333333',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      name: 'System Admin',
      email: 'admin@gmail.com',
      phone: '+919833333333',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('Seeded easy admin:', easyAdmin.email, '(password: password)');

  // 4.6 Demo Administrator
  const adminEmail = 'admin.demo@shubhmangalam.local';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Marketplace Administrator',
      phone: '+919800000003',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      name: 'Marketplace Administrator',
      email: adminEmail,
      phone: '+919800000003',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log('Seeded demo admin:', admin.email, '(password: password)');

  console.log('--- Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

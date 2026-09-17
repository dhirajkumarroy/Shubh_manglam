import { PrismaClient, BookingStatus, NotificationType } from '@prisma/client';
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

// 8 Core Essential Event Types
const EVENT_TYPES = [
  { name: 'Birthday', description: 'Birthday parties, 1st birthdays, and milestone celebrations', sortOrder: 1 },
  { name: 'Wedding', description: 'Traditional and modern wedding celebrations & rituals', sortOrder: 2 },
  { name: 'Engagement', description: 'Ring ceremony and pre-wedding engagement functions', sortOrder: 3 },
  { name: 'Reception', description: 'Post-wedding dinner and celebratory receptions', sortOrder: 4 },
  { name: 'Anniversary', description: 'Milestone anniversary gatherings and dinners', sortOrder: 5 },
  { name: 'Mundan', description: 'Sacred first haircut ceremony for children', sortOrder: 6 },
  { name: 'Puja', description: 'Hawan, Satyanarayan Katha, and spiritual blessings', sortOrder: 7 },
  { name: 'Party', description: 'Cocktail, family get-togethers, and private celebrations', sortOrder: 8 },
];

// 8 Core Simplified Celebration Categories
const CATEGORIES = [
  { name: 'Halwai & Catering', icon: '🍲', description: 'Desi ghee sweets, live halwai, buffet catering, snacks & chaat', sortOrder: 1 },
  { name: 'Decoration', icon: '🎈', description: 'Birthday theme balloons, floral stages, mandap & haldi decor', sortOrder: 2 },
  { name: 'Beautician & Makeup', icon: '💄', description: 'Party makeup, bridal HD makeover, hairstyling & sari draping', sortOrder: 3 },
  { name: 'Mehndi Artist', icon: '🌿', description: 'Bridal mehndi, Arabic henna designs, and guest group packages', sortOrder: 4 },
  { name: 'Photography & Videography', icon: '📸', description: 'Birthday shoots, candid wedding photography, and 4K cinematography', sortOrder: 5 },
  { name: 'DJ, Sound & Music', icon: '🎵', description: 'Party DJ with lights, traditional dhol, and PA sound systems', sortOrder: 6 },
  { name: 'Pandit Ji & Rituals', icon: '🕉️', description: 'Vedic pandits for birthday puja, hawan, and wedding rituals', sortOrder: 7 },
  { name: 'Tent & Furniture Setup', icon: '🎪', description: 'Shamiyana canopy, VIP sofas, banquet seating, and coolers', sortOrder: 8 },
];

const CATEGORY_SUBCATEGORIES: Record<string, { name: string; description: string }[]> = {
  'Halwai & Catering': [
    { name: 'Live Desi Ghee Jalebi & Mithai', description: 'Fresh hot jalebi, imarti, gulab jamun, and traditional sweets made on-site' },
    { name: 'Grand Party & Wedding Buffet', description: 'Multi-course appetizers, curries, breads, dal makhani, and desserts' },
    { name: 'Live Chaat & Street Food Stalls', description: 'Gol gappa, aloo tikki, dahi bhalla, pav bhaji, and spring roll counters' },
    { name: 'Morning Bedmi Poori & Sabzi', description: 'Authentic morning celebration breakfast with poori, aloo subzi, and pickle' },
  ],
  Decoration: [
    { name: 'Birthday Theme & Balloon Decor', description: 'Ring backdrops, organic balloon arches, cartoon themes, and LED numbers' },
    { name: 'Floral Stage & Backdrop', description: 'Fresh flower wall, grand sofa backdrop, and stage spotlighting' },
    { name: 'Mandap & Varmala Setup', description: 'Traditional Vedic 4-pillar mandap and revolving varmala stage' },
    { name: 'Haldi & Mehndi Setup', description: 'Yellow marigold curtains, photobooth cutouts, and festive floor seating' },
  ],
  'Beautician & Makeup': [
    { name: 'Party Makeup & Hair Styling', description: 'Subtle or glam party makeup, hair curling, and sari/lehenga draping' },
    { name: 'Bridal HD & Airbrush Makeup', description: 'Waterproof high-definition bridal makeup with jewelry setting' },
    { name: 'Family & Guest Makeup', description: 'Speedy makeover package for relatives and friends' },
  ],
  'Mehndi Artist': [
    { name: 'Bridal Full Hands & Feet', description: 'Intricate wedding storytelling figures, baraat motifs, and dense coverage' },
    { name: 'Arabic & Modern Henna', description: 'Trendy floral trails, shaded cuffs, and contemporary motifs' },
    { name: 'Family & Group Mehndi', description: 'Hourly mehndi package for wedding and sangeet guests' },
  ],
  'Photography & Videography': [
    { name: 'Birthday & Event Photography', description: 'Candid moments, cake cutting highlights, and family group portraits' },
    { name: 'Candid Wedding Photography', description: 'Artistic emotion-capturing portraits with premium album' },
    { name: 'Cinematic 4K Video & Drone', description: 'High-definition cinematic teaser, highlight reel, and aerial shots' },
  ],
  'DJ, Sound & Music': [
    { name: 'Birthday & Party DJ with Lights', description: 'High-energy DJ setup with dance lights, smoke machine, and sound' },
    { name: 'Dhol & Tasha Procession', description: 'Energetic Punjabi and wedding dhol players for entry' },
    { name: 'PA Sound System & Microphones', description: 'Clear acoustic speakers and wireless cordless mics for speeches' },
  ],
  'Pandit Ji & Rituals': [
    { name: 'Birthday Hawan & Blessing Puja', description: 'Vedic birthday prayers, hawan samagri, and auspicious chanting' },
    { name: 'Vivah Sanskar (Wedding Rites)', description: 'Complete traditional saat phere, kanyadaan, and Vedic mantras' },
    { name: 'Griha Pravesh & Satyanarayan', description: 'Housewarming blessing puja, hawan, and devotional storytelling' },
  ],
  'Tent & Furniture Setup': [
    { name: 'Waterproof Shamiyana & Canopy', description: 'Weatherproof all-season tent with sidewalls and ceiling fabric' },
    { name: 'VIP Sofas & Banquet Seating', description: 'White leatherette sofas, banquet chairs with covers, and coffee tables' },
    { name: 'Fairy Lights Canopy & Coolers', description: 'Warm fairy light roof curtains and heavy industrial desert coolers' },
  ],
};

const EVENT_RECOMMENDED_CATEGORIES: Record<string, string[]> = {
  Birthday: ['Halwai & Catering', 'Decoration', 'DJ, Sound & Music', 'Photography & Videography'],
  Wedding: [
    'Halwai & Catering',
    'Decoration',
    'Beautician & Makeup',
    'Mehndi Artist',
    'Photography & Videography',
    'DJ, Sound & Music',
    'Pandit Ji & Rituals',
    'Tent & Furniture Setup',
  ],
  Engagement: ['Decoration', 'Halwai & Catering', 'Photography & Videography', 'Beautician & Makeup', 'DJ, Sound & Music'],
  Reception: ['Halwai & Catering', 'Decoration', 'Photography & Videography', 'DJ, Sound & Music', 'Tent & Furniture Setup'],
  Anniversary: ['Decoration', 'Halwai & Catering', 'Photography & Videography', 'DJ, Sound & Music'],
  Mundan: ['Pandit Ji & Rituals', 'Halwai & Catering', 'Decoration', 'Photography & Videography'],
  Puja: ['Pandit Ji & Rituals', 'Halwai & Catering', 'Decoration', 'DJ, Sound & Music'],
  Party: ['Halwai & Catering', 'DJ, Sound & Music', 'Decoration', 'Photography & Videography'],
};

async function main() {
  console.log('--- PURGING ALL DATA & INITIALIZING CLEAN 8-CATEGORY MARKETPLACE ---');

  // 1. Clean Database
  console.log('1. Clearing existing tables...');
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
      "public"."event_type_categories",
      "public"."categories",
      "public"."event_types",
      "public"."admin_mfa",
      "public"."password_reset_tokens",
      "public"."email_verification_tokens",
      "public"."oauth_accounts",
      "public"."user_sessions",
      "public"."users"
    CASCADE;
  `);

  // 2. Seed Event Types
  console.log('\n2. Seeding 8 Core Event Types...');
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

  // 3. Seed 8 Simplified Categories & Subcategories
  console.log('\n3. Seeding 8 Clean Essential Categories & Subcategories...');
  const categoryMap = new Map<string, string>();
  const subcategoryMap = new Map<string, { id: string; categoryId: string }>();

  for (const cat of CATEGORIES) {
    const slug = toSlug(cat.name);
    const created = await prisma.category.create({
      data: {
        parentId: null,
        name: cat.name,
        slug,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryMap.set(cat.name, created.id);

    const subcats = CATEGORY_SUBCATEGORIES[cat.name] || [];
    let subOrder = 1;
    for (const sub of subcats) {
      const subSlug = `${slug}-${toSlug(sub.name)}`;
      const subCreated = await prisma.category.create({
        data: {
          parentId: created.id,
          name: sub.name,
          slug: subSlug,
          description: sub.description,
          sortOrder: subOrder++,
          isActive: true,
        },
      });
      subcategoryMap.set(`${cat.name}:${sub.name}`, { id: subCreated.id, categoryId: created.id });
    }
  }

  // 4. Map Event Types to Categories
  console.log('\n4. Mapping Event Types to Categories...');
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
    }
  }

  // 5. Standard Test Accounts (All with Password@123)
  console.log('\n5. Seeding Accounts (Admin, Customer, 3 Specialized Providers)...');
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
  console.log(`Admin seeded:     ${admin.email} / Password@123`);

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
  console.log(`Customer seeded:  ${customer.email} / Password@123`);

  // 5.3 Provider 1: Halwai & Catering Provider
  const halwaiUser = await prisma.user.create({
    data: {
      name: 'Radhe Shyam (Halwai)',
      email: 'halwai@gmail.com',
      phone: '+919811223344',
      passwordHash: defaultPasswordHash,
      role: 'VENDOR',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const halwaiVendor = await prisma.vendor.create({
    data: {
      userId: halwaiUser.id,
      businessName: 'Shree Krishna Halwai & Caterers',
      slug: 'shree-krishna-halwai-caterers',
      phone: '+919811223344',
      email: 'halwai@gmail.com',
      addressLine1: 'Main Halwai Gali, Near Railway Station',
      city: 'Panipat',
      state: 'Haryana',
      pincode: '132103',
      latitude: 29.3909,
      longitude: 76.9635,
      ratingAverage: 4.9,
      ratingCount: 38,
      status: 'APPROVED',
      isVerified: true,
      isActive: true,
    },
  });

  const halwaiCatId = categoryMap.get('Halwai & Catering')!;
  await prisma.vendorCategory.create({
    data: { vendorId: halwaiVendor.id, categoryId: halwaiCatId },
  });

  const jalebiSub = subcategoryMap.get('Halwai & Catering:Live Desi Ghee Jalebi & Mithai')!;
  const buffetSub = subcategoryMap.get('Halwai & Catering:Grand Party & Wedding Buffet')!;
  const breakfastSub = subcategoryMap.get('Halwai & Catering:Morning Bedmi Poori & Sabzi')!;

  const halwaiService1 = await prisma.service.create({
    data: {
      vendorId: halwaiVendor.id,
      categoryId: halwaiCatId,
      subcategoryId: jalebiSub.id,
      name: 'Live Desi Ghee Jalebi & Rabri Counter',
      slug: 'live-desi-ghee-jalebi-rabri-counter',
      description: 'Hot sizzling live jalebi fried in pure desi ghee served with chilled creamy rabri for celebrations.',
      pricingType: 'FIXED',
      basePrice: 8500,
      isAvailable: true,
      isActive: true,
    },
  });

  await prisma.service.create({
    data: {
      vendorId: halwaiVendor.id,
      categoryId: halwaiCatId,
      subcategoryId: buffetSub.id,
      name: 'Pure Veg Birthday Feast Buffet (Per Head)',
      slug: 'pure-veg-birthday-feast-buffet',
      description: 'Complete party buffet with 2 paneer dishes, dal makhani, pulao, naan/missi roti, raita, and hot gulab jamun.',
      pricingType: 'PER_PERSON',
      basePrice: 450,
      isAvailable: true,
      isActive: true,
    },
  });

  await prisma.service.create({
    data: {
      vendorId: halwaiVendor.id,
      categoryId: halwaiCatId,
      subcategoryId: breakfastSub.id,
      name: 'Traditional Bedmi Poori & Chana Sabzi',
      slug: 'traditional-bedmi-poori-chana-sabzi',
      description: 'Morning breakfast celebration with crisp urad dal bedmi poori, spicy hing aloo, and methi chutney.',
      pricingType: 'PER_PERSON',
      basePrice: 180,
      isAvailable: true,
      isActive: true,
    },
  });
  console.log(`Halwai seeded:    ${halwaiUser.email} / Password@123 ("Shree Krishna Halwai & Caterers")`);

  // 5.4 Provider 2: Beautician & Mehndi Provider
  const beautyUser = await prisma.user.create({
    data: {
      name: 'Pooja Sharma',
      email: 'beautician@gmail.com',
      phone: '+919822334455',
      passwordHash: defaultPasswordHash,
      role: 'VENDOR',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const beautyVendor = await prisma.vendor.create({
    data: {
      userId: beautyUser.id,
      businessName: 'Pooja Makeover & Mehndi Art',
      slug: 'pooja-makeover-mehndi-art',
      phone: '+919822334455',
      email: 'beautician@gmail.com',
      addressLine1: 'Shop 14, Model Town Market',
      city: 'Panipat',
      state: 'Haryana',
      pincode: '132103',
      latitude: 29.3950,
      longitude: 76.9680,
      ratingAverage: 4.8,
      ratingCount: 26,
      status: 'APPROVED',
      isVerified: true,
      isActive: true,
    },
  });

  const beautyCatId = categoryMap.get('Beautician & Makeup')!;
  const mehndiCatId = categoryMap.get('Mehndi Artist')!;
  await prisma.vendorCategory.createMany({
    data: [
      { vendorId: beautyVendor.id, categoryId: beautyCatId },
      { vendorId: beautyVendor.id, categoryId: mehndiCatId },
    ],
  });

  const makeupSub = subcategoryMap.get('Beautician & Makeup:Party Makeup & Hair Styling')!;
  const mehndiSub = subcategoryMap.get('Mehndi Artist:Arabic & Modern Henna')!;

  const beautyService1 = await prisma.service.create({
    data: {
      vendorId: beautyVendor.id,
      categoryId: beautyCatId,
      subcategoryId: makeupSub.id,
      name: 'Celebration Glam Party Makeup & Hair Styling',
      slug: 'celebration-glam-party-makeup-hair-styling',
      description: 'Flawless party makeup, eye shadow highlights, hair curls/bun, and saree/lehenga draping.',
      pricingType: 'PER_PERSON',
      basePrice: 2500,
      isAvailable: true,
      isActive: true,
    },
  });

  await prisma.service.create({
    data: {
      vendorId: beautyVendor.id,
      categoryId: mehndiCatId,
      subcategoryId: mehndiSub.id,
      name: 'Designer Arabic & Modern Henna Art',
      slug: 'designer-arabic-modern-henna-art',
      description: 'Elegant dark-stain natural organic henna with modern floral patterns for both palms.',
      pricingType: 'FIXED',
      basePrice: 3500,
      isAvailable: true,
      isActive: true,
    },
  });
  console.log(`Beautician seeded:${beautyUser.email} / Password@123 ("Pooja Makeover & Mehndi Art")`);

  // 5.5 Provider 3: Decor & DJ Provider
  const decorUser = await prisma.user.create({
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

  const decorVendor = await prisma.vendor.create({
    data: {
      userId: decorUser.id,
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
      ratingAverage: 4.9,
      ratingCount: 42,
      status: 'APPROVED',
      isVerified: true,
      isActive: true,
    },
  });

  const decorCatId = categoryMap.get('Decoration')!;
  const djCatId = categoryMap.get('DJ, Sound & Music')!;
  const tentCatId = categoryMap.get('Tent & Furniture Setup')!;
  await prisma.vendorCategory.createMany({
    data: [
      { vendorId: decorVendor.id, categoryId: decorCatId },
      { vendorId: decorVendor.id, categoryId: djCatId },
      { vendorId: decorVendor.id, categoryId: tentCatId },
    ],
  });

  const balloonSub = subcategoryMap.get('Decoration:Birthday Theme & Balloon Decor')!;
  const stageSub = subcategoryMap.get('Decoration:Floral Stage & Backdrop')!;
  const djSub = subcategoryMap.get('DJ, Sound & Music:Birthday & Party DJ with Lights')!;

  const decorService1 = await prisma.service.create({
    data: {
      vendorId: decorVendor.id,
      categoryId: decorCatId,
      subcategoryId: balloonSub.id,
      name: 'Birthday Theme & Balloon Ring Decor',
      slug: 'birthday-theme-balloon-ring-decor',
      description: 'Complete 8-foot circular arch with pastel organic balloons, neon "Happy Birthday" light, and cake plinth.',
      pricingType: 'FIXED',
      basePrice: 5500,
      isAvailable: true,
      isActive: true,
    },
  });

  await prisma.service.create({
    data: {
      vendorId: decorVendor.id,
      categoryId: decorCatId,
      subcategoryId: stageSub.id,
      name: 'Royal Floral Stage Backdrop',
      slug: 'royal-floral-stage-backdrop',
      description: 'Grand royal floral backdrop with warm stage lighting, velvet sofa set, and floral walkway.',
      pricingType: 'FIXED',
      basePrice: 25000,
      isAvailable: true,
      isActive: true,
    },
  });

  await prisma.service.create({
    data: {
      vendorId: decorVendor.id,
      categoryId: djCatId,
      subcategoryId: djSub.id,
      name: 'Party DJ with LED Truss & Laser Sound',
      slug: 'party-dj-led-truss-laser-sound',
      description: 'Professional celebration DJ, powerful JBL sound setup, moving head sharpies, and fog machine.',
      pricingType: 'PER_DAY',
      basePrice: 12000,
      isAvailable: true,
      isActive: true,
    },
  });
  console.log(`Decorator seeded: ${decorUser.email} / Password@123 ("Royal Celebrations & Decor")`);

  // 6. Seed Sample Live Inquiries Matching the User's Story (20 Sep Birthday Party)
  console.log('\n6. Seeding Initial 20 Sep Birthday Inquiries...');

  // Inquiry 1: Sent to Halwai for 20 Sep Birthday
  const inq1Metadata = {
    occasion: 'Birthday',
    eventDate: '20 Sep 2026',
    guestCount: 50,
    location: 'Model Town, Panipat',
    notes: 'Need live jalebi counter and dinner buffet for 50 people on 20th Sep evening 7 PM.',
    serviceName: halwaiService1.name,
  };

  const booking1 = await prisma.booking.create({
    data: {
      bookingNumber: 'SM-INQ-200901',
      customerId: customer.id,
      vendorId: halwaiVendor.id,
      status: BookingStatus.PENDING,
      subtotal: 8500,
      total: 8500,
      customerNote: JSON.stringify(inq1Metadata),
      items: {
        create: [
          {
            serviceId: halwaiService1.id,
            name: halwaiService1.name,
            quantity: 1,
            unitPrice: 8500,
            totalPrice: 8500,
            notes: 'Occasion: Birthday, 20 Sep 2026',
          },
        ],
      },
    },
  });

  // Inquiry 2: Sent to Decorator for 20 Sep Birthday
  const inq2Metadata = {
    occasion: 'Birthday',
    eventDate: '20 Sep 2026',
    guestCount: 50,
    location: 'Model Town, Panipat',
    notes: 'Need balloon ring decoration with golden and pastel blue theme.',
    serviceName: decorService1.name,
  };

  const booking2 = await prisma.booking.create({
    data: {
      bookingNumber: 'SM-INQ-200902',
      customerId: customer.id,
      vendorId: decorVendor.id,
      status: BookingStatus.PENDING,
      subtotal: 5500,
      total: 5500,
      customerNote: JSON.stringify(inq2Metadata),
      items: {
        create: [
          {
            serviceId: decorService1.id,
            name: decorService1.name,
            quantity: 1,
            unitPrice: 5500,
            totalPrice: 5500,
            notes: 'Occasion: Birthday, 20 Sep 2026',
          },
        ],
      },
    },
  });

  // Inquiry 3: Sent to Beautician (Already Accepted as showcase)
  const inq3Metadata = {
    occasion: 'Birthday Party',
    eventDate: '20 Sep 2026',
    guestCount: 2,
    location: 'Model Town, Panipat',
    notes: 'Party makeup for mom and sister at home at 4 PM.',
    serviceName: beautyService1.name,
  };

  await prisma.booking.create({
    data: {
      bookingNumber: 'SM-INQ-200903',
      customerId: customer.id,
      vendorId: beautyVendor.id,
      status: BookingStatus.CONFIRMED,
      subtotal: 5000,
      total: 5000,
      customerNote: JSON.stringify(inq3Metadata),
      vendorNote: 'Confirmed! Pooja will reach your residence at 3:45 PM on 20 Sep.',
      confirmedAt: new Date(),
      items: {
        create: [
          {
            serviceId: beautyService1.id,
            name: beautyService1.name,
            quantity: 2,
            unitPrice: 2500,
            totalPrice: 5000,
            notes: 'Occasion: Birthday Party',
          },
        ],
      },
    },
  });

  // Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: halwaiUser.id,
        title: 'New Birthday Inquiry for 20 Sep!',
        message: 'Dhiraj Customer sent an inquiry for Birthday feast on 20 Sep 2026 (50 guests).',
        type: NotificationType.REQUEST_CREATED,
        data: { bookingId: booking1.id, bookingNumber: 'SM-INQ-200901' },
      },
      {
        userId: decorUser.id,
        title: 'New Birthday Decor Inquiry for 20 Sep!',
        message: 'Dhiraj Customer sent an inquiry for Birthday balloon arch on 20 Sep 2026.',
        type: NotificationType.REQUEST_CREATED,
        data: { bookingId: booking2.id, bookingNumber: 'SM-INQ-200902' },
      },
      {
        userId: customer.id,
        title: 'Inquiry Accepted by Pooja Makeover!',
        message: 'Pooja Makeover accepted your request for 20 Sep 2026 party makeup.',
        type: NotificationType.OWNER_ACCEPTED,
      },
    ],
  });

  console.log('\n======================================================');
  console.log('✅ DATABASE PURGE & 8-CATEGORY SEED COMPLETED!');
  console.log('======================================================');
  console.log('Test Logins (Password: Password@123):');
  console.log('- Admin:      admin@gmail.com');
  console.log('- Customer:   customer@gmail.com');
  console.log('- Halwai:     halwai@gmail.com ("Shree Krishna Halwai")');
  console.log('- Beautician: beautician@gmail.com ("Pooja Makeover & Mehndi")');
  console.log('- Decorator:  provider@gmail.com ("Royal Celebrations & Decor")');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

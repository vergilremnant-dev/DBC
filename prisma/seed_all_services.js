import { PrismaClient, CategoryType, VerificationStatus, BookingStatus, RequirementStatus, CallbackStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { assertDemoSeedAllowed, demoSeedPassword } from './seedGuard.js';

const prisma = new PrismaClient();

const providersToSeed = [
  {
    email: 'cctv_partner@example.com',
    fullName: 'Karthik Raja',
    businessName: 'SecureVision CCTV Systems',
    categorySlug: 'cctv-installation',
    experienceYears: 6,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543010',
    description: 'Expert CCTV installation, home security integrations, DVR troubleshooting, and networking.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'pest_partner@example.com',
    fullName: 'Dinesh Karthik',
    businessName: 'PestShield Solutions',
    categorySlug: 'pest-control',
    experienceYears: 5,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543011',
    description: 'Professional termite treatments, cockroach gel applications, bed bug sprays, and rodent control.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'false_ceiling_partner@example.com',
    fullName: 'Sanjay Kapoor',
    businessName: 'Royal Ceiling Designs',
    categorySlug: 'false-ceiling',
    experienceYears: 7,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543012',
    description: 'Specialist in POP false ceiling installations, designer grid ceilings, gypsum board designs, and LED lighting setup.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'tiles_partner@example.com',
    fullName: 'Mahesh Babu',
    businessName: 'Elite Tiles & Marble',
    categorySlug: 'tiles',
    experienceYears: 9,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543013',
    description: 'Wall and floor tile installations, marble polishing, granite fittings, and grouting services.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'masonry_partner@example.com',
    fullName: 'Balaram Naidu',
    businessName: 'Naidu Civil Contractors',
    categorySlug: 'masonry',
    experienceYears: 11,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543014',
    description: 'Brickwork, concrete repairs, plastering, stone paving, and miscellaneous civil repairs.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'civil_engineer_partner@example.com',
    fullName: 'Vikram Sen',
    businessName: 'Sen Civil Engineering Consult',
    categorySlug: 'civil-engineer',
    experienceYears: 8,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543015',
    description: 'Professional site layout verifications, construction supervision, material quality audits, and structural reviews.',
    canProvideServices: false,
    canProvideConsultation: true,
    consultationFee: 1000
  },
  {
    email: 'structural_partner@example.com',
    fullName: 'Praveen Kumar',
    businessName: 'PK Structural Engineering',
    categorySlug: 'structural-engineer',
    experienceYears: 12,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543016',
    description: 'Column and beam load designs, foundation structural reviews, earthquake resistance audits, and stability certifications.',
    canProvideServices: false,
    canProvideConsultation: true,
    consultationFee: 2000
  },
  {
    email: 'landscape_partner@example.com',
    fullName: 'Meera Jasmine',
    businessName: 'GreenScapes Landscape Studio',
    categorySlug: 'landscape-designer',
    experienceYears: 10,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543017',
    description: 'Garden design layouts, pathway paving designs, balcony greening, and outdoor lighting arrangements.',
    canProvideServices: false,
    canProvideConsultation: true,
    consultationFee: 1800
  },
  {
    email: 'quantity_partner@example.com',
    fullName: 'Ram Prasad',
    businessName: 'RP Surveyors & Estimators',
    categorySlug: 'quantity-surveyor',
    experienceYears: 9,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543018',
    description: 'Material cost estimates, construction bill verifications, project valuations, and quantity audits.',
    canProvideServices: false,
    canProvideConsultation: true,
    consultationFee: 1100
  },
  {
    email: 'vastu_partner@example.com',
    fullName: 'Shastryji Sharma',
    businessName: 'Vastu Divine Solutions',
    categorySlug: 'vastu-consultant',
    experienceYears: 14,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543019',
    description: 'Directional home layouts, Vastu compliance reviews, element balance assessments, and correction plans without demolition.',
    canProvideServices: false,
    canProvideConsultation: true,
    consultationFee: 1500
  },
  {
    email: 'interior_designer_partner@example.com',
    fullName: 'Rahul Bose',
    businessName: 'Bose Interior Designs',
    categorySlug: 'interior-designer',
    experienceYears: 8,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543020',
    description: 'Exquisite residential and kitchen interior space layouts, false ceilings design, wardrobe planning, and modular setups.',
    canProvideServices: false,
    canProvideConsultation: true,
    consultationFee: 1200
  },
  {
    email: 'architect_partner@example.com',
    fullName: 'Alice Architect',
    businessName: 'Alice Design Studio',
    categorySlug: 'architect',
    experienceYears: 10,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543021',
    description: 'Senior Structural Architect and Design Consultant.',
    canProvideServices: false,
    canProvideConsultation: true,
    consultationFee: 1500
  }
];

async function main() {
  // This script deletes and recreates demo data: development/test databases only.
  assertDemoSeedAllowed('seed_all_services.js');
  const demoPassword = demoSeedPassword('seed_all_services.js');
  console.log('=== STARTING ALL SERVICES SEEDING ===\n');

  // Verify and create a default customer profile
  const customerEmail = 'customer@dbc.com';
  let customerUser = await prisma.user.findUnique({ where: { email: customerEmail } });
  if (!customerUser) {
    const hashedPassword = await bcrypt.hash(demoPassword, 10);
    customerUser = await prisma.user.create({
      data: {
        email: customerEmail,
        password: hashedPassword,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }
    });
  }

  let customerProfile = await prisma.customerProfile.findUnique({ where: { userId: customerUser.id } });
  if (!customerProfile) {
    customerProfile = await prisma.customerProfile.create({
      data: {
        userId: customerUser.id,
        fullName: 'John Customer',
        phoneNumber: '9876543210',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        address: 'Apt 4B, Emerald Residency'
      }
    });
  }
  console.log(`✅ Customer Profile Ready: ${customerProfile.fullName}`);

  // Fetch users to delete and clean up children tables
  const emailsToDelete = providersToSeed.map(p => p.email);
  const usersToDelete = await prisma.user.findMany({
    where: { email: { in: emailsToDelete } },
    include: { providerProfile: true }
  });

  const providerIds = usersToDelete
    .map(u => u.providerProfile?.id)
    .filter(Boolean);

  if (providerIds.length > 0) {
    console.log(`🧹 Found ${providerIds.length} seeded profiles. Cleaning child records...`);
    // Delete reviews
    await prisma.review.deleteMany({ where: { providerId: { in: providerIds } } });
    // Delete portfolios
    await prisma.portfolio.deleteMany({ where: { providerId: { in: providerIds } } });
    // Delete bookings
    await prisma.booking.deleteMany({ where: { providerId: { in: providerIds } } });
    // Delete callback requests
    await prisma.callbackRequest.deleteMany({ where: { assignedProviderId: { in: providerIds } } });
  }

  // Also clean up any customer requirements matching the category ids
  const categorySlugs = providersToSeed.map(p => p.categorySlug);
  const categoriesToDeleteReqs = await prisma.serviceCategory.findMany({
    where: { slug: { in: categorySlugs } }
  });
  const categoryIds = categoriesToDeleteReqs.map(c => c.id);
  if (categoryIds.length > 0) {
    await prisma.requirement.deleteMany({ where: { serviceCategoryId: { in: categoryIds } } });
  }

  // Now safely delete the parent user accounts
  await prisma.user.deleteMany({
    where: {
      email: { in: emailsToDelete }
    }
  });
  console.log('🧹 Cleaned up existing partner seed users.');

  for (const partner of providersToSeed) {
    console.log(`Checking category for slug: ${partner.categorySlug}...`);
    let category = await prisma.serviceCategory.findUnique({
      where: { slug: partner.categorySlug }
    });

    if (!category) {
      console.log(`   Category ${partner.categorySlug} missing, creating...`);
      category = await prisma.serviceCategory.create({
        data: {
          name: partner.categorySlug.charAt(0).toUpperCase() + partner.categorySlug.slice(1).replace('-', ' '),
          slug: partner.categorySlug,
          categoryType: partner.canProvideConsultation ? CategoryType.WHITE_COLLAR : CategoryType.BLUE_COLLAR,
          icon: partner.categorySlug,
          isActive: true
        }
      });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(demoPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: partner.email,
        password: hashedPassword,
        role: 'PROVIDER',
        status: 'ACTIVE'
      }
    });
    console.log(`   ✅ Created User: ${user.email}`);

    // Create provider profile
    const profile = await prisma.providerProfile.create({
      data: {
        userId: user.id,
        fullName: partner.fullName,
        businessName: partner.businessName,
        categoryId: category.id,
        experienceYears: partner.experienceYears,
        city: partner.city,
        state: partner.state,
        phoneNumber: partner.phoneNumber,
        email: partner.email,
        description: partner.description,
        verificationStatus: VerificationStatus.VERIFIED,
        canProvideServices: partner.canProvideServices,
        canProvideConsultation: partner.canProvideConsultation,
        consultationFee: partner.consultationFee || 0,
        averageRating: 4.8,
        totalReviews: 1,
        rating5Count: 1
      }
    });
    console.log(`   ✅ Created Provider Profile: ${profile.fullName} in ${category.name}`);

    // Seed a portfolio item
    await prisma.portfolio.create({
      data: {
        providerId: profile.id,
        title: `${partner.businessName} Flagship Project`,
        description: `A showcase of our premium works in ${category.name}. All deliverables were met on time.`,
        projectType: partner.canProvideConsultation ? 'Consultation & Planning' : 'Execution & Fitting',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
      }
    });

    // Seed a review
    await prisma.review.create({
      data: {
        customerId: customerProfile.id,
        providerId: profile.id,
        rating: 5,
        reviewTitle: 'Exceptional Quality of Work',
        reviewDescription: `Highly professional team. The execution of ${category.name} services was seamless. Would highly recommend!`,
        wouldRecommend: true,
        isVerified: true
      }
    });

    // Seed a requirement for customer in this category
    const reqTitle = `Need Professional ${category.name} Services`;
    await prisma.requirement.create({
      data: {
        customerId: customerProfile.id,
        title: reqTitle,
        description: `Looking for experienced team to handle custom ${category.name.toLowerCase()} work for a 3BHK residential site.`,
        serviceCategory: category.name,
        serviceCategoryId: category.id,
        location: 'Madhapur, Hyderabad',
        budgetMin: partner.canProvideConsultation ? 10000 : 5000,
        budgetMax: partner.canProvideConsultation ? 50000 : 25000,
        status: RequirementStatus.PUBLISHED
      }
    });

    // Seed a booking record
    const bookingNo = `BK-${partner.categorySlug.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;
    await prisma.booking.create({
      data: {
        customerId: customerProfile.id,
        providerId: profile.id,
        categoryId: category.id,
        bookingNumber: bookingNo,
        bookingStatus: BookingStatus.COMPLETED,
        preferredDate: new Date(),
        preferredTime: '10:00 AM - 12:00 PM',
        customerAddress: 'Apt 4B, Emerald Residency',
        city: 'Hyderabad',
        state: 'Telangana',
        notes: 'Standard installation and verification works.',
        estimatedBudget: partner.canProvideConsultation ? 15000 : 8000
      }
    });

    // Seed a callback request
    const refNo = `CB-${partner.categorySlug.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;
    await prisma.callbackRequest.create({
      data: {
        referenceNumber: refNo,
        fullName: customerProfile.fullName,
        phoneNumber: customerProfile.phoneNumber,
        email: customerEmail,
        city: 'Hyderabad',
        state: 'Telangana',
        preferredLanguage: 'English',
        serviceCategoryId: category.id,
        projectType: partner.canProvideConsultation ? 'Consultation' : 'Execution',
        estimatedBudget: partner.canProvideConsultation ? 2000 : 10000,
        preferredCallTime: 'Evening (4 PM - 7 PM)',
        message: `Interested in callback consultation for ${category.name.toLowerCase()}.`,
        status: CallbackStatus.CONTACTED,
        assignedProviderId: profile.id,
        notes: `Setup contact with ${profile.fullName}`
      }
    });
  }

  console.log('\n=== ALL SERVICES DATABASE SEEDING COMPLETED SUCCESSFULY ===');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ SEED ERROR:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

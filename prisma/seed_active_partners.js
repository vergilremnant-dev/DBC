import { PrismaClient, CategoryType, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { assertDemoSeedAllowed, demoSeedPassword } from './seedGuard.js';

const prisma = new PrismaClient();

const partnersToSeed = [
  {
    email: 'plumber_partner@example.com',
    fullName: 'Ramesh Prasad',
    businessName: 'Prasad Plumbing Services',
    categorySlug: 'plumbing',
    experienceYears: 12,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543001',
    description: 'Expert in residential pipe fittings, leak repairs, bathroom fitments, and water pump troubleshooting.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'electrician_partner@example.com',
    fullName: 'Kiran Kumar',
    businessName: 'Kiran Electrical Works',
    categorySlug: 'electrical',
    experienceYears: 8,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543002',
    description: 'Specialized in home rewiring, short-circuit repairs, switchboard installations, and inverter setups.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'carpenter_partner@example.com',
    fullName: 'Mohammad Ali',
    businessName: 'Ali Custom Woodworks',
    categorySlug: 'carpentry',
    experienceYears: 15,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543003',
    description: 'Master craftsman for custom furniture, cabinet installations, wooden door repair, and polishing works.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'painter_partner@example.com',
    fullName: 'Vijay Singh',
    businessName: 'Vijay Wall Painters',
    categorySlug: 'painting',
    experienceYears: 7,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543004',
    description: 'Professional interior and exterior painting services, wall textures, damp proofing, and color consultation.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'ac_partner@example.com',
    fullName: 'Suresh Raina',
    businessName: 'Raina AC Techs',
    categorySlug: 'ac-repair',
    experienceYears: 6,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543005',
    description: 'Expert servicing for split/window ACs, gas charging, filter wash, and compressor replacements.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'cleaner_partner@example.com',
    fullName: 'Anitha Reddy',
    businessName: 'Reddy Deep Cleaners',
    categorySlug: 'cleaning',
    experienceYears: 5,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543006',
    description: 'Premium deep cleaning, kitchen sanitization, sofa shampooing, and bathroom descaling.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'waterproofer_partner@example.com',
    fullName: 'Nikhil Gowda',
    businessName: 'Gowda Damp Solutions',
    categorySlug: 'waterproofing',
    experienceYears: 9,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543007',
    description: 'Terrace waterproofing, basement chemical coatings, expansion joint filling, and slab leakage protection.',
    canProvideServices: true,
    canProvideConsultation: false
  },
  {
    email: 'architect_partner@example.com',
    fullName: 'Ananya Roy',
    businessName: 'Roy Architect Associates',
    categorySlug: 'architecture',
    experienceYears: 10,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543008',
    description: 'Registered Architect. Customized 2D/3D floor planning, elevation design, structural safety, and blueprint approvals.',
    canProvideServices: false,
    canProvideConsultation: true,
    consultationFee: 1500
  },
  {
    email: 'interior_partner@example.com',
    fullName: 'Rahul Bose',
    businessName: 'Bose Interior Designs',
    categorySlug: 'interior-design',
    experienceYears: 8,
    city: 'Hyderabad',
    state: 'Telangana',
    phoneNumber: '9876543009',
    description: 'Exquisite residential and kitchen interior space layouts, false ceilings design, wardrobe planning, and modular setups.',
    canProvideServices: false,
    canProvideConsultation: true,
    consultationFee: 1200
  }
];

async function main() {
  assertDemoSeedAllowed('seed_active_partners.js');
  const demoPasswordHash = await bcrypt.hash(demoSeedPassword('seed_active_partners.js'), 10);
  console.log('=== SEEDING ACTIVE SERVICE PARTNERS ===\n');

  for (const partner of partnersToSeed) {
    console.log(`Checking category for: ${partner.categorySlug}...`);
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

    // Check user duplication
    let user = await prisma.user.findFirst({ where: { email: partner.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: partner.email,
          password: demoPasswordHash,
          role: 'PROVIDER',
          status: 'ACTIVE'
        }
      });
      console.log(`   ✅ Created User: ${user.email}`);
    }

    // Check profile duplication
    let profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.providerProfile.create({
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
          canProvideConsultation: partner.canProvideConsultation,
          consultationFee: partner.consultationFee || 0
        }
      });
      console.log(`   ✅ Created Provider Profile: ${profile.fullName}`);
    } else {
      console.log(`   Partner Profile for ${partner.fullName} already exists.`);
    }
  }

  console.log('\n=== SEEDING COMPLETED SUCCESSFULY ===');
}

main()
  .catch((e) => {
    console.error('❌ SEED CRASHED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, CategoryType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { assertDemoSeedAllowed, demoAdminAllowed, demoSeedPassword } from './seedGuard.js';

const prisma = new PrismaClient();

const categories = [
  // Blue Collar Categories
  {
    name: 'Plumbing',
    slug: 'plumbing',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Professional plumbing services, pipe repairs, leak detections, and fittings.',
    icon: 'plumbing',
    displayOrder: 1,
    isActive: true,
  },
  {
    name: 'Electrical',
    slug: 'electrical',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Electrical wiring, appliance installations, circuit repairs, and maintenance.',
    icon: 'electrical',
    displayOrder: 2,
    isActive: true,
  },
  {
    name: 'Carpentry',
    slug: 'carpentry',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Custom woodwork, furniture repairs, cabinetry, door installations, and polishing.',
    icon: 'carpentry',
    displayOrder: 3,
    isActive: true,
  },
  {
    name: 'Painting',
    slug: 'painting',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Interior and exterior wall painting, textures, wall waterproofing, and color consultations.',
    icon: 'painting',
    displayOrder: 4,
    isActive: true,
  },
  {
    name: 'AC Repair',
    slug: 'ac-repair',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Air conditioner servicing, gas refilling, installations, and compressor repairs.',
    icon: 'ac-repair',
    displayOrder: 5,
    isActive: true,
  },
  {
    name: 'CCTV Installation',
    slug: 'cctv-installation',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Security camera installations, surveillance system setup, DVR troubleshooting, and networking.',
    icon: 'cctv',
    displayOrder: 6,
    isActive: true,
  },
  {
    name: 'Cleaning',
    slug: 'cleaning',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Deep home cleaning, sofa and carpet shampooing, bathroom descaling, and kitchen cleaning.',
    icon: 'cleaning',
    displayOrder: 7,
    isActive: true,
  },
  {
    name: 'Waterproofing',
    slug: 'waterproofing',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Terrace waterproofing, basement dampness control, bathroom leakage repairs, and chemical coatings.',
    icon: 'waterproofing',
    displayOrder: 8,
    isActive: true,
  },
  {
    name: 'Pest Control',
    slug: 'pest-control',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Termite treatments, cockroach gel applications, bed bug sprays, and rodent control.',
    icon: 'pest-control',
    displayOrder: 9,
    isActive: true,
  },
  {
    name: 'False Ceiling',
    slug: 'false-ceiling',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'POP false ceiling installations, designer grid ceilings, gypsum board designs, and LED lighting setup.',
    icon: 'false-ceiling',
    displayOrder: 10,
    isActive: true,
  },
  {
    name: 'Tiles',
    slug: 'tiles',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Wall and floor tile installations, marble polishing, granite fittings, and grouting services.',
    icon: 'tiles',
    displayOrder: 11,
    isActive: true,
  },
  {
    name: 'Masonry',
    slug: 'masonry',
    categoryType: CategoryType.BLUE_COLLAR,
    description: 'Brickwork, concrete repairs, plastering, stone paving, and miscellaneous civil repairs.',
    icon: 'masonry',
    displayOrder: 12,
    isActive: true,
  },

  // White Collar Categories
  {
    name: 'Architect',
    slug: 'architect',
    categoryType: CategoryType.WHITE_COLLAR,
    description: 'Home layout plans, architectural elevations, blueprint designs, and building permit compliance.',
    icon: 'architect',
    displayOrder: 13,
    isActive: true,
  },
  {
    name: 'Interior Designer',
    slug: 'interior-designer',
    categoryType: CategoryType.WHITE_COLLAR,
    description: '3D interior visualizations, space planning, modular kitchen designs, and material selections.',
    icon: 'interior-designer',
    displayOrder: 14,
    isActive: true,
  },
  {
    name: 'Civil Engineer',
    slug: 'civil-engineer',
    categoryType: CategoryType.WHITE_COLLAR,
    description: 'Site layout verifications, construction supervision, material quality audits, and structural reviews.',
    icon: 'civil-engineer',
    displayOrder: 15,
    isActive: true,
  },
  {
    name: 'Structural Engineer',
    slug: 'structural-engineer',
    categoryType: CategoryType.WHITE_COLLAR,
    description: 'Column and beam load designs, foundation structural reviews, earthquake resistance audits, and stability certifications.',
    icon: 'structural-engineer',
    displayOrder: 16,
    isActive: true,
  },
  {
    name: 'Landscape Designer',
    slug: 'landscape-designer',
    categoryType: CategoryType.WHITE_COLLAR,
    description: 'Garden design layouts, pathway paving designs, balcony greening, and outdoor lighting arrangements.',
    icon: 'landscape-designer',
    displayOrder: 17,
    isActive: true,
  },
  {
    name: 'Quantity Surveyor',
    slug: 'quantity-surveyor',
    categoryType: CategoryType.WHITE_COLLAR,
    description: 'Material cost estimates, construction bill verifications, project valuations, and quantity audits.',
    icon: 'quantity-surveyor',
    displayOrder: 18,
    isActive: true,
  },
  {
    name: 'Vastu Consultant',
    slug: 'vastu-consultant',
    categoryType: CategoryType.WHITE_COLLAR,
    description: 'Directional home layouts, Vastu compliance reviews, element balance assessments, and correction plans without demolition.',
    icon: 'vastu-consultant',
    displayOrder: 19,
    isActive: true,
  },
];

const testUsers = [
  {
    email: 'admin@dbc.com',
    role: 'ADMIN',
    profile: null,
  },
  {
    email: 'customer@dbc.com',
    role: 'CUSTOMER',
    profile: {
      type: 'customer',
      data: {
        fullName: 'John Customer',
        phoneNumber: '9876543210',
        address: 'Apt 4B, Emerald Residency',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
      },
    },
  },
  {
    email: 'professional@dbc.com',
    role: 'PROVIDER',
    profile: {
      type: 'provider_services',
    },
  },
  {
    email: 'consultant@dbc.com',
    role: 'PROVIDER',
    profile: {
      type: 'provider_consultant',
    },
  },
];

async function main() {
  assertDemoSeedAllowed('seed.js');
  const demoPassword = demoSeedPassword('seed.js');
  console.log('Seeding service categories...');
  for (const category of categories) {
    const upserted = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        categoryType: category.categoryType,
        description: category.description,
        icon: category.icon,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
      },
      create: category,
    });
    console.log(`Upserted category: ${upserted.name} (${upserted.categoryType})`);
  }
  console.log('Category seeding completed successfully.');

  console.log('\nSeeding test users...');
  for (const user of testUsers) {
    // Admin demo accounts are opt-in: a seed never grants ADMIN silently.
    if (user.role === 'ADMIN' && !demoAdminAllowed()) {
      console.log(`Skipped admin demo account ${user.email} (set SEED_CREATE_ADMIN=true to create it).`);
      continue;
    }
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(demoPassword, 10);
      const createdUser = await prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          role: user.role,
        },
      });
      console.log(`Created user: ${createdUser.email} with role ${createdUser.role}`);

      if (user.profile) {
        if (user.profile.type === 'customer') {
          await prisma.customerProfile.create({
            data: {
              userId: createdUser.id,
              ...user.profile.data,
            },
          });
          console.log(`Created Customer Profile for ${createdUser.email}`);
        } else if (user.profile.type === 'provider_services') {
          const category = await prisma.serviceCategory.findUnique({
            where: { slug: 'plumbing' }
          });
          const categoryId = category ? category.id : 1;

          await prisma.providerProfile.create({
            data: {
              userId: createdUser.id,
              fullName: 'Bob Builder',
              businessName: 'DBC Plumbing Pros',
              phoneNumber: '9876543211',
              email: createdUser.email,
              experienceYears: 5,
              city: 'Hyderabad',
              state: 'Telangana',
              serviceAreas: 'Gachibowli, Madhapur, Jubilee Hills',
              categoryId: categoryId,
              description: 'Professional plumbing installations and leak repairs.',
              canProvideServices: true,
              canProvideConsultation: false,
            },
          });
          console.log(`Created Services Provider Profile for ${createdUser.email}`);
        } else if (user.profile.type === 'provider_consultant') {
          const category = await prisma.serviceCategory.findUnique({
            where: { slug: 'architect' }
          });
          const categoryId = category ? category.id : 1;

          await prisma.providerProfile.create({
            data: {
              userId: createdUser.id,
              fullName: 'Alice Architect',
              businessName: 'Alice Design Studio',
              phoneNumber: '9876543222',
              email: createdUser.email,
              experienceYears: 10,
              city: 'Hyderabad',
              state: 'Telangana',
              serviceAreas: 'All India',
              categoryId: categoryId,
              description: 'Senior Structural Architect and Design Consultant.',
              canProvideServices: true,
              canProvideConsultation: true,
              consultationFee: 1500.0,
            },
          });
          console.log(`Created Consultant/Architect Provider Profile for ${createdUser.email}`);
        }
      }
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }
  console.log('User seeding completed successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

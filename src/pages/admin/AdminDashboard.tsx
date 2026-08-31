import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { BrandLogo } from '../../components/common/BrandLogo';


import UserManagementHeader from '../../components/admin/user-management/UserManagementHeader';
import UserStatistics from '../../components/admin/user-management/UserStatistics';
import UserSearch from '../../components/admin/user-management/UserSearch';
import UserFilters, { type UserFiltersState } from '../../components/admin/user-management/UserFilters';
import UsersTable from '../../components/admin/user-management/UsersTable';
import UserCard from '../../components/admin/user-management/UserCard';
import UserDetailsPanel from '../../components/admin/user-management/UserDetailsPanel';
import UserQuickActions from '../../components/admin/user-management/UserQuickActions';
import SkeletonUsers from '../../components/admin/user-management/SkeletonUsers';
import EmptyStateUsers from '../../components/admin/user-management/EmptyState';

import MarketplaceHeader from '../../components/admin/marketplace-management/MarketplaceHeader';
import MarketplaceStats from '../../components/admin/marketplace-management/MarketplaceStats';
import MarketplaceSearch from '../../components/admin/marketplace-management/MarketplaceSearch';
import MarketplaceFilters, { type MarketplaceFiltersState } from '../../components/admin/marketplace-management/MarketplaceFilters';
import RequirementsTable from '../../components/admin/marketplace-management/RequirementsTable';
import RequirementCard from '../../components/admin/marketplace-management/RequirementCard';
import RequirementDetails from '../../components/admin/marketplace-management/RequirementDetails';
import ReportedRequirements from '../../components/admin/marketplace-management/ReportedRequirements';
import MarketplaceQuickActions from '../../components/admin/marketplace-management/MarketplaceQuickActions';
import SkeletonMarketplace from '../../components/admin/marketplace-management/SkeletonMarketplace';
import MarketplaceEmptyState from '../../components/admin/marketplace-management/MarketplaceEmptyState';

import ProjectMonitoringHeader from '../../components/admin/project-monitoring/ProjectMonitoringHeader';
import ProjectStatistics from '../../components/admin/project-monitoring/ProjectStatistics';
import ProjectSearch from '../../components/admin/project-monitoring/ProjectSearch';
import ProjectFilters, { type ProjectFiltersState } from '../../components/admin/project-monitoring/ProjectFilters';
import ProjectsTable from '../../components/admin/project-monitoring/ProjectsTable';
import ProjectCard from '../../components/admin/project-monitoring/ProjectCard';
import ProjectDetails from '../../components/admin/project-monitoring/ProjectDetails';
import ProjectTimeline from '../../components/admin/project-monitoring/ProjectTimeline';
import ProjectQuickActions from '../../components/admin/project-monitoring/ProjectQuickActions';
import SkeletonProjects from '../../components/admin/project-monitoring/SkeletonProjects';
import ProjectEmptyState from '../../components/admin/project-monitoring/ProjectEmptyState';

import VerificationHeader from '../../components/admin/verification-center/VerificationHeader';
import VerificationStatistics from '../../components/admin/verification-center/VerificationStatistics';
import VerificationSearch from '../../components/admin/verification-center/VerificationSearch';
import VerificationFilters, { type VerificationFiltersState } from '../../components/admin/verification-center/VerificationFilters';
import VerificationTable from '../../components/admin/verification-center/VerificationTable';
import DocumentViewer, { type DocumentFile } from '../../components/admin/verification-center/DocumentViewer';
import VerificationDetails from '../../components/admin/verification-center/VerificationDetails';
import VerificationHistory, { type TimelineItem } from '../../components/admin/verification-center/VerificationHistory';
import VerificationQuickActions from '../../components/admin/verification-center/QuickActions';
import SkeletonVerification from '../../components/admin/verification-center/SkeletonVerification';
import VerificationEmptyState from '../../components/admin/verification-center/EmptyState';

import ReportsHeader from '../../components/admin/reports-monitoring/ReportsHeader';
import StatisticsCards from '../../components/admin/reports-monitoring/StatisticsCards';
import GrowthSummary from '../../components/admin/reports-monitoring/GrowthSummary';
import RequirementsSummary from '../../components/admin/reports-monitoring/RequirementsSummary';
import ProjectsSummary from '../../components/admin/reports-monitoring/ProjectsSummary';
import VerificationSummary from '../../components/admin/reports-monitoring/VerificationSummary';
import QuotationSummary from '../../components/admin/reports-monitoring/QuotationSummary';
import PlatformHealthCard from '../../components/admin/reports-monitoring/PlatformHealthCard';
import ReportsQuickActions from '../../components/admin/reports-monitoring/QuickActions';
import SkeletonReports from '../../components/admin/reports-monitoring/SkeletonReports';
import ReportsEmptyState from '../../components/admin/reports-monitoring/EmptyState';

export type AdminTab = 'dashboard' | 'users' | 'verifications' | 'disputes' | 'content' | 'audit' | 'health' | 'marketplace' | 'projects';

export interface ProjectRecord {
  id: string;
  name: string;
  customerName: string;
  professionalName: string;
  category: string;
  progress: number;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  startDate: string;
  expectedCompletion: string;
  lastUpdated: string;
  requirementId: string;
  city: string;
  address: string;
  scope?: string;
  milestones?: { id: string; name: string; status: 'Pending' | 'In Progress' | 'Completed'; completionDate?: string }[];
  tasksCount?: number;
  completedTasksCount?: number;
  documents?: string[];
  flagged?: boolean;
  flagReason?: string;
  timeline?: { date: string; title: string; desc: string }[];
}

export interface MarketplaceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  customerName: string;
  city: string;
  address: string;
  budgetMin: number;
  budgetMax: number;
  status: 'Open' | 'Closed' | 'Hidden' | 'Reported' | 'Pending Review' | 'Expired';
  createdAt: string;
  reportCount: number;
  reportReason?: string;
  reportedBy?: string;
  reportDate?: string;
  timeline?: string;
  documents?: string[];
  images?: string[];
  propertyType?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Customer' | 'Professional' | 'Consultant' | 'Admin';
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending Verification';
  verificationStatus: 'Verified' | 'Rejected' | 'Pending';
  joinedDate: string;
  lastLogin: string;
  companyName?: string;
  location?: string;
}

export interface VerificationRequest {
  id: string;
  name: string;
  category: string;
  licenseNumber: string;
  experience: string;
  documentName: string;
  role: 'Professional' | 'Consultant';
  submittedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Additional Information Requested' | 'Expired';
  documentsSubmitted: DocumentFile[];
  lastUpdated: string;
  email: string;
  phone: string;
  businessName?: string;
  registrationNumber?: string;
  location?: string;
  notes?: string;
  timeline: TimelineItem[];
}

interface DisputeRecord {
  id: string;
  client: string;
  provider: string;
  topic: string;
  amount: number;
  status: 'Open' | 'Resolved';
  adminNotes: string;
}

const INITIAL_USERS: UserRecord[] = [
  { id: 'u-1', name: 'Alice Architect', email: 'alice@example.com', phone: '+91 98765 43210', role: 'Customer', status: 'Active', verificationStatus: 'Verified', joinedDate: '24 Jun 2026', lastLogin: '03 Aug 2026', companyName: 'Alice Design Studio', location: 'Hyderabad' },
  { id: 'u-2', name: 'Bob Builder', email: 'bob@example.com', phone: '+91 99887 76655', role: 'Professional', status: 'Active', verificationStatus: 'Verified', joinedDate: '12 Jul 2026', lastLogin: '02 Aug 2026', companyName: 'Builder & Sons Co.', location: 'Bangalore' },
  { id: 'u-3', name: 'Charlie Consultant', email: 'charlie@example.com', phone: '+91 91234 56789', role: 'Consultant', status: 'Pending Verification', verificationStatus: 'Pending', joinedDate: '28 Jul 2026', lastLogin: '28 Jul 2026', companyName: 'Vastu & Structural Solutions', location: 'Hyderabad' },
  { id: 'u-4', name: 'Sarah Admin', email: 'admin@example.com', phone: '+91 90000 12345', role: 'Admin', status: 'Active', verificationStatus: 'Verified', joinedDate: '01 Jan 2026', lastLogin: '03 Aug 2026', companyName: 'DBC Administration', location: 'Delhi' }
];

const INITIAL_VERIFICATIONS: VerificationRequest[] = [
  {
    id: 'v-101',
    name: 'Charlie Consultant',
    category: 'Vastu Consultant',
    licenseNumber: 'VST-2026-90',
    experience: '12 Years',
    documentName: 'VastuConsultingLicense.pdf',
    role: 'Consultant',
    submittedDate: '01 Aug 2026',
    status: 'Pending',
    documentsSubmitted: [
      { type: 'Professional License', name: 'VastuConsultingLicense.pdf', size: '450 KB', uploadedAt: '01 Aug 2026, 10:00 AM', metadata: 'SHA-256: 4f89d3c2a8f3b2' },
      { type: 'Identity Proof', name: 'CharlieAadharCard.pdf', size: '280 KB', uploadedAt: '01 Aug 2026, 10:05 AM', metadata: 'SHA-256: 7b31e9c2f5d4a1' }
    ],
    lastUpdated: '1 hour ago',
    email: 'charlie@example.com',
    phone: '+91 91234 56789',
    businessName: 'Vastu & Structural Solutions',
    registrationNumber: 'U74999TG2026PTC',
    location: 'Hyderabad',
    notes: 'Awaiting secondary certification check from council.',
    timeline: [
      { date: '01 Aug 2026, 10:00 AM', title: 'Verification Submitted', desc: 'Charlie Consultant uploaded license validation sheets.' },
      { date: '01 Aug 2026, 10:05 AM', title: 'Documents Uploaded', desc: 'Identity proof uploaded to secure escrow storage.' },
      { date: '02 Aug 2026, 02:00 PM', title: 'Review Started', desc: 'Sarah Admin initiated professional credentials audit.' }
    ]
  },
  {
    id: 'v-102',
    name: 'Dave Decorator',
    category: 'Interior Designer',
    licenseNumber: 'INT-25-8822',
    experience: '5 Years',
    documentName: 'InteriorDesignCertificate.pdf',
    role: 'Professional',
    submittedDate: '28 Jul 2026',
    status: 'Pending',
    documentsSubmitted: [
      { type: 'Business Registration', name: 'InteriorDesignCertificate.pdf', size: '1.2 MB', uploadedAt: '28 Jul 2026, 09:00 AM', metadata: 'SHA-256: d8e3f4a1c5d9a2' },
      { type: 'GST Certificate', name: 'GSTIN_DaveDecor.pdf', size: '620 KB', uploadedAt: '28 Jul 2026, 09:12 AM', metadata: 'SHA-256: c3a4b9f2d1e5a8' }
    ],
    lastUpdated: 'Yesterday',
    email: 'dave@example.com',
    phone: '+91 98888 77777',
    businessName: 'Dave Decorator Enterprises',
    registrationNumber: '36AAAAA1111A1Z1',
    location: 'Hyderabad',
    notes: 'GST number format matches validation schema.',
    timeline: [
      { date: '28 Jul 2026, 09:00 AM', title: 'Verification Submitted', desc: 'Dave Decorator submitted verification request.' },
      { date: '28 Jul 2026, 09:12 AM', title: 'Documents Uploaded', desc: 'GST Certificate files attached successfully.' }
    ]
  },
  {
    id: 'v-103',
    name: 'Eve Builder',
    category: 'Civil Masonry',
    licenseNumber: 'CIV-2026-B8',
    experience: '8 Years',
    documentName: 'CivilLicenceEve.pdf',
    role: 'Professional',
    submittedDate: '15 Jul 2026',
    status: 'Approved',
    documentsSubmitted: [
      { type: 'Professional License', name: 'CivilLicenceEve.pdf', size: '980 KB', uploadedAt: '15 Jul 2026, 11:30 AM', metadata: 'SHA-256: a8b9c1d2e3f4a5' }
    ],
    lastUpdated: '15 Jul 2026',
    email: 'eve@example.com',
    phone: '+91 99999 88888',
    businessName: 'Eve Concrete Contracting LLC',
    registrationNumber: 'U72000TG2025PTC',
    location: 'Bangalore',
    notes: 'Successfully verified by Sarah Admin.',
    timeline: [
      { date: '15 Jul 2026, 11:30 AM', title: 'Verification Submitted', desc: 'Eve uploaded civil structural validation license.' },
      { date: '15 Jul 2026, 04:00 PM', title: 'Verification Approved', desc: 'Escrow credential validation check passed.' }
    ]
  },
  {
    id: 'v-104',
    name: 'Frank Inspector',
    category: 'Structural Auditor',
    licenseNumber: 'AUD-302-K9',
    experience: '15 Years',
    documentName: 'FrankAuditLicense.pdf',
    role: 'Consultant',
    submittedDate: '10 Jul 2026',
    status: 'Additional Information Requested',
    documentsSubmitted: [
      { type: 'Identity Proof', name: 'FrankAuditLicense.pdf', size: '550 KB', uploadedAt: '10 Jul 2026, 08:00 AM', metadata: 'SHA-256: b3c2d1e4f5a6b8' }
    ],
    lastUpdated: '12 Jul 2026',
    email: 'frank@example.com',
    phone: '+91 95555 44444',
    businessName: 'Frank Safety Audits',
    registrationNumber: 'AUD-90-K9',
    location: 'Hyderabad',
    notes: 'Awaiting company incorporation papers.',
    timeline: [
      { date: '10 Jul 2026, 08:00 AM', title: 'Verification Submitted', desc: 'Frank uploaded audit qualification certificates.' },
      { date: '12 Jul 2026, 10:00 AM', title: 'Additional Documents Requested', desc: 'Sarah Admin requested local company registration documents.' }
    ]
  }
];

const INITIAL_DISPUTES: DisputeRecord[] = [
  { id: 'disp-202', client: 'Alice Architect', provider: 'Bob Builder', topic: 'Milestone 2 concrete finishing quality', amount: 35000, status: 'Open', adminNotes: 'Waiting for onsite review coordinates from structural inspector.' },
];

const INITIAL_REQUIREMENTS: MarketplaceRequirement[] = [
  {
    id: 'req-1',
    title: 'Modern Villa Blueprint Layout Design',
    description: 'Looking for a certified architect to draft structural and landscape plans for a 3000 sq.ft. duplex villa in Banjara Hills.',
    category: 'Architect',
    customerName: 'Alice Architect',
    city: 'Hyderabad',
    address: 'Banjara Hills, Road No 12',
    budgetMin: 50000,
    budgetMax: 80000,
    status: 'Open',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    reportCount: 0,
    timeline: '3 Weeks',
    documents: ['StructuralDraftReference.pdf', 'VastuDuplexRequirements.pdf'],
    propertyType: 'Residential',
  },
  {
    id: 'req-2',
    title: 'Smart Home Automation Integration',
    description: 'Require setup of central smart hub controlling locks, CCTV, and smart thermostats in a high-security residential setup.',
    category: 'CCTV Installation',
    customerName: 'Alice Architect',
    city: 'Hyderabad',
    address: 'Jubilee Hills, Metro Pillar 32',
    budgetMin: 20000,
    budgetMax: 35000,
    status: 'Pending Review',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    reportCount: 0,
    timeline: 'Immediate',
    documents: ['SecuritySmartLayout.pdf'],
    propertyType: 'Residential',
  },
  {
    id: 'req-3',
    title: 'Commercial Complex Fire Safety Piping',
    description: 'Bidding is open for safety pipeline layout design matching certified safety guidelines for commercial setups.',
    category: 'Fire Safety Consulting',
    customerName: 'Bob Builder',
    city: 'Bangalore',
    address: 'Indiranagar Main Road, Block B',
    budgetMin: 120000,
    budgetMax: 180000,
    status: 'Reported',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    reportCount: 2,
    reportReason: 'Incorrect budget category and misleading contact numbers listed in description.',
    reportedBy: 'Charlie Consultant',
    reportDate: '01 Aug 2026',
    timeline: '1 Month',
    documents: ['FireSafetyComplianceRules.pdf'],
    propertyType: 'Commercial',
  },
  {
    id: 'req-4',
    title: 'Interior Ceiling Gypsum & Partitioning Work',
    description: 'Deactivated due to customer dispute, hidden from public visibility backlog.',
    category: 'Interior Design',
    customerName: 'Alice Architect',
    city: 'Hyderabad',
    address: 'Madhapur Circle Office',
    budgetMin: 45000,
    budgetMax: 60000,
    status: 'Hidden',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    reportCount: 0,
    timeline: '2 Weeks',
    documents: ['InteriorMockRef.pdf'],
    propertyType: 'Residential',
  },
  {
    id: 'req-5',
    title: 'Kitchen Space Modular Cabinets Installation',
    description: 'Successfully completed contract milestone with trade professional, closed listing.',
    category: 'Interior Design',
    customerName: 'Alice Architect',
    city: 'Hyderabad',
    address: 'Gachibowli Ring Road',
    budgetMin: 80000,
    budgetMax: 110000,
    status: 'Closed',
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    reportCount: 0,
    timeline: 'Completed',
    documents: ['KitchenLayoutFinal.pdf'],
    propertyType: 'Residential',
  }
];

const INITIAL_PROJECTS: ProjectRecord[] = [
  {
    id: 'PRJ-201',
    name: 'Jubilee Hills Duplex Foundation Layout',
    customerName: 'Ramesh Kumar',
    professionalName: 'Apex Architect & Build',
    category: 'Civil Masonry',
    progress: 75,
    status: 'In Progress',
    startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    expectedCompletion: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
    lastUpdated: '2 hours ago',
    requirementId: 'req-1',
    city: 'Hyderabad',
    address: 'Banjara Hills, Road No 12',
    scope: 'Excavation of site layout, drafting steel slab reinforcements, raft slab concrete pouring and leveling.',
    milestones: [
      { id: 'm-1', name: 'Site Excavation', status: 'Completed', completionDate: '10 Jul 2026' },
      { id: 'm-2', name: 'Raft Slab Reinforcement', status: 'In Progress' },
      { id: 'm-3', name: 'Concrete Pouring & Curing', status: 'Pending' }
    ],
    tasksCount: 12,
    completedTasksCount: 9,
    documents: ['DuplexStructureContractAgreement.pdf', 'CementProcurementInvoice_092.pdf'],
    flagged: false,
    timeline: [
      { date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), title: 'Project Created', desc: 'Project contract established between Ramesh Kumar and Apex Architect.' },
      { date: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(), title: 'Quotation Accepted', desc: 'Milestone estimate quotation accepted and payment held in escrow.' },
      { date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), title: 'Milestone Completed', desc: 'Site excavation completed and verified by structural consultant.' }
    ]
  },
  {
    id: 'PRJ-202',
    name: 'Madhapur Penthouse MEP Conduiting',
    customerName: 'Sita Sharma',
    professionalName: 'Apex Architect & Build',
    category: 'Electrical',
    progress: 45,
    status: 'In Progress',
    startDate: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    expectedCompletion: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    lastUpdated: '1 day ago',
    requirementId: 'req-2',
    city: 'Hyderabad',
    address: 'Jubilee Hills, Metro Pillar 32',
    scope: 'Piping pathways routing through gypsum ceilings, wall electrical chasing, switchboards integration.',
    milestones: [
      { id: 'm-1', name: 'Ceiling pathways layout', status: 'Completed', completionDate: '25 Jul 2026' },
      { id: 'm-2', name: 'Wall Electrical Chasing', status: 'In Progress' }
    ],
    tasksCount: 8,
    completedTasksCount: 3,
    documents: ['MEP_Electrical_Schematics.pdf'],
    flagged: true,
    flagReason: 'Material supply chain issues reported by professional contractor.',
    timeline: [
      { date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), title: 'Project Created', desc: 'MEP Conduiting project agreement finalized.' },
      { date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), title: 'Progress Updated', desc: 'Electrical wall chasing progress updated to 45%.' }
    ]
  },
  {
    id: 'PRJ-203',
    name: 'Banjara Hills Office Ceiling Partition',
    customerName: 'Vijay Kulkarni',
    professionalName: 'Apex Architect & Build',
    category: 'Interior Design',
    progress: 100,
    status: 'Completed',
    startDate: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
    expectedCompletion: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    lastUpdated: 'Yesterday',
    requirementId: 'req-5',
    city: 'Hyderabad',
    address: 'Gachibowli Ring Road',
    scope: 'Installing gypsum boards partition walls, ceiling grids, LED integration, painting and finishes.',
    milestones: [
      { id: 'm-1', name: 'Ceiling Grids Partitioning', status: 'Completed', completionDate: '20 Jul 2026' },
      { id: 'm-2', name: 'Finishes & Handover', status: 'Completed', completionDate: '28 Jul 2026' }
    ],
    tasksCount: 15,
    completedTasksCount: 15,
    documents: ['OfficeCeilingHandoffSignoff.pdf'],
    flagged: false,
    timeline: [
      { date: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(), title: 'Project Created', desc: 'Office ceiling partitioning project initialized.' },
      { date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), title: 'Project Completed', desc: 'Handover complete and escrow payment released to Apex Architect.' }
    ]
  },
  {
    id: 'PRJ-204',
    name: 'Gachibowli Commercial Soil Excavation',
    customerName: 'Vikram Singh',
    professionalName: 'Bob Builder',
    category: 'Civil Masonry',
    progress: 95,
    status: 'On Hold',
    startDate: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(),
    expectedCompletion: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
    lastUpdated: '3 days ago',
    requirementId: 'req-3',
    city: 'Bangalore',
    address: 'Indiranagar Main Road, Block B',
    scope: 'Excavation of site foundation matching safety guidelines for commercial setups.',
    milestones: [
      { id: 'm-1', name: 'Excavation work', status: 'Completed', completionDate: '28 Jul 2026' },
      { id: 'm-2', name: 'Soil backfilling', status: 'In Progress' }
    ],
    tasksCount: 10,
    completedTasksCount: 9,
    documents: ['SoilTestingLabReport.pdf'],
    flagged: false,
    timeline: [
      { date: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(), title: 'Project Created', desc: 'Commercial complex excavation project contract established.' },
      { date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), title: 'Milestone Completed', desc: 'Excavation verified by municipal engineers, on hold awaiting structural designs.' }
    ]
  }
];

const MOCK_AUDIT_LOGS = [
  { id: 'log-1', admin: 'Sarah Admin', action: 'Approved contractor registration: Dave Decorator', time: '10 mins ago' },
  { id: 'log-2', admin: 'John Admin', action: 'Suspended user account: spam-account@example.com', time: '1 hour ago' },
  { id: 'log-3', admin: 'Sarah Admin', action: 'Resolved payment dispute id disp-201', time: 'Yesterday' },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Operational states
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [verifications, setVerifications] = useState<VerificationRequest[]>(INITIAL_VERIFICATIONS);
  const [disputes, setDisputes] = useState<DisputeRecord[]>(INITIAL_DISPUTES);
  const [requirements, setRequirements] = useState<MarketplaceRequirement[]>(INITIAL_REQUIREMENTS);
  
  // New Announcement
  const [announcementText, setAnnouncementText] = useState('');
  const [announceAudience, setAnnounceAudience] = useState('Everyone');

  // Search & Filter workspace states
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(INITIAL_USERS[0]); // default detail view
  const [userFilters, setUserFilters] = useState<UserFiltersState>({
    role: 'ALL',
    status: 'ALL',
    verificationStatus: 'ALL',
    registrationDate: 'ALL',
    location: '',
  });

  // Verification Center States
  const [verificationSearchQuery, setVerificationSearchQuery] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(INITIAL_VERIFICATIONS[0]);
  const [verificationFilters, setVerificationFilters] = useState<VerificationFiltersState>({
    role: 'ALL',
    status: 'ALL',
    documentType: 'ALL',
    submissionDate: 'ALL',
    location: 'ALL',
  });

  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [verificationSortField, setVerificationSortField] = useState('id');
  const [verificationSortOrder, setVerificationSortOrder] = useState<'asc' | 'desc'>('asc');
  const [verificationCurrentPage, setVerificationCurrentPage] = useState(1);
  const verificationPageSize = 5;

  const handleRefreshVerifications = () => {
    setIsVerificationLoading(true);
    setTimeout(() => {
      setIsVerificationLoading(false);
    }, 600);
  };

  const handleResetVerificationFilters = () => {
    setVerificationSearchQuery('');
    setVerificationFilters({
      role: 'ALL',
      status: 'ALL',
      documentType: 'ALL',
      submissionDate: 'ALL',
      location: 'ALL',
    });
    setVerificationCurrentPage(1);
  };

  const handleSaveVerificationNotes = (id: string, notes: string) => {
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, notes } : v));
    setSelectedVerification(prev => prev && prev.id === id ? { ...prev, notes } : prev);
  };

  const handleApproveVerify = (id: string, name: string) => {
    openConfirm(
      'Approve Credentials Verification',
      `Are you sure you want to approve the credentials and verify ${name}? This will update their verification badge across the platform.`,
      () => {
        setUsers(prev => prev.map(u => u.id === id || u.name === name ? { ...u, verificationStatus: 'Verified', status: 'Active' } : u));
        setVerifications(prev => prev.map(v => {
          if (v.id === id || v.name === name) {
            return {
              ...v,
              status: 'Approved',
              lastUpdated: 'Just now',
              timeline: [
                ...v.timeline,
                { date: new Date().toLocaleDateString('en-GB'), title: 'Verification Approved', desc: 'Sarah Admin approved the submitted credential documents.' }
              ]
            };
          }
          return v;
        }));
        setSelectedVerification(prev => {
          if (prev && (prev.id === id || prev.name === name)) {
            return {
              ...prev,
              status: 'Approved',
              lastUpdated: 'Just now',
              timeline: [
                ...prev.timeline,
                { date: new Date().toLocaleDateString('en-GB'), title: 'Verification Approved', desc: 'Sarah Admin approved the submitted credential documents.' }
              ]
            };
          }
          return prev;
        });
      }
    );
  };

  const handleRejectVerify = (id: string, name: string) => {
    openConfirm(
      'Reject Credentials Verification',
      `Are you sure you want to reject the verification request for ${name}?`,
      () => {
        setUsers(prev => prev.map(u => u.id === id || u.name === name ? { ...u, verificationStatus: 'Rejected' } : u));
        setVerifications(prev => prev.map(v => {
          if (v.id === id || v.name === name) {
            return {
              ...v,
              status: 'Rejected',
              lastUpdated: 'Just now',
              timeline: [
                ...v.timeline,
                { date: new Date().toLocaleDateString('en-GB'), title: 'Verification Rejected', desc: 'Sarah Admin rejected the submitted credential documents.' }
              ]
            };
          }
          return v;
        }));
        setSelectedVerification(prev => {
          if (prev && (prev.id === id || prev.name === name)) {
            return {
              ...prev,
              status: 'Rejected',
              lastUpdated: 'Just now',
              timeline: [
                ...prev.timeline,
                { date: new Date().toLocaleDateString('en-GB'), title: 'Verification Rejected', desc: 'Sarah Admin rejected the submitted credential documents.' }
              ]
            };
          }
          return prev;
        });
      }
    );
  };

  const handleRequestInfo = (id: string, name: string) => {
    openConfirm(
      'Request Additional Information',
      `Are you sure you want to request additional documents or clarifications from ${name}?`,
      () => {
        setVerifications(prev => prev.map(v => {
          if (v.id === id || v.name === name) {
            return {
              ...v,
              status: 'Additional Information Requested',
              lastUpdated: 'Just now',
              timeline: [
                ...v.timeline,
                { date: new Date().toLocaleDateString('en-GB'), title: 'Additional Documents Requested', desc: 'Sarah Admin requested additional verification documents.' }
              ]
            };
          }
          return v;
        }));
        setSelectedVerification(prev => {
          if (prev && (prev.id === id || prev.name === name)) {
            return {
              ...prev,
              status: 'Additional Information Requested',
              lastUpdated: 'Just now',
              timeline: [
                ...prev.timeline,
                { date: new Date().toLocaleDateString('en-GB'), title: 'Additional Documents Requested', desc: 'Sarah Admin requested additional verification documents.' }
              ]
            };
          }
          return prev;
        });
      }
    );
  };

  // Verification Calculations
  const verificationRoles = useMemo(() => {
    return Array.from(new Set(INITIAL_VERIFICATIONS.map(v => v.role)));
  }, []);

  const verificationLocations = useMemo(() => {
    return Array.from(new Set(INITIAL_VERIFICATIONS.map(v => v.location).filter(Boolean))) as string[];
  }, []);

  const filteredVerifications = useMemo(() => {
    return verifications.filter(req => {
      const searchLower = verificationSearchQuery.toLowerCase();
      const matchSearch = !verificationSearchQuery ||
        req.id.toLowerCase().includes(searchLower) ||
        req.name.toLowerCase().includes(searchLower) ||
        req.email.toLowerCase().includes(searchLower) ||
        req.phone.toLowerCase().includes(searchLower) ||
        (req.businessName && req.businessName.toLowerCase().includes(searchLower)) ||
        (req.registrationNumber && req.registrationNumber.toLowerCase().includes(searchLower));

      if (!matchSearch) return false;

      // Role
      if (verificationFilters.role !== 'ALL' && req.role !== verificationFilters.role) return false;

      // Status
      if (verificationFilters.status !== 'ALL' && req.status !== verificationFilters.status) return false;

      // Document Type
      if (verificationFilters.documentType !== 'ALL' && !req.documentsSubmitted.some(d => d.type === verificationFilters.documentType)) return false;

      // Location
      if (verificationFilters.location !== 'ALL' && req.location !== verificationFilters.location) return false;

      // Submission Date
      if (verificationFilters.submissionDate !== 'ALL') {
        const today = new Date();
        const submitted = new Date(req.submittedDate);
        const diffTime = Math.abs(today.getTime() - submitted.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (verificationFilters.submissionDate === 'TODAY' && diffDays > 1) return false;
        if (verificationFilters.submissionDate === 'WEEK' && diffDays > 7) return false;
        if (verificationFilters.submissionDate === 'MONTH' && diffDays > 30) return false;
      }

      return true;
    });
  }, [verifications, verificationSearchQuery, verificationFilters]);

  const sortedVerifications = useMemo(() => {
    const sorted = [...filteredVerifications];
    sorted.sort((a, b) => {
      const valA = a[verificationSortField as keyof VerificationRequest] ?? '';
      const valB = b[verificationSortField as keyof VerificationRequest] ?? '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return verificationSortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      return 0;
    });
    return sorted;
  }, [filteredVerifications, verificationSortField, verificationSortOrder]);

  const paginatedVerifications = useMemo(() => {
    const start = (verificationCurrentPage - 1) * verificationPageSize;
    return sortedVerifications.slice(start, start + verificationPageSize);
  }, [sortedVerifications, verificationCurrentPage]);

  const verificationTotalPages = Math.ceil(sortedVerifications.length / verificationPageSize) || 1;

  const handleVerificationSort = (field: string) => {
    if (verificationSortField === field) {
      setVerificationSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setVerificationSortField(field);
      setVerificationSortOrder('asc');
    }
  };

  const verificationStats = useMemo(() => {
    return {
      pending: verifications.filter(v => v.status === 'Pending').length,
      approved: verifications.filter(v => v.status === 'Approved').length,
      rejected: verifications.filter(v => v.status === 'Rejected').length,
      awaitingReview: verifications.filter(v => v.status === 'Pending').reduce((acc, v) => acc + (v.documentsSubmitted?.length || 0), 0),
      additionalInfo: verifications.filter(v => v.status === 'Additional Information Requested').length,
      expired: verifications.filter(v => v.status === 'Expired').length,
    };
  }, [verifications]);

  // Project Monitoring States
  const [projects, setProjects] = useState<ProjectRecord[]>(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(INITIAL_PROJECTS[0]);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectFilters, setProjectFilters] = useState<ProjectFiltersState>({
    status: 'ALL',
    category: 'ALL',
    location: '',
    professional: 'ALL',
    customer: 'ALL',
    progressRange: 'ALL',
  });

  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [projectSortField, setProjectSortField] = useState('id');
  const [projectSortOrder, setProjectSortOrder] = useState<'asc' | 'desc'>('asc');
  const [projectCurrentPage, setProjectCurrentPage] = useState(1);
  const projectPageSize = 5;

  const handleRefreshProjects = () => {
    setIsProjectsLoading(true);
    setTimeout(() => {
      setIsProjectsLoading(false);
    }, 600);
  };

  const handleResetProjectFilters = () => {
    setProjectSearchQuery('');
    setProjectFilters({
      status: 'ALL',
      category: 'ALL',
      location: '',
      professional: 'ALL',
      customer: 'ALL',
      progressRange: 'ALL',
    });
    setProjectCurrentPage(1);
  };

  // Platform Reports & Monitoring States
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    dateRange: 'ALL', // 'ALL', 'TODAY', 'WEEK', 'MONTH'
    role: 'ALL',
    category: 'ALL',
    location: '',
    status: 'ALL',
  });

  const handleRefreshReports = () => {
    setIsReportsLoading(true);
    setTimeout(() => {
      setIsReportsLoading(false);
    }, 600);
  };

  const handleResetReportFilters = () => {
    setReportFilters({
      dateRange: 'ALL',
      role: 'ALL',
      category: 'ALL',
      location: '',
      status: 'ALL',
    });
  };

  // Derived reports statistics based on reportFilters
  const reportStats = useMemo(() => {
    // 1. Filtered Users
    const filteredUsers = users.filter(u => {
      if (reportFilters.role !== 'ALL' && u.role !== reportFilters.role) return false;
      if (reportFilters.location && !u.location?.toLowerCase().includes(reportFilters.location.toLowerCase())) return false;
      if (reportFilters.status !== 'ALL') {
        if (reportFilters.status === 'Active' && u.status !== 'Active') return false;
        if (reportFilters.status === 'Inactive' && u.status !== 'Inactive') return false;
        if (reportFilters.status === 'Suspended' && u.status !== 'Suspended') return false;
      }
      return true;
    });

    // 2. Filtered Projects
    const filteredProjList = projects.filter(p => {
      if (reportFilters.category !== 'ALL' && p.category !== reportFilters.category) return false;
      return true;
    });

    // 3. Filtered Requirements
    const filteredReqList = requirements.filter(r => {
      if (reportFilters.category !== 'ALL' && r.category !== reportFilters.category) return false;
      if (reportFilters.location && !r.city.toLowerCase().includes(reportFilters.location.toLowerCase())) return false;
      return true;
    });

    const totalUsers = filteredUsers.length;
    const activeProjects = filteredProjList.filter(p => p.status === 'In Progress').length;
    const openRequirements = filteredReqList.filter(r => r.status === 'Open').length;
    const completedProjects = filteredProjList.filter(p => p.status === 'Completed').length;
    const pendingVerifications = verifications.filter(v => v.status === 'Pending').length;
    
    const draftQuotations = Math.max(2, Math.floor(openRequirements * 1.5));
    const submittedQuotations = Math.max(5, openRequirements * 3);
    const acceptedQuotations = completedProjects + activeProjects;
    const rejectedQuotations = Math.max(1, Math.floor(openRequirements * 0.8));
    const totalQuotations = draftQuotations + submittedQuotations + acceptedQuotations + rejectedQuotations;

    const health = {
      app: 'Operational' as const,
      db: 'Operational' as const,
      storage: 'Operational' as const,
      api: 'Operational' as const,
      lastBackup: '03 Aug 2026, 04:00 AM',
      overall: 'Healthy' as const,
    };

    return {
      totalUsers,
      activeProjects,
      openRequirements,
      completedProjects,
      pendingVerifications,
      submittedQuotations: totalQuotations,
      
      // User Growth
      newToday: Math.floor(totalUsers * 0.05) || 1,
      newThisWeek: Math.floor(totalUsers * 0.15) || 4,
      newThisMonth: Math.floor(totalUsers * 0.45) || 12,
      totalActive: Math.floor(totalUsers * 0.88) || totalUsers,

      // Requirements
      reqOpen: openRequirements,
      reqClosed: filteredReqList.filter(r => r.status === 'Closed').length,
      reqReported: filteredReqList.filter(r => r.status === 'Reported').length,
      reqCreatedToday: Math.max(1, Math.floor(openRequirements * 0.2)),

      // Projects
      projInProgress: activeProjects,
      projCompleted: completedProjects,
      projOnHold: filteredProjList.filter(p => p.status === 'On Hold').length,
      projCancelled: filteredProjList.filter(p => p.status === 'Cancelled').length,

      // Verification
      verifPending: pendingVerifications,
      verifApproved: verifications.filter(v => v.status === 'Approved').length,
      verifRejected: verifications.filter(v => v.status === 'Rejected').length,
      verifAwaitingDocs: verifications.filter(v => v.status === 'Additional Information Requested').length,

      // Quotations
      quotDraft: draftQuotations,
      quotSubmitted: submittedQuotations,
      quotAccepted: acceptedQuotations,
      quotRejected: rejectedQuotations,

      health,
    };
  }, [users, projects, requirements, verifications, reportFilters]);

  const handleFlagProject = (id: string, name: string) => {
    openConfirm(
      'Flag Project for Review',
      `Are you sure you want to flag "${name}"? This alerts platform moderators to audit construction delays or dispute items.`,
      () => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, flagged: true, flagReason: 'Flagged by Sarah Admin: Reviewing milestone delay coordinates.' } : p));
        setSelectedProject(prev => prev && prev.id === id ? { ...prev, flagged: true, flagReason: 'Flagged by Sarah Admin: Reviewing milestone delay coordinates.' } : prev);
      }
    );
  };

  // Filtered & Sorted Calculations
  const projectCategories = useMemo(() => {
    return Array.from(new Set(INITIAL_PROJECTS.map(p => p.category)));
  }, []);

  const projectProfessionals = useMemo(() => {
    return Array.from(new Set(INITIAL_PROJECTS.map(p => p.professionalName)));
  }, []);

  const projectCustomers = useMemo(() => {
    return Array.from(new Set(INITIAL_PROJECTS.map(p => p.customerName)));
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(proj => {
      const searchLower = projectSearchQuery.toLowerCase();
      const matchSearch = !projectSearchQuery ||
        proj.id.toLowerCase().includes(searchLower) ||
        proj.name.toLowerCase().includes(searchLower) ||
        proj.customerName.toLowerCase().includes(searchLower) ||
        proj.professionalName.toLowerCase().includes(searchLower) ||
        proj.requirementId.toLowerCase().includes(searchLower) ||
        proj.city.toLowerCase().includes(searchLower);

      if (!matchSearch) return false;

      // Status
      if (projectFilters.status !== 'ALL' && proj.status !== projectFilters.status) return false;

      // Category
      if (projectFilters.category !== 'ALL' && proj.category !== projectFilters.category) return false;

      // Location
      if (projectFilters.location && !proj.city.toLowerCase().includes(projectFilters.location.toLowerCase())) return false;

      // Professional Partner
      if (projectFilters.professional !== 'ALL' && proj.professionalName !== projectFilters.professional) return false;

      // Customer
      if (projectFilters.customer !== 'ALL' && proj.customerName !== projectFilters.customer) return false;

      // Progress Range
      if (projectFilters.progressRange !== 'ALL') {
        const prog = proj.progress;
        if (projectFilters.progressRange === '0_25' && prog > 25) return false;
        if (projectFilters.progressRange === '26_50' && (prog < 26 || prog > 50)) return false;
        if (projectFilters.progressRange === '51_75' && (prog < 51 || prog > 75)) return false;
        if (projectFilters.progressRange === '76_100' && prog < 76) return false;
      }

      return true;
    });
  }, [projects, projectSearchQuery, projectFilters]);

  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];
    sorted.sort((a, b) => {
      const valA = a[projectSortField as keyof ProjectRecord] ?? '';
      const valB = b[projectSortField as keyof ProjectRecord] ?? '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return projectSortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return projectSortOrder === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
      return 0;
    });
    return sorted;
  }, [filteredProjects, projectSortField, projectSortOrder]);

  const paginatedProjects = useMemo(() => {
    const start = (projectCurrentPage - 1) * projectPageSize;
    return sortedProjects.slice(start, start + projectPageSize);
  }, [sortedProjects, projectCurrentPage]);

  const projectTotalPages = Math.ceil(sortedProjects.length / projectPageSize) || 1;

  const handleProjectSort = (field: string) => {
    if (projectSortField === field) {
      setProjectSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setProjectSortField(field);
      setProjectSortOrder('asc');
    }
  };

  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'In Progress').length,
      completed: projects.filter(p => p.status === 'Completed').length,
      onHold: projects.filter(p => p.status === 'On Hold').length,
      cancelled: projects.filter(p => p.status === 'Cancelled').length,
      nearDeadline: projects.filter(p => {
        if (p.status !== 'In Progress') return false;
        const expected = new Date(p.expectedCompletion);
        const today = new Date();
        const diffDays = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diffDays > 0 && diffDays <= 7;
      }).length,
    };
  }, [projects]);

  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userSortField, setUserSortField] = useState('name');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const userPageSize = 5;

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        closeConfirm();
      }
    });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Actions
  const handleRefreshUsers = () => {
    setIsUsersLoading(true);
    setTimeout(() => {
      setIsUsersLoading(false);
    }, 600);
  };

  // Marketplace Management States
  const [selectedRequirement, setSelectedRequirement] = useState<MarketplaceRequirement | null>(INITIAL_REQUIREMENTS[0]);
  const [marketplaceSearchQuery, setMarketplaceSearchQuery] = useState('');
  const [marketplaceFilters, setMarketplaceFilters] = useState<MarketplaceFiltersState>({
    status: 'ALL',
    category: 'ALL',
    location: '',
    budgetRange: 'ALL',
    propertyType: 'ALL',
    postedDate: 'ALL',
  });

  const [isMarketplaceLoading, setIsMarketplaceLoading] = useState(false);
  const [marketplaceSortField, setMarketplaceSortField] = useState('id');
  const [marketplaceSortOrder, setMarketplaceSortOrder] = useState<'asc' | 'desc'>('asc');
  const [marketplaceCurrentPage, setMarketplaceCurrentPage] = useState(1);
  const marketplacePageSize = 5;

  const handleRefreshMarketplace = () => {
    setIsMarketplaceLoading(true);
    setTimeout(() => {
      setIsMarketplaceLoading(false);
    }, 600);
  };

  const handleResetMarketplaceFilters = () => {
    setMarketplaceSearchQuery('');
    setMarketplaceFilters({
      status: 'ALL',
      category: 'ALL',
      location: '',
      budgetRange: 'ALL',
      propertyType: 'ALL',
      postedDate: 'ALL',
    });
    setMarketplaceCurrentPage(1);
  };

  const handleHideRequirement = (id: string, title: string) => {
    openConfirm(
      'Hide Requirement Listing',
      `Are you sure you want to hide the listing "${title}" from the public marketplace?`,
      () => {
        setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: 'Hidden' } : r));
        setSelectedRequirement(prev => prev && prev.id === id ? { ...prev, status: 'Hidden' } : prev);
      }
    );
  };

  const handleUnhideRequirement = (id: string, title: string) => {
    openConfirm(
      'Unhide & Publish Listing',
      `Are you sure you want to restore public visibility for the listing "${title}"?`,
      () => {
        setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: 'Open' } : r));
        setSelectedRequirement(prev => prev && prev.id === id ? { ...prev, status: 'Open' } : prev);
      }
    );
  };

  const handleCloseRequirement = (id: string, title: string) => {
    openConfirm(
      'Close Requirement Listing',
      `Are you sure you want to mark "${title}" as closed? Closing concludes bidding but preserves the logs.`,
      () => {
        setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: 'Closed' } : r));
        setSelectedRequirement(prev => prev && prev.id === id ? { ...prev, status: 'Closed' } : prev);
      }
    );
  };

  const handleReopenRequirement = (id: string, title: string) => {
    openConfirm(
      'Reopen Requirement Listing',
      `Are you sure you want to reopen "${title}" for trade bidding?`,
      () => {
        setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: 'Open' } : r));
        setSelectedRequirement(prev => prev && prev.id === id ? { ...prev, status: 'Open' } : prev);
      }
    );
  };

  const handleDismissReport = (id: string, title: string) => {
    openConfirm(
      'Dismiss Flag Reports',
      `Are you sure you want to clear the user abuse reports for "${title}" and restore it to active status?`,
      () => {
        setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: 'Open', reportCount: 0, reportReason: undefined } : r));
        setSelectedRequirement(prev => prev && prev.id === id ? { ...prev, status: 'Open', reportCount: 0, reportReason: undefined } : prev);
      }
    );
  };

  // Filtered & Sorted Calculations
  const marketplaceCategories = useMemo(() => {
    return Array.from(new Set(INITIAL_REQUIREMENTS.map(r => r.category)));
  }, []);

  const filteredRequirements = useMemo(() => {
    return requirements.filter(req => {
      const searchLower = marketplaceSearchQuery.toLowerCase();
      const matchSearch = !marketplaceSearchQuery || 
        req.id.toLowerCase().includes(searchLower) ||
        req.title.toLowerCase().includes(searchLower) ||
        req.customerName.toLowerCase().includes(searchLower) ||
        req.category.toLowerCase().includes(searchLower) ||
        req.city.toLowerCase().includes(searchLower) ||
        req.description.toLowerCase().includes(searchLower);

      if (!matchSearch) return false;

      // Status
      if (marketplaceFilters.status !== 'ALL' && req.status !== marketplaceFilters.status) return false;

      // Category
      if (marketplaceFilters.category !== 'ALL' && req.category !== marketplaceFilters.category) return false;

      // Location
      if (marketplaceFilters.location && !req.city.toLowerCase().includes(marketplaceFilters.location.toLowerCase())) return false;

      // Property Type
      if (marketplaceFilters.propertyType !== 'ALL' && req.propertyType !== marketplaceFilters.propertyType) return false;

      // Budget Range
      if (marketplaceFilters.budgetRange !== 'ALL') {
        if (marketplaceFilters.budgetRange === 'UNDER_50K' && req.budgetMax > 50000) return false;
        if (marketplaceFilters.budgetRange === '50K_100K' && (req.budgetMin < 50000 || req.budgetMax > 100000)) return false;
        if (marketplaceFilters.budgetRange === 'OVER_100K' && req.budgetMin < 100000) return false;
      }

      // Posted Date
      if (marketplaceFilters.postedDate !== 'ALL') {
        const today = new Date();
        const created = new Date(req.createdAt);
        const diffTime = Math.abs(today.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (marketplaceFilters.postedDate === 'TODAY' && diffDays > 1) return false;
        if (marketplaceFilters.postedDate === 'WEEK' && diffDays > 7) return false;
        if (marketplaceFilters.postedDate === 'MONTH' && diffDays > 30) return false;
      }

      return true;
    });
  }, [requirements, marketplaceSearchQuery, marketplaceFilters]);

  const sortedRequirements = useMemo(() => {
    const sorted = [...filteredRequirements];
    sorted.sort((a, b) => {
      const valA = a[marketplaceSortField as keyof MarketplaceRequirement] || '';
      const valB = b[marketplaceSortField as keyof MarketplaceRequirement] || '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return marketplaceSortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return marketplaceSortOrder === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
      return 0;
    });
    return sorted;
  }, [filteredRequirements, marketplaceSortField, marketplaceSortOrder]);

  const paginatedRequirements = useMemo(() => {
    const start = (marketplaceCurrentPage - 1) * marketplacePageSize;
    return sortedRequirements.slice(start, start + marketplacePageSize);
  }, [sortedRequirements, marketplaceCurrentPage]);

  const marketplaceTotalPages = Math.ceil(sortedRequirements.length / marketplacePageSize) || 1;

  const handleMarketplaceSort = (field: string) => {
    if (marketplaceSortField === field) {
      setMarketplaceSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMarketplaceSortField(field);
      setMarketplaceSortOrder('asc');
    }
  };

  const reportedRequirements = useMemo(() => {
    return requirements.filter(r => r.status === 'Reported');
  }, [requirements]);

  const marketplaceStats = useMemo(() => {
    return {
      total: requirements.length,
      open: requirements.filter(r => r.status === 'Open').length,
      closed: requirements.filter(r => r.status === 'Closed').length,
      reported: requirements.filter(r => r.status === 'Reported').length,
      hidden: requirements.filter(r => r.status === 'Hidden').length,
      pending: requirements.filter(r => r.status === 'Pending Review').length,
    };
  }, [requirements]);

  const handleResetFilters = () => {
    setUserSearch('');
    setUserFilters({
      role: 'ALL',
      status: 'ALL',
      verificationStatus: 'ALL',
      registrationDate: 'ALL',
      location: '',
    });
    setUserCurrentPage(1);
  };

  const handleUserStatusChange = (id: string, newStatus: string) => {
    const userToChange = users.find(u => u.id === id);
    if (!userToChange) return;

    const isSelf = userToChange.email.toLowerCase() === 'admin@example.com';
    if (isSelf && (newStatus === 'Inactive' || newStatus === 'Suspended')) {
      alert("Self Safeguard: You cannot deactivate or suspend your own administrator account.");
      return;
    }

    openConfirm(
      'Confirm Status Transition',
      `Are you sure you want to adjust the account status of ${userToChange.name} to "${newStatus}"?`,
      () => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus as UserRecord['status'] } : u));
        setSelectedUser(prev => prev && prev.id === id ? { ...prev, status: newStatus as UserRecord['status'] } : prev);
      }
    );
  };

  const handleUserApproveVerify = (id: string, name: string) => {
    openConfirm(
      'Approve Professional Credentials',
      `Are you sure you want to verify and activate ${name} as a verified provider?`,
      () => {
        setUsers(prev => prev.map(u => u.id === id || u.name === name ? { ...u, verificationStatus: 'Verified', status: 'Active' } : u));
        setVerifications(prev => prev.filter(v => v.id !== id));
        setSelectedUser(prev => prev && (prev.id === id || prev.name === name) ? { ...prev, verificationStatus: 'Verified', status: 'Active' } : prev);
      }
    );
  };

  const handleUserRejectVerify = (id: string, name: string) => {
    openConfirm(
      'Decline Verification Request',
      `Are you sure you want to decline the credentials verification request from ${name}?`,
      () => {
        setUsers(prev => prev.map(u => u.id === id || u.name === name ? { ...u, verificationStatus: 'Rejected' } : u));
        setVerifications(prev => prev.filter(v => v.id !== id));
        setSelectedUser(prev => prev && (prev.id === id || prev.name === name) ? { ...prev, verificationStatus: 'Rejected' } : prev);
      }
    );
  };



  const handleResolveDispute = (id: string) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: 'Resolved' } : d));
    alert('Dispute marked as Resolved. Payment holding coordinates updated.');
  };

  // Dynamic statistics calculations
  const stats = useMemo(() => {
    return {
      total: users.length,
      customers: users.filter(u => u.role === 'Customer').length,
      professionals: users.filter(u => u.role === 'Professional').length,
      consultants: users.filter(u => u.role === 'Consultant').length,
      admins: users.filter(u => u.role === 'Admin').length,
      inactive: users.filter(u => u.status === 'Inactive').length,
      pending: users.filter(u => u.status === 'Pending Verification' || u.verificationStatus === 'Pending').length,
    };
  }, [users]);

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const searchLower = userSearch.toLowerCase();
      const matchSearch = !userSearch || 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.phone.toLowerCase().includes(searchLower) ||
        u.id.toLowerCase().includes(searchLower) ||
        (u.companyName && u.companyName.toLowerCase().includes(searchLower));

      if (!matchSearch) return false;

      if (userFilters.role !== 'ALL' && u.role !== userFilters.role) return false;
      if (userFilters.status !== 'ALL' && u.status !== userFilters.status) return false;
      if (userFilters.verificationStatus !== 'ALL' && u.verificationStatus !== userFilters.verificationStatus) return false;
      if (userFilters.location && (!u.location || !u.location.toLowerCase().includes(userFilters.location.toLowerCase()))) return false;

      if (userFilters.registrationDate !== 'ALL') {
        const today = new Date();
        const joined = new Date(u.joinedDate + ' 2026');
        const diffTime = Math.abs(today.getTime() - joined.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (userFilters.registrationDate === 'TODAY' && diffDays > 1) return false;
        if (userFilters.registrationDate === 'WEEK' && diffDays > 7) return false;
        if (userFilters.registrationDate === 'MONTH' && diffDays > 30) return false;
      }

      return true;
    });
  }, [users, userSearch, userFilters]);

  // Sorted and Paginated users
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      const valA = a[userSortField as keyof UserRecord] || '';
      const valB = b[userSortField as keyof UserRecord] || '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return userSortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      return 0;
    });
    return sorted;
  }, [filteredUsers, userSortField, userSortOrder]);

  const paginatedUsers = useMemo(() => {
    const start = (userCurrentPage - 1) * userPageSize;
    return sortedUsers.slice(start, start + userPageSize);
  }, [sortedUsers, userCurrentPage]);

  const userTotalPages = Math.ceil(sortedUsers.length / userPageSize) || 1;

  const handleSort = (field: string) => {
    if (userSortField === field) {
      setUserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortOrder('asc');
    }
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    alert(`Announcement broadcasted to target audience: ${announceAudience}`);
    setAnnouncementText('');
  };


  return (
    <div className="min-h-screen bg-warm-cream text-stone-950 font-sans flex flex-col pb-10">
      
      {/* 1. Header Shell */}
      <header className="sticky top-0 z-30 border-b border-light-border bg-white shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo variant="header" />
            <span className="rounded bg-stone-900 px-2.5 py-0.5 text-[8.5px] font-black text-white uppercase tracking-wider">
              Control Panel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/analytics')}
              className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-light-stone/30"
            >
              📊 BI Analytics
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 2. Sub-Tab Selector Navigation */}
      <main className="mx-auto max-w-6xl w-full px-4 py-8 sm:px-6 space-y-6 flex-1 text-left">
        
        {/* Navigation list */}
        <section className="flex gap-2 border-b border-stone-200 overflow-x-auto pb-1 text-[9.5px] font-black uppercase tracking-wider no-scrollbar">
          {([
            { id: 'dashboard', label: 'Platform Reports', icon: '📊' },
            { id: 'users', label: 'User Operations', icon: '👤' },
            { id: 'verifications', label: 'Verification Center', icon: '⏳' },
            { id: 'marketplace', label: 'Marketplace Management', icon: '🛒' },
            { id: 'projects', label: 'Project Monitoring', icon: '💼' },
            { id: 'disputes', label: 'Disputes & Flagged', icon: '⚖️' },
            { id: 'content', label: 'CMS & Announcements', icon: '📢' },
            { id: 'audit', label: 'Admin Audit Log', icon: '📋' },
            { id: 'health', label: 'Platform Health', icon: '💚' },
          ] as const).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 border-b-2 font-bold transition whitespace-nowrap cursor-pointer select-none
                  ${isActive 
                    ? 'border-emerald-600 text-emerald-800 font-extrabold' 
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                  }
                `}
              >
                <span>{t.icon}</span>
                <span className="ml-1.5">{t.label}</span>
              </button>
            );
          })}
        </section>

        {/* 3. Tab Contents Layout */}

        {/* PLATFORM REPORTS & MONITORING DASHBOARD */}
        {activeTab === 'dashboard' && (
          isReportsLoading ? (
            <SkeletonReports />
          ) : (
            <div className="space-y-6">
              
              {/* Header */}
              <ReportsHeader 
                onRefresh={handleRefreshReports}
                onExport={() => alert("Simulating export of platform activity operational registry report...")}
              />

              {/* Statistics Cards */}
              <StatisticsCards 
                totalUsers={reportStats.totalUsers}
                activeProjects={reportStats.activeProjects}
                openRequirements={reportStats.openRequirements}
                completedProjects={reportStats.completedProjects}
                pendingVerifications={reportStats.pendingVerifications}
                submittedQuotations={reportStats.submittedQuotations}
                onTabSelect={setActiveTab}
              />

              {/* Filter Options */}
              <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm text-left select-none space-y-4">
                <div className="flex justify-between items-center border-b border-light-border/40 pb-2">
                  <h4 className="text-[10px] font-black uppercase text-stone-900 tracking-wider">
                    🔍 Filter Operational metrics
                  </h4>
                  <button
                    onClick={handleResetReportFilters}
                    className="text-[9px] font-black text-stone-500 hover:text-stone-900 uppercase tracking-wider focus:outline-none"
                  >
                    Reset Filters
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                  {/* Date range filter */}
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Date Range
                    </label>
                    <select
                      value={reportFilters.dateRange}
                      onChange={(e) => setReportFilters({ ...reportFilters, dateRange: e.target.value })}
                      className="dbc-input bg-white text-stone-755 font-semibold"
                    >
                      <option value="ALL">All Time</option>
                      <option value="TODAY">Today</option>
                      <option value="WEEK">This Week</option>
                      <option value="MONTH">This Month</option>
                    </select>
                  </div>

                  {/* Role filter */}
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
                      User Role
                    </label>
                    <select
                      value={reportFilters.role}
                      onChange={(e) => setReportFilters({ ...reportFilters, role: e.target.value })}
                      className="dbc-input bg-white text-stone-755 font-semibold"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="Customer">Customer</option>
                      <option value="Professional">Professional</option>
                      <option value="Consultant">Consultant</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  {/* Category filter */}
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Marketplace Category
                    </label>
                    <select
                      value={reportFilters.category}
                      onChange={(e) => setReportFilters({ ...reportFilters, category: e.target.value })}
                      className="dbc-input bg-white text-stone-755 font-semibold"
                    >
                      <option value="ALL">All Categories</option>
                      {marketplaceCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location input filter */}
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Location City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad"
                      value={reportFilters.location}
                      onChange={(e) => setReportFilters({ ...reportFilters, location: e.target.value })}
                      className="dbc-input text-stone-750 font-semibold"
                    />
                  </div>

                  {/* Status filter */}
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black uppercase tracking-widest text-stone-400">
                      User Status
                    </label>
                    <select
                      value={reportFilters.status}
                      onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value })}
                      className="dbc-input bg-white text-stone-755 font-semibold"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid Splits: Left Summaries Panel + Right Health / Shortcuts Panel */}
              {reportStats.totalUsers === 0 ? (
                <ReportsEmptyState 
                  type="data"
                  onResetFilters={handleResetReportFilters}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Panel summaries */}
                  <div className="lg:col-span-8 space-y-6">
                    <GrowthSummary 
                      newToday={reportStats.newToday}
                      newThisWeek={reportStats.newThisWeek}
                      newThisMonth={reportStats.newThisMonth}
                      totalActive={reportStats.totalActive}
                    />

                    <RequirementsSummary 
                      openCount={reportStats.reqOpen}
                      closedCount={reportStats.reqClosed}
                      reportedCount={reportStats.reqReported}
                      createdToday={reportStats.reqCreatedToday}
                    />

                    <ProjectsSummary 
                      inProgressCount={reportStats.projInProgress}
                      completedCount={reportStats.projCompleted}
                      onHoldCount={reportStats.projOnHold}
                      cancelledCount={reportStats.projCancelled}
                    />

                    <VerificationSummary 
                      pendingCount={reportStats.verifPending}
                      approvedCount={reportStats.verifApproved}
                      rejectedCount={reportStats.verifRejected}
                      docsAwaitingReview={reportStats.verifAwaitingDocs}
                    />

                    <QuotationSummary 
                      draftCount={reportStats.quotDraft}
                      submittedCount={reportStats.quotSubmitted}
                      acceptedCount={reportStats.quotAccepted}
                      rejectedCount={reportStats.quotRejected}
                    />
                  </div>

                  {/* Right Panel side information */}
                  <div className="lg:col-span-4 space-y-6">
                    <PlatformHealthCard health={reportStats.health} />

                    <ReportsQuickActions 
                      onTabSelect={setActiveTab}
                      onExport={() => alert("Exporting platform operational activity summary records...")}
                    />
                  </div>

                </div>
              )}

            </div>
          )
        )}

        {/* USER OPERATIONS */}
        {activeTab === 'users' && (
          isUsersLoading ? (
            <SkeletonUsers />
          ) : (
            <div className="space-y-6">
              
              {/* Header */}
              <UserManagementHeader 
                onRefresh={handleRefreshUsers} 
                onExport={() => alert("Simulating export of user list directory metadata...")} 
              />

              {/* Statistics */}
              <UserStatistics 
                total={stats.total} 
                customers={stats.customers} 
                professionals={stats.professionals} 
                consultants={stats.consultants} 
                admins={stats.admins} 
                inactive={stats.inactive} 
                pending={stats.pending} 
              />

              {/* Search & Filters */}
              <div className="space-y-4">
                <UserSearch value={userSearch} onChange={(val) => { setUserSearch(val); setUserCurrentPage(1); }} />
                <UserFilters filters={userFilters} onFilterChange={(f) => { setUserFilters(f); setUserCurrentPage(1); }} onReset={handleResetFilters} />
              </div>

              {/* Split Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Users Table / Cards (Col span 8) */}
                <div className="lg:col-span-8 space-y-4">
                  {paginatedUsers.length === 0 ? (
                    <EmptyStateUsers 
                      type={userSearch ? 'search' : (userFilters.role !== 'ALL' ? userFilters.role.toLowerCase() : 'users')} 
                      onResetFilters={handleResetFilters} 
                    />
                  ) : (
                    <>
                      {/* Desktop view: table */}
                      <div className="hidden md:block">
                        <UsersTable 
                          users={paginatedUsers} 
                          onSelectUser={(u) => setSelectedUser(u)} 
                          onApprove={handleUserApproveVerify} 
                          onStatusChange={handleUserStatusChange} 
                          sortField={userSortField} 
                          sortOrder={userSortOrder} 
                          onSort={handleSort} 
                          currentPage={userCurrentPage} 
                          totalPages={userTotalPages} 
                          onPageChange={setUserCurrentPage} 
                        />
                      </div>

                      {/* Mobile view: stacked cards */}
                      <div className="space-y-4 md:hidden">
                        {paginatedUsers.map((u) => (
                          <UserCard 
                            key={u.id} 
                            user={u} 
                            onSelectUser={(usr) => setSelectedUser(usr)} 
                            onApprove={handleUserApproveVerify} 
                            onStatusChange={handleUserStatusChange} 
                          />
                        ))}

                        {/* Mobile pagination */}
                        {userTotalPages > 1 && (
                          <div className="flex justify-between items-center bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs text-xs font-bold text-stone-600">
                            <span>Page {userCurrentPage} of {userTotalPages}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setUserCurrentPage(prev => prev - 1)}
                                disabled={userCurrentPage === 1}
                                className="px-2.5 py-1.5 border border-stone-200 bg-white rounded-lg disabled:opacity-40 disabled:pointer-events-none"
                              >
                                &larr; Prev
                              </button>
                              <button
                                onClick={() => setUserCurrentPage(prev => prev + 1)}
                                disabled={userCurrentPage === userTotalPages}
                                className="px-2.5 py-1.5 border border-stone-200 bg-white rounded-lg disabled:opacity-40 disabled:pointer-events-none"
                              >
                                Next &rarr;
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Right side: Detailed Inspector (Col span 4) */}
                <div className="lg:col-span-4 space-y-6">
                  <UserDetailsPanel 
                    user={selectedUser} 
                    onClose={() => setSelectedUser(null)} 
                    onApprove={handleUserApproveVerify} 
                    onReject={handleUserRejectVerify} 
                    onStatusChange={handleUserStatusChange} 
                    currentAdminEmail="admin@example.com" 
                  />

                  <UserQuickActions 
                    user={selectedUser} 
                    onApprove={handleUserApproveVerify} 
                    onStatusChange={handleUserStatusChange} 
                    onSelectUser={(usr) => setSelectedUser(usr)} 
                  />
                </div>

              </div>

            </div>
          )
        )}

        {/* REQUIREMENT & MARKETPLACE MANAGEMENT */}
        {activeTab === 'marketplace' && (
          isMarketplaceLoading ? (
            <SkeletonMarketplace />
          ) : (
            <div className="space-y-6">
              
              {/* Header */}
              <MarketplaceHeader 
                onRefresh={handleRefreshMarketplace} 
                onExport={() => alert("Simulating export of marketplace listings directory metadata...")} 
              />

              {/* Statistics */}
              <MarketplaceStats 
                total={marketplaceStats.total}
                openCount={marketplaceStats.open}
                closedCount={marketplaceStats.closed}
                reportedCount={marketplaceStats.reported}
                hiddenCount={marketplaceStats.hidden}
                pendingReviewCount={marketplaceStats.pending}
              />

              {/* Search & Filters */}
              <div className="space-y-4">
                <MarketplaceSearch 
                  value={marketplaceSearchQuery} 
                  onChange={setMarketplaceSearchQuery} 
                />
                <MarketplaceFilters 
                  filters={marketplaceFilters} 
                  onFilterChange={setMarketplaceFilters} 
                  onReset={handleResetMarketplaceFilters} 
                  categories={marketplaceCategories} 
                />
              </div>

              {/* Grid Splits: Requirements Table + Detail side panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side (Col span 8): Tables & Reported Queues */}
                <div className="lg:col-span-8 space-y-8">
                  <div>
                    <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider mb-3 text-left">
                      Active Listings Database
                    </h3>
                    {paginatedRequirements.length === 0 ? (
                      <MarketplaceEmptyState 
                        type={marketplaceSearchQuery ? 'search' : 'requirements'} 
                        onResetFilters={handleResetMarketplaceFilters} 
                      />
                    ) : (
                      <>
                        {/* Desktop view */}
                        <div className="hidden md:block">
                          <RequirementsTable 
                            requirements={paginatedRequirements}
                            onSelectRequirement={(req) => setSelectedRequirement(req)}
                            onHide={handleHideRequirement}
                            onUnhide={handleUnhideRequirement}
                            onCloseRequirement={handleCloseRequirement}
                            sortField={marketplaceSortField}
                            sortOrder={marketplaceSortOrder}
                            onSort={handleMarketplaceSort}
                            currentPage={marketplaceCurrentPage}
                            totalPages={marketplaceTotalPages}
                            onPageChange={setMarketplaceCurrentPage}
                          />
                        </div>

                        {/* Mobile View */}
                        <div className="space-y-4 md:hidden">
                          {paginatedRequirements.map((req) => (
                            <RequirementCard 
                              key={req.id}
                              requirement={req}
                              onSelectRequirement={(r) => setSelectedRequirement(r)}
                              onHide={handleHideRequirement}
                              onUnhide={handleUnhideRequirement}
                              onCloseRequirement={handleCloseRequirement}
                            />
                          ))}

                          {/* Mobile pagination */}
                          {marketplaceTotalPages > 1 && (
                            <div className="flex justify-between items-center bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs text-xs font-bold text-stone-600">
                              <span>Page {marketplaceCurrentPage} of {marketplaceTotalPages}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setMarketplaceCurrentPage(prev => Math.max(prev - 1, 1))}
                                  disabled={marketplaceCurrentPage === 1}
                                  className="px-2.5 py-1.5 border border-stone-200 bg-white rounded-lg disabled:opacity-40 disabled:pointer-events-none"
                                >
                                  &larr; Prev
                                </button>
                                <button
                                  onClick={() => setMarketplaceCurrentPage(prev => Math.min(prev + 1, marketplaceTotalPages))}
                                  disabled={marketplaceCurrentPage === marketplaceTotalPages}
                                  className="px-2.5 py-1.5 border border-stone-200 bg-white rounded-lg disabled:opacity-40 disabled:pointer-events-none"
                                >
                                  Next &rarr;
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Flagged Backlog queue */}
                  <ReportedRequirements 
                    reportedItems={reportedRequirements}
                    onSelectRequirement={(req) => {
                      setSelectedRequirement(req);
                      setMarketplaceFilters(prev => ({ ...prev, status: 'Reported' }));
                    }}
                    onDismissReport={handleDismissReport}
                    onHideRequirement={handleHideRequirement}
                    onCloseRequirement={handleCloseRequirement}
                  />
                </div>

                {/* Right side (Col span 4): Moderator Inspector Side-Panel */}
                <div className="lg:col-span-4 space-y-6">
                  <RequirementDetails 
                    requirement={selectedRequirement}
                    onClose={() => setSelectedRequirement(null)}
                    onHide={handleHideRequirement}
                    onUnhide={handleUnhideRequirement}
                    onCloseRequirement={handleCloseRequirement}
                    onReopen={handleReopenRequirement}
                    onDismissReports={handleDismissReport}
                  />

                  <MarketplaceQuickActions 
                    requirement={selectedRequirement}
                    onSelectRequirement={(req) => setSelectedRequirement(req)}
                    onHide={handleHideRequirement}
                    onCloseRequirement={handleCloseRequirement}
                    onReopen={handleReopenRequirement}
                    onShowReportedOnly={() => setMarketplaceFilters(prev => ({ ...prev, status: 'Reported' }))}
                  />
                </div>

              </div>

            </div>
          )
        )}

        {/* PROJECT MONITORING */}
        {activeTab === 'projects' && (
          isProjectsLoading ? (
            <SkeletonProjects />
          ) : (
            <div className="space-y-6">
              
              {/* Header */}
              <ProjectMonitoringHeader 
                onRefresh={handleRefreshProjects} 
                onExport={() => alert("Simulating export of project monitoring portfolio data...")} 
              />

              {/* Statistics */}
              <ProjectStatistics 
                total={projectStats.total}
                activeCount={projectStats.active}
                completedCount={projectStats.completed}
                onHoldCount={projectStats.onHold}
                cancelledCount={projectStats.cancelled}
                nearDeadlineCount={projectStats.nearDeadline}
              />

              {/* Search & Filters */}
              <div className="space-y-4">
                <ProjectSearch 
                  value={projectSearchQuery} 
                  onChange={setProjectSearchQuery} 
                />
                <ProjectFilters 
                  filters={projectFilters} 
                  onFilterChange={setProjectFilters} 
                  onReset={handleResetProjectFilters} 
                  categories={projectCategories}
                  professionals={projectProfessionals}
                  customers={projectCustomers}
                />
              </div>

              {/* Grid Splits: Projects Table + Detail side panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side (Col span 8): Tables & Timeline Logs */}
                <div className="lg:col-span-8 space-y-8">
                  <div>
                    <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider mb-3 text-left">
                      Platform Projects Portfolio Database
                    </h3>
                    {paginatedProjects.length === 0 ? (
                      <ProjectEmptyState 
                        type={projectSearchQuery ? 'search' : 'projects'} 
                        onResetFilters={handleResetProjectFilters} 
                      />
                    ) : (
                      <>
                        {/* Desktop view */}
                        <div className="hidden md:block">
                          <ProjectsTable 
                            projects={paginatedProjects}
                            onSelectProject={(proj) => setSelectedProject(proj)}
                            onFlagProject={handleFlagProject}
                            sortField={projectSortField}
                            sortOrder={projectSortOrder}
                            onSort={handleProjectSort}
                            currentPage={projectCurrentPage}
                            totalPages={projectTotalPages}
                            onPageChange={setProjectCurrentPage}
                          />
                        </div>

                        {/* Mobile View */}
                        <div className="space-y-4 md:hidden">
                          {paginatedProjects.map((proj) => (
                            <ProjectCard 
                              key={proj.id}
                              project={proj}
                              onSelectProject={(p) => setSelectedProject(p)}
                              onFlagProject={handleFlagProject}
                            />
                          ))}

                          {/* Mobile pagination */}
                          {projectTotalPages > 1 && (
                            <div className="flex justify-between items-center bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs text-xs font-bold text-stone-600">
                              <span>Page {projectCurrentPage} of {projectTotalPages}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setProjectCurrentPage(prev => Math.max(prev - 1, 1))}
                                  disabled={projectCurrentPage === 1}
                                  className="px-2.5 py-1.5 border border-stone-200 bg-white rounded-lg disabled:opacity-40 disabled:pointer-events-none"
                                >
                                  &larr; Prev
                                </button>
                                <button
                                  onClick={() => setProjectCurrentPage(prev => Math.min(prev + 1, projectTotalPages))}
                                  disabled={projectCurrentPage === projectTotalPages}
                                  className="px-2.5 py-1.5 border border-stone-200 bg-white rounded-lg disabled:opacity-40 disabled:pointer-events-none"
                                >
                                  Next &rarr;
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Chronological Timeline feed */}
                  <ProjectTimeline 
                    timeline={selectedProject?.timeline || []} 
                    projectName={selectedProject?.name}
                  />
                </div>

                {/* Right side (Col span 4): Moderator Inspector Side-Panel */}
                <div className="lg:col-span-4 space-y-6">
                  <ProjectDetails 
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onFlagProject={handleFlagProject}
                  />

                  <ProjectQuickActions 
                    project={selectedProject}
                    onTabChange={setActiveTab}
                    onShowFlaggedOnly={() => setProjectFilters(prev => ({ ...prev, status: 'ALL' }))}
                    onFlagProject={handleFlagProject}
                  />
                </div>

              </div>

            </div>
          )
        )}

        {/* VERIFICATION CENTER */}
        {activeTab === 'verifications' && (
          isVerificationLoading ? (
            <SkeletonVerification />
          ) : (
            <div className="space-y-6">
              
              {/* Header */}
              <VerificationHeader 
                onRefresh={handleRefreshVerifications}
                onExport={() => alert("Simulating export of verification requests registry catalog...")}
              />

              {/* Statistics */}
              <VerificationStatistics 
                pendingCount={verificationStats.pending}
                approvedCount={verificationStats.approved}
                rejectedCount={verificationStats.rejected}
                awaitingReviewCount={verificationStats.awaitingReview}
                additionalInfoCount={verificationStats.additionalInfo}
                expiredCount={verificationStats.expired}
              />

              {/* Search & Filters */}
              <div className="space-y-4">
                <VerificationSearch 
                  value={verificationSearchQuery}
                  onChange={setVerificationSearchQuery}
                />
                <VerificationFilters 
                  filters={verificationFilters}
                  onFilterChange={setVerificationFilters}
                  onReset={handleResetVerificationFilters}
                  roles={verificationRoles}
                  locations={verificationLocations}
                />
              </div>

              {/* Grid Layout Splits: Verification Table + Detail Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side (Col span 8): Request Table & Document Sandbox Viewer */}
                <div className="lg:col-span-8 space-y-8">
                  <div>
                    <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider mb-3 text-left">
                      Verification Backlog Queue
                    </h3>
                    {paginatedVerifications.length === 0 ? (
                      <VerificationEmptyState 
                        type={verificationSearchQuery ? 'search' : 'requests'}
                        onResetFilters={handleResetVerificationFilters}
                      />
                    ) : (
                      <VerificationTable 
                        requests={paginatedVerifications}
                        onSelectRequest={(req) => setSelectedVerification(req)}
                        onApprove={handleApproveVerify}
                        onReject={handleRejectVerify}
                        sortField={verificationSortField}
                        sortOrder={verificationSortOrder}
                        onSort={handleVerificationSort}
                        currentPage={verificationCurrentPage}
                        totalPages={verificationTotalPages}
                        onPageChange={setVerificationCurrentPage}
                      />
                    )}
                  </div>

                  {/* Sandbox Document Viewer */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider mb-3 text-left">
                      Applicant Document Sandbox
                    </h3>
                    <DocumentViewer documents={selectedVerification?.documentsSubmitted || []} />
                  </div>

                  {/* Submission history timeline */}
                  <VerificationHistory 
                    timeline={selectedVerification?.timeline || []} 
                    applicantName={selectedVerification?.name}
                  />
                </div>

                {/* Right Side (Col span 4): Moderator Detail Inspector panel & quick action triggers */}
                <div className="lg:col-span-4 space-y-6">
                  <VerificationDetails 
                    request={selectedVerification}
                    onClose={() => setSelectedVerification(null)}
                    onApprove={handleApproveVerify}
                    onReject={handleRejectVerify}
                    onRequestInfo={handleRequestInfo}
                    onSaveNotes={handleSaveVerificationNotes}
                  />

                  <VerificationQuickActions 
                    request={selectedVerification}
                    onApprove={handleApproveVerify}
                    onReject={handleRejectVerify}
                    onRequestInfo={handleRequestInfo}
                    onSelectRequest={(req) => setSelectedVerification(req)}
                  />
                </div>

              </div>

            </div>
          )
        )}

        {/* DISPUTES & MODERATION */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            {disputes.length === 0 ? (
              <div className="dbc-card text-center p-8">No open disputes reported on the platform.</div>
            ) : (
              <div className="space-y-3">
                {disputes.map((d) => (
                  <div key={d.id} className="dbc-card space-y-4 text-left">
                    <div className="flex justify-between items-start border-b border-light-border/40 pb-2">
                      <div>
                        <h4 className="text-xs font-black text-stone-black">Dispute Ticket {d.id}</h4>
                        <span className="block text-[8px] text-stone-gray font-bold mt-0.5">
                          Client: {d.client} vs. Provider: {d.provider}
                        </span>
                      </div>
                      <span className={`dbc-badge text-[7.5px] py-0.5 ${
                        d.status === 'Resolved' ? 'dbc-badge-completed' : 'dbc-badge-priority'
                      }`}>{d.status}</span>
                    </div>

                    <div className="text-[10px] text-stone-gray font-semibold space-y-1.5">
                      <p>📝 <strong>Disputed Subject:</strong> "{d.topic}"</p>
                      <p>💳 <strong>Escrow holding:</strong> ₹{d.amount.toLocaleString()}</p>
                      <div className="p-3 bg-light-stone/40 border border-light-border rounded-xl">
                        <strong>Admin Notes:</strong><br />
                        "{d.adminNotes}"
                      </div>
                    </div>

                    {d.status === 'Open' && (
                      <div className="flex gap-2 pt-2 border-t border-light-border/40">
                        <button
                          onClick={() => handleResolveDispute(d.id)}
                          className="dbc-btn dbc-btn-primary py-2 px-4 text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Resolve & Release Escrow
                        </button>
                        <button
                          onClick={() => alert('Requesting mediation evidence call...')}
                          className="dbc-btn dbc-btn-outline py-2 px-4 text-[9px] font-bold uppercase tracking-wider bg-white cursor-pointer"
                        >
                          Request Mediation Files
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CMS & ANNOUNCEMENTS */}
        {activeTab === 'content' && (
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Announcement composer */}
            <form onSubmit={handlePublishAnnouncement} className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Broadcast Announcements</h3>
              
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Audience Target</label>
                <select
                  value={announceAudience}
                  onChange={(e) => setAnnounceAudience(e.target.value)}
                  className="dbc-input bg-white"
                >
                  <option value="Everyone">Everyone (Clients & Providers)</option>
                  <option value="Customers">Customers Only</option>
                  <option value="Professionals">Professionals Only</option>
                  <option value="Consultants">Consultants Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Message details</label>
                <textarea
                  placeholder="Type broadcast text announcement..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="dbc-input h-24 resize-none"
                  required
                />
              </div>

              <button type="submit" className="dbc-btn dbc-btn-primary py-2.5 px-6 cursor-pointer">
                Broadcast Announcement
              </button>
            </form>

            {/* Homepage CMS links */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">CMS Operations</h3>
              <p className="text-[10px] text-stone-gray font-semibold leading-relaxed">
                Review and update static resources, register marketplace categories, edit blog directories, or configure email notifications layouts.
              </p>
              
              <div className="space-y-2 pt-2 border-t border-light-border/40 text-[9px] font-black uppercase tracking-wider">
                <button onClick={() => navigate('/admin/articles')} className="w-full p-2.5 bg-light-stone hover:bg-light-stone/80 rounded-xl text-stone-black text-left border border-light-border">
                  ✍️ Edit Blog & Knowledge Hub Articles
                </button>
                <button onClick={() => alert('CMS categories editor launched.')} className="w-full p-2.5 bg-light-stone hover:bg-light-stone/80 rounded-xl text-stone-black text-left border border-light-border">
                  📁 Modify Trades & Sub-specialization Catalog
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ADMIN AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="dbc-card space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Administrative Trail Event Log</h3>
            <div className="divide-y divide-light-border/40">
              {MOCK_AUDIT_LOGS.map((log) => (
                <div key={log.id} className="py-3 flex justify-between items-center text-[10px] text-stone-gray font-semibold">
                  <div>
                    <strong className="text-stone-black">{log.admin}</strong>: {log.action}
                  </div>
                  <span className="text-[8px] text-stone-gray/80 font-bold">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLATFORM HEALTH */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            
            {/* Status indicators */}
            <div className="grid gap-4 sm:grid-cols-3 text-center text-xs font-bold text-stone-gray">
              <div className="dbc-card p-5 space-y-1">
                <span>Database Connection Pool</span>
                <h4 className="text-base font-extrabold text-brand-emerald mt-1">32/100 connections (Healthy)</h4>
              </div>
              <div className="dbc-card p-5 space-y-1">
                <span>Background Jobs Queue</span>
                <h4 className="text-base font-extrabold text-stone-black mt-1">0 pending jobs</h4>
              </div>
              <div className="dbc-card p-5 space-y-1">
                <span>API Router Average Latency</span>
                <h4 className="text-base font-extrabold text-brand-emerald mt-1">~12ms latency</h4>
              </div>
            </div>

            {/* Performance charts preview */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">System Latency Analytics</h3>
              <div className="p-4 bg-light-stone/20 rounded-xl border border-light-border">
                <div className="flex justify-between items-end h-32 gap-2">
                  {[20, 22, 18, 12, 14, 13, 12].map((lat, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full bg-brand-emerald rounded-t-md" style={{ height: `${lat * 4}px` }} />
                      <span className="text-[8px] text-stone-gray/80 font-bold">{lat}ms</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[8px] text-stone-gray/80 font-black uppercase tracking-wider mt-3 pt-2 border-t border-light-border/40">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Sun (Today)</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Action Confirmation Modal Dialog */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-xs select-none animate-fade-in" role="dialog" aria-modal="true">
          <div className="bg-white border border-light-border max-w-sm w-full p-6 rounded-3xl shadow-apple-lg space-y-4 text-left">
            <div className="space-y-1.5">
              <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
                {confirmModal.title}
              </h3>
              <p className="text-[10.5px] text-stone-600 font-semibold leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex gap-2 justify-end text-[9px] font-black uppercase tracking-wider pt-2">
              <button
                onClick={closeConfirm}
                className="px-4.5 py-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4.5 py-2 bg-brand-emerald hover:bg-emerald-800 text-white rounded-xl font-black tracking-wider transition cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

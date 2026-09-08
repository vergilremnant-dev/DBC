import { useEffect, useState, lazy, Suspense } from 'react';
import { Navigate, Route, Routes, Outlet } from 'react-router-dom';

const WorkspaceLayout = lazy(() => import('./layouts/WorkspaceLayout'));
const WorkspaceOverview = lazy(() => import('./pages/workspace/WorkspaceOverview'));
const WorkspaceRequirements = lazy(() => import('./pages/workspace/WorkspaceRequirements'));
const WorkspaceBookings = lazy(() => import('./pages/workspace/WorkspaceBookings'));
const WorkspaceInbox = lazy(() => import('./pages/workspace/WorkspaceInbox'));
const WorkspaceNotifications = lazy(() => import('./pages/workspace/WorkspaceNotifications'));
const WorkspaceSettings = lazy(() => import('./pages/workspace/WorkspaceSettings'));
const ProfessionalDashboard = lazy(() => import('./pages/workspace/professional/ProfessionalDashboard'));
const ProfessionalLeads = lazy(() => import('./pages/workspace/professional/ProfessionalLeads'));
const ProfessionalProjects = lazy(() => import('./pages/workspace/professional/ProfessionalProjects'));
const ProfessionalProfile = lazy(() => import('./pages/workspace/professional/ProfessionalProfile'));
const ConsultationWorkspace = lazy(() => import('./pages/workspace/consultant/ConsultationWorkspace'));
const ConsultationReportPage = lazy(() => import('./pages/workspace/consultant/ConsultationReportPage'));
const ConsultantCrmPage = lazy(() => import('./pages/workspace/consultant/ConsultantCrmPage'));
const RequirementWorkspacePage = lazy(() => import('./pages/workspace/professional/RequirementWorkspacePage'));
const QuotationManagementPage = lazy(() => import('./pages/workspace/professional/QuotationManagementPage'));
const ProfessionalProjectWorkspace = lazy(() => import('./pages/workspace/professional/ProjectWorkspacePage'));
import { useAuth } from './hooks/auth/useAuth';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicMarketplace } from './pages/PublicMarketplace';
import { BookServicePage } from './pages/customer/BookServicePage';
import { RequestCallbackPage } from './pages/RequestCallbackPage';
import { BlogCatalog } from './pages/blog/BlogCatalog';
import { ArticleDetailPage } from './pages/blog/ArticleDetailPage';
import { ChatPanel } from './pages/chat/ChatPanel';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { ProjectWorkspacePage } from './pages/shared/ProjectWorkspacePage';
import { AppointmentSchedulingPage } from './pages/shared/AppointmentSchedulingPage';
import { CollaborationWorkspacePage } from './pages/shared/CollaborationWorkspacePage';
import { CategoryProvidersPage } from './pages/CategoryProvidersPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { KnowMorePage } from './pages/KnowMorePage';
import { PublicProfessionalProfilePage } from './pages/PublicProfessionalProfilePage';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAnalyticsDashboard } from './pages/admin/AdminAnalyticsDashboard';
import { AdminArticlesPage } from './pages/admin/AdminArticlesPage';
import AdminPlatformSettings from './pages/admin/AdminPlatformSettings';
import { FinanceBillingPage } from './pages/shared/FinanceBillingPage';
import { SmartIntelligencePage } from './pages/shared/SmartIntelligencePage';
import { IntegrationAutomationPage } from './pages/shared/IntegrationAutomationPage';
import { MobilePwaPage } from './pages/shared/MobilePwaPage';
import { useAuthDispatch } from './hooks/auth/useAuthStore';
import { refreshThunk, logout } from './store/auth/authSlice';

function RootRedirect() {
  return <Navigate to="/" replace />;
}

function WorkspaceIndexRedirect() {
  const { user } = useAuth();
  const norm = user?.role?.toUpperCase() || '';
  if (norm.includes('ADMIN')) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (norm.includes('PROVIDER')) {
    return <Navigate to="/workspace/dashboard" replace />;
  }
  return <Navigate to="/workspace/overview" replace />;
}

function App() {
  const dispatch = useAuthDispatch();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    dispatch(refreshThunk()).finally(() => {
      setInitialized(true);
    });

    const handleGlobalLogout = () => {
      dispatch(logout());
    };
    window.addEventListener('auth:logout', handleGlobalLogout);

    return () => {
      window.removeEventListener('auth:logout', handleGlobalLogout);
    };
  }, [dispatch]);

  if (!initialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-4 border-stone-200 border-t-emerald-700 animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Securing Session...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        {/* The root page is the single unified dashboard for everyone */}
        <Route path="/" element={<PublicMarketplace />} />
        <Route path="/category/:id/providers" element={<CategoryProvidersPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/professional/:id" element={<PublicProfessionalProfilePage />} />
        <Route path="/know-more" element={<KnowMorePage />} />
        <Route path="/about" element={<KnowMorePage />} />
        <Route path="/request-callback" element={<RequestCallbackPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        
        <Route
          path="/book-service"
          element={
            <ProtectedRoute allowedRoles={['ROLE_CUSTOMER']}>
              <BookServicePage />
            </ProtectedRoute>
          }
        />
        
        <Route path="/blog" element={<BlogCatalog />} />
        <Route path="/blog/:slug" element={<ArticleDetailPage />} />
        
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['ROLE_CUSTOMER', 'ROLE_PROVIDER']}>
              <ChatPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute allowedRoles={['ROLE_CUSTOMER', 'ROLE_PROVIDER']}>
              <ProjectWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={['ROLE_CUSTOMER', 'ROLE_PROVIDER']}>
              <AppointmentSchedulingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collaboration"
          element={
            <ProtectedRoute allowedRoles={['ROLE_CUSTOMER', 'ROLE_PROVIDER']}>
              <CollaborationWorkspacePage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/workspace"
        element={
          <ProtectedRoute allowedRoles={['ROLE_CUSTOMER', 'ROLE_PROVIDER', 'ROLE_ADMIN']}>
            <Suspense
              fallback={
                <div className="flex h-screen w-screen items-center justify-center bg-stone-50">
                  <div className="text-center space-y-3">
                    <div className="h-8 w-8 rounded-full border-4 border-stone-200 border-t-emerald-700 animate-spin mx-auto"></div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Loading Workspace...</p>
                  </div>
                </div>
              }
            >
              <WorkspaceLayout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        <Route index element={<WorkspaceIndexRedirect />} />
        
        {/* Customer subroutes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['ROLE_CUSTOMER']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="overview" element={<WorkspaceOverview />} />
          <Route path="requirements" element={<WorkspaceRequirements />} />
          <Route path="settings" element={<WorkspaceSettings />} />
        </Route>

        {/* Professional subroutes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['ROLE_PROVIDER']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ProfessionalDashboard />} />
          <Route path="leads" element={<ProfessionalLeads />} />
          <Route path="projects" element={<ProfessionalProjects />} />
          <Route path="profile" element={<ProfessionalProfile />} />
          <Route path="consultation/:id" element={<ConsultationWorkspace />} />
          <Route path="report/:id" element={<ConsultationReportPage />} />
          <Route path="crm" element={<ConsultantCrmPage />} />
          <Route path="requirement/:id" element={<RequirementWorkspacePage />} />
          <Route path="quotations" element={<QuotationManagementPage />} />
          <Route path="project/:id" element={<ProfessionalProjectWorkspace />} />
        </Route>

        {/* Shared subroutes (dynamic rendering inside components) */}
        <Route path="bookings" element={<WorkspaceBookings />} />
        <Route path="inbox" element={<WorkspaceInbox />} />
        <Route path="notifications" element={<WorkspaceNotifications />} />
        <Route path="finance" element={<FinanceBillingPage />} />
        <Route path="ai-intelligence" element={<SmartIntelligencePage />} />
        <Route path="integrations" element={<IntegrationAutomationPage />} />
        <Route path="mobile-pwa" element={<MobilePwaPage />} />
      </Route>

      {/* Deprecated customer & contractor routes redirecting to unified workspace */}
      <Route path="/customer/dashboard" element={<Navigate to="/workspace/overview" replace />} />
      <Route path="/customer/requirements" element={<Navigate to="/workspace/requirements" replace />} />
      <Route path="/customer/requirements/create" element={<Navigate to="/workspace/requirements" replace />} />
      <Route path="/customer/profile" element={<Navigate to="/workspace/settings" replace />} />
      <Route path="/customer/bookings" element={<Navigate to="/workspace/bookings" replace />} />
      <Route path="/contractor/dashboard" element={<Navigate to="/workspace/dashboard" replace />} />
      {/* Admin subroutes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <AdminAnalyticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/articles"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <AdminArticlesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <AdminPlatformSettings />
          </ProtectedRoute>
        }
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;

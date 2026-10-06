import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

// Layouts
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import AdminLayout from '../layouts/AdminLayout'
import AdminRoute from '../components/admin/AdminRoute'

// Pages
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import GigsPage from '../pages/GigsPage'
import GigDetailPage from '../pages/GigDetailPage'
import OrdersPage from '../pages/OrdersPage'
import OrderDetailPage from '../pages/OrderDetailPage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectWorkspacePage from '../pages/ProjectWorkspacePage'
import MessagesPage from '../pages/MessagesPage'
import ProfilePage from '../pages/ProfilePage'
import DashboardPage from '../pages/DashboardPage'
import ContractsPage from '../pages/ContractsPage'
import ContractDetailPage from '../pages/ContractDetailPage'
import ReviewsPage from '../pages/ReviewsPage'
import SettingsPage from '../pages/SettingsPage'
import FindTalentPage from '../pages/FindTalentPage'
import HomePage from '../pages/HomePage'
import FreelancerDetailPage from '../pages/FreelancerDetailPage'
import BecomeFreelancerPage from '../pages/BecomeFreelancerPage'
import TopTalentPage from '../pages/TopTalentPage'
import NotFoundPage from '../pages/NotFoundPage'

// Admin Pages
import AdminOverviewPage from '../pages/admin/AdminOverviewPage'
import AdminBecomeFreelancerPage from '../pages/admin/AdminBecomeFreelancerPage'
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage'
import AdminSkillsPage from '../pages/admin/AdminSkillsPage'
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname + location.search }} replace />
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin/overview" replace />
  }
  return children
}

const GuestRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return children
  return <Navigate to={user?.role === 'admin' ? '/admin/overview' : '/app/home'} replace />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/app',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="home" replace />,
      },
      {
        path: 'home',
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'gigs',
        element: (
          <ProtectedRoute>
            <GigsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'gigs/:id',
        element: (
          <ProtectedRoute>
            <GigDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projects',
        element: (
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projects/:id',
        element: (
          <ProtectedRoute>
            <ProjectWorkspacePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projects/:id/:tab',
        element: (
          <ProtectedRoute>
            <ProjectWorkspacePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'messages',
        element: (
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'contracts',
        element: (
          <ProtectedRoute>
            <ContractsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'contracts/:id',
        element: (
          <ProtectedRoute>
            <ContractDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviews',
        element: (
          <ProtectedRoute>
            <ReviewsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: <Navigate to="/app/profile" replace />,
      },
      {
        path: 'become-freelancer',
        element: (
          <ProtectedRoute>
            <BecomeFreelancerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'freelancers/:id',
        element: (
          <ProtectedRoute>
            <FreelancerDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'top-talent',
        element: (
          <ProtectedRoute>
            <TopTalentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'talent',
        element: <Navigate to="/app/top-talent" replace />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="overview" replace />,
      },
      {
        path: 'overview',
        element: <AdminOverviewPage />,
      },
      {
        path: 'applications',
        element: <AdminBecomeFreelancerPage />,
      },
      {
        path: 'categories',
        element: <AdminCategoriesPage />,
      },
      {
        path: 'skills',
        element: <AdminSkillsPage />,
      },
      {
        path: 'analytics',
        element: <AdminAnalyticsPage />,
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export default router

import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegistrationPage from "./pages/RegistrationPage"
import SubscriptionsPage from "./pages/SubscriptionsPage"
import SubscriptionCheckoutPage from "./pages/SubscriptionCheckoutPage"
import PackagesPage from "./pages/PackagesPage"
import SubscriberDashboardPage from "./pages/SubscriberDashboardPage"
import MarketerDashboardPage from "./pages/MarketerDashboardPage"
import AdminDashboardPage from "./pages/AdminDashboardPage"
import AdminPackagesPage from "./pages/AdminPackagesPage"
import MarketerManagementPage from "./pages/MarketerManagementPage"
import MarketerEarningsAdminPage from "./pages/MarketerEarningsAdminPage"
import MarketerWithdrawPage from "./pages/MarketerWithdrawPage"
import MarketerRedeemPage from "./pages/MarketerRedeemPage"
import MarketerEarningsPage from "./pages/MarketerEarningsPage"
import ReferralsPage from "./pages/ReferralsPage"
import LessonManagementPage from "./pages/LessonManagementPage"
import LearningHierarchyPage from "./pages/LearningHierarchyPage"
import InvitesPage from "./pages/InvitesPage"
import WeekendTutorialsPage from "./pages/WeekendTutorialsPage"
import AboutUsPage from "./pages/AboutUsPage"
import GoToClassPage from "./pages/GoToClassPage"

// New pages
import ContactUsPage from "./pages/ContactUsPage"
import UserGuidePage from "./pages/UserGuidePage"
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage"
import TermsOfServicePage from "./pages/TermsOfServicePage"
import AccountSettingsPage from "./pages/AccountSettingsPage"
import ChangeUsercodePage from "./pages/ChangeUsercodePage"
import ForgotUsercodePage from "./pages/ForgotUsercodePage"
import NotFoundPage from "./pages/NotFoundPage"
import UnauthorizedPage from "./pages/UnauthorizedPage"
import AdminUsersPage from "./pages/AdminUsersPage"
import AdminWithdrawalsPage from "./pages/AdminWithdrawalsPage"
import AdminRolesPage from "./pages/AdminRolesPage"
import AdminHLSPage from "./pages/AdminHLSPage"
import AdminTransactionsPage from "./pages/AdminTransactionsPage"
import AdminSubscriptionsPage from "./pages/AdminSubscriptionsPage"

// Protected route wrapper
import { ProtectedRoute } from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/customlogin" element={<LoginPage />} />
        <Route path="/forgot-usercode" element={<ForgotUsercodePage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/subscribe/:packageId/checkout" element={<SubscriptionCheckoutPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="/packages/buy/:id" element={<PackagesPage />} />
        <Route path="/weekend-tutorials" element={<WeekendTutorialsPage />} />
        <Route path="/gotoclass" element={<GoToClassPage />} />
        <Route path="/class" element={<GoToClassPage />} />
        <Route path="/subscribe/:id" element={<SubscriptionsPage />} />
        <Route path="/aboutus" element={<AboutUsPage />} />
        <Route path="/contactus" element={<ContactUsPage />} />
        <Route path="/guide" element={<UserGuidePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected routes */}
        <Route
          path="/account"
          element={
            <ProtectedRoute requireAuth>
              <AccountSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requireAuth>
              <ChangeUsercodePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireAuth requireRole="subscriber">
              <SubscriberDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Marketer routes */}
        <Route
          path="/marketer-dashboard"
          element={
            <ProtectedRoute requireAuth requireRole="marketer">
              <MarketerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketer-withdraw"
          element={
            <ProtectedRoute requireAuth requireRole="marketer">
              <MarketerWithdrawPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketer-redeem"
          element={
            <ProtectedRoute requireAuth requireRole="marketer">
              <MarketerRedeemPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketer/earnings"
          element={
            <ProtectedRoute requireAuth requireRole="marketer">
              <MarketerEarningsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <AdminWithdrawalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <AdminTransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/packages"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <AdminPackagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <AdminSubscriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute requireAuth requireRole="superadmin">
              <AdminRolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/hls"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <AdminHLSPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/marketers"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <MarketerManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/marketer-earnings"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <MarketerEarningsAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/lessons"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <LessonManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/learning-hierarchy"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              <LearningHierarchyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invites"
          element={
            <ProtectedRoute requireAuth>
              <InvitesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invites/add"
          element={
            <ProtectedRoute requireAuth>
              <InvitesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/referrals"
          element={
            <ProtectedRoute requireAuth requireRole="marketer">
              <ReferralsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


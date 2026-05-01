import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'))
const SubscriptionCheckoutPage = lazy(() => import('./pages/SubscriptionCheckoutPage'))
const PackagesPage = lazy(() => import('./pages/PackagesPage'))
const PackageCheckoutPage = lazy(() => import('./pages/PackageCheckoutPage'))
const SubscriberDashboardPage = lazy(() => import('./pages/SubscriberDashboardPage'))
const MarketerDashboardPage = lazy(() => import('./pages/MarketerDashboardPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminPackagesPage = lazy(() => import('./pages/AdminPackagesPage'))
const MarketerManagementPage = lazy(() => import('./pages/MarketerManagementPage'))
const MarketerEarningsAdminPage = lazy(() => import('./pages/MarketerEarningsAdminPage'))
const MarketerWithdrawPage = lazy(() => import('./pages/MarketerWithdrawPage'))
const MarketerRedeemPage = lazy(() => import('./pages/MarketerRedeemPage'))
const MarketerEarningsPage = lazy(() => import('./pages/MarketerEarningsPage'))
const ReferralsPage = lazy(() => import('./pages/ReferralsPage'))
const LessonManagementPage = lazy(() => import('./pages/LessonManagementPage'))
const LearningHierarchyPage = lazy(() => import('./pages/LearningHierarchyPage'))
const InvitesPage = lazy(() => import('./pages/InvitesPage'))
const WeekendTutorialsPage = lazy(() => import('./pages/WeekendTutorialsPage'))
const GoToClassPage = lazy(() => import('./pages/GoToClassPage'))
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'))
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'))
const UserGuidePage = lazy(() => import('./pages/UserGuidePage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'))
const AccountSettingsPage = lazy(() => import('./pages/AccountSettingsPage'))
const ChangeUsercodePage = lazy(() => import('./pages/ChangeUsercodePage'))
const ForgotUsercodePage = lazy(() => import('./pages/ForgotUsercodePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const AdminWithdrawalsPage = lazy(() => import('./pages/AdminWithdrawalsPage'))
const AdminRolesPage = lazy(() => import('./pages/AdminRolesPage'))
const AdminTransactionsPage = lazy(() => import('./pages/AdminTransactionsPage'))
const AdminSubscriptionsPage = lazy(() => import('./pages/AdminSubscriptionsPage'))
const BunnySyncAdminPage = lazy(() => import('./pages/BunnySyncAdminPage'))
const BunnyUploadAdminPage = lazy(() => import('./pages/BunnyUploadAdminPage'))

// Page loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

// Wrap page with loading fallback
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

// Protected route wrapper
import { ProtectedRoute } from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={withSuspense(HomePage)} />
        <Route path="/login" element={withSuspense(LoginPage)} />
        <Route path="/customlogin" element={withSuspense(LoginPage)} />
        <Route path="/forgot-usercode" element={withSuspense(ForgotUsercodePage)} />
        <Route path="/subscriptions" element={withSuspense(SubscriptionsPage)} />
        <Route path="/subscribe/:packageId/checkout" element={withSuspense(SubscriptionCheckoutPage)} />
        <Route path="/packages" element={withSuspense(PackagesPage)} />
        <Route path="/packages/buy/:id" element={withSuspense(PackageCheckoutPage)} />
          <Route path="/weekend-tutorials" element={withSuspense(WeekendTutorialsPage)} />
          <Route path="/gotoclass" element={withSuspense(GoToClassPage)} />
          <Route path="/class" element={withSuspense(GoToClassPage)} />
         <Route
            path="/class/subscriber"
            element={
              <ProtectedRoute requireAuth requireRole="subscriber">
                {withSuspense(GoToClassPage)}
              </ProtectedRoute>
            }
         />
         <Route path="/subscribe/:id" element={withSuspense(SubscriptionsPage)} />
        <Route path="/aboutus" element={withSuspense(AboutUsPage)} />
        <Route path="/contactus" element={withSuspense(ContactUsPage)} />
        <Route path="/guide" element={withSuspense(UserGuidePage)} />
        <Route path="/privacy" element={withSuspense(PrivacyPolicyPage)} />
        <Route path="/terms" element={withSuspense(TermsOfServicePage)} />
        <Route path="/unauthorized" element={withSuspense(UnauthorizedPage)} />

        {/* Protected routes */}
        <Route
          path="/account"
          element={
            <ProtectedRoute requireAuth>
              {withSuspense(AccountSettingsPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requireAuth>
              {withSuspense(ChangeUsercodePage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireAuth requireRole="subscriber">
              {withSuspense(SubscriberDashboardPage)}
            </ProtectedRoute>
          }
        />

        {/* Marketer routes */}
        <Route
          path="/marketer-dashboard"
          element={
            <ProtectedRoute requireAuth requireRole="marketer">
              {withSuspense(MarketerDashboardPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketer-withdraw"
          element={
            <ProtectedRoute requireAuth requireRole="marketer">
              {withSuspense(MarketerWithdrawPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketer-redeem"
          element={
            <ProtectedRoute requireAuth requireRole="marketer">
              {withSuspense(MarketerRedeemPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketer/earnings"
          element={
            <ProtectedRoute requireAuth requireRole="marketer">
              {withSuspense(MarketerEarningsPage)}
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(AdminDashboardPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(AdminWithdrawalsPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(AdminUsersPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(AdminTransactionsPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/packages"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(AdminPackagesPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(AdminSubscriptionsPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bunny-sync"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(BunnySyncAdminPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bunny-upload"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(BunnyUploadAdminPage)}
            </ProtectedRoute>
          }
        />
          <Route
            path="/admin/roles"
           element={
             <ProtectedRoute requireAuth requireRole="admin">
               {withSuspense(AdminRolesPage)}
             </ProtectedRoute>
           }
         />
        <Route
          path="/admin/marketers"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(MarketerManagementPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/marketer-earnings"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(MarketerEarningsAdminPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/lessons"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(LessonManagementPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/learning-hierarchy"
          element={
            <ProtectedRoute requireAuth requireRole="admin">
              {withSuspense(LearningHierarchyPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/invites"
          element={
            <ProtectedRoute requireAuth>
              {withSuspense(InvitesPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/invites/add"
          element={
            <ProtectedRoute requireAuth>
              {withSuspense(InvitesPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/referrals"
          element={
            <ProtectedRoute requireAuth requireRole="marketer">
              {withSuspense(ReferralsPage)}
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


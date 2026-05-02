# Mobile Responsiveness Checklist

**Project:** BTC Learning Platform  
**Date:** 2026-05-02  
**Purpose:** Comprehensive UI/UX mobile responsiveness verification for all frontend pages

---

## 📱 Testing Guidelines

### Devices to Test
- **Mobile:** 375px (iPhone SE), 428px (iPhone 14 Pro Max), 390px (iPhone 13)
- **Tablet:** 768px (iPad), 820px (iPad Pro), 1024px (iPad Air)
- **Desktop:** 1440px, 1920px

### Key Areas to Verify
- [ ] Navigation menu (hamburger/drawer)
- [ ] Touch target sizes (minimum 44px)
- [ ] Text readability (no horizontal scrolling)
- [ ] Form inputs and buttons
- [ ] Image/video scaling
- [ ] Card components and grids
- [ ] Tables (horizontal scroll or stacked layout)
- [ ] Modal dialogs and overlays
- [ ] Sidebar/header responsiveness
- [ ] Footer layout

---

## ✅ Public Pages (No Authentication Required)

### 1. HomePage.tsx
**Route:** `/`  
**Role:** Landing page for all users  
**Priority:** 🔴 High

#### Critical Checks:
- [x] **[Line 117-186] Hero Section** - Flex layout `lg:flex-row` → stacks on mobile ✓
- [x] **[Line 121-124] Hero Title** - `text-4xl lg:text-5xl` responsive font size ✓
- [x] **[Line 129-142] CTA Buttons** - `flex-col sm:flex-row` stacks on mobile ✓
- [x] **[Line 144-159] Stats Section** - `w-px` dividers visible but thin on mobile ✓
- [x] **[Line 162-184] Hero Image** - `w-full h-auto` scales properly ✓
- [x] **[Line 164-167] Hero Image** - No fixed height, aspect ratio preserved ✓

#### Feature Cards (Line 199-211):
- [x] **Grid Layout** - `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` adapts correctly ✓
- [x] **Touch Targets** - Card click areas minimum 44px ✓
- [x] **Icon Sizes** - `h-12 w-12` appropriate for mobile ✓

#### Courses Section (Line 231-277):
- [x] **Grid Layout** - `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` → 1 col on mobile ✓
- [x] **Image Scaling** - `w-full h-full object-cover` maintains aspect ratio ✓
- [x] **Text Truncation** - `line-clamp-2` prevents overflow ✓
- [x] **Group Hover Effects** - Touch-friendly on mobile ✓

#### Stats Section (Line 282-303): **⚠️ NEEDS FIX**
- [ ] **ISSUE: 2-column grid on mobile** - `grid-cols-2 md:grid-cols-4` → Cramped at 375px
- [ ] **ISSUE: Divider lines** - `w-px h-12` too thin (1px) on mobile
- [x] **Font Sizes** - `text-4xl` ≈ 36px - acceptable but large
- [x] **Padding** - `px-4` sufficient ✓

#### Testimonials (Line 306-339):
- [x] **Grid Layout** - `grid-cols-1 md:grid-cols-3` → single column ✓
- [x] **Card Height** - Consistent height ✓

#### CTA Section (Line 342-366):
- [x] **Buttons** - `flex-col sm:flex-row` stacks on mobile ✓
- [x] **Text Sizes** - `text-3xl` ≈ 28px - acceptable ✓
- [x] **Padding** - `p-12` - may be excessive but works ✓

**Component Dependencies:**
- Layout, Header, Footer
- Feature cards, CTA sections

**Navigation (Header.tsx):**
- [x] **Mobile Menu** - Hamburger menu works (lines 106-113)
- [x] **Desktop Nav** - Hidden on mobile, icons+text on lg (lines 126-142)
- [x] **Tablet Nav** - Icons only on md (lines 145-160)
- [x] **Mobile Menu Dropdown** - Full menu slides down (lines 283-305)
- [x] **Auth Buttons** - Responsive (icons only on sm for logout)
- [x] **User Menu** - Works on all sizes ✓

**Known Mobile Concerns:**
1. ⚠️ **Stats section cramped** - 2 columns on 375px (~160px each)
2. ⚠️ **Divider lines barely visible** - 1px width
3. ⚠️ **Hero stats font may overflow** - Need to test with long numbers

**Recommendation:** Change stats to single column on mobile

### 2. WeekendTutorialsPage.tsx
**Route:** `/weekend-tutorials`  
**Role:** Public tutorial listings  
**Priority:** 🔴 High

- [ ] Tutorial grid becomes single column on mobile
- [ ] Filter controls are accessible and usable
- [ ] Pagination buttons are touch-friendly
- [ ] Lesson cards display all essential info
- [ ] Search input expands properly
- [ ] Price tags and action buttons visibility

**Component Dependencies:**
- Layout, ProtectedRoute
- Data tables, filter components

### 3. GuestClassPage.tsx
**Route:** `/guest/class`  
**Role:** Guest access to video lessons  
**Priority:** 🔴 High

- [ ] Video player container responsive
- [ ] Video quality selector accessible on mobile
- [ ] Playback controls touch-friendly
- [ ] Lesson info panel stacks below video
- [ ] Fullscreen mode works correctly
- [ ] Related lessons carousel/grid adapts

**Component Dependencies:**
- Layout, VideoPlayer, VideoContainer
- QualitySelector, VideoInfo, VideoTopBar

### 4. SubscriberClassPage.tsx
**Route:** `/class`  
**Role:** Subscribers access to video lessons  
**Priority:** 🔴 High

- [ ] Video player responsive (same as GuestClassPage)
- [ ] Sidebar navigation (if present) slides in/out
- [ ] Chat/messaging UI (if present) responsive
- [ ] Lesson notes/panel collapses appropriately
- [ ] Fullscreen mode behavior on mobile

**Component Dependencies:**
- Layout, VideoPlayer, VideoContainer
- QualitySelector, Sidebar

### 5. LoginPage.tsx
**Route:** `/login`  
**Role:** User authentication  
**Priority:** 🔴 High

- [ ] Login form inputs are sized for mobile keyboards
- [ ] Form fields have proper spacing
- [ ] Submit button is easily tappable
- [ ] "Forgot usercode" link is accessible
- [ ] Social login buttons (if any) scale
- [ ] Error messages display properly

**Component Dependencies:**
- Auth forms, input components

### 6. ForgotUsercodePage.tsx
**Route:** `/forgot-usercode`  
**Role:** Account recovery  
**Priority:** 🟡 Medium

- [ ] Phone number input optimized for mobile
- [ ] Form validation messages visible
- [ ] Submit button accessible
- [ ] Back to login navigation clear

**Component Dependencies:**
- Form inputs, verification components

### 7. ChangeUsercodePage.tsx
**Route:** `/change-usercode`  
**Role:** Update phone number  
**Priority:** 🟡 Medium

- [ ] Phone input mobile-optimized
- [ ] Verification steps clear on small screens
- [ ] OTP input (if used) mobile-friendly

**Component Dependencies:**
- Form inputs, verification modals

### 8. UserGuidePage.tsx
**Route:** `/user-guide`  
**Role:** Documentation/help  
**Priority:** 🟢 Low

- [ ] Documentation content readable on mobile
- [ ] Code blocks horizontally scrollable
- [ ] Images scale appropriately
- [ ] Table of contents (if present) collapsible
- [ ] Navigation within guide works on mobile

**Component Dependencies:**
- Markdown renderer, scrollable containers

### 9. TermsOfServicePage.tsx
**Route:** `/terms`  
**Role:** Legal terms  
**Priority:** 🟢 Low

- [ ] Long text content readable
- [ ] No horizontal scrolling for text
- [ ] Accept/decline buttons (if present) accessible

**Component Dependencies:**
- Scrollable containers

### 10. PrivacyPolicyPage.tsx
**Route:** `/privacy`  
**Role:** Privacy policy  
**Priority:** 🟢 Low

- [ ] Same checks as Terms of Service
- [ ] Link navigation works on mobile

**Component Dependencies:**
- Scrollable containers

### 11. AboutUsPage.tsx
**Route:** `/about`  
**Role:** Company information  
**Priority:** 🟢 Low

- [ ] Team member cards stack vertically
- [ ] Image galleries responsive
- [ ] Contact information accessible

**Component Dependencies:**
- Cards, gallery components

### 12. ContactUsPage.tsx
**Route:** `/contact`  
**Role:** Contact form  
**Priority:** 🟡 Medium

- [ ] Contact form inputs mobile-friendly
- [ ] Text areas sized appropriately
- [ ] Submit button tappable
- [ ] Map embed (if present) responsive
- [ ] Contact info cards stack vertically

**Component Dependencies:**
- Form components, map embeds

### 13. NotFoundPage.tsx
**Route:** `/*` (404)  
**Role:** Page not found  
**Priority:** 🟢 Low

- [ ] Error message readable on mobile
- [ ] Home navigation button accessible
- [ ] Illustration/image scales properly

**Component Dependencies:**
- Basic layout components

### 14. UnauthorizedPage.tsx
**Route:** `/unauthorized`  
**Role:** Access denied  
**Priority:** 🟢 Low

- [ ] Message clear on small screens
- [ ] Navigation options accessible

**Component Dependencies:**
- Basic layout

---

## 🔐 Subscriber/Member Pages

### 15. SubscriberDashboardPage.tsx
**Route:** `/dashboard`  
**Role:** Main dashboard for subscribers  
**Priority:** 🔴 High

- [ ] Dashboard widgets stack vertically on mobile
- [ ] Statistics cards resize appropriately
- [ ] Recent activity feed scrollable
- [ ] Quick access buttons touch-friendly
- [ ] Sidebar navigation (if present) slides in/out

**Component Dependencies:**
- Layout, Sidebar, Dashboard widgets
- Cards, statistics components

### 16. SubscriptionCheckoutPage.tsx
**Route:** `/subscription/checkout`  
**Role:** Subscribe to membership  
**Priority:** 🔴 High

- [ ] Payment form inputs mobile-optimized
- [ ] Plan selection cards stack vertically
- [ ] M-Pesa payment module responsive
- [ ] Terms checkbox accessible
- [ ] Submit button visible and tappable

**Component Dependencies:**
- MpesaPaymentModule, Form components
- Plan selection cards

## 📦 Package Pages

### 17. PackagesPage.tsx
**Route:** `/packages`  
**Role:** Browse available packages  
**Priority:** 🟡 Medium

- [ ] Package cards stack vertically on mobile
- [ ] Filter controls accessible
- [ ] Sort dropdown usable on mobile
- [ ] Price comparison tables (if any) scrollable or stacked

**Component Dependencies:**
- Cards, DataTable, filter components

### 18. PackageCheckoutPage.tsx
**Route:** `/package/checkout/:id`  
**Role:** Purchase individual package  
**Priority:** 🔴 High

- [ ] Package details readable on mobile
- [ ] Payment form responsive
- [ ] M-Pesa payment module works on mobile
- [ ] Feature list stacks vertically

**Component Dependencies:**
- MpesaPaymentModule, Form components
- Package details cards

---

## 💰 Marketer/Affiliate Pages

### 19. MarketerDashboardPage.tsx
**Route:** `/marketer/dashboard`  
**Role:** Affiliate dashboard  
**Priority:** 🟡 Medium

- [ ] Earnings cards stack vertically
- [ ] Referral statistics readable
- [ ] Recent referrals table scrollable horizontally or stacked
- [ ] Withdraw button accessible

**Component Dependencies:**
- Dashboard widgets, Statistics cards
- DataTable

### 20. MarketerEarningsPage.tsx
**Route:** `/marketer/earnings`  
**Role:** View earnings history  
**Priority:** 🟡 Medium

- [ ] Earnings table horizontally scrollable on mobile
- [ ] Filter controls accessible
- [ ] Date picker usable on mobile
- [ ] Export buttons touch-friendly

**Component Dependencies:**
- DataTable, date pickers

### 21. MarketerEarningsAdminPage.tsx
**Route:** `/admin/marketer-earnings`  
**Role:** Admin view of marketer earnings  
**Priority:** 🟡 Medium

- [ ] Same checks as MarketerEarningsPage
- [ ] Admin actions accessible

**Component Dependencies:**
- DataTable, admin controls

### 22. MarketerManagementPage.tsx
**Route:** `/admin/marketers`  
**Role:** Manage affiliate marketers  
**Priority:** 🟢 Low

- [ ] Marketer list table scrollable on mobile
- [ ] Action buttons (edit, delete) accessible
- [ ] Add marketer form responsive

**Component Dependencies:**
- DataTable, form modals

### 23. MarketerWithdrawPage.tsx
**Route:** `/marketer/withdraw`  
**Role:** Request withdrawal  
**Priority:** 🟡 Medium

- [ ] Withdrawal form mobile-friendly
- [ ] Amount input with clear validation
- [ ] Bank details inputs accessible
- [ ] Submit button visible

**Component Dependencies:**
- Form components, input fields

### 24. MarketerRedeemPage.tsx
**Route:** `/marketer/redeem`  
**Role:** Redeem commissions  
**Priority:** 🟢 Low

- [ ] Redeem form responsive
- [ ] Available amount display clear
- [ ] Submit button accessible

**Component Dependencies:**
- Form components

### 25. ReferralsPage.tsx
**Route:** `/marketer/referrals`  
**Role:** View referral history  
**Priority:** 🟢 Low

- [ ] Referrals table scrollable on mobile
- [ ] Search/filter controls usable
- [ ] User details readable

**Component Dependencies:**
- DataTable, search components

---

## 👤 User/Person Management

### 26. AdminUsersPage.tsx
**Route:** `/admin/users`  
**Role:** Manage all users  
**Priority:** 🟡 Medium

- [ ] Users table horizontally scrollable on mobile
- [ ] Action buttons (edit, delete, ban) accessible
- [ ] Add user form responsive in modal
- [ ] Filter controls usable on mobile

**Component Dependencies:**
- DataTable, modals, form components

### 27. AdminRolesPage.tsx
**Route:** `/admin/roles`  
**Role:** Manage user roles  
**Priority:** 🟢 Low

- [ ] Roles list table scrollable
- [ ] Permission checkboxes alignment on mobile
- [ ] Form modals responsive

**Component Dependencies:**
- DataTable, form modals

### 28. AccountSettingsPage.tsx
**Route:** `/account/settings`  
**Role:** User account settings  
**Priority:** 🟡 Medium

- [ ] Settings sections stack vertically
- [ ] Form inputs (email, phone) mobile-optimized
- [ ] Password change form accessible
- [ ] Save buttons visible

**Component Dependencies:**
- Form components, PhoneVerificationModal

### 29. PhoneVerificationCard.tsx
**Route:** (Various)  
**Role:** Phone verification component  
**Priority:** 🔴 High

- [ ] OTP input fields mobile-friendly
- [ ] Resend button accessible
- [ ] Verification success/error messages visible
- [ ] Works within modals on mobile

**Component Dependencies:**
- OTP inputs, modals

---

## 📚 Content Management

### 30. LearningHierarchyPage.tsx
**Route:** `/learning-hierarchy`  
**Role:** Browse learning areas/levels  
**Priority:** 🟡 Medium

- [ ] Tree/hierarchy view adapts to mobile
- [ ] Expand/collapse controls touch-friendly
- [ ] Learning area cards stack vertically
- [ ] Search input usable

**Component Dependencies:**
- Tree view components, cards

### 31. LessonsHierarchyPage.tsx (if exists)
**Note:** Check if separate page exists  
**Role:** Browse lessons by hierarchy  
**Priority:** 🟡 Medium

- [ ] Lesson tree responsive
- [ ] Lesson cards stack on mobile

**Component Dependencies:**
- Tree components, cards

### 32. AdminLessonsPage.tsx (if exists)
**Route:** `/admin/lessons`  
**Role:** Manage lessons (check if separate or part of LessonManagementPage)  
**Priority:** 🟢 Low

**Component Dependencies:**
- DataTable, forms

### 33. LessonManagementPage.tsx
**Route:** `/admin/lessons/manage`  
**Role:** CRUD operations for lessons  
**Priority:** 🟢 Low

- [ ] Lesson list table scrollable on mobile
- [ ] Add/edit lesson form responsive in modal
- [ ] Video upload controls usable on mobile
- [ ] Action buttons accessible

**Component Dependencies:**
- DataTable, BunnyVideo modals, forms

---

## 🎬 Video/Bunny Management Pages

### 34. BunnyUploadAdminPage.tsx
**Route:** `/admin/bunny/upload`  
**Role:** Upload videos to BunnyCDN  
**Priority:** 🟢 Low

- [ ] Upload form responsive
- [ ] File picker usable on mobile
- [ ] Progress indicators visible
- [ ] Video mapping controls accessible

**Component Dependencies:**
- BunnyVideo components, forms

### 35. BunnySyncAdminPage.tsx
**Route:** `/admin/bunny/sync`  
**Role:** Sync videos between systems  
**Priority:** 🟢 Low

- [ ] Sync status table scrollable
- [ ] Sync controls accessible
- [ ] Logs view readable on mobile

**Component Dependencies:**
- DataTable, BunnyVideo components

### 36. BunnyVideosModal.tsx (Component)
**Route:** (Modal)  
**Role:** Browse/select Bunny videos  
**Priority:** 🟢 Low

- [ ] Modal fits mobile screen
- [ ] Video list scrollable
- [ ] Select buttons touch-friendly

**Component Dependencies:**
- Modal, DataTable

### 37. MultiUploadModal.tsx (Component)
**Route:** (Modal)  
**Role:** Bulk upload videos  
**Priority:** 🟢 Low

- [ ] File inputs accessible on mobile
- [ ] Multiple file selection works
- [ ] Progress visible

**Component Dependencies:**
- Modal, upload components

### 38. LinkVideoModal.tsx (Component)
**Route:** (Modal)  
**Role:** Link video to lesson  
**Priority:** 🟢 Low

- [ ] Search input usable on mobile
- [ ] Video results list scrollable
- [ ] Link button accessible

**Component Dependencies:**
- Modal, search components

### 39. MappingStatusModal.tsx (Component)
**Route:** (Modal)  
**Role:** View mapping status  
**Priority:** 🟢 Low

- [ ] Status table scrollable
- [ ] Details readable on mobile

**Component Dependencies:**
- Modal, table

---

## 💳 Transaction & Payment Pages

### 40. AdminTransactionsPage.tsx
**Route:** `/admin/transactions`  
**Role:** View all transactions  
**Priority:** 🟡 Medium

- [ ] Transactions table horizontally scrollable on mobile
- [ ] Filter controls (date, status) accessible
- [ ] Search input usable
- [ ] Export buttons touch-friendly

**Component Dependencies:**
- DataTable, filter components

### 41. AdminSubscriptionsPage.tsx
**Route:** `/admin/subscriptions`  
**Role:** Manage subscriptions  
**Priority:** 🟢 Low

- [ ] Subscriptions table scrollable
- [ ] Action buttons accessible

**Component Dependencies:**
- DataTable

### 42. AdminPackagesPage.tsx
**Route:** `/admin/packages`  
**Role:** Manage packages  
**Priority:** 🟢 Low

- [ ] Packages table scrollable
- [ ] Add/edit form responsive

**Component Dependencies:**
- DataTable, modals

### 43. AdminWithdrawalsPage.tsx
**Route:** `/admin/withdrawals`  
**Role:** Process withdrawal requests  
**Priority:** 🟢 Low

- [ ] Withdrawals table scrollable
- [ ] Status update buttons accessible

**Component Dependencies:**
- DataTable

---

## 🎥 Video Player Pages (Critical)

### 44. VideoPlayer.tsx (Component)
**Route:** (Used in Class pages)  
**Role:** Core video playback  
**Priority:** 🔴 Critical

- [ ] Video container maintains aspect ratio on all screens
- [ ] Controls (play/pause, volume, progress) touch-friendly
- [ ] Fullscreen mode works correctly on mobile
- [ ] Quality selector dropdown usable on mobile
- [ ] Loading states visible on small screens
- [ ] Error messages readable

**Component Dependencies:**
- React Player or similar
- Custom controls

### 45. VideoContainer.tsx (Component)
**Route:** (Wrapper for VideoPlayer)  
**Role:** Video layout container  
**Priority:** 🔴 Critical

- [ ] Responsive width/height calculations
- [ ] Sidebar (lesson notes) collapses appropriately
- [ ] Chat panel (if any) slides in/out on mobile

**Component Dependencies:**
- Layout components

### 46. VideoTopBar.tsx (Component)
**Route:** (Video controls)  
**Role:** Video title and actions  
**Priority:** 🟡 Medium

- [ ] Title readable on small screens (may truncate)
- [ ] Action buttons (like, share) accessible
- [ ] Quality selector fits mobile screen

**Component Dependencies:**
- Button components

### 47. VideoInfo.tsx (Component)
**Route:** (Video metadata)  
**Role:** Display video information  
**Priority:** 🟢 Low

- [ ] Description text readable
- [ ] Metadata (date, views) stacks appropriately

**Component Dependencies:**
- Typography components

### 48. QualitySelector.tsx (Component)
**Route:** (Video quality dropdown)  
**Role:** Select playback quality  
**Priority:** 🟡 Medium

- [ ] Dropdown menu fits mobile screen
- [ ] Options easily selectable
- [ ] Current quality clearly indicated

**Component Dependencies:**
- Dropdown components

---

## 🎯 Payment Components (Critical)

### 49. MpesaPaymentModule.tsx
**Route:** (Used in checkout pages)  
**Role:** M-Pesa payment processing  
**Priority:** 🔴 Critical

- [ ] Payment form inputs optimized for mobile
- [ ] Amount display readable
- [ ] Payment button tappable
- [ ] Loading states visible
- [ ] Success/error messages clear on small screens
- [ ] Works in modal (if used)

**Component Dependencies:**
- Form components, buttons
- API integration

### 50. LessonPurchaseModal.tsx
**Route:** (Modal)  
**Role:** Purchase individual lesson  
**Priority:** 🔴 High

- [ ] Modal fits mobile screen without overflow
- [ ] Lesson details readable
- [ ] Price clear
- [ ] M-Pesa payment module responsive in modal
- [ ] Close button accessible

**Component Dependencies:**
- Modal, MpesaPaymentModule

---

## 🎨 UI Component Library

### 51. Header.tsx
**Route:** (Site header)  
**Role:** Main navigation  
**Priority:** 🔴 Critical

- [ ] Logo scales appropriately
- [ ] Navigation links collapse to hamburger on mobile
- [ ] Search input (if present) collapses/expands properly
- [ ] User menu (dropdown) works on mobile
- [ ] Touch targets are 44px minimum

**Component Dependencies:**
- Navigation, auth components

### 52. Sidebar.tsx
**Route:** (Dashboard navigation)  
**Role:** Sidebar menu for authenticated users  
**Priority:** 🔴 High

- [ ] Collapses to drawer on mobile
- [ ] Menu items touch-friendly
- [ ] Expand/collapse toggle accessible
- [ ] Overlay/backdrop on mobile

**Component Dependencies:**
- Navigation, drawer components

### 53. Footer.tsx
**Route:** (Site footer)  
**Role:** Footer navigation/links  
**Priority:** 🟡 Medium

- [ ] Columns stack vertically on mobile
- [ ] Links touch-friendly
- [ ] Copyright readable
- [ ] Social media icons sized properly

**Component Dependencies:**
- Link components

### 54. Layout.tsx
**Route:** (Page wrapper)  
**Role:** Main page layout  
**Priority:** 🔴 Critical

- [ ] Content area responsive padding
- [ ] Max-width constraints appropriate
- [ ] Mobile-first breakpoints correct

**Component Dependencies:**
- Header, Footer, Sidebar

### 55. WithRole.tsx
**Route:** (HOC)  
**Role:** Role-based rendering  
**Priority:** 🟢 Low

- [ ] No UI impact (logic only)

### 56. WithPermission.tsx
**Route:** (HOC)  
**Role:** Permission-based rendering  
**Priority:** 🟢 Low

- [ ] No UI impact (logic only)

### 57. CanI.tsx
**Route:** (Component)  
**Role:** Inline permission check  
**Priority:** 🟢 Low

- [ ] No UI impact (logic only)

### 58. ProtectedRoute.tsx
**Route:** (Route wrapper)  
**Role:** Route protection  
**Priority:** 🟢 Low

- [ ] No UI impact (logic only)

### 59. PhoneVerificationModal.tsx
**Route:** (Modal)  
**Role:** Phone verification  
**Priority:** 🔴 High

- [ ] Modal fits mobile screen
- [ ] Phone input mobile-optimized
- [ ] OTP input fields accessible
- [ ] Resend button touch-friendly

**Component Dependencies:**
- Modal, form inputs

---

## 🧩 Reusable UI Components

### 60. Button.tsx (ui/button)
**Role:** Primary action component  
**Priority:** 🔴 Critical

- [ ] Minimum touch target 44px
- [ ] Loading states visible
- [ ] Text readable on small screens

### 61. Input.tsx (ui/input)
**Role:** Form input  
**Priority:** 🔴 Critical

- [ ] Mobile keyboard appropriate (numeric, email, etc.)
- [ ] Font size readable
- [ ] Focus states visible

### 62. Card.tsx (ui/card)
**Role:** Content card  
**Priority:** 🟡 Medium

- [ ] Padding appropriate on mobile
- [ ] Content stacks if needed

### 63. Badge.tsx (ui/badge)
**Role:** Status badges  
**Priority:** 🟢 Low

- [ ] Text readable on small screens

### 64. Checkbox.tsx (ui/checkbox)
**Role:** Checkbox input  
**Priority:** 🟡 Medium

- [ ] Touch target 44px minimum

### 65. Label.tsx (ui/label)
**Role:** Form labels  
**Priority:** 🟢 Low

- [ ] Font size readable

### 66. Tabs.tsx (ui/tabs)
**Role:** Tabbed interface  
**Priority:** 🟡 Medium

- [ ] Tabs scrollable horizontally or stack vertically on mobile
- [ ] Touch targets adequate

---

## 📊 Data Display Components

### 67. DataTables (various pages)
**Pages:** 
- AdminUsersPage
- AdminTransactionsPage
- MarketerEarningsPage
- LessonManagementPage
- Subscriptions list
- Packages list
- And more...

**Priority:** 🔴 High (for pages with tables)

- [ ] Tables horizontally scrollable on mobile
- [ ] Columns don't break layout
- [ ] Action buttons in rows accessible
- [ ] Pagination controls usable
- [ ] Filter dropdowns work on mobile

---

## 🏷️ Special Components

### 68. LessonCard.tsx
**Role:** Display lesson preview  
**Role:** Used in listings  
**Priority:** 🟡 Medium

- [ ] Card stack vertically on mobile
- [ ] Image scales appropriately
- [ ] Title readable (may truncate)
- [ ] Price/actions visible

### 69. LessonPurchaseModal.tsx
**Role:** Purchase lesson  
**Priority:** 🔴 High

- [ ] See Page 49 checks

### 70. Membership/Subscription related modals
**Role:** Upgrade/downgrade flows  
**Priority:** 🟡 Medium

- [ ] Plans stack vertically on mobile
- [ ] Comparison tables scrollable
- [ ] Select buttons accessible

---

## 🔧 Testing Checklist Summary

### Critical Paths (Must Test)
1. ✅ Login flow on mobile
2. ✅ Video playback on mobile (all class pages)
3. ✅ M-Pesa payment on mobile
4. ✅ Navigation (hamburger menu)
5. ✅ Core layout (header, sidebar, footer)

### High Priority
- All checkout/purchase flows
- Dashboard main views
- Subscription management
- User settings

### Medium Priority
- Admin tables and management pages
- Marketer dashboard and earnings
- Package browsing

### Low Priority
- Static pages (About, Contact, Legal)
- Admin configuration pages

---

## 🐛 Common Mobile Issues to Watch For

### Layout Issues
- [ ] Horizontal scrolling (content wider than viewport)
- [ ] Text overflow (text doesn't wrap)
- [ ] Overlapping elements
- [ ] Fixed widths causing breakpoints to fail
- [ ] Images/videos overflowing containers

### Interaction Issues
- [ ] Touch targets too small (< 44px)
- [ ] Hover states interfering with touch
- [ ] Dropdowns not opening/closing properly
- [ ] Modals not fitting screen
- [ ] Keyboard covering input fields

### Performance Issues
- [ ] Images not optimized for mobile (too large)
- [ ] Videos loading heavy assets on mobile
- [ ] Too many re-renders on resize
- [ ] Layout shifts during load

### Typography
- [ ] Font too small to read
- [ ] Line height causing overlap
- [ ] Text truncation without ellipsis
- [ ] Responsive font sizing working

---

## 📏 Testing Tools & Methods

### Browser DevTools
- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- Safari Responsive Design Mode

### Real Devices
- iPhone (various sizes)
- Android phones (various sizes)
- iPad/tablet

### Automated Tools
- Lighthouse mobile audit
- Responsive design checkers

### Manual Testing
- Touch navigation
- Form input with mobile keyboard
- Orientation changes (portrait ↔ landscape)

---

## ✅ Progress Tracking

| Page/Section | Mobile Tested | Tablet Tested | Issues Found | Status |
|--------------|---------------|---------------|--------------|--------|
| HomePage | | | **Stats grid (2-col), Divider lines** | ⚠️ **NEEDS FIX** |
| WeekendTutorialsPage | | | | ⏳ Pending |
| GuestClassPage | | | | ⏳ Pending |
| SubscriberClassPage | | | | ⏳ Pending |
| LoginPage | | | | ⏳ Pending |
| SubscriberDashboard | | | | ⏳ Pending |
| SubscriptionCheckout | | | | ⏳ Pending |
| VideoPlayer | | | | ⏳ Pending |
| MpesaPaymentModule | | | | ⏳ Pending |

---

## 📝 Notes & Observations

### ⚠️ HomePage Analysis - Issues Found (2026-05-02)

#### **Critical: Stats Section Grid on Mobile**
- **Location:** HomePage.tsx, lines 282-303
- **Problem:** `grid-cols-2 md:grid-cols-4` creates cramped 2-column layout on small screens
- **Impact:** On 375px viewport: Each column ≈ 160px (very tight)
- **Suggested Fix:** Change to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` for better mobile spacing

#### **Minor: Divider Lines Visibility**
- **Location:** HomePage.tsx, lines 149, 154
- **Problem:** 1px wide divider lines barely visible on mobile
- **Suggested Fix:** Hide on mobile with `hidden md:block` or increase width

---

---

## 📅 Last Updated

**Date:** 2026-05-02  
**Next Review:** After major UI updates  
**Maintainer:** Frontend Team

---

*This checklist should be reviewed and updated whenever new pages are added or existing pages are significantly modified.*

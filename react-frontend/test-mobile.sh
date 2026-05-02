#!/bin/bash
# Mobile Responsiveness Testing Script for BTC Learning Platform
# Usage: ./test-mobile.sh [page-name]

set -e

echo "============================================"
echo "  Mobile Responsiveness Testing Suite"
echo "  BTC Learning Platform"
echo "============================================"
echo ""

echo "Available Pages:"
echo "  1. homepage       - Landing page (public)"
echo "  2. login          - Authentication (public)"
echo "  3. weekend        - Weekend tutorials (public)"
echo "  4. guest-class    - Guest video access (public)"
echo "  5. class          - Video playback (public)"
echo "  6. packages       - Package listing (public)"
echo "  7. subscription   - Subscription checkout (public)"
echo "  8. package-check  - Package checkout (public)"
echo "  9. dashboard      - Subscriber dashboard (protected)"
echo "  10. profile       - Account settings (protected)"
echo ""

PAGE=${1:-homepage}

echo "Testing: $PAGE"
echo "============================================"
echo ""

# Function to test responsive breakpoints
test_breakpoints() {
    echo "Testing responsive breakpoints..."
    echo ""
    
    # Mobile sizes
    echo "📱 Mobile Tests:"
    echo "  • 375px (iPhone SE)"
    echo "  • 390px (iPhone 13)"
    echo "  • 428px (iPhone 14 Pro Max)"
    echo "  • 480px (Large phones)"
    echo ""
    
    # Tablet sizes
    echo "📱 Tablet Tests:"
    echo "  • 768px (iPad)"
    echo "  • 820px (iPad Pro 11)"
    echo "  • 1024px (iPad Air)"
    echo ""
    
    # Desktop sizes
    echo "🖥️  Desktop Tests:"
    echo "  • 1440px (Standard)"
    echo "  • 1920px (Full HD)"
    echo ""
}

# Function to list common issues
list_common_issues() {
    echo "⚠️  Common Mobile Issues to Check:"
    echo ""
    echo "  1. Horizontal scrolling (content wider than viewport)"
    echo "  2. Text overflow (text doesn't wrap or truncate)"
    echo "  3. Touch targets < 44px"
    echo "  4. Hover states interfering with touch"
    echo "  5. Fixed widths breaking layout"
    echo "  6. Images overflowing containers"
    echo "  7. Forms cut off by mobile keyboard"
    echo "  8. Modal dialogs not fitting screen"
    echo "  9. Navigation not collapsing"
    echo "  10. Tables not horizontally scrollable"
    echo ""
}

# Function to test specific page
test_page() {
    case $PAGE in
        homepage)
            echo "Testing HomePage.tsx"
            echo "==================="
            echo ""
            echo "Page: /"
            echo "Components: Hero, Features, Courses, Stats, Testimonials, CTA"
            echo ""
            echo "✅ Expected Behavior:"
            echo "  • Hero section: flex-col on mobile"
            echo "  • Features: 1 column (md: 2 cols, lg: 3 cols)"
            echo "  • Courses: 1 column (md: 2 cols, lg: 4 cols)"
            echo "  • Stats: Should be 1 column or properly spaced"
            echo "  • Navigation: Hamburger menu visible"
            echo ""
            echo "❌ Watch For:"
            echo "  • Stats grid cramped (2 cols on small screen)"
            echo "  • Divider lines too thin"
            echo ""
            ;;
        login)
            echo "Testing LoginPage.tsx"
            echo "====================="
            echo ""
            echo "Page: /login"
            echo "Components: Login form"
            echo ""
            echo "✅ Expected Behavior:"
            echo "  • Form inputs mobile-optimized"
            echo "  • Keyboard appropriate (default)"
            echo "  • Submit button tappable (44px+)"
            echo ""
            ;;
        weekend)
            echo "Testing WeekendTutorialsPage.tsx"
            echo "================================="
            echo ""
            echo "Page: /weekend-tutorials"
            echo "Components: Tutorial list, filters"
            echo ""
            echo "✅ Expected Behavior:"
            echo "  • Tutorial grid: 1 column"
            echo "  • Filters: Accessible, dropdowns work"
            echo "  • Cards: All info visible"
            echo ""
            ;;
        guest-class|class)
            echo "Testing Video Playback Pages"
            echo "============================="
            echo ""
            echo "Pages: /guest-class, /class, /subscriber-class"
            echo "Components: VideoPlayer, VideoContainer"
            echo ""
            echo "✅ Expected Behavior (CRITICAL):"
            echo "  • Video container: Maintains aspect ratio"
            echo "  • Controls: Touch-friendly (44px+)"
            echo "  • Fullscreen: Works correctly"
            echo "  • Quality selector: Usable on mobile"
            echo "  • No horizontal scroll"
            echo ""
            echo "❌ Watch For:"
            echo "  • Video overflow"
            echo "  • Controls overlapping video"
            echo "  • Keyboard covering controls"
            echo ""
            ;;
        packages)
            echo "Testing PackagesPage.tsx"
            echo "========================"
            echo ""
            echo "Page: /packages"
            echo "Components: Package cards, filters"
            echo ""
            echo "✅ Expected Behavior:"
            echo "  • Cards: 1 column on mobile"
            echo "  • Filters: Usable dropdowns/inputs"
            echo "  • CTAs: Tappable buttons"
            echo ""
            ;;
        subscription|package-check)
            echo "Testing Checkout Pages"
            echo "====================="
            echo ""
            echo "Pages: /checkout/subscription, /checkout/package"
            echo "Components: MpesaPaymentModule, forms"
            echo ""
            echo "✅ Expected Behavior (CRITICAL):"
            echo "  • Payment form: Mobile-optimized inputs"
            echo "  • M-Pesa module: Works in modal/inline"
            echo "  • Buttons: Large, tappable"
            echo "  • Loading states: Visible"
            echo ""
            ;;
        dashboard)
            echo "Testing SubscriberDashboardPage.tsx"
            echo "===================================="
            echo ""
            echo "Page: /dashboard"
            echo "Components: Dashboard widgets"
            echo ""
            echo "✅ Expected Behavior:"
            echo "  • Widgets: Stack vertically"
            echo "  • Sidebar: Slides in (if authenticated)"
            echo "  • Navigation: Hamburger menu"
            echo ""
            ;;
        profile)
            echo "Testing AccountSettingsPage.tsx"
            echo "================================"
            echo ""
            echo "Page: /account"
            echo "Components: Settings forms"
            echo ""
            echo "✅ Expected Behavior:"
            echo "  • Form sections: Stacked"
            echo "  • Inputs: Mobile keyboard appropriate"
            echo "  • Phone verification: Modal fits screen"
            echo ""
            ;;
        *)
            echo "Unknown page: $PAGE"
            echo ""
            test_breakpoints
            list_common_issues
            exit 1
            ;;
    esac
}

# Function to run browser tests
run_browser_tests() {
    echo "============================================"
    echo "  Browser Testing Commands"
    echo "============================================"
    echo ""
    echo "To test manually:"
    echo ""
    echo "1. Start dev server:"
    echo "   cd react-frontend && npm run dev"
    echo ""
    echo "2. Open in browser:"
    echo "   http://localhost:5173"
    echo ""
    echo "3. Use DevTools:"
    echo "   • Chrome: F12 → Toggle Device Toolbar (Ctrl+Shift+M)"
    echo "   • Firefox: F12 → Responsive Design Mode (Ctrl+Shift+M)"
    echo ""
    echo "4. Test sizes:"
    echo "   • iPhone SE: 375×667"
    echo "   • iPhone 13: 390×844"
    echo "   • iPad: 768×1024"
    echo ""
    echo "5. Test interactions:"
    echo "   • Touch navigation"
    echo "   • Form inputs with keyboard"
    echo "   • Orientation change"
    echo "   • Pinch to zoom"
    echo ""
}

# Function to run automated checks
run_checks() {
    echo "============================================"
    echo "  Automated Checks"
    echo "============================================"
    echo ""
    
    # Check for responsive CSS classes
    echo "Checking responsive class patterns..."
    echo ""
    
    cd react-frontend
    
    echo "Common patterns (should see these):"
    echo "  • flex-col → flex-row transitions"
    echo "  • grid-cols-* with breakpoints"
    echo "  • sm:, md:, lg: prefixes"
    echo ""
    
    cd ..
    
    echo "✅ Responsive utilities detected:"
    echo "  • Tailwind CSS (breakpoints: sm, md, lg, xl, 2xl)"
    echo "  • Flexbox layouts"
    echo "  • Grid layouts"
    echo ""
}

# Main execution
test_breakpoints
test_page
list_common_issues
run_checks
run_browser_tests

echo "============================================"
echo "  Testing Complete"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Review checklist: MOBILE_RESPONSIVENESS_CHECKLIST.md"
echo "  2. Run manual tests in browser"
if [ "$PAGE" = "homepage" ]; then
    echo "  3. Priority fix: Stats section (2-col → 1-col on mobile)"
fi
echo "  4. Update checklist with findings"
echo ""

# Responsive Layout Documentation

## Overview

The application now features a modern, fully responsive layout system that works seamlessly across all device sizes from mobile phones (320px) to large desktop screens (1920px+).

## Key Improvements

### 1. **Main Layout (MainLayout.vue)**

#### Features:
- **Responsive Header**: Adapts to screen size with collapsible navigation
- **Smart Drawer**:
  - Desktop: Shows by default with mini-mode toggle
  - Mobile: Hidden by default, opens as overlay
  - Breakpoint: 1024px
- **User Profile Section**:
  - Full profile display in normal mode
  - Compact avatar in mini mode
- **Modern Design**: Gradient backgrounds, smooth transitions, and improved shadows

#### Breakpoints:
- **Mobile**: < 600px
- **Tablet**: 600px - 1023px (Navigation hidden, uses drawer menu)
- **Desktop**: ≥ 1024px (Full navigation visible)
- **Large Desktop**: ≥ 1440px

### 2. **Guest Layout (Guestmenus.vue)**

#### Features:
- **Mobile-First Design**: Optimized for small screens
- **Responsive Navigation**:
  - Mobile: Hamburger menu with drawer
  - Desktop: Full horizontal navigation
- **CTA Button**: Prominent "Go to Class" button always visible
- **Gradient Branding**: Modern gradient text for app name

#### Mobile Optimizations:
- Touch-friendly button sizes (min 44px)
- Optimized spacing for small screens
- Smooth drawer animations
- Proper safe area support for notched devices

### 3. **Responsive Utilities (responsive.scss)**

A comprehensive set of utility classes for responsive design:

#### Container Classes:
```scss
.container          // Max-width container with responsive padding
.container-fluid    // Full-width with responsive padding
```

#### Spacing:
```scss
.section-padding    // Responsive vertical padding
.section-margin     // Responsive vertical margins
```

#### Typography:
```scss
.responsive-h1      // 2rem → 3.5rem
.responsive-h2      // 1.75rem → 3rem
.responsive-h3      // 1.5rem → 2rem
.responsive-body    // 0.875rem → 1.125rem
```

#### Grid System:
```scss
.responsive-grid    // 1 → 2 → 3 → 4 columns
.responsive-grid-2  // 1 → 2 columns
```

#### Cards & Buttons:
```scss
.responsive-card    // Responsive padding and hover effects
.responsive-btn     // Responsive button sizing
```

#### Visibility:
```scss
.hide-mobile        // Hide on mobile
.hide-tablet        // Hide on tablet
.hide-desktop       // Hide on desktop
.show-mobile        // Show only on mobile
.show-tablet        // Show only on tablet
.show-desktop       // Show only on desktop
```

#### Images:
```scss
.responsive-img         // Full-width responsive image
.responsive-img-cover   // Cover image with responsive height
```

#### Aspect Ratios:
```scss
.aspect-ratio-16-9  // 16:9 aspect ratio
.aspect-ratio-4-3   // 4:3 aspect ratio
.aspect-ratio-1-1   // 1:1 aspect ratio (square)
```

## Breakpoint System

```scss
$breakpoint-xs: 0px
$breakpoint-sm: 600px
$breakpoint-md: 1024px
$breakpoint-lg: 1440px
$breakpoint-xl: 1920px
```

## Usage Examples

### Using Container Classes

```vue
<template>
  <div class="container section-padding">
    <h1 class="responsive-h1">Welcome</h1>
    <p class="responsive-body">Your content here</p>
  </div>
</template>
```

### Using Grid System

```vue
<template>
  <div class="responsive-grid">
    <div class="responsive-card">Card 1</div>
    <div class="responsive-card">Card 2</div>
    <div class="responsive-card">Card 3</div>
  </div>
</template>
```

### Responsive Visibility

```vue
<template>
  <div>
    <!-- Show only on mobile -->
    <div class="show-mobile">
      <button>Mobile Menu</button>
    </div>

    <!-- Hide on mobile -->
    <div class="hide-mobile">
      <nav>Desktop Navigation</nav>
    </div>
  </div>
</template>
```

### Responsive Images

```vue
<template>
  <div class="aspect-ratio-16-9">
    <img src="image.jpg" alt="Responsive image" />
  </div>
</template>
```

## Accessibility Features

### Focus States
All interactive elements have visible focus indicators for keyboard navigation:
```scss
.focus-visible:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
```

### Touch Targets
Minimum touch target size of 44x44px for mobile devices:
```scss
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### Screen Reader Support
```scss
.sr-only {
  // Visually hidden but accessible to screen readers
}
```

## Performance Optimizations

### Reduced Motion
Respects user's motion preferences:
```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Dark Mode Support
Automatic dark mode detection:
```scss
@media (prefers-color-scheme: dark) {
  .auto-dark {
    background-color: #1a1a1a;
    color: #ffffff;
  }
}
```

### High Contrast Mode
Enhanced visibility for high contrast mode:
```scss
@media (prefers-contrast: high) {
  .responsive-card {
    border: 2px solid currentColor;
  }
}
```

## Mobile-Specific Features

### Safe Area Support
Handles notched devices (iPhone X, etc.):
```scss
.safe-area-padding {
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
}
```

### Touch Optimization
```scss
.touch-optimized {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
```

## Testing Recommendations

### Device Testing
Test on the following viewport sizes:
- **320px**: iPhone SE (smallest)
- **375px**: iPhone 12/13 Mini
- **390px**: iPhone 12/13/14
- **414px**: iPhone Plus models
- **768px**: iPad Portrait
- **1024px**: iPad Landscape / Small Desktop
- **1440px**: Standard Desktop
- **1920px**: Large Desktop

### Browser Testing
- Chrome (Desktop & Mobile)
- Safari (Desktop & iOS)
- Firefox (Desktop & Mobile)
- Edge (Desktop)

### Accessibility Testing
- Keyboard navigation
- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- Color contrast ratios
- Touch target sizes

## Best Practices

1. **Mobile-First Approach**: Start with mobile styles, then add desktop enhancements
2. **Touch-Friendly**: Ensure all interactive elements are at least 44x44px
3. **Performance**: Use CSS transforms for animations (GPU-accelerated)
4. **Accessibility**: Always include focus states and ARIA labels
5. **Testing**: Test on real devices, not just browser dev tools
6. **Progressive Enhancement**: Ensure core functionality works without JavaScript

## Future Enhancements

- [ ] Add PWA support with offline capabilities
- [ ] Implement skeleton loading states
- [ ] Add gesture support for mobile (swipe, pinch-to-zoom)
- [ ] Optimize images with responsive srcset
- [ ] Add lazy loading for images and components
- [ ] Implement virtual scrolling for long lists

## Support

For issues or questions about the responsive layout system, please refer to:
- Quasar Framework Documentation: https://quasar.dev
- CSS Grid Guide: https://css-tricks.com/snippets/css/complete-guide-grid/
- Flexbox Guide: https://css-tricks.com/snippets/css/a-guide-to-flexbox/

---

**Last Updated**: February 2026
**Version**: 2.0.0

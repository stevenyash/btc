<template>
  <q-header elevated class="bg-white text-dark shadow-2">
    <q-toolbar class="header-toolbar">
      <!-- Mobile menu button -->
      <q-btn
        flat
        dense
        round
        icon="menu"
        aria-label="Menu"
        @click="toggleDrawer"
        class="lt-md mobile-menu-btn"
      />

      <!-- App Name/Logo -->
      <div class="app-name-container">
        <q-btn
          no-caps
          flat
          to="/home"
          class="app-name-btn"
        >
          <div class="app-name-text">
            {{ $appName }}
          </div>
        </q-btn>
      </div>

      <!-- Desktop Navigation -->
      <div class="gt-md desktop-navigation">
        <div class="nav-links">
          <template v-for="(menu, index) in topNavMenus" :key="`topnav-${index}`">
            <q-btn
              flat
              :to="menu.path"
              no-caps
              class="nav-link"
            >
              <q-icon :name="menu.icon" class="q-mr-xs" size="sm" />
              <span>{{ menu.label }}</span>
            </q-btn>
          </template>
        </div>

        <div class="nav-actions">
          <q-btn
            no-caps
            flat
            to="/customlogin"
            class="login-btn"
          >
            <q-icon name="login" class="q-mr-xs" size="sm" />
            <span>Login</span>
          </q-btn>

          <q-btn
            unelevated
            color="secondary"
            to="/viewlessons"
            class="cta-btn"
          >
            <q-icon name="school" class="q-mr-xs" />
            <span>Go to Class</span>
          </q-btn>
        </div>
      </div>

      <!-- Mobile CTA -->
      <q-btn
        unelevated
        color="secondary"
        to="/viewlessons"
        class="lt-sm mobile-cta"
        no-caps
      >
        <q-icon name="school" size="sm" />
        <span class="q-ml-xs">Class</span>
      </q-btn>
    </q-toolbar>

    <!-- Mobile Drawer Navigation -->
    <q-drawer
      v-model="drawer"
      side="left"
      overlay
      bordered
      :width="280"
      class="lt-md mobile-drawer"
    >
      <q-scroll-area class="fit">
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="app-name-text-drawer">
            {{ $appName }}
          </div>
          <q-btn
            flat
            dense
            round
            icon="close"
            @click="drawer = false"
            class="close-drawer-btn"
          />
        </div>

        <q-separator />

        <!-- Navigation Menu -->
        <q-list padding>
          <template v-for="(menu, index) in sideNavMenus" :key="`sidenav-${index}`">
            <q-item
              clickable
              v-ripple
              :to="menu.path"
              @click="drawer = false"
              class="drawer-menu-item"
            >
              <q-item-section avatar>
                <q-icon :name="menu.icon" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ menu.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <q-separator class="q-my-md" />

          <q-item
            clickable
            v-ripple
            to="/customlogin"
            @click="drawer = false"
            class="drawer-menu-item login-item"
          >
            <q-item-section avatar>
              <q-icon name="login" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">Login</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            to="/viewlessons"
            @click="drawer = false"
            class="drawer-menu-item cta-item"
          >
            <q-item-section avatar>
              <q-icon name="school" color="secondary" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold text-secondary">
                Go to Class
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>
  </q-header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { PUBLIC_MENUS } from 'src/composables/menus';

const drawer = ref(false);

const topNavMenus = computed(() => PUBLIC_MENUS.topNav);
const sideNavMenus = computed(() => PUBLIC_MENUS.sideNav);

const toggleDrawer = () => {
  drawer.value = !drawer.value;
};
</script>

<style scoped lang="scss">
/* Header Toolbar */
.header-toolbar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  min-height: 64px;
  gap: 12px;
}

/* Mobile Menu Button */
.mobile-menu-btn {
  flex-shrink: 0;
  margin-right: 4px;
}

/* App Name Container */
.app-name-container {
  flex-shrink: 0;
}

.app-name-btn {
  padding: 8px 12px;
}

.app-name-text {
  font-size: 1.5rem;
  font-weight: 700;
  white-space: nowrap;
  background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Desktop Navigation */
.desktop-navigation {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-left: 24px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-link {
  padding: 8px 16px;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.nav-link:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.login-btn {
  padding: 8px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.cta-btn {
  padding: 8px 24px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Mobile CTA */
.mobile-cta {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Mobile Drawer */
.mobile-drawer {
  background: #fafafa;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px;
  background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%);
  color: white;
}

.app-name-text-drawer {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.close-drawer-btn {
  color: white;
}

.drawer-menu-item {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s ease;
}

.drawer-menu-item:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: translateX(4px);
}

.login-item {
  background: rgba(var(--q-primary-rgb), 0.1);
}

.cta-item {
  background: rgba(var(--q-secondary-rgb), 0.1);
}

/* Responsive Breakpoints */

/* Tablets and Medium Screens */
@media (max-width: 1023px) {
  .app-name-text {
    font-size: 1.35rem;
  }

  .header-toolbar {
    padding: 10px 12px;
    min-height: 56px;
  }

  /* Hide desktop navigation on tablets to prevent overflow */
  .desktop-navigation {
    display: none !important;
  }
}

/* Mobile Devices */
@media (max-width: 599px) {
  .app-name-text {
    font-size: 1.2rem;
  }

  .header-toolbar {
    padding: 8px;
    gap: 8px;
  }

  .mobile-menu-btn {
    margin-right: 0;
  }

  .mobile-cta {
    padding: 6px 12px;
  }
}

/* Small Mobile Devices */
@media (max-width: 399px) {
  .app-name-text {
    font-size: 1.05rem;
  }

  .mobile-menu-btn {
    min-width: 36px;
    width: 36px;
  }

  .mobile-cta {
    padding: 6px 10px;
    min-width: 70px;
  }

  .mobile-cta span {
    font-size: 0.85rem;
  }

  .mobile-cta .q-icon {
    font-size: 16px;
  }
}

/* Extra Small Mobile Devices */
@media (max-width: 359px) {
  .app-name-text {
    font-size: 0.95rem;
    letter-spacing: -0.3px;
  }

  .mobile-menu-btn {
    min-width: 34px;
    width: 34px;
  }

  .mobile-cta {
    padding: 5px 8px;
    min-width: 65px;
  }

  .mobile-cta span {
    font-size: 0.8rem;
  }

  .mobile-cta .q-icon {
    font-size: 14px;
  }
}

/* Ultra Small Devices */
@media (max-width: 320px) {
  .app-name-text {
    font-size: 0.9rem;
    letter-spacing: -0.4px;
  }

  .header-toolbar {
    padding: 6px;
    gap: 6px;
  }

  .mobile-menu-btn {
    min-width: 32px;
    width: 32px;
  }

  .mobile-cta {
    padding: 4px 6px;
    min-width: 60px;
  }

  .mobile-cta span {
    font-size: 0.75rem;
  }

  .mobile-cta .q-icon {
    font-size: 13px;
  }
}

/* Desktop Screens - Show navigation */
@media (min-width: 1024px) {
  .desktop-navigation {
    display: flex !important;
    flex: 3;
  }

  .app-name-container {
    flex: 1;
  }
}

/* Desktop Large Screens */
@media (min-width: 1440px) {
  .app-name-text {
    font-size: 1.75rem;
  }

  .header-toolbar {
    padding: 12px 24px;
  }

  .desktop-navigation {
    margin-left: 32px;
  }

  .nav-link {
    padding: 10px 20px;
  }

  .cta-btn {
    padding: 10px 28px;
  }
}

/* Ensure smooth transitions */
.nav-link,
.login-btn,
.cta-btn,
.mobile-cta,
.drawer-menu-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Accessibility improvements */
.nav-link:focus,
.login-btn:focus,
.cta-btn:focus,
.mobile-cta:focus,
.drawer-menu-item:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .header-toolbar {
    display: none;
  }
}
</style>

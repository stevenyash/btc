<template>
    <q-layout view="hHh LpR lfr">
        <template v-if="auth.isLoggedIn">
            <!-- App header -->
            <q-header elevated class="bg-white text-dark shadow-2">
                <q-toolbar class="header-toolbar">
                    <!-- Mobile menu button -->
                    <q-btn
                        flat
                        dense
                        round
                        icon="menu"
                        aria-label="Menu"
                        @click="toggleLeftDrawer"
                        class="menu-toggle-btn"
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

                    <!-- Desktop Navigation - Top Left Menus -->
                    <div class="gt-md desktop-nav-left">
                        <template
                            v-for="(menu, index) in navbarTopLeft"
                            :key="`topleftmenubtn-${index}`"
                        >
                            <q-btn
                                no-caps
                                :icon="menu.icon"
                                flat
                                :label="menu.label"
                                :to="menu.path"
                                v-if="!menu.submenu.length"
                                class="nav-btn"
                            />
                            <q-btn-dropdown
                                no-caps
                                :icon="menu.icon"
                                flat
                                :label="menu.label"
                                v-else
                                class="nav-btn"
                            >
                                <q-list dense>
                                    <q-item
                                        v-for="(submenu, subindex) in menu.submenu"
                                        :key="`topleftsubmenu-${subindex}`"
                                        clickable
                                        v-ripple
                                        :to="submenu.path"
                                    >
                                        <q-item-section avatar v-if="submenu.icon">
                                            <q-icon :name="submenu.icon" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>{{ submenu.label }}</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-btn-dropdown>
                        </template>
                    </div>

                    <q-space />

                    <!-- Desktop Navigation - Top Right Menus -->
                    <div class="gt-md desktop-nav-right">
                        <template
                            v-for="(menu, index) in navbarTopRight"
                            :key="`toprightmenu-${index}`"
                        >
                            <q-btn
                                no-caps
                                :icon="menu.icon"
                                flat
                                :label="menu.label"
                                :to="menu.path"
                                v-if="!menu.submenu.length"
                                class="nav-btn"
                            />
                            <q-btn-dropdown
                                no-caps
                                :icon="menu.icon"
                                flat
                                :label="menu.label"
                                v-else
                                class="nav-btn"
                            >
                                <q-list dense>
                                    <q-item
                                        v-for="(submenu, subindex) in menu.submenu"
                                        :key="`toprightsubmenu-${subindex}`"
                                        clickable
                                        v-ripple
                                        :to="submenu.path"
                                    >
                                        <q-item-section avatar v-if="submenu.icon">
                                            <q-icon :name="submenu.icon" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label>{{ submenu.label }}</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-btn-dropdown>
                        </template>
                    </div>

                    <!-- User Account Dropdown -->
                    <q-btn-dropdown
                        no-caps
                        flat
                        dense
                        icon="account_circle"
                        class="user-menu-btn"
                    >
                        <q-list dense style="min-width: 200px">
                            <q-item class="user-info-item">
                                <q-item-section>
                                    <q-item-label class="text-weight-bold text-capitalize">
                                        {{ $auth.userName }}
                                    </q-item-label>
                                    <q-item-label caption v-if="$auth.userRole" class="text-capitalize">
                                        {{ $auth.userRole }}
                                    </q-item-label>
                                </q-item-section>
                            </q-item>
                            <q-separator />
                            <q-item clickable v-ripple to="/account">
                                <q-item-section avatar>
                                    <q-icon name="account_box" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label>My Account</q-item-label>
                                </q-item-section>
                            </q-item>
                            <q-item clickable v-ripple @click="Changeusercode()">
                                <q-item-section avatar>
                                    <q-icon name="lock" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label>Change usercode</q-item-label>
                                </q-item-section>
                            </q-item>
                            <q-separator />
                            <q-item clickable v-ripple @click="startLogout()">
                                <q-item-section avatar>
                                    <q-icon name="exit_to_app" color="negative" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label class="text-negative">Logout</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-btn-dropdown>
                </q-toolbar>
            </q-header>

            <!-- App left drawer -->
            <q-drawer
                v-model="leftDrawer"
                show-if-above
                :width="260"
                :breakpoint="1024"
                bordered
                :mini="leftDrawerMini"
                :mini-width="70"
                class="app-drawer"
            >
                <q-scroll-area class="fit">
                    <!-- User Profile Section -->
                    <div class="user-profile-section" v-show="!leftDrawerMini">
                        <q-img
                            class="user-avatar"
                            :ratio="1"
                            :src="$utils.setImgUrl($auth.userPhoto, 'medium')"
                        >
                            <template v-slot:error>
                                <div class="absolute-full flex flex-center bg-grey-3 text-grey-8">
                                    <q-icon name="account_circle" size="80px" />
                                </div>
                            </template>
                        </q-img>
                        <div class="user-info">
                            <div class="text-h6 text-weight-bold text-capitalize">
                                {{ $auth.userName }}
                            </div>
                            <div v-if="$auth.userRole" class="text-caption text-grey-7 text-capitalize">
                                {{ $auth.userRole }}
                            </div>
                        </div>
                    </div>

                    <!-- Mini mode user icon -->
                    <div v-show="leftDrawerMini" class="mini-user-icon">
                        <q-avatar size="40px" color="primary" text-color="white">
                            <q-img :src="$utils.setImgUrl($auth.userPhoto, 'small')">
                                <template v-slot:error>
                                    <q-icon name="account_circle" />
                                </template>
                            </q-img>
                        </q-avatar>
                    </div>

                    <q-separator class="q-my-md" />

                    <!-- Navigation Menu -->
                    <q-list padding>
                        <template
                            v-for="(menu, index) in navbarSideLeft"
                            :key="`sideleftmenu-${index}`"
                        >
                            <q-item
                                exact
                                clickable
                                v-ripple
                                :to="menu.path"
                                v-if="!menu.submenu.length"
                                class="menu-item"
                            >
                                <q-item-section avatar>
                                    <q-icon
                                        :color="menu.iconcolor || 'primary'"
                                        :name="menu.icon"
                                    />
                                    <q-tooltip
                                        v-if="leftDrawerMini"
                                        anchor="center right"
                                        self="center left"
                                        :offset="[10, 0]"
                                    >
                                        {{ menu.label }}
                                    </q-tooltip>
                                </q-item-section>
                                <q-item-section>
                                    {{ menu.label }}
                                </q-item-section>
                            </q-item>

                            <q-expansion-item
                                expand-separator
                                :content-inset-level="0.5"
                                group="leftmenu"
                                v-else
                                class="menu-expansion"
                            >
                                <template v-slot:header>
                                    <q-item-section avatar>
                                        <q-icon
                                            :color="menu.iconcolor || 'primary'"
                                            :name="menu.icon"
                                        />
                                        <q-tooltip
                                            v-if="leftDrawerMini"
                                            anchor="center right"
                                            self="center left"
                                            :offset="[10, 0]"
                                        >
                                            {{ menu.label }}
                                        </q-tooltip>
                                    </q-item-section>
                                    <q-item-section>
                                        {{ menu.label }}
                                    </q-item-section>
                                </template>
                                <q-list>
                                    <q-item
                                        exact
                                        :to="submenu.path"
                                        clickable
                                        v-ripple
                                        v-for="(submenu, subindex) in menu.submenu"
                                        :key="`sideleftsubmenubtn-${subindex}`"
                                        class="submenu-item"
                                    >
                                        <q-item-section avatar v-if="submenu.icon">
                                            <q-icon
                                                :color="submenu.iconcolor || 'primary'"
                                                :name="submenu.icon"
                                                size="sm"
                                            />
                                        </q-item-section>
                                        <q-item-section>
                                            {{ submenu.label }}
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-expansion-item>
                        </template>
                    </q-list>

                    <!-- Drawer Toggle Button -->
                    <div class="drawer-toggle-container gt-md" v-show="!leftDrawerMini">
                        <q-btn
                            flat
                            dense
                            round
                            icon="chevron_left"
                            @click="leftDrawerMini = true"
                            class="drawer-toggle-btn"
                        >
                            <q-tooltip>Minimize</q-tooltip>
                        </q-btn>
                    </div>
                </q-scroll-area>
            </q-drawer>
        </template>

        <template v-else>
            <Guestmenus />
        </template>

        <!-- App right drawer -->
        <q-drawer
            :no-swipe-open="!drawerComponentFile"
            side="right"
            v-model="rightDrawer.showDrawer"
            :width="rightDrawer.width"
            :breakpoint="500"
            overlay
            elevated
        >
            <component
                v-if="rightDrawer.showDrawer"
                is-sub-page
                :is="drawerComponentFile"
                :api-path="rightDrawer.pageUrl"
                :page-data="rightDrawer.pageData"
            />

            <q-btn
                class="close-drawer-btn"
                unelevated
                dense
                round
                color="grey-1"
                text-color="grey"
                icon="close"
                @click="rightDrawer.showDrawer = false"
            />
        </q-drawer>

        <!-- App layout container -->
        <q-page-container class="page-container">
            <router-view />
        </q-page-container>

        <!-- Footer -->
        <q-footer elevated class="app-footer">
            <MainFooter />
        </q-footer>

        <!-- Change usercode Dialog -->
        <q-dialog v-model="changepwd">
            <q-card style="min-width: 400px; max-width: 90vw">
                <Changeusercode />
            </q-card>
        </q-dialog>

        <!-- Page display dialog -->
        <q-dialog
            :seamless="pageDialog.seamless"
            :maximized="pageDialog.maximized"
            :persistent="pageDialog.persistent"
            :position="pageDialog.position"
            v-model="pageDialog.showDialog"
        >
            <q-card
                class="q-pa-md"
                :style="{
                    width: pageDialog.width,
                    maxWidth: pageDialog.maxWidth,
                }"
            >
                <component
                    v-if="pageDialog.showDialog"
                    is-sub-page
                    :is="dialogComponentFile"
                    :api-path="pageDialog.pageUrl"
                    :page-data="pageDialog.pageData"
                />
                <q-btn
                    class="dialog-close-btn"
                    v-if="pageDialog.closeBtn"
                    icon="close"
                    color="grey"
                    flat
                    round
                    dense
                    v-close-popup
                />
            </q-card>
        </q-dialog>

        <!-- Image preview dialog -->
        <q-dialog v-model="imageDialog.showDialog">
            <q-carousel
                transition-prev="scale"
                transition-next="scale"
                swipeable
                animated
                control-type="unelevated"
                control-color="primary"
                v-model="imageDialog.currentSlide"
                :navigation="false"
                :arrows="imageDialog.images.length > 1"
                infinite
                :padding="false"
                height="auto"
                class="bg-dark rounded-borders"
            >
                <q-carousel-slide
                    class="no-padding"
                    v-for="(img, index) in imageDialog.images"
                    :key="index"
                    :name="index"
                >
                    <img style="max-width: 100%; max-height: 100%" :src="img" />
                </q-carousel-slide>
            </q-carousel>
        </q-dialog>

        <!-- Request error dialog -->
        <q-dialog v-model="errorDialog" position="top">
            <q-card style="min-width: 300px; max-width: 95vw">
                <q-card-section class="row items-center align-start">
                    <q-avatar
                        text-color="negative"
                        size="40px"
                        font-size="36px"
                        icon="error"
                    />
                    <div class="q-ml-sm">
                        <div class="text-weight-bold text-negative">
                            Unable to complete request.
                        </div>
                        <q-separator class="q-my-sm" />
                        <div
                            class="text-capitalize"
                            v-for="(msg, index) in pageErrors"
                            :key="index"
                        >
                            {{ msg }}
                        </div>
                    </div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-layout>
</template>

<script setup>
import { defineAsyncComponent, toRefs, computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useApp } from "src/composables/app";
import { useAuth } from "src/composables/auth";
import { useMenus, PUBLIC_MENUS } from "src/composables/menus";
import { useAppStore } from "src/stores/app";
import Guestmenus from "./Guestmenus.vue";
import MainFooter from "./MainFooter.vue";
import Changeusercode from "src/pages/account/changeusercode.vue";

const changepwd = ref(false);

const $q = useQuasar();
const app = useApp();
const auth = useAuth();
const store = useAppStore();
const menus = useMenus();

const {
    pageDialog,
    imageDialog,
    leftDrawer,
    leftDrawerMini,
    rightDrawer,
    pageErrors,
} = toRefs(store);

const dialogComponentFile = computed(() => {
    if (pageDialog.value.showDialog && pageDialog.value.pageComponent) {
        return defineAsyncComponent(() =>
            import(`src/pages/${pageDialog.value.pageComponent}.vue`)
        );
    }
    return null;
});

const drawerComponentFile = computed(() => {
    if (rightDrawer.value.showDrawer && rightDrawer.value.pageComponent) {
        return defineAsyncComponent(() =>
            import(`src/pages/${rightDrawer.value.pageComponent}.vue`)
        );
    }
    return null;
});

const errorDialog = computed({
    get() {
        return pageErrors.value.length > 0;
    },
    set(newValue) {
        pageErrors.value = [];
    },
});

function startLogout() {
    auth.logout();
    location.href = "/";
}

function Changeusercode() {
    changepwd.value = true;
}

function toggleLeftDrawer() {
    if ($q.platform.is.mobile || $q.screen.lt.md) {
        leftDrawer.value = !leftDrawer.value;
        leftDrawerMini.value = false;
    } else {
        if (leftDrawer.value && leftDrawerMini.value) {
            leftDrawerMini.value = false;
        } else if (leftDrawer.value && !leftDrawerMini.value) {
            leftDrawerMini.value = true;
        } else {
            leftDrawer.value = true;
            leftDrawerMini.value = false;
        }
    }
}

// Use permission-aware menu system from useMenus composable
const navbarSideLeft = computed(() => menus.sideMenus.value);
const navbarTopLeft = computed(() => menus.publicMenus.value);
const navbarTopRight = computed(() => menus.topRightMenus.value);

// Initialize drawer state based on screen size
onMounted(() => {
    leftDrawer.value = $q.screen.gt.md;
    leftDrawerMini.value = false;
});
</script>

<style lang="scss" scoped>
/* Header Styles */
.header-toolbar {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    min-height: 64px;
}

.menu-toggle-btn {
    margin-right: 12px;
}

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
}

.desktop-nav-left,
.desktop-nav-right {
    display: flex;
    align-items: center;
    gap: 4px;
}

.nav-btn {
    margin: 0 4px;
}

.user-menu-btn {
    margin-left: 12px;
}

/* Drawer Styles */
.app-drawer {
    background: #fafafa;
}

.user-profile-section {
    padding: 24px 16px;
    text-align: center;
    background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%);
    color: white;
}

.user-avatar {
    width: 100px;
    height: 100px;
    margin: 0 auto 16px;
    border-radius: 50%;
    border: 4px solid rgba(255, 255, 255, 0.3);
    overflow: hidden;
}

.user-info {
    margin-top: 12px;
}

.mini-user-icon {
    display: flex;
    justify-content: center;
    padding: 16px 0;
}

.menu-item,
.submenu-item {
    border-radius: 8px;
    margin: 4px 8px;
    transition: all 0.3s ease;
}

.menu-item:hover,
.submenu-item:hover {
    background: rgba(0, 0, 0, 0.05);
}

.drawer-toggle-container {
    position: absolute;
    bottom: 16px;
    right: 16px;
}

.drawer-toggle-btn {
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Page Container */
.page-container {
    min-height: calc(100vh - 64px - 200px);
    padding-top: 64px;
}

/* Footer */
.app-footer {
    background: var(--q-primary);
    color: white;
    padding: 24px;
}

/* Dialog Styles */
.close-drawer-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1;
}

.dialog-close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
}

.user-info-item {
    background: rgba(0, 0, 0, 0.02);
    margin-bottom: 8px;
}

/* Responsive Styles */
@media (max-width: 1023px) {
    .app-name-text {
        font-size: 1.25rem;
    }

    .header-toolbar {
        padding: 8px 12px;
        min-height: 56px;
    }

    .page-container {
        padding-top: 56px;
    }

    /* Hide desktop navigation on tablets and below to prevent overflow */
    .desktop-nav-left,
    .desktop-nav-right {
        display: none !important;
    }
}

@media (max-width: 599px) {
    .app-name-text {
        font-size: 1.1rem;
    }

    .menu-toggle-btn {
        margin-right: 8px;
    }

    .user-menu-btn {
        margin-left: 8px;
    }

    .header-toolbar {
        padding: 8px;
    }
}

@media (max-width: 399px) {
    .app-name-text {
        font-size: 1rem;
    }
}

/* Ensure desktop navigation only shows on larger screens */
@media (min-width: 1024px) {
    .desktop-nav-left,
    .desktop-nav-right {
        display: flex !important;
    }
}
</style>

<style lang="scss">
/* Global Styles */
body.body--light {
    background: #f5f5f5;
}

.q-item.q-router-link--active,
.q-item--active {
    color: white !important;
    background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%);
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.q-item.q-router-link--active .q-icon,
.q-item--active .q-icon {
    color: white !important;
}

/* Smooth transitions */
.q-drawer,
.q-header,
.q-page-container {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Scrollbar styling */
.q-scrollarea__thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.q-scrollarea__thumb:hover {
    background: rgba(0, 0, 0, 0.3);
}

/* Card improvements */
.q-card {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* Button improvements */
.q-btn {
    text-transform: none;
    font-weight: 500;
}

/* Improved focus states for accessibility */
.q-btn:focus,
.q-item:focus {
    outline: 2px solid var(--q-primary);
    outline-offset: 2px;
}
</style>

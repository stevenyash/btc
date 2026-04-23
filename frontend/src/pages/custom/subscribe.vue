<template>
    <q-page class="main-page q-pb-xl" id="subscription-page">
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <!-- Subscription Status Alert -->
                    <div v-if="isSubscribe" class="col-12 comp-grid">
                        <q-banner class="bg-blue-1 text-blue-10 rounded-borders q-mb-md">
                            <template v-slot:avatar>
                                <q-icon name="info" color="blue-8" />
                            </template>
                            <div class="text-body2 text-body1-md">
                                Dear Customer, you are subscribed to <strong>{{ subscribedpackage.package }}</strong>
                                which expires on <strong>{{ subscribedpackage.expirery_date }}</strong>.
                                You can either extend by purchasing the same package or buy a different one.
                            </div>
                        </q-banner>
                    </div>

                    <!-- Page Header -->
                    <div class="col-12 comp-grid">
                        <div class="page-header q-mb-sm q-mb-md-md">
                            <div class="header-content row items-center q-col-gutter-sm q-px-xs q-px-sm-md">
                                <div class="col-auto">
                                    <q-avatar
                                        class="q-mr-xs q-mr-sm-md"
                                        size="32px"
                                        size-md="40px"
                                        icon="accessibility"
                                        color="primary"
                                        text-color="white"
                                    />
                                </div>
                                <div class="col">
                                    <div class="header-title text-h6 text-h5-md text-bold text-dark">
                                        BTC Affordable & Flexible Packages
                                    </div>
                                    <div class="header-subtitle text-caption text-body2-md text-grey-7">
                                        We value our customers. Thank you.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <q-separator class="q-my-sm q-my-md-md" />
                    </div>

                    <!-- Package Selection -->
                    <div class="col-12 comp-grid" v-if="packageShow">
                        <q-card class="subscription-card nice-shadow-6">
                            <!-- Tabs -->
                            <q-tabs
                                v-model="TabPage388"
                                active-color="primary"
                                indicator-color="primary"
                                align="left"
                                :breakpoint="0"
                                class="tabs-container"
                                :class="{ 'q-tabs--dense': $q.screen.lt.md }"
                            >
                                <q-tab
                                    name="TabPage388Page1"
                                    icon="perm_identity"
                                    label="Individual"
                                    :ripple="false"
                                    class="text-no-wrap"
                                />
                                <q-tab
                                    name="TabPage388Page2"
                                    icon="group"
                                    label="Institutional"
                                    :ripple="false"
                                    class="text-no-wrap"
                                />
                                <q-tab
                                    name="TabPage388Page3"
                                    icon="golf_course"
                                    label="Pay As You Go"
                                    :ripple="false"
                                    class="text-no-wrap"
                                />
                            </q-tabs>

                            <q-separator />

                            <!-- Tab Panels -->
                            <q-tab-panels
                                v-model="TabPage388"
                                animated
                                keep-alive
                                class="tab-panels"
                            >
                                <!-- Individual Subscription -->
                                <q-tab-panel name="TabPage388Page1" class="q-pa-none">
                                    <div class="package-category">
                                        <div class="category-label q-pa-xs q-pa-sm-md bg-light-blue-6 text-white">
                                            <div class="text-subtitle2 text-subtitle1-md text-center text-bold">
                                                Subscribers Only Packages
                                            </div>
                                        </div>
                                        <api-data-source api-path="components_data/subscribe_data_repeater" v-slot="req">
                                            <div class="packages-grid q-pa-sm q-pa-md-md">
                                                <div
                                                    class="row q-col-gutter-md"
                                                    :class="{ 'justify-center': req.response && req.response.length < 2 }"
                                                >
                                                    <div
                                                        v-for="(data, i) in req.response"
                                                        :key="i"
                                                        class="col-12 col-sm-6 col-md-4 col-lg-3"
                                                    >
                                                        <PackageCard
                                                            :data="data"
                                                            :is-current="subscribedpackage?.id == data.id"
                                                            @subscribe="subscribeToProduct"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </api-data-source>
                                    </div>
                                </q-tab-panel>

                                <!-- Institutional Subscription -->
                                <q-tab-panel name="TabPage388Page2" class="q-pa-none">
                                    <div class="package-category">
                                        <div class="category-label q-pa-xs q-pa-sm-md bg-pink-5 text-white">
                                            <div class="text-subtitle2 text-subtitle1-md text-center text-bold">
                                                Home Schooling/School/Institution Packages
                                            </div>
                                        </div>
                                        <api-data-source api-path="components_data/subscribe_data_repeater_2" v-slot="req">
                                            <div class="packages-grid q-pa-sm q-pa-md-md">
                                                <div
                                                    class="row q-col-gutter-md"
                                                    :class="{ 'justify-center': req.response && req.response.length < 2 }"
                                                >
                                                    <div
                                                        v-for="(data, i) in req.response"
                                                        :key="i"
                                                        class="col-12 col-sm-6 col-md-4 col-lg-3"
                                                    >
                                                        <PackageCard
                                                            :data="data"
                                                            :is-current="subscribedpackage?.id == data.id"
                                                            @subscribe="subscribeToProduct"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </api-data-source>
                                    </div>
                                </q-tab-panel>

                                <!-- Pay As You Go -->
                                <q-tab-panel name="TabPage388Page3" class="q-pa-none">
                                    <div class="package-category">
                                        <div class="category-label q-pa-xs q-pa-sm-md bg-indigo-9 text-white">
                                            <div class="text-subtitle2 text-subtitle1-md text-center text-bold">
                                                Pay As You Go Packages
                                            </div>
                                        </div>
                                        <api-data-source api-path="components_data/subscribe_data_repeater_3" v-slot="req">
                                            <div class="packages-grid q-pa-sm q-pa-md-md">
                                                <div
                                                    class="row q-col-gutter-md"
                                                    :class="{ 'justify-center': req.response && req.response.length < 2 }"
                                                >
                                                    <div
                                                        v-for="(data, i) in req.response"
                                                        :key="i"
                                                        class="col-12 col-sm-6 col-md-4 col-lg-3"
                                                    >
                                                        <PackageCard
                                                            :data="data"
                                                            :is-current="false"
                                                            @subscribe="subscribeToProduct"
                                                            button-label="Pay Now"
                                                            button-color="yellow"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </api-data-source>
                                    </div>
                                </q-tab-panel>
                            </q-tab-panels>
                        </q-card>
                    </div>

                    <!-- User Registration Form -->
                    <div class="col-12 comp-grid" v-if="promptReg">
                        <div class="registration-section">
                            <q-card class="registration-card nice-shadow-4">
                                <q-card-section class="q-pa-sm q-pa-md-md">
                                    <div class="text-h6 text-h5-md text-bold q-mb-sm q-mb-md-md">
                                        Complete Your Registration
                                    </div>
                                    <p class="text-body2 text-grey-7">
                                        Please fill in your details to continue with the subscription.
                                    </p>
                                </q-card-section>
                                <q-card-section class="q-pa-sm q-pa-md-md">
                                    <subscribeuser-users-page
                                        ref="usersAddPage"
                                        @complete="userAdded"
                                        :show-header="false"
                                        :redirect="false"
                                        is-sub-page
                                    />
                                </q-card-section>
                            </q-card>
                        </div>
                    </div>

                    <!-- Mpesa Payment Component -->
                    <div class="col-12 comp-grid" v-if="showMpesaPrompt">
                        <div class="payment-section">
                            <q-card class="payment-card nice-shadow-5">
                                <q-card-section class="q-pa-sm q-pa-md-md">
                                    <div class="text-h6 text-h5-md text-bold q-mb-sm q-mb-md-md">
                                        Complete Payment
                                    </div>
                                    <p class="text-body2 text-grey-7 q-mb-md">
                                        Enter your M-Pesa phone number to proceed with the payment of
                                        <strong class="text-primary">Ksh {{ formData.amount }}</strong>
                                    </p>
                                    <MpesaPayment
                                        :phoneNumber="formData.phone_number"
                                        :amount="formData.amount"
                                        @insertTransaction="insertTransaction"
                                        :callback_Url="'components_data/callback'"
                                        @processSubscription="processMemberSubscription"
                                    />
                                    <q-btn
                                        label="Cancel"
                                        color="grey"
                                        outline
                                        @click="showMpesaPrompt = false"
                                        class="q-mt-sm q-mt-md-md"
                                        size="sm"
                                        size-md="md"
                                    />
                                </q-card-section>
                            </q-card>
                        </div>
                    </div>

                    <!-- Login Dialog -->
                    <div class="col-12 comp-grid">
                        <q-dialog v-model="startLogin" persistent :maximized="$q.screen.lt.sm">
                            <q-card class="login-dialog-card" :style="dialogStyle">
                                <Login class="q-pa-sm q-pa-md-md" />
                                <q-card-actions align="right" class="q-pa-sm q-pa-md-md">
                                    <q-btn
                                        label="Cancel"
                                        color="grey"
                                        @click="startLogin = false"
                                        flat
                                    />
                                </q-card-actions>
                            </q-card>
                        </q-dialog>
                    </div>
                </div>
            </div>
        </section>
    </q-page>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue';
import { utils } from 'src/utils';
import { ApiService } from 'src/services/api';
import { useApp } from 'src/composables/app.js';
import { useAuth } from 'src/composables/auth';
import subscribeuserUsersPage from "../users/subscribeuser.vue";
import Login from "src/pages/index/login.vue"
import MpesaPayment from 'src/components/MpesaPayment.vue';
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
    pageName: {
        type: String,
        default: 'home',
    },
    routeName: {
        type: String,
        default: 'home',
    },
    isSubPage: {
        type: Boolean,
        default: false,
    },
});

// Components
const PackageCard = {
    props: ['data', 'isCurrent', 'buttonLabel', 'buttonColor'],
    emits: ['subscribe'],
    template: `
        <q-card class="package-card nice-shadow-2 hover-card">
            <q-card-section class="package-header q-pa-sm q-pa-md-md">
                <div class="text-h6 text-h5-md text-center text-primary text-bold">
                    {{ data.name }}
                </div>
                <div class="text-subtitle2 text-subtitle1-md text-center text-grey-7">
                    {{ data.label }}
                </div>
            </q-card-section>

            <q-card-section class="package-description q-pa-sm q-pa-md-md">
                <div class="text-body2 text-justify line-clamp-3">
                    {{ data.description }}
                </div>
            </q-card-section>

            <q-card-section class="package-price q-pa-sm q-pa-md-md">
                <div class="text-h5 text-h4-md text-bold text-primary text-center">
                    Ksh {{ data.fee }}
                </div>
                <div class="text-subtitle2 text-center q-mt-xs">
                    Duration: {{ data.duration_amount || data.duration }} {{ data.duration_unit || '' }}
                </div>
            </q-card-section>

            <q-card-actions align="center" class="package-actions q-pa-sm q-pa-md-md">
                <q-btn
                    :color="isCurrent ? 'warning' : (buttonColor || 'positive')"
                    :label="isCurrent ? 'Extend' : (buttonLabel || 'Subscribe')"
                    icon="add_shopping_cart"
                    @click="$emit('subscribe', data)"
                    class="full-width action-btn"
                    unelevated
                    no-caps
                    size="sm"
                    size-md="md"
                />
                <div v-if="isCurrent" class="current-package-badge text-caption text-center q-mt-xs text-grey-7">
                    Currently Active
                </div>
            </q-card-actions>
        </q-card>
    `
};

// Quasar and Router Instances
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const app = useApp();
const auth = useAuth();

// Reactive States
const packageShow = ref(true);
const promptPayment = ref(false);
const promptReg = ref(false);
const showMpesaPrompt = ref(false);
const packageId = ref(0);
const paymentId = ref();
const isLoading = ref(false);
const userData = ref({});
const loginErrorMsg = ref(false);
const username = ref('guest');
const usercode = ref('guest');
const startLogin = ref(false);
const isSubscribe = ref(false);
const subscribedpackage = ref();
const TabPage388 = ref('TabPage388Page1');

// Reactive Form Data
const formData = reactive({
    user_id: 0,
    phone_number: "",
    amount: "",
    transaction_reference: "NULL",
    checkout_request_id: "NULL",
    status: "",
    description: "subscription",
    response_code: "NULL",
    response_description: "",
    transactiondate: new Date(),
    package_id: "",
});

// Computed Properties
const dialogStyle = computed(() => ({
    width: $q.screen.lt.sm ? '100%' : '500px',
    maxWidth: $q.screen.lt.sm ? '100%' : '90vw',
    borderRadius: $q.screen.lt.sm ? '0' : '8px',
}));

// Methods
onMounted(() => {
    checksubscription();
});

const subscribeToProduct = (data) => {
    if (!auth.isLoggedIn || auth.isGuest) {
        subscribe(data);
    } else {
        packageShow.value = false;
        formData.user_id = auth.userId;
        formData.phone_number = auth.user?.phone || "";
        packageId.value = data.id;
        formData.package_id = data.id;
        formData.amount = data.fee * 1;
        showMpesaPrompt.value = true;
    }
};

const subscribe = (data) => {
    packageShow.value = false;
    packageId.value = data.id;
    formData.package_id = data.id;
    formData.amount = data.fee * 1;

    if (data.subscription_type === 2) {
        promptPayment.value = true;
    } else {
        promptReg.value = true;
    }
};

const userAdded = (data) => {
    username.value = data.phone;
    usercode.value = data.usercode;
    formData.phone_number = data.phone;
    formData.user_id = data.id ?? 0;
    formData.transaction_reference = utils.randomNum();
    showMpesaPrompt.value = true;
    promptReg.value = false;
};

const insertTransaction = async (CheckoutRequestID) => {
    try {
        formData.checkout_request_id = CheckoutRequestID;
        formData.transaction_reference = CheckoutRequestID;
        const response = await ApiService.post("transactions/add", formData);
        paymentId.value = response.data.id;
        if (paymentId.value) {
            pollPaymentStatus();
        }
    } catch (e) {
        console.error("Error during transaction insertion:", e);
        app.flashMsg("Error", "Failed to initiate transaction. Please try again.");
    }
};

const pollPaymentStatus = async (timeout = 30000, interval = 3000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const stopPolling = await checkPaymentStatus();
        if (stopPolling) {
            startLogin.value = auth.isLoggedIn ? false : true;
            break;
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
};

const checkPaymentStatus = async () => {
    try {
        if (!paymentId.value) throw new Error("Payment ID is missing.");
        const response = await ApiService.post("components_data/checkstatus", {
            payment_id: paymentId.value,
        });

        if (response.data.status === "success") {
            return await processMemberSubscription(paymentId.value);
        } else if (response.data.status === "Pending") {
            return false;
        } else {
            app.flashMsg("Error", "Payment failed or is in an unknown state.");
            return true;
        }
    } catch (e) {
        console.error("Error checking payment status:", e.message);
        app.flashMsg("Error", "An error occurred while checking payment status.");
        return true;
    }
};

const processMemberSubscription = async (paymentId) => {
    try {
        isLoading.value = true;
        const response = await ApiService.post("components_data/subscription", {
            transaction_id: paymentId,
        });

        if (response.data.status === "success") {
            app.flashMsg("Success", "Subscription has been successfully added.");
            sessionStorage.setItem("payment_id", "");

            // Reset states
            showMpesaPrompt.value = false;
            packageShow.value = true;

            // Refresh subscription status
            await checksubscription();

            return true;
        } else {
            app.flashMsg("Error", "Failed to process subscription. Please try again.");
            return false;
        }
    } catch (error) {
        console.error("Error while processing subscription:", error.message);
        app.flashMsg("Error", "An error occurred while processing subscription.");
        return false;
    } finally {
        isLoading.value = false;
    }
};

async function checksubscription() {
    try {
        const response = await ApiService.post("components_data/checksubscription");
        if (response.data.id > 0) {
            isSubscribe.value = true;
            subscribedpackage.value = response.data;
        } else {
            isSubscribe.value = false;
            subscribedpackage.value = null;
        }
    } catch (e) {
        console.error(e);
        isSubscribe.value = false;
    }
}
</script>

<style scoped>
/* Base Styles - Mobile First */
.main-page {
    min-height: 100vh;
    background-color: #f8f9fa;
}

.page-section {
    padding-top: 16px;
}

/* Header */
.page-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
}

.header-content {
    display: flex;
    align-items: center;
}

.header-title {
    color: white;
    line-height: 1.3;
}

.header-subtitle {
    color: rgba(255, 255, 255, 0.9);
}

/* Subscription Card */
.subscription-card {
    border-radius: 12px;
    overflow: hidden;
}

/* Tabs */
.tabs-container {
    background: white;
}

.tabs-container :deep(.q-tab) {
    min-height: 48px;
    padding: 0 12px;
    font-size: 0.875rem;
}

.tabs-container :deep(.q-tab__label) {
    font-weight: 500;
}

/* Package Cards */
.packages-grid {
    min-height: 300px;
}

.package-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid #e0e0e0;
}

.package-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15) !important;
    border-color: var(--q-primary);
}

.package-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
}

.package-description {
    flex-grow: 1;
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
}

.package-price {
    background-color: #f8f9fa;
    border-top: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
}

.package-actions {
    border-top: 1px solid #f0f0f0;
}

.action-btn {
    font-weight: 500;
    letter-spacing: 0.5px;
}

.current-package-badge {
    opacity: 0.8;
}

/* Category Labels */
.category-label {
    border-radius: 8px 8px 0 0;
    margin-bottom: 1px;
}

/* Registration & Payment Cards */
.registration-card,
.payment-card {
    border-radius: 12px;
    margin-bottom: 16px;
}

/* Login Dialog */
.login-dialog-card {
    max-height: 90vh;
    overflow-y: auto;
}

/* Responsive Adjustments */

/* Extra Small Devices (< 375px) */
@media (max-width: 374px) {
    .page-header {
        padding: 12px;
    }

    .header-title {
        font-size: 1.125rem !important;
    }

    .tabs-container :deep(.q-tab) {
        padding: 0 8px;
        font-size: 0.75rem;
        min-height: 44px;
    }

    .tabs-container :deep(.q-tab__icon) {
        font-size: 1rem;
    }

    .category-label .text-subtitle2 {
        font-size: 0.75rem !important;
    }
}

/* Small Devices (375px - 599px) */
@media (min-width: 375px) and (max-width: 599px) {
    .tabs-container :deep(.q-tab) {
        padding: 0 10px;
    }

    .package-card {
        margin-bottom: 16px;
    }
}

/* Mobile Devices (< 600px) */
@media (max-width: 599px) {
    .header-content {
        flex-direction: column;
        text-align: center;
    }

    .header-content .col-auto {
        margin-bottom: 8px;
    }

    .tabs-container {
        overflow-x: auto;
        white-space: nowrap;
    }

    .tabs-container :deep(.q-tabs__content) {
        flex-wrap: nowrap;
    }

    .packages-grid .row {
        flex-direction: column;
    }

    .package-card {
        margin-bottom: 16px;
    }

    .login-dialog-card {
        border-radius: 0;
        height: 100vh;
        max-height: 100vh;
    }
}

/* Tablets (600px - 767px) */
@media (min-width: 600px) and (max-width: 767px) {
    .packages-grid .col-sm-6 {
        margin-bottom: 16px;
    }

    .package-card {
        min-height: 320px;
    }
}

/* Tablets (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
    .packages-grid .col-md-4 {
        margin-bottom: 20px;
    }

    .package-card {
        min-height: 340px;
    }

    .tabs-container :deep(.q-tab) {
        min-height: 52px;
        padding: 0 16px;
    }
}

/* Desktop (1024px and up) */
@media (min-width: 1024px) {
    .page-section {
        padding-top: 24px;
    }

    .page-header {
        margin-bottom: 24px;
        padding: 24px;
    }

    .packages-grid .col-lg-3 {
        margin-bottom: 24px;
    }

    .package-card {
        min-height: 360px;
    }

    .tabs-container :deep(.q-tab) {
        min-height: 56px;
        padding: 0 24px;
        font-size: 1rem;
    }
}

/* Landscape Mode */
@media (max-width: 1023px) and (orientation: landscape) {
    .main-page {
        min-height: auto;
    }

    .package-card {
        min-height: 280px;
    }

    .login-dialog-card {
        height: 100vh;
    }
}

/* High DPI Screens */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .package-card {
        border-width: 0.5px;
    }
}

/* Safe Area Support */
@supports (padding: max(0px)) {
    .page-section {
        padding-left: max(16px, env(safe-area-inset-left));
        padding-right: max(16px, env(safe-area-inset-right));
    }

    .page-header {
        margin-left: max(0px, env(safe-area-inset-left) * -1);
        margin-right: max(0px, env(safe-area-inset-right) * -1);
        border-radius: 0;
        padding-left: max(16px, env(safe-area-inset-left));
        padding-right: max(16px, env(safe-area-inset-right));
    }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
    .package-card {
        transition: none;
    }

    .package-card:hover {
        transform: none;
    }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
    .main-page {
        background-color: #121212;
    }

    .subscription-card,
    .package-card,
    .registration-card,
    .payment-card {
        background-color: #1e1e1e;
        border-color: #333;
    }

    .package-header,
    .package-price {
        background-color: #2d2d2d;
        border-color: #333;
    }

    .header-title {
        color: white;
    }

    .header-subtitle {
        color: rgba(255, 255, 255, 0.7);
    }

    .text-grey-7 {
        color: rgba(255, 255, 255, 0.7) !important;
    }
}

/* Loading States */
.loading-state {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Empty States */
.empty-state {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

/* Ensure buttons are touch-friendly on mobile */
@media (max-width: 600px) {
    .action-btn,
    .q-btn {
        min-height: 44px;
        min-width: 44px;
    }

    .package-actions .q-btn {
        font-size: 0.875rem;
        padding: 8px 16px;
    }
}

/* Improve scrolling on mobile */
@media (max-width: 767px) {
    .tabs-container {
        -webkit-overflow-scrolling: touch;
    }
}
</style>

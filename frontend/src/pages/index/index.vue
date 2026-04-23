<template>
    <q-page class="main-page" id="index-page">
        <!-- Hero Section -->
        <section class="page-section q-mb-sm q-pt-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div class="col comp-grid">
                        <div class="hero-wrapper">
                            <section class="hero-section">
                                <div class="overlay"></div>
                                <div class="hero-content q-px-md q-py-xl q-px-lg-xl q-py-lg-xl">
                                    <h1 class="hero-title text-h4 text-h3-md text-h2-lg text-white text-center q-mb-sm q-mb-md-md">
                                        Learn Anytime, Anywhere
                                    </h1>
                                    <p class="hero-subtitle text-body1 text-subtitle1-md text-white text-center q-mb-lg">
                                        Join thousands of Kenyan students mastering new skills online
                                    </p>
                                    <div class="hero-buttons row justify-center q-gutter-md q-gutter-lg-md">
                                        <q-btn
                                            color="primary"
                                            glossy
                                            size="md"
                                            size-lg="lg"
                                            label="Get Started"
                                            to="services"
                                            class="col-12 col-sm-auto cta-primary"
                                            no-caps
                                            unelevated
                                        />
                                        <q-btn
                                            outline
                                            color="white"
                                            size="md"
                                            size-lg="lg"
                                            label="Go To Class"
                                            to="viewlessons"
                                            class="col-12 col-sm-auto cta-secondary"
                                            no-caps
                                        />
                                    </div>
                                </div>
                            </section>

                            <!-- Stats Bar -->
                            <div class="stats-bar">
                                <div class="container-fluid">
                                    <div class="row q-col-gutter-md justify-center">
                                        <div class="col-6 col-sm-3 stat-item">
                                            <q-icon name="people" size="32px" color="white" />
                                            <div class="stat-value">10,000+</div>
                                            <div class="stat-label">Students</div>
                                        </div>
                                        <div class="col-6 col-sm-3 stat-item">
                                            <q-icon name="video_library" size="32px" color="white" />
                                            <div class="stat-value">500+</div>
                                            <div class="stat-label">Lessons</div>
                                        </div>
                                        <div class="col-6 col-sm-3 stat-item">
                                            <q-icon name="school" size="32px" color="white" />
                                            <div class="stat-value">50+</div>
                                            <div class="stat-label">Teachers</div>
                                        </div>
                                        <div class="col-6 col-sm-3 stat-item">
                                            <q-icon name="verified" size="32px" color="white" />
                                            <div class="stat-value">95%</div>
                                            <div class="stat-label">Success Rate</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Features Section -->
                            <div class="features-section q-py-xl">
                                <div class="container-fluid">
                                    <div class="text-center q-mb-xl">
                                        <h2 class="text-h5 text-primary text-bold">Why Choose BTC?</h2>
                                        <p class="text-subtitle1 text-grey-7">Everything you need for quality education</p>
                                    </div>
                                    <div class="row q-col-gutter-md justify-center">
                                        <div class="col-12 col-sm-6 col-md-3">
                                            <q-card flat bordered class="feature-card">
                                                <q-card-section class="text-center q-pa-md">
                                                    <q-icon name="schedule" size="48px" color="primary" class="q-mb-md" />
                                                    <div class="text-h6 text-weight-medium">Flexible Learning</div>
                                                    <div class="text-body2 text-grey-7 q-mt-sm">Learn at your own pace, anytime, anywhere</div>
                                                </q-card-section>
                                            </q-card>
                                        </div>
                                        <div class="col-12 col-sm-6 col-md-3">
                                            <q-card flat bordered class="feature-card">
                                                <q-card-section class="text-center q-pa-md">
                                                    <q-icon name="workspace_premium" size="48px" color="secondary" class="q-mb-md" />
                                                    <div class="text-h6 text-weight-medium">Expert Teachers</div>
                                                    <div class="text-body2 text-grey-7 q-mt-sm">Qualified educators with years of experience</div>
                                                </q-card-section>
                                            </q-card>
                                        </div>
                                        <div class="col-12 col-sm-6 col-md-3">
                                            <q-card flat bordered class="feature-card">
                                                <q-card-section class="text-center q-pa-md">
                                                    <q-icon name="savings" size="48px" color="positive" class="q-mb-md" />
                                                    <div class="text-h6 text-weight-medium">Affordable</div>
                                                    <div class="text-body2 text-grey-7 q-mt-sm">Quality education that fits your budget</div>
                                                </q-card-section>
                                            </q-card>
                                        </div>
                                        <div class="col-12 col-sm-6 col-md-3">
                                            <q-card flat bordered class="feature-card">
                                                <q-card-section class="text-center q-pa-md">
                                                    <q-icon name="phone_android" size="48px" color="accent" class="q-mb-md" />
                                                    <div class="text-h6 text-weight-medium">Learn Anywhere</div>
                                                    <div class="text-body2 text-grey-7 q-mt-sm">Access lessons on any device</div>
                                                </q-card-section>
                                            </q-card>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Testimonials -->
                            <div class="testimonials-wrapper q-py-xl">
                                <div class="container-fluid">
                                    <div class="text-center q-mb-xl">
                                        <h2 class="text-h5 text-primary text-bold">What Our Students Say</h2>
                                        <p class="text-subtitle1 text-grey-7">Hear from Kenyan students across the country</p>
                                    </div>
                                    <TestimonialsSection />
                                </div>
                            </div>

                            <!-- FAQ Section -->
                            <div class="faq-section q-py-xl">
                                <div class="container-fluid">
                                    <div class="text-center q-mb-xl">
                                        <h2 class="text-h5 text-primary text-bold">Frequently Asked Questions</h2>
                                    </div>
                                    <div class="row justify-center">
                                        <div class="col-12 col-md-8">
                                            <q-list bordered class="faq-list rounded-borders">
                                                <q-expansion-item
                                                    v-for="(faq, index) in faqs"
                                                    :key="index"
                                                    :label="faq.question"
                                                    :icon="faq.icon"
                                                    header-class="text-weight-medium"
                                                >
                                                    <q-card>
                                                        <q-card-section class="text-body2 text-grey-8">
                                                            {{ faq.answer }}
                                                        </q-card-section>
                                                    </q-card>
                                                </q-expansion-item>
                                            </q-list>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- CTA Section -->
                            <div class="cta-section q-py-xl">
                                <div class="container-fluid">
                                    <q-card flat bordered class="cta-card text-center q-pa-xl">
                                        <h3 class="text-h5 text-bold text-primary">Ready to Start Learning?</h3>
                                        <p class="text-body1 text-grey-7 q-mb-lg">
                                            Subscribe today and unlock unlimited access to all lessons
                                        </p>
                                        <div class="row justify-center q-gutter-md">
                                            <q-btn
                                                color="positive"
                                                icon="shopping_cart"
                                                label="View Packages"
                                                to="subscriptionshow"
                                                size="lg"
                                                no-caps
                                                unelevated
                                            />
                                            <q-btn
                                                outline
                                                color="primary"
                                                icon="contact_mail"
                                                label="Contact Us"
                                                to="contactus"
                                                size="lg"
                                                no-caps
                                            />
                                        </div>
                                    </q-card>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Modal Section -->
        <section class="page-section q-mt-lg">
            <div class="container-fluid background-container">
                <div class="row justify-center q-col-gutter-md">
                    <div class="col-12 comp-grid">
                        <!-- Landing Confirm Dialog -->
                        <q-dialog v-model="landingConfirm" @hide="onDialogHide" :maximized="$q.screen.lt.sm" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
                            <q-card class="q-dialog-plugin q-pa-md-sm q-pa-md-md" :style="dialogStyle">
                                <q-card-section class="text-center q-pa-md-sm q-pa-md-md">
                                    <div class="text-h6 text-subtitle1-sm text-weight-bold q-mb-sm">Do you have a subscription with us?</div>
                                    <p class="text-body2 text-caption-sm q-mb-none">Please select an option below:</p>
                                </q-card-section>

                                <q-card-actions align="center" class="q-pa-md-sm q-pa-md-md column q-gutter-y-sm">
                                    <q-btn
                                        no-caps
                                        color="positive"
                                        label="Yes, Access My Account"
                                        @click="onYesClick"
                                        class="full-width"
                                        :size="$q.screen.lt.sm ? 'md' : 'lg'"
                                        unelevated
                                    />
                                    <q-btn
                                        no-caps
                                        color="primary"
                                        label="No, Subscribe Now"
                                        @click="onNoClick"
                                        class="full-width"
                                        :size="$q.screen.lt.sm ? 'md' : 'lg'"
                                        unelevated
                                    />
                                    <q-btn
                                        no-caps
                                        outline
                                        color="grey-7"
                                        label="Continue as Guest"
                                        @click="onGuestClick"
                                        class="full-width"
                                        :size="$q.screen.lt.sm ? 'md' : 'lg'"
                                    />
                                </q-card-actions>

                                <q-card-section class="text-center">
                                    <q-checkbox v-model="dontShowAgain" label="Don't show this again" dense />
                                </q-card-section>
                            </q-card>
                        </q-dialog>

                        <!-- Login Dialog -->
                        <q-dialog v-model="login" persistent :maximized="$q.screen.lt.sm" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
                            <q-card class="login-dialog" :style="dialogStyle">
                                <Login />
                            </q-card>
                        </q-dialog>
                    </div>
                </div>
            </div>
        </section>
    </q-page>
</template>

<script setup>
import { computed, ref, reactive, watch, onMounted } from 'vue';
import { useApp } from 'src/composables/app';
import { useAuth } from 'src/composables/auth';
import { useRoute, useRouter } from 'vue-router';
import { ApiService } from 'src/services/api';
import Login from "src/pages/index/login.vue"
import { Loading, QSpinnerGears, useQuasar } from 'quasar'
import TestimonialsSection from 'src/components/TestimonialsSection.vue';
import {
    generateFingerprint,
    storeFingerprint,
    retrieveFingerprint,
    clearFingerprint,
    getPlugins,
    getUserAgent,
    getPlatform,
    getScreenResolution,
    getDeviceDetails,
    getIpAddress,
} from "src/fingerprint";

const props = defineProps({
    pageName: {
        type: String,
        default: 'index',
    },
    routeName: {
        type: String,
        default: 'index',
    },
    isSubPage: {
        type: Boolean,
        default: false,
    },
});

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const app = useApp();
const $q = useQuasar();

const formData = reactive({
    username: '',
    usercode: '',
});

const pageReady = ref(true);
const loading = ref(false);
const loginErrorMsg = ref('');
const rememberUser = ref(false);
const landingConfirm = ref(false);
const login = ref(false);
const isguest = ref(null);
const storedFingerprint = ref();
const slide = ref(0);
const dontShowAgain = ref(false);

const faqs = ref([
    {
        question: "How do I subscribe?",
        answer: "You can subscribe by clicking on 'Subscribe Now' and choosing a package that fits your needs. Payment is made via M-Pesa STK push.",
        icon: "help"
    },
    {
        question: "What levels do you offer?",
        answer: "We offer learning content for ECDE, Primary, JSS (Junior Secondary), and SSS (Senior Secondary) levels.",
        icon: "school"
    },
    {
        question: "Can I learn on my phone?",
        answer: "Yes! Our platform is fully responsive and works on phones, tablets, and computers.",
        icon: "phone_android"
    },
    {
        question: "How much does it cost?",
        answer: "We have various packages to fit different budgets. Visit our packages page for detailed pricing.",
        icon: "savings"
    },
]);

// Computed properties for responsive styles
const dialogStyle = computed(() => ({
    width: $q.screen.lt.sm ? '100%' : '100%',
    maxWidth: $q.screen.lt.sm ? '100%' : '500px',
    borderRadius: $q.screen.lt.sm ? '16px 16px 0 0' : '8px',
    maxHeight: $q.screen.lt.sm ? '90vh' : 'auto',
}));

async function startLogin() {
    try {
        loading.value = true;
        loginErrorMsg.value = '';
        let url = "/auth/login";
        let payload = {
            formData,
            rememberUser: rememberUser.value,
            url
        };
        const loginData = await auth.login(payload);
        loading.value = false;
        if (loginData.token) {
            let nextUrl = route.query.nexturl || '/home'
            router.go(nextUrl);
        } else {
            router.push(loginData.nextpage);
        }
    } catch (error) {
        loading.value = false;
        loginErrorMsg.value = error.request?.response || "Unable to establish connection...";
    }
}

watch(landingConfirm, (val) => {
    if (val) {
        setTimeout(() => {
            landingConfirm.value = false
        }, 8000)
    }
});

onMounted(() => {
    if (route.query.ref) {
        getReferal(route.query.ref);
    }

    // Check if user opted out of popup
    const showPopup = $q.localStorage.getItem('show_landing_popup');
    if (showPopup === false) {
        return;
    }

    // Use timeout to ensure DOM is ready - 8 seconds delay
    setTimeout(() => {
        landingConfirm.value = true;
    }, 8000);
});

async function getReferal(id) {
    try {
        const response = await ApiService.get("components_data/getferal", { params: { id } });
        let data = response.data;
        $q.localStorage.set("referral_code", data.referral_code);
    } catch (e) {
        console.error(e);
    }
}

function onYesClick() {
    isguest.value = false;
    login.value = true;
    landingConfirm.value = false;
}

function onNoClick() {
    isguest.value = false;
    landingConfirm.value = false;
    app.navigateTo('subscriptionshow');
}

function onGuestClick() {
    isguest.value = true;
    landingConfirm.value = false;
}

async function onDialogHide() {
    // Save preference if user checked "Don't show again"
    if (dontShowAgain.value) {
        $q.localStorage.set('show_landing_popup', false);
    }
    
    if (isguest.value == true || isguest.value == null) {
        await saveGuest();
    }
}

function onLoginHide() {
    const showPopup = $q.localStorage.getItem('show_landing_popup');
    if (showPopup !== false) {
        landingConfirm.value = true;
    }
}

function autologin() {
    Loading.show({ message: "Checking for human" })
    formData.username = "guest";
    formData.usercode = "guest";
    startLogin();
}

async function saveGuest() {
    let ip = await getIpAddress()
    let platform = await getPlatform()
    try {
        let postData = {
            fingerprint: storedFingerprint.value,
            platform: `${platform}`,
            ip_address: ip,
        }
        let response = await ApiService.post("components_data/guesttrack", postData);
        Loading.hide();
    } catch (e) {
        Loading.hide();
        console.error(e);
    }
}
</script>

<style scoped>
.main-page {
    overflow-x: hidden;
}

.hero-section {
    position: relative;
    min-height: 70vh;
    max-height: 85vh;
    background: url('/images/BTC Landing.jpg') center center / cover no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.55);
}

.hero-content {
    position: relative;
    z-index: 1;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem 1rem;
}

.hero-title {
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1rem;
}

.hero-subtitle {
    line-height: 1.5;
    margin-bottom: 2rem;
}

.hero-buttons {
    width: 100%;
}

.hero-buttons .q-btn {
    min-width: 200px;
    min-height: 48px;
}

.cta-primary {
    font-weight: 600;
}

.cta-secondary {
    border-width: 2px;
}

/* Stats Bar */
.stats-bar {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    padding: 32px 16px;
}

.stat-item {
    text-align: center;
    color: white;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 8px;
}

.stat-label {
    font-size: 0.875rem;
    opacity: 0.9;
}

/* Features Section */
.features-section {
    background: #ffffff;
    padding: 48px 16px;
}

.feature-card {
    border-radius: 12px;
    height: 100%;
    transition: all 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* Testimonials */
.testimonials-wrapper {
    background-color: #f8f9fa;
    padding: 48px 16px;
}

/* FAQ Section */
.faq-section {
    background: #ffffff;
    padding: 48px 16px;
}

.faq-list {
    border-radius: 12px;
}

/* CTA Section */
.cta-section {
    padding: 48px 16px;
}

.cta-card {
    border-radius: 16px;
    background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

/* Dialog Responsive Styles */
.login-dialog {
    overflow-y: auto;
    max-height: 90vh;
}

/* Extra Small Devices */
@media (max-width: 599px) {
    .hero-section {
        min-height: 60vh;
        max-height: 70vh;
    }

    .hero-content {
        padding: 1.5rem 0.5rem;
    }

    .hero-title {
        font-size: 1.75rem !important;
    }

    .hero-subtitle {
        font-size: 1rem !important;
    }

    .hero-buttons .q-btn {
        min-width: 100%;
        min-height: 44px;
        margin-bottom: 8px;
    }

    .stats-bar {
        padding: 20px 16px;
    }

    .stat-value {
        font-size: 1.25rem;
    }

    .features-section,
    .testimonials-wrapper,
    .faq-section,
    .cta-section {
        padding: 32px 16px;
    }

    .q-dialog-plugin {
        margin: 0 !important;
        border-radius: 16px 16px 0 0 !important;
    }
}

/* Small Devices */
@media (min-width: 600px) and (max-width: 767px) {
    .hero-section {
        min-height: 65vh;
    }

    .hero-title {
        font-size: 2rem !important;
    }
}

/* Medium Devices */
@media (min-width: 768px) and (max-width: 1023px) {
    .hero-section {
        min-height: 75vh;
    }

    .hero-title {
        font-size: 2.5rem !important;
    }
}

/* Large Devices */
@media (min-width: 1024px) {
    .hero-section {
        min-height: 80vh;
    }

    .hero-title {
        font-size: 3rem !important;
    }
}
</style>
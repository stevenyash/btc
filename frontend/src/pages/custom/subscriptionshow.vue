<template>
  <q-page class="main-page">
    <section class="page-section q-pa-sm q-pa-md-sm">
      <div class="container-fluid">
        <div class="row justify-center">
          <!-- Subscription Plans Section -->
          <div class="col-12 col-md-8 col-lg-6 comp-grid" v-if="!showMpesaPrompt">
            <div class="subscription-plans">
              <api-data-source api-path="components_data/subscriptionshow_data_repeater" v-slot="req">
                <div>
                  <!-- Loading State -->
                  <div v-if="req.loading" class="text-center q-my-xl">
                    <q-spinner size="40px" color="primary" />
                    <div class="q-mt-md text-caption">Loading plans...</div>
                  </div>

                  <!-- Content -->
                  <template v-if="!req.loading && req.response">
                    <div class="text-center q-mb-md">
                      <q-toolbar class="justify-center">
                        <q-toolbar-title class="text-h5 text-weight-bold text-primary">
                          Subscription Plans
                        </q-toolbar-title>
                      </q-toolbar>
                      <p class="text-grey-7 q-mt-sm">Choose a plan that fits your needs</p>
                    </div>

                    <!-- Subscription Cards Grid -->
                    <div class="row q-col-gutter-md justify-center">
                      <div v-for="(data, index) in req.response"
                           :key="index"
                           class="col-12 col-sm-6 col-md-12 col-lg-6">
                        <q-card class="subscription-card shadow-3 rounded-borders animated fadeIn"
                                :style="`animation-delay: ${index * 0.1}s`">
                          <q-card-section class="q-pa-lg">
                            <!-- Plan Header -->
                            <div class="text-center q-mb-md">
                              <div class="text-h6 text-weight-bold text-grey-9">
                                {{ data.name }}
                              </div>
                              <q-chip v-if="data.is_popular"
                                      color="primary"
                                      text-color="white"
                                      size="sm"
                                      class="q-mt-xs">
                                Most Popular
                              </q-chip>
                            </div>

                            <!-- Plan Description -->
                            <div class="text-body2 text-grey-7 text-center q-my-md line-clamp-2">
                              {{ data.description || 'Premium features included' }}
                            </div>

                            <!-- Price and Action -->
                            <div class="row items-center justify-between q-mt-lg">
                              <div class="text-h5 text-weight-bold text-primary">
                                Ksh. {{ Number(data.membership_fee).toLocaleString() }}
                              </div>
                              <q-btn
                                  unelevated
                                  color="primary"
                                  icon="subscriptions"
                                  :label="windowWidth < 600 ? '' : 'Subscribe'"
                                  :padding="windowWidth < 600 ? 'sm' : 'md'"
                                  @click="subscribe(data)"
                                  class="subscribe-btn"
                              >
                                <q-tooltip v-if="windowWidth < 600"
                                           anchor="top middle"
                                           self="bottom middle">
                                  Subscribe
                                </q-tooltip>
                              </q-btn>
                            </div>

                            <!-- Features List (Optional) -->
                            <div v-if="data.features" class="q-mt-md">
                              <q-list dense class="text-caption">
                                <q-item v-for="(feature, featIndex) in data.features"
                                        :key="featIndex"
                                        class="q-px-none">
                                  <q-item-section avatar>
                                    <q-icon name="check_circle" color="positive" size="16px" />
                                  </q-item-section>
                                  <q-item-section>
                                    <q-item-label>{{ feature }}</q-item-label>
                                  </q-item-section>
                                </q-item>
                              </q-list>
                            </div>
                          </q-card-section>
                        </q-card>
                      </div>
                    </div>
                  </template>

                  <!-- Empty State -->
                  <template v-if="!req.loading && (!req.response || req.response.length === 0)">
                    <div class="text-center q-pa-xl">
                      <q-icon name="info" size="50px" color="grey-5" />
                      <div class="text-h6 q-mt-md text-grey-7">No subscription plans available</div>
                      <div class="text-caption text-grey-6 q-mt-sm">
                        Please check back later for available plans.
                      </div>
                    </div>
                  </template>
                </div>
              </api-data-source>
            </div>
          </div>

          <!-- Payment Section -->
          <div class="col-12 col-md-8 col-lg-6 comp-grid" v-if="showMpesaPrompt">
            <q-card class="payment-section shadow-3 rounded-borders animated slideInRight">
              <q-card-section class="q-pa-lg">
                <div class="row items-center q-mb-md">
                  <q-btn
                      flat
                      round
                      icon="arrow_back"
                      @click="showMpesaPrompt = false"
                      class="q-mr-sm"
                  />
                  <div class="text-h6 text-weight-bold">Complete Subscription</div>
                </div>
                <MpesaPayment
                    :subscriptiondata="subscriptiondata"
                    :referral_code="referral_code"
                    @payment-completed="onPaymentCompleted"
                    @payment-cancelled="showMpesaPrompt = false"
                />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { ApiService } from 'src/services/api';
import { useApp } from 'src/composables/app.js';
import { useAuth } from 'src/composables/auth';
import MpesaPayment from 'src/pages/users/subscribeuser.vue';
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from 'quasar';

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

const app = useApp();
const auth = useAuth();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();

// Reactive data
const showMpesaPrompt = ref(false);
const subscriptiondata = ref(null);
const referral_code = ref('');
const loading = ref(false);
const isSubscribed = ref(false);
const subscribedPackage = ref(null);
const isLoading = ref(false);
const windowWidth = ref(window.innerWidth);

// Computed properties
const isMobile = computed(() => windowWidth.value < 768);
const isSmallMobile = computed(() => windowWidth.value < 600);

// Window resize handler
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// Check subscription status
async function checkSubscription() {
  try {
    loading.value = true;
    const response = await ApiService.get("components_data/checksubscription");
console.log("Subscription check response:", response.data);
    if (response.data && response.data.length > 0) {
      isSubscribed.value = true;
      $q.dialog({
        title: 'Active Subscription',
        message: 'You already have an active subscription. You can continue using our services.or go to the home page.for renewal',
        ok: {
          label: 'Continue',
          color: 'primary'
        },
        persistent: true
      }).onOk(() => router.push("/home"));
    } else {
      subscribedPackage.value = response.data;
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
    $q.notify({
      type: 'negative',
      message: 'Failed to check subscription status'
    });
  } finally {
    loading.value = false;
  }
}

// Subscribe function
function subscribe(data) {
  checkSubscription().then(() => {
    if (!isSubscribed.value) {
      subscriptiondata.value = data;
      showMpesaPrompt.value = true;

      // Scroll to payment section on mobile
      if (isMobile.value) {
        setTimeout(() => {
          const paymentSection = document.querySelector('.payment-section');
          if (paymentSection) {
            paymentSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    }
  });
}

// Payment completed handler
function onPaymentCompleted() {
  showMpesaPrompt.value = false;
  $q.notify({
    type: 'positive',
    message: 'Subscription completed successfully!',
    timeout: 3000
  });

  router.push('/dashboard');
}

// Lifecycle hooks
onMounted(() => {
  // Get referral code
  referral_code.value = route.query?.ref || $q.localStorage.getItem('referral_code') || null;

  // Redirect admin users
  if (auth.userRole === "superadmin" || auth.isAdmin) {
    app.navigateTo("subscriptiontypes");
  }
if(auth.isLoggedIn) {
    checkSubscription();
  }
  // Add resize listener
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  // Cleanup resize listener
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.main-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-section {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
}

.subscription-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #e0e0e0;
  height: 100%;
}

.subscription-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

.subscribe-btn {
  transition: all 0.3s ease;
}

.subscribe-btn:hover {
  transform: scale(1.05);
}

.payment-section {
  border-left: 4px solid var(--q-primary);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Mobile-specific styles */
@media (max-width: 768px) {
  .page-section {
    padding: 8px;
    align-items: flex-start;
    min-height: calc(100vh - 60px);
  }

  .subscription-card {
    margin-bottom: 16px;
  }

  .payment-section {
    margin-top: 16px;
  }
}

@media (max-width: 600px) {
  .subscription-card {
    margin-bottom: 12px;
  }

  .text-h5 {
    font-size: 1.25rem;
  }

  .text-h6 {
    font-size: 1.1rem;
  }
}

/* Animation delays for staggered card appearance */
.subscription-card:nth-child(1) { animation-delay: 0.1s; }
.subscription-card:nth-child(2) { animation-delay: 0.2s; }
.subscription-card:nth-child(3) { animation-delay: 0.3s; }
.subscription-card:nth-child(4) { animation-delay: 0.4s; }
</style>

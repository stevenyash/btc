<template>
  <q-page class="main-page">
    <!-- Welcome Banner -->
    <section class="page-section q-pa-sm q-pa-md-md">
      <div class="container-fluid">
        <q-card flat bordered class="welcome-banner gradient-primary text-white q-pa-md">
          <div class="row items-center">
            <div class="col-12 col-md-8">
              <div class="text-h5 text-weight-bold q-mb-xs">
                <q-icon name="waving_hand" size="sm" class="q-mr-sm" />
                Welcome Back, {{ auth.user?.username || 'Subscriber' }}!
              </div>
              <p class="text-body2 q-mb-none">
                Track your learning progress and manage your subscriptions
              </p>
            </div>
            <div class="col-12 col-md-4 text-right">
              <q-btn
                rounded
                outline
                color="white"
                icon="school"
                label="Start Learning"
                no-caps
                unelevated
                to="/viewlessons"
                class="q-mt-sm q-mt-md-none"
              />
            </div>
          </div>
        </q-card>
      </div>
    </section>

    <!-- Stats Overview -->
    <section class="page-section q-pa-sm q-pa-md-md">
      <div class="container-fluid">
        <div class="row q-col-gutter-md">
          <!-- Subscription Status Card -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered class="stat-card shadow-2 hover-lift">
              <q-card-section class="text-center">
                <q-icon
                  name="verified_user"
                  size="48px"
                  :color="subscriptionData.status === 'active' ? 'positive' : 'negative'"
                />
                <div class="text-h6 text-weight-bold q-mt-sm">
                  {{ subscriptionData.status || 'Inactive' }}
                </div>
                <div class="text-caption text-grey-7">Subscription Status</div>
                <q-linear-progress
                  v-if="subscriptionData.status === 'active'"
                  :value="subscriptionProgress"
                  color="positive"
                  class="q-mt-sm"
                />
              </q-card-section>
            </q-card>
          </div>

          <!-- Lessons Viewed Card -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered class="stat-card shadow-2 hover-lift">
              <q-card-section class="text-center">
                <q-icon name="visibility" size="48px" color="primary" />
                <div class="text-h6 text-weight-bold q-mt-sm">
                  {{ subscriberStore.lessons_viewed || 0 }}
                </div>
                <div class="text-caption text-grey-7">Lessons Viewed</div>
                <q-circular-progress
                  v-if="subscriberStore.total_lessons"
                  :value="lessonProgress"
                  size="40px"
                  :thickness="0.15"
                  color="primary"
                  track-color="grey-3"
                  class="q-mt-sm"
                  show-value
                >
                  <div class="text-caption">{{ Math.round(lessonProgress) }}%</div>
                </q-circular-progress>
              </q-card-section>
            </q-card>
          </div>

          <!-- Lesson Balance Card -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered class="stat-card shadow-2 hover-lift">
              <q-card-section class="text-center">
                <q-icon name="account_balance_wallet" size="48px" color="orange" />
                <div class="text-h6 text-weight-bold q-mt-sm">
                  {{ subscriberStore.lesson_balance || 0 }}
                </div>
                <div class="text-caption text-grey-7">Lessons Remaining</div>
                <q-badge
                  v-if="subscriberStore.lesson_balance < 5"
                  color="orange"
                  class="q-mt-sm"
                >
                  Low Balance
                </q-badge>
              </q-card-section>
            </q-card>
          </div>

          <!-- Days Until Expiry Card -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered class="stat-card shadow-2 hover-lift">
              <q-card-section class="text-center">
                <q-icon
                  name="event"
                  size="48px"
                  :color="daysUntilExpiry <= 7 ? 'negative' : daysUntilExpiry <= 30 ? 'orange' : 'positive'"
                />
                <div class="text-h6 text-weight-bold q-mt-sm">
                  {{ daysUntilExpiry >= 0 ? daysUntilExpiry : 0 }} Days
                </div>
                <div class="text-caption text-grey-7">Until Expiry</div>
                <q-badge
                  v-if="daysUntilExpiry <= 7 && daysUntilExpiry > 0"
                  color="negative"
                  class="q-mt-sm"
                >
                  Renew Soon!
                </q-badge>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="page-section q-pa-sm q-pa-md-md">
      <div class="container-fluid">
        <div class="text-h6 text-weight-medium q-mb-md">
          <q-icon name="bolt" class="q-mr-xs" />
          Quick Actions
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-6 col-sm-4 col-md-2">
            <q-btn
              flat
              class="full-width action-btn"
              to="/viewlessons"
            >
              <div class="column items-center">
                <q-icon name="play_circle" size="32px" color="primary" />
                <div class="text-caption q-mt-xs">Watch Lessons</div>
              </div>
            </q-btn>
          </div>
          <div class="col-6 col-sm-4 col-md-2">
            <q-btn
              flat
              class="full-width action-btn"
              to="/renewsubscription"
            >
              <div class="column items-center">
                <q-icon name="autorenew" size="32px" color="positive" />
                <div class="text-caption q-mt-xs">Renew</div>
              </div>
            </q-btn>
          </div>
          <div class="col-6 col-sm-4 col-md-2">
            <q-btn
              flat
              class="full-width action-btn"
              to="/buypackages"
            >
              <div class="column items-center">
                <q-icon name="shopping_cart" size="32px" color="orange" />
                <div class="text-caption q-mt-xs">Buy Packages</div>
              </div>
            </q-btn>
          </div>

          <div class="col-6 col-sm-4 col-md-2">
            <q-btn
              flat
              class="full-width action-btn"
              to="/contactus"
            >
              <div class="column items-center">
                <q-icon name="support_agent" size="32px" color="info" />
                <div class="text-caption q-mt-xs">Support</div>
              </div>
            </q-btn>
          </div>
          <div class="col-6 col-sm-4 col-md-2">
            <q-btn
              flat
              class="full-width action-btn"
              @click="refreshDashboard"
            >
              <div class="column items-center">
                <q-icon name="refresh" size="32px" color="grey-7" />
                <div class="text-caption q-mt-xs">Refresh</div>
              </div>
            </q-btn>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content Grid -->
    <section class="page-section q-pa-sm q-pa-md-md">
      <div class="container-fluid">
        <div class="row q-col-gutter-md">
          <!-- Subscription Details Card -->
          <div class="col-12 col-md-6 col-lg-4">
            <q-card flat bordered class="shadow-2 full-height">
              <q-card-section class="bg-primary text-white">
                <div class="text-h6 text-weight-bold">
                  <q-icon name="card_membership" class="q-mr-xs" />
                  Subscription Details
                </div>
              </q-card-section>

              <template v-if="!loading.subscription">
                <q-card-section>
                  <q-list separator>
                    <q-item>
                      <q-item-section avatar>
                        <q-icon name="phone" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Phone Number</q-item-label>
                        <q-item-label class="text-weight-medium">
                          {{ subscriptionData.phone_no || 'N/A' }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section avatar>
                        <q-icon name="calendar_today" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Start Date</q-item-label>
                        <q-item-label class="text-weight-medium">
                          {{ formatDate(subscriptionData.start_date) }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section avatar>
                        <q-icon
                          name="event"
                          :color="isExpiringSoon(subscriptionData.expiry_date) ? 'orange' :
                                  isExpired(subscriptionData.expiry_date) ? 'negative' : 'primary'"
                        />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Expiry Date</q-item-label>
                        <q-item-label
                          class="text-weight-medium"
                          :class="{'text-orange': isExpiringSoon(subscriptionData.expiry_date),
                                   'text-negative': isExpired(subscriptionData.expiry_date)}"
                        >
                          {{ formatDate(subscriptionData.expiry_date) }}
                        </q-item-label>
                        <q-item-label
                          v-if="isExpiringSoon(subscriptionData.expiry_date)"
                          caption
                          class="text-orange"
                        >
                          <q-icon name="warning" size="xs" />
                          Expires in {{ daysUntilExpiry }} days
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section avatar>
                        <q-icon name="info" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Status</q-item-label>
                        <q-item-label>
                          <q-chip
                            :color="subscriptionData.status === 'active' ? 'positive' : 'negative'"
                            text-color="white"
                            dense
                          >
                            {{ subscriptionData.status || 'Inactive' }}
                          </q-chip>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>

                <q-card-actions v-if="isExpiringSoon(subscriptionData.expiry_date) || isExpired(subscriptionData.expiry_date)">
                  <q-btn
                    flat
                    color="primary"
                    icon="autorenew"
                    label="Renew Now"
                    class="full-width"
                    to="/renewsubscription"
                  />
                </q-card-actions>
              </template>

              <template v-else-if="error.subscription">
                <q-card-section class="text-center q-py-xl">
                  <q-icon name="error_outline" size="48px" color="negative" />
                  <p class="text-body2 text-negative q-mt-md">Failed to load subscription data</p>
                  <q-btn 
                    color="primary" 
                    label="Retry" 
                    icon="refresh" 
                    @click="retryFetchSubscription"
                    class="q-mt-md"
                    no-caps
                  />
                </q-card-section>
              </template>

              <template v-else>
                <q-card-section class="text-center q-py-xl">
                  <q-spinner size="40px" color="primary" />
                  <p class="text-caption text-grey q-mt-sm">Loading...</p>
                </q-card-section>
              </template>
            </q-card>
          </div>

          <!-- Learning Progress Card -->
          <div class="col-12 col-md-6 col-lg-4">
            <q-card flat bordered class="shadow-2 full-height">
              <q-card-section class="bg-secondary text-white">
                <div class="text-h6 text-weight-bold">
                  <q-icon name="trending_up" class="q-mr-xs" />
                  Learning Progress
                </div>
              </q-card-section>

                <q-card-section>
                  <!-- Progress Circle -->
                  <div class="text-center q-mb-md">
                    <q-circular-progress
                      :value="lessonProgress"
                      size="120px"
                      :thickness="0.12"
                      color="secondary"
                      track-color="grey-3"
                      show-value
                      class="q-ma-md"
                    >
                      <div class="text-h5 text-weight-bold">{{ Math.round(lessonProgress) }}%</div>
                      <div class="text-caption text-grey-7">Complete</div>
                    </q-circular-progress>
                  </div>

                  <q-separator class="q-my-md" />

                  <!-- Stats Grid -->
                  <div class="row q-col-gutter-sm">
                    <div class="col-6">
                      <div class="stat-box text-center q-pa-sm bg-grey-2 rounded-borders">
                        <div class="text-h6 text-weight-bold text-primary">
                          {{ subscriberStore.lessons_viewed || 0 }}
                        </div>
                        <div class="text-caption text-grey-7">Viewed</div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-box text-center q-pa-sm bg-grey-2 rounded-borders">
                        <div class="text-h6 text-weight-bold text-orange">
                          {{ subscriberStore.lesson_balance || 0 }}
                        </div>
                        <div class="text-caption text-grey-7">Remaining</div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-box text-center q-pa-sm bg-grey-2 rounded-borders">
                        <div class="text-h6 text-weight-bold text-positive">
                          {{ subscriberStore.total_lessons || 0 }}
                        </div>
                        <div class="text-caption text-grey-7">Total</div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-box text-center q-pa-sm bg-grey-2 rounded-borders">
                        <div class="text-h6 text-weight-bold text-secondary">
                          {{ subscriberStore.status === 'active' ? 'Active' : 'Inactive' }}
                        </div>
                        <div class="text-caption text-grey-7">Status</div>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-card-actions>
                  <q-btn
                    flat
                    color="secondary"
                    icon="play_arrow"
                    label="Continue Learning"
                    class="full-width"
                    to="/viewlessons"
                  />
                </q-card-actions>
            </q-card>
          </div>

          <!-- Activity Timeline Card -->
          <div class="col-12 col-lg-4">
            <q-card flat bordered class="shadow-2 full-height">
              <q-card-section class="bg-info text-white">
                <div class="text-h6 text-weight-bold">
                  <q-icon name="history" class="q-mr-xs" />
                  Recent Activity
                </div>
              </q-card-section>

              <q-card-section class="q-pa-none">
                <q-timeline color="primary" class="q-pa-md">
                  <q-timeline-entry
                    v-if="subscriptionData.start_date"
                    icon="check_circle"
                    color="positive"
                    :subtitle="formatDate(subscriptionData.start_date)"
                  >
                    <div class="text-weight-medium">Subscription Started</div>
                    <div class="text-caption text-grey-7">Your subscription became active</div>
                  </q-timeline-entry>

                  <q-timeline-entry
                    v-if="subscriberStore.lessons_viewed > 0"
                    icon="visibility"
                    color="primary"
                  >
                    <div class="text-weight-medium">{{ subscriberStore.lessons_viewed }} Lessons Viewed</div>
                    <div class="text-caption text-grey-7">Keep up the great work!</div>
                  </q-timeline-entry>

                  <q-timeline-entry
                    v-if="packagesData && packagesData.length > 0"
                    icon="shopping_bag"
                    color="orange"
                    :subtitle="formatDate(packagesData[0]?.transaction_date)"
                  >
                    <div class="text-weight-medium">Package Purchased</div>
                    <div class="text-caption text-grey-7">{{ packagesData[0]?.package_name }}</div>
                  </q-timeline-entry>

                  <q-timeline-entry
                    v-if="subscriptionData.expiry_date"
                    icon="event"
                    :color="isExpiringSoon(subscriptionData.expiry_date) ? 'orange' : 'grey-5'"
                    :subtitle="formatDate(subscriptionData.expiry_date)"
                  >
                    <div class="text-weight-medium">Subscription Expires</div>
                    <div class="text-caption text-grey-7">
                      {{ daysUntilExpiry > 0 ? `In ${daysUntilExpiry} days` : 'Expired' }}
                    </div>
                  </q-timeline-entry>
                </q-timeline>
              </q-card-section>

              <q-card-actions>
                <q-btn
                  flat
                  color="info"
                  icon="history"
                  label="View Full History"
                  class="full-width"
                  @click="showFullHistory"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Packages History Section -->
    <section class="page-section q-pa-sm q-pa-md-md">
      <div class="container-fluid">
        <div class="text-h6 text-weight-medium q-mb-md">
          <q-icon name="inventory" class="q-mr-xs" />
          Package Purchase History
        </div>

        <q-card flat bordered class="shadow-2">
          <template v-if="!loading.packages">
            <template v-if="packagesData && packagesData.length > 0">
              <!-- Desktop Table -->
              <div class="hidden-xs">
                <q-table
                  flat
                  :rows="packagesData"
                  :columns="columns"
                  row-key="purchase_id"
                  :pagination="pagination"
                  :rows-per-page-options="[5, 10, 20]"
                >
                  <template v-slot:body-cell-purchase_id="props">
                    <q-td :props="props">
                      <q-badge color="primary" class="q-pa-xs">
                        #{{ props.row.purchase_id }}
                      </q-badge>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-status="props">
                    <q-td :props="props">
                      <q-chip
                        :color="props.row.status === 'active' ? 'positive' : 'grey'"
                        text-color="white"
                        dense
                      >
                        {{ props.row.status || 'N/A' }}
                      </q-chip>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-transaction_date="props">
                    <q-td :props="props">
                      {{ formatDate(props.row.transaction_date) }}
                    </q-td>
                  </template>

                  <template v-slot:body-cell-expiry_date="props">
                    <q-td :props="props">
                      {{ formatDate(props.row.expiry_date) }}
                    </q-td>
                  </template>
                </q-table>
              </div>

              <!-- Mobile Cards -->
              <div class="visible-xs">
                <q-card
                  v-for="pkg in packagesData"
                  :key="pkg.purchase_id"
                  flat
                  bordered
                  class="package-card-mobile q-mb-md"
                >
                  <q-card-section>
                    <div class="row items-center q-mb-sm">
                      <q-badge color="primary" class="q-pa-xs">
                        #{{ pkg.purchase_id }}
                      </q-badge>
                      <q-space />
                      <q-chip
                        :color="pkg.status === 'active' ? 'positive' : 'grey'"
                        text-color="white"
                        dense
                      >
                        {{ pkg.status || 'N/A' }}
                      </q-chip>
                    </div>
                    <div class="text-subtitle1 text-weight-bold">
                      {{ pkg.package_name }}
                    </div>
                  </q-card-section>

                  <q-separator />

                  <q-card-section>
                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <div class="text-caption text-grey">Purchased</div>
                        <div class="text-body2">{{ formatDate(pkg.transaction_date) }}</div>
                      </div>
                      <div class="col-6">
                        <div class="text-caption text-grey">Expires</div>
                        <div class="text-body2">{{ formatDate(pkg.expiry_date) }}</div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </template>

            <!-- Empty State -->
            <template v-else>
              <q-card-section class="text-center q-py-xl">
                <q-icon name="inventory_2" size="64px" color="grey-5" />
                <p class="text-h6 text-grey q-mt-md">No Package History</p>
                <p class="text-body2 text-grey-7">
                  You haven't purchased any packages yet.
                </p>
                <q-btn
                  color="primary"
                  icon="shopping_cart"
                  label="Browse Packages"
                  to="/buypackages"
                  class="q-mt-md"
                  no-caps
                  unelevated
                />
              </q-card-section>
            </template>
          </template>

          <!-- Loading State -->
          <template v-else-if="error.packages">
            <q-card-section class="text-center q-py-xl">
              <q-icon name="error_outline" size="48px" color="negative" />
              <p class="text-body2 text-negative q-mt-md">Failed to load package history</p>
              <q-btn 
                color="primary" 
                label="Retry" 
                icon="refresh" 
                @click="retryFetchPackages"
                class="q-mt-md"
                no-caps
              />
            </q-card-section>
          </template>
        </q-card>
      </div>
    </section>

    <!-- Footer Spacer -->
    <section class="q-pa-lg text-center text-grey-6">
      <p class="text-caption q-mb-none">
        Need help? Contact our support team
      </p>
    </section>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApp } from 'src/composables/app.js';
import { useAuth } from 'src/composables/auth';
import { useRouter } from 'vue-router';
import { ApiService } from 'src/services/api';
import { useQuasar } from 'quasar';
import { useSubscribedStore } from "src/stores/subscribedStore";
defineProps({
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
const router = useRouter();
const $q = useQuasar();
const subscriberStore = useSubscribedStore();
// Reactive data stores
const subscriptionData = ref({});
const packagesData = ref([]);

// Loading states
const loading = ref({
  subscription: false,
  packages: false
});

// Error states
const error = ref({
  subscription: false,
  packages: false
});

// Retry functions
const retryFetchSubscription = () => {
  error.value.subscription = false;
  fetchSubscriptionData();
};

const retryFetchPackages = () => {
  error.value.packages = false;
  fetchPackagesData();
};

// Computed properties
// Direct access to store properties
const isAuthorized = computed(() => subscriberStore.isAuthorized);
const authMessage = computed(() => subscriberStore.authMessage);
const activeSessions = computed(() => subscriberStore.activeSessions);
const concurrentAccess = computed(() => subscriberStore.concurrent_access);
const isAllowed = computed(() => subscriberStore.isAllowed);

const lessonProgress = computed(() => {
  const total = subscriberStore.total_lessons || 0;
  const viewed = subscriberStore.lessons_viewed || 0;
  return total > 0 ? (viewed / total) * 100 : 0;
});

const subscriptionProgress = computed(() => {
  const start = new Date(subscriptionData.value.start_date);
  const expiry = new Date(subscriptionData.value.expiry_date);
  const now = new Date();

  if (!subscriptionData.value.start_date || !subscriptionData.value.expiry_date) return 0;

  const totalDays = (expiry - start) / (1000 * 60 * 60 * 24);
  const daysElapsed = (now - start) / (1000 * 60 * 60 * 24);

  return totalDays > 0 ? Math.min((daysElapsed / totalDays) * 100, 100) : 0;
});

const daysUntilExpiry = computed(() => {
  if (!subscriptionData.value.expiry_date) return 0;
  const expiry = new Date(subscriptionData.value.expiry_date);
  const now = new Date();
  const diffInDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return diffInDays;
});

// Fetch subscription data
const fetchSubscriptionData = async () => {
  loading.value.subscription = true;
  error.value.subscription = false;

  try {
    const response = await ApiService.get("components_data/subscriber_data_component");
    subscriptionData.value = Array.isArray(response.data) ? response.data[0] || {} : response.data;
  } catch (err) {
    console.error("Error fetching subscription data:", err);
    error.value.subscription = true;
    subscriptionData.value = {};
  } finally {
    loading.value.subscription = false;
  }
};

// Fetch packages data
const fetchPackagesData = async () => {
  loading.value.packages = true;
  error.value.packages = false;

  try {
    const response = await ApiService.get("components_data/subscriber_data_repeater");
    packagesData.value = response.data || [];
  } catch (err) {
    console.error("Error fetching packages:", err);
    error.value.packages = true;
    packagesData.value = [];
  } finally {
    loading.value.packages = false;
  }
};

// Fetch all data
const fetchAllData = async () => {
  // Initialize store (fetches lesson data)
  await subscriberStore.initialize();

  // Fetch subscription and packages data separately
  await Promise.all([
    fetchSubscriptionData(),
    fetchPackagesData()
  ]);
};

// Refresh dashboard
const refreshDashboard = () => {
  $q.notify({
    type: 'info',
    message: 'Refreshing dashboard...',
    position: 'top'
  });
  fetchAllData();
};

// Show full history - redirect to transactions page
const showFullHistory = () => {
  router.push('/transactions');
};

// Utility functions
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (err) {
    console.error("Error formatting date:", err);
    return 'Invalid date';
  }
}

const isExpired = (dateString) => {
  if (!dateString) return false;
  try {
    return new Date(dateString) <= new Date();
  } catch (err) {
    console.error("Error checking expiration:", err);
    return false;
  }
};

function isExpiringSoon(expiryDate) {
  if (!expiryDate) return false;
  try {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffInDays = (expiry - today) / (1000 * 60 * 60 * 24);
    return diffInDays <= 30 && diffInDays > 0;
  } catch (err) {
    console.error("Error checking expiring soon:", err);
    return false;
  }
}

// Table configuration
const columns = ref([
  { name: "purchase_id", label: "Purchase ID", field: "purchase_id", align: "left", sortable: true },
  { name: "package_name", label: "Package Name", field: "package_name", align: "left", sortable: true },
  { name: "transaction_date", label: "Purchase Date", field: "transaction_date", align: "left", sortable: true },
  { name: "expiry_date", label: "Expiry Date", field: "expiry_date", align: "left", sortable: true },
  { name: "status", label: "Status", field: "status", align: "center", sortable: true }
]);

const pagination = ref({
  sortBy: 'transaction_date',
  descending: true,
  page: 1,
  rowsPerPage: 5
});

// Initialize on mount
onMounted(() => {
    subscriberStore.initialize()
    console.log("on sub")
  fetchAllData();
});
</script>

<style scoped>
/* Gradient Background */
.gradient-primary {
  background: linear-gradient(135deg, var(--q-primary) 0%, #1976d2 100%);
}

/* Welcome Banner */
.welcome-banner {
  border-radius: 12px;
  overflow: hidden;
}

/* Stat Cards */
.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  height: 100%;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

/* Action Buttons */
.action-btn {
  border-radius: 12px;
  padding: 16px 8px;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.03);
  transform: translateY(-2px);
}

/* Full Height Cards */
.full-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.full-height .q-card__section:last-child {
  margin-top: auto;
}

/* Stat Box */
.stat-box {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.stat-box:hover {
  transform: scale(1.05);
}

/* Package Cards */
.package-card-mobile {
  border-left: 4px solid var(--q-primary);
  transition: transform 0.2s ease;
}

.package-card-mobile:hover {
  transform: translateX(4px);
}

/* Responsive Utilities */
.visible-xs {
  display: none;
}

.hidden-xs {
  display: block;
}

@media (max-width: 599px) {
  .visible-xs {
    display: block !important;
  }

  .hidden-xs {
    display: none !important;
  }

  .stat-card {
    margin-bottom: 12px;
  }

  .action-btn {
    padding: 12px 4px;
  }
}

/* Card Shadows */
.shadow-2 {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Smooth Transitions */
* {
  transition: color 0.2s ease, background-color 0.2s ease;
}

/* Timeline Customization */
.q-timeline {
  max-height: 400px;
  overflow-y: auto;
}

/* Rounded Borders */
.rounded-borders {
  border-radius: 8px;
}

/* Better spacing */
.q-card {
  border-radius: 12px;
}

/* Improved table */
.q-table {
  border-radius: 0 0 12px 12px;
}
</style>

<template>
  <q-page class="main-page">
    <!-- Welcome Header -->
    <section class="page-section q-pa-md">
      <div class="container-fluid">
        <q-card class="welcome-card bg-gradient-primary text-white nice-shadow-5 rounded-borders">
          <q-card-section class="row items-center q-py-lg">
            <q-avatar class="q-mr-md" size="60px" color="white" text-color="primary" icon="admin_panel_settings" />
            <div class="col">
              <div class="text-h4 text-bold">Welcome, Super Admin</div>
              <div class="text-subtitle1 text-white-7">Manage your platform with complete control</div>
            </div>
            <div class="col-auto">
              <q-btn
                flat
                round
                dense
                icon="notifications"
                color="white"
                size="md"
              >
                <q-badge color="red" floating>3</q-badge>
              </q-btn>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </section>

    <!-- Quick Stats Overview -->
    <section class="page-section q-pa-md">
      <div class="container-fluid">
        <div class="text-h6 q-mb-md text-weight-medium">Quick Overview</div>
        <div class="row q-col-gutter-md">
          <!-- Users Card -->
          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="stat-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-caption text-grey-7">Total Users</div>
                    <record-count api-path="components_data/getcount_users" v-slot="record">
                      <div class="text-h4 text-weight-bold text-primary">
                        <span v-if="!record.loading">{{ record.num }}</span>
                        <q-spinner v-else color="primary" size="24px" />
                      </div>
                    </record-count>
                  </div>
                  <div class="col-auto">
                    <q-avatar size="56px" color="primary-1" text-color="primary" icon="verified_user" />
                  </div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-actions>
                <q-btn flat dense color="primary" label="View All" icon-right="arrow_forward" :to="`/users`" class="full-width" />
              </q-card-actions>
            </q-card>
          </div>

          <!-- Marketers Card -->
          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="stat-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-caption text-grey-7">Total Marketers</div>
                    <record-count api-path="components_data/getcount_marketers" v-slot="record">
                      <div class="text-h4 text-weight-bold text-secondary">
                        <span v-if="!record.loading">{{ record.num }}</span>
                        <q-spinner v-else color="secondary" size="24px" />
                      </div>
                    </record-count>
                  </div>
                  <div class="col-auto">
                    <q-avatar size="56px" color="secondary-1" text-color="secondary" icon="link" />
                  </div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-actions>
                <q-btn flat dense color="secondary" label="View All" icon-right="arrow_forward" :to="`/marketers`" class="full-width" />
              </q-card-actions>
            </q-card>
          </div>

          <!-- Subscriptions Card -->
          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="stat-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-caption text-grey-7">Total Revenue</div>
                    <record-count api-path="components_data/getcount_subscriptions" v-slot="record">
                      <div class="text-h4 text-weight-bold text-positive">
                        <span v-if="!record.loading">{{ record.num }}</span>
                        <q-spinner v-else color="positive" size="24px" />
                      </div>
                    </record-count>
                  </div>
                  <div class="col-auto">
                    <q-avatar size="56px" color="positive-1" text-color="positive" icon="attach_money" />
                  </div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-actions>
                <q-btn flat dense color="positive" label="View Report" icon-right="arrow_forward" :to="`/subscriptions`" class="full-width" />
              </q-card-actions>
            </q-card>
          </div>

          <!-- Purchases Card -->
          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="stat-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-caption text-grey-7">Total Purchases</div>
                    <record-count api-path="components_data/getcount_purchases" v-slot="record">
                      <div class="text-h4 text-weight-bold text-accent">
                        <span v-if="!record.loading">{{ record.num }}</span>
                        <q-spinner v-else color="accent" size="24px" />
                      </div>
                    </record-count>
                  </div>
                  <div class="col-auto">
                    <q-avatar size="56px" color="accent-1" text-color="accent" icon="shopping_cart" />
                  </div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-actions>
                <q-btn flat dense color="accent" label="View All" icon-right="arrow_forward" :to="`/purchases`" class="full-width" />
              </q-card-actions>
            </q-card>
          </div>

          <!-- Marketer Earnings Card -->
          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="stat-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-caption text-grey-7">Pending Commissions</div>
                    <record-count api-path="marketer_earnings/admin/dashboard-stats" v-slot="record">
                      <div class="text-h4 text-weight-bold text-amber">
                        <span v-if="!record.loading">KES {{ formatCurrency(record.pending_payouts || 0) }}</span>
                        <q-spinner v-else color="amber" size="24px" />
                      </div>
                    </record-count>
                  </div>
                  <div class="col-auto">
                    <q-avatar size="56px" color="amber-1" text-color="amber" icon="account_balance_wallet" />
                  </div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-actions>
                <q-btn flat dense color="amber" label="Manage" icon-right="arrow_forward" :to="`/marketer-admin`" class="full-width" />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="page-section q-pa-md">
      <div class="container-fluid">
        <div class="text-h6 q-mb-md text-weight-medium">Quick Actions</div>
        <div class="row q-col-gutter-md">
          <!-- User Management -->
          <div class="col-lg-4 col-md-6 col-12">
            <q-card class="action-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section class="bg-primary text-white">
                <div class="row items-center">
                  <q-icon name="people" size="32px" class="q-mr-sm" />
                  <div class="text-h6 text-weight-medium">User Management</div>
                </div>
              </q-card-section>
              <q-card-section>
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <q-btn
                      unelevated
                      color="primary"
                      icon="person_add"
                      label="Add User"
                      :to="`/users/add`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                  <div class="col-6">
                    <q-btn
                      unelevated
                      color="primary"
                      icon="list"
                      label="View Users"
                      :to="`/users`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                  <div class="col-12">
                    <q-btn
                      outline
                      color="primary"
                      icon="vpn_key"
                      label="Assign Rights"
                      :to="`/userprivileges`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Permissions & Roles -->
          <div class="col-lg-4 col-md-6 col-12">
            <q-card class="action-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section class="bg-purple text-white">
                <div class="row items-center">
                  <q-icon name="security" size="32px" class="q-mr-sm" />
                  <div class="text-h6 text-weight-medium">Permissions & Roles</div>
                </div>
              </q-card-section>
              <q-card-section>
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <q-btn
                      unelevated
                      color="purple"
                      icon="admin_panel_settings"
                      label="Permissions"
                      :to="`/permissions/manage`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                  <div class="col-6">
                    <q-btn
                      unelevated
                      color="purple"
                      icon="badge"
                      label="Roles"
                      :to="`/roles`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                  <div class="col-12">
                    <q-btn
                      outline
                      color="purple"
                      icon="settings"
                      label="Role Permissions"
                      :to="`/rolepermissions/manage`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Marketing -->
          <div class="col-lg-4 col-md-6 col-12">
            <q-card class="action-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section class="bg-secondary text-white">
                <div class="row items-center">
                  <q-icon name="campaign" size="32px" class="q-mr-sm" />
                  <div class="text-h6 text-weight-medium">Marketing</div>
                </div>
              </q-card-section>
              <q-card-section>
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <q-btn
                      unelevated
                      color="secondary"
                      icon="person_add"
                      label="Add Marketer"
                      :to="`/marketers/add`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                  <div class="col-6">
                    <q-btn
                      unelevated
                      color="secondary"
                      icon="list"
                      label="View All"
                      :to="`/marketers`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                  <div class="col-6">
                    <q-btn
                      outline
                      color="secondary"
                      icon="mail"
                      label="View Invites"
                      :to="`/invites`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                  <div class="col-6">
                    <q-btn
                      outline
                      color="secondary"
                      icon="account_balance_wallet"
                      label="Earnings"
                      :to="`/marketer-earnings`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                  <div class="col-6">
                    <q-btn
                      outline
                      color="amber"
                      icon="redeem"
                      label="Redemptions"
                      :to="`/marketer-redeem`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                  <div class="col-6">
                    <q-btn
                      outline
                      color="info"
                      icon="payments"
                      label="Withdrawals"
                      :to="`/marketer-withdraw`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                  <div class="col-12">
                    <q-btn
                      unelevated
                      color="secondary"
                      icon="admin_panel_settings"
                      label="Marketer Admin Panel"
                      :to="`/marketer-admin`"
                      class="full-width"
                      size="md"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- System Management -->
    <section class="page-section q-pa-md">
      <div class="container-fluid">
        <div class="text-h6 q-mb-md text-weight-medium">System Management</div>
        <div class="row q-col-gutter-md">
          <!-- SMS Credits -->
          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="system-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section class="bg-green-7 text-white text-center">
                <q-icon name="sms" size="48px" />
                <div class="text-h6 q-mt-sm">SMS Credits</div>
              </q-card-section>
              <q-card-section>
                <sms-balance />
              </q-card-section>
            </q-card>
          </div>

          <!-- Database Migration -->
          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="system-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section class="bg-blue-7 text-white text-center">
                <q-icon name="storage" size="48px" />
                <div class="text-h6 q-mt-sm">Database</div>
              </q-card-section>
              <q-card-section class="text-center">
                <q-btn
                  unelevated
                  color="blue"
                  icon="sync"
                  label="Migration"
                  :to="`/migration`"
                  class="full-width"
                  size="md"
                />
              </q-card-section>
            </q-card>
          </div>

          <!-- Subscriptions -->
          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="system-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section class="bg-orange-7 text-white text-center">
                <q-icon name="subscriptions" size="48px" />
                <div class="text-h6 q-mt-sm">Subscriptions</div>
              </q-card-section>
              <q-card-section class="text-center">
                <div class="row q-col-gutter-xs">
                  <div class="col-6">
                    <q-btn
                      flat
                      dense
                      color="orange"
                      label="Active"
                      :to="`/activesubscriptions`"
                      class="full-width"
                      size="sm"
                    />
                  </div>
                  <div class="col-6">
                    <q-btn
                      flat
                      dense
                      color="orange"
                      label="Expired"
                      :to="`/expiredsubscriptions`"
                      class="full-width"
                      size="sm"
                    />
                  </div>
                  <div class="col-12">
                    <q-btn
                      unelevated
                      color="orange"
                      label="All Reports"
                      :to="`/subscriptions`"
                      class="full-width"
                      size="sm"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Transactions -->
          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="system-card nice-shadow-3 rounded-borders hover-lift">
              <q-card-section class="bg-teal-7 text-white text-center">
                <q-icon name="receipt_long" size="48px" />
                <div class="text-h6 q-mt-sm">Transactions</div>
              </q-card-section>
              <q-card-section class="text-center">
                <q-btn
                  unelevated
                  color="teal"
                  icon="list"
                  label="View All"
                  :to="`/transactions`"
                  class="full-width"
                  size="md"
                />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Reports & Analytics -->
    <section class="page-section q-pa-md">
      <div class="container-fluid">
        <div class="text-h6 q-mb-md text-weight-medium">Reports & Analytics</div>
        <div class="row q-col-gutter-md">
          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="report-card nice-shadow-3 rounded-borders hover-lift" flat bordered>
              <q-card-section class="text-center">
                <q-icon name="bar_chart" size="40px" color="indigo" />
                <div class="text-subtitle1 q-mt-sm text-weight-medium">Subscription Reports</div>
              </q-card-section>
              <q-separator />
              <q-card-actions vertical>
                <q-btn flat dense align="left" icon="trending_up" label="Monthly Summary" :to="`/monthlysubscriptionsummary`" />
                <q-btn flat dense align="left" icon="pie_chart" label="By Type" :to="`/subscriptionsbytype`" />
                <q-btn flat dense align="left" icon="donut_small" label="Status Distribution" :to="`/subscriptionstatusdistribution`" />
              </q-card-actions>
            </q-card>
          </div>

          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="report-card nice-shadow-3 rounded-borders hover-lift" flat bordered>
              <q-card-section class="text-center">
                <q-icon name="people_outline" size="40px" color="deep-purple" />
                <div class="text-subtitle1 q-mt-sm text-weight-medium">User Analytics</div>
              </q-card-section>
              <q-separator />
              <q-card-actions vertical>
                <q-btn flat dense align="left" icon="schedule" label="Subscriber Tracker" :to="`/subscribertracker`" />
                <q-btn flat dense align="left" icon="visibility" label="Guest Tracker" :to="`/guesttracker`" />
                <q-btn flat dense align="left" icon="person" label="Active Users" :to="`/users`" />
              </q-card-actions>
            </q-card>
          </div>

          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="report-card nice-shadow-3 rounded-borders hover-lift" flat bordered>
              <q-card-section class="text-center">
                <q-icon name="school" size="40px" color="blue" />
                <div class="text-subtitle1 q-mt-sm text-weight-medium">Learning Management</div>
              </q-card-section>
              <q-separator />
              <q-card-actions vertical>
                <q-btn flat dense align="left" icon="layers" label="Learning Levels" :to="`/learninglevels`" />
                <q-btn flat dense align="left" icon="video_library" label="Tutorials" :to="`/tutorialssettings`" />
                <q-btn flat dense align="left" icon="quiz" label="Questions" :to="`/questions`" />
              </q-card-actions>
            </q-card>
          </div>

          <div class="col-lg-3 col-md-6 col-12">
            <q-card class="report-card nice-shadow-3 rounded-borders hover-lift" flat bordered>
              <q-card-section class="text-center">
                <q-icon name="settings" size="40px" color="grey-7" />
                <div class="text-subtitle1 q-mt-sm text-weight-medium">System Settings</div>
              </q-card-section>
              <q-separator />
              <q-card-actions vertical>
                <q-btn flat dense align="left" icon="tune" label="Lesson Settings" :to="`/lessonsetting`" />
                <q-btn flat dense align="left" icon="info" label="About Us" :to="`/aboutus`" />
                <q-btn flat dense align="left" icon="contact_mail" label="Contact Settings" :to="`/contactus/contactusedit`" />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Settings Section -->
    <section class="page-section q-pa-md">
      <div class="container-fluid">
        <div class="text-h6 q-mb-md text-weight-medium">Platform Settings</div>
        <q-card class="nice-shadow-3 rounded-borders">
          <SettingsPage />
        </q-card>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useApp } from 'src/composables/app.js';
import SettingsPage from 'src/components/SettingsPage.vue';
import SmsBalance from 'src/components/SmsBalance.vue';

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
const pageReady = ref(true);

const formatCurrency = (value) => {
  return parseFloat(value || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>

<style scoped>
/* Gradient Background */
.bg-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Card Hover Effects */
.hover-lift {
  transition: all 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

/* Stat Cards */
.stat-card {
  border-left: 4px solid currentColor;
}

.stat-card .q-card__section:first-child {
  min-height: 120px;
}

/* Action Cards */
.action-card {
  overflow: hidden;
}

.action-card .q-card__section:first-child {
  position: relative;
}

.action-card .q-card__section:first-child::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

/* System Cards */
.system-card {
  overflow: hidden;
}

.system-card .q-card__section:first-child {
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Report Cards */
.report-card {
  border-top: 3px solid #e0e0e0;
}

.report-card:hover {
  border-top-color: currentColor;
}

/* Welcome Card */
.welcome-card {
  overflow: hidden;
  position: relative;
}

.welcome-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

/* Text Utilities */
.text-white-7 {
  color: rgba(255, 255, 255, 0.7);
}

/* Responsive Adjustments */
@media (max-width: 1023px) {
  .text-h4 {
    font-size: 1.5rem;
  }

  .text-h6 {
    font-size: 1.1rem;
  }
}

@media (max-width: 599px) {
  .stat-card .q-card__section:first-child {
    min-height: 100px;
  }

  .system-card .q-card__section:first-child {
    min-height: 120px;
  }
}

/* Animation Classes */
.animated {
  animation-duration: 0.6s;
  animation-fill-mode: both;
}

/* Nice Shadows */
.nice-shadow-3 {
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
}

.nice-shadow-5 {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.12);
}

/* Rounded Borders */
.rounded-borders {
  border-radius: 12px;
}

/* Color Variations */
.bg-primary-1 {
  background-color: rgba(25, 118, 210, 0.1);
}

.bg-secondary-1 {
  background-color: rgba(156, 39, 176, 0.1);
}

.bg-positive-1 {
  background-color: rgba(33, 150, 83, 0.1);
}

.bg-accent-1 {
  background-color: rgba(233, 30, 99, 0.1);
}
</style>

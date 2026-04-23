<template>
    <q-page class="main-page" id="">
        <!-- Welcome Banner -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <q-card flat bordered class="welcome-banner gradient-marketer text-white q-pa-md">
                    <div class="row items-center">
                        <div class="col-12 col-md-8">
                            <div class="text-h5 text-weight-bold q-mb-xs">
                                <q-icon name="campaign" size="sm" class="q-mr-sm" />
                                Marketer Dashboard
                            </div>
                            <p class="text-body2 q-mb-none">
                                Track your invites, referrals, and earned points
                            </p>
                        </div>
                        <div class="col-12 col-md-4 text-right">
                            <q-btn
                                rounded
                                outline
                                color="white"
                                icon="person_add"
                                label="New Invite"
                                no-caps
                                unelevated
                                to="/invites/add"
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
                    <!-- Total Points Card -->
                    <div class="col-12 col-sm-6 col-md-3">
                        <q-card flat bordered class="stat-card shadow-2 hover-lift full-height">
                            <q-card-section class="text-center">
                                <q-icon name="stars" size="48px" color="amber" />
                                <div class="text-h5 text-weight-bold q-mt-sm">
                                    <span v-if="!loading.earnings">{{ earningsData.total_points }}</span>
                                    <q-spinner v-else size="24px" color="amber" />
                                </div>
                                <div class="text-caption text-grey-7">Total Points</div>
                                <div class="text-caption text-amber q-mt-xs">
                                    Redeemable: {{ earningsData.available_points }}
                                    <q-btn flat dense size="sm" color="amber" label="Redeem" @click="goToRedeem" class="q-ml-xs" />
                                </div>
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Total Earned Card -->
                    <div class="col-12 col-sm-6 col-md-3">
                        <q-card flat bordered class="stat-card shadow-2 hover-lift full-height">
                            <q-card-section class="text-center">
                                <q-icon name="paid" size="48px" color="positive" />
                                <div class="text-h5 text-weight-bold q-mt-sm">
                                    <span v-if="!loading.earnings">KES {{ formatCurrency(earningsData.total_earnings) }}</span>
                                    <q-spinner v-else size="24px" color="positive" />
                                </div>
                                <div class="text-caption text-grey-7">Total Earned</div>
                                <div class="text-caption text-positive q-mt-xs">
                                    Commission + Points
                                </div>
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Pending Withdrawal Card -->
                    <div class="col-12 col-sm-6 col-md-3">
                        <q-card flat bordered class="stat-card shadow-2 hover-lift full-height">
                            <q-card-section class="text-center">
                                <q-icon name="account_balance_wallet" size="48px" color="info" />
                                <div class="text-h5 text-weight-bold q-mt-sm">
                                    <span v-if="!loading.earnings">KES {{ formatCurrency(earningsData.pending_earnings) }}</span>
                                    <q-spinner v-else size="24px" color="info" />
                                </div>
                                <div class="text-caption text-grey-7">Pending Withdrawal</div>
                                <q-btn flat dense size="sm" color="info" label="Withdraw" @click="goToWithdraw" class="q-mt-xs" />
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Commission Rate Card -->
                    <div class="col-12 col-sm-6 col-md-3">
                        <q-card flat bordered class="stat-card shadow-2 hover-lift full-height">
                            <q-card-section class="text-center">
                                <q-icon name="percent" size="48px" color="secondary" />
                                <div class="text-h5 text-weight-bold q-mt-sm">
                                    <span v-if="!loading.earnings">{{ (earningsData.commission_rate * 100).toFixed(0) }}%</span>
                                    <q-spinner v-else size="24px" color="secondary" />
                                </div>
                                <div class="text-caption text-grey-7">Commission Rate</div>
                                <div class="text-caption text-secondary q-mt-xs">
                                    1 pt = KES {{ earningsData.point_value }}
                                </div>
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
                            to="/invites/add"
                        >
                            <div class="column items-center">
                                <q-icon name="person_add" size="32px" color="primary" />
                                <div class="text-caption q-mt-xs">Send Invite</div>
                            </div>
                        </q-btn>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-btn
                            flat
                            class="full-width action-btn"
                            to="/invites"
                        >
                            <div class="column items-center">
                                <q-icon name="list" size="32px" color="secondary" />
                                <div class="text-caption q-mt-xs">View Invites</div>
                            </div>
                        </q-btn>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-btn
                            flat
                            class="full-width action-btn"
                            to="/marketer-earnings"
                        >
                            <div class="column items-center">
                                <q-icon name="account_balance_wallet" size="32px" color="positive" />
                                <div class="text-caption q-mt-xs">Earnings</div>
                            </div>
                        </q-btn>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-btn
                            flat
                            class="full-width action-btn"
                            to="/marketer-redeem"
                        >
                            <div class="column items-center">
                                <q-icon name="redeem" size="32px" color="amber" />
                                <div class="text-caption q-mt-xs">Redeem Points</div>
                            </div>
                        </q-btn>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-btn
                            flat
                            class="full-width action-btn"
                            to="/marketer-withdraw"
                        >
                            <div class="column items-center">
                                <q-icon name="payments" size="32px" color="info" />
                                <div class="text-caption q-mt-xs">Withdraw</div>
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

        <!-- Performance Chart & Recent Activity -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-md">
                    <!-- Performance Chart -->
                    <div class="col-12 col-md-8">
                        <q-card flat bordered class="shadow-2 full-height">
                            <q-card-section class="bg-primary text-white">
                                <div class="text-h6 text-weight-bold">
                                    <q-icon name="show_chart" class="q-mr-xs" />
                                    Performance Overview
                                </div>
                            </q-card-section>
                            <q-card-section>
                                <template v-if="!loading.performance">
                                    <div class="row q-col-gutter-md">
                                        <div class="col-12 col-sm-4">
                                            <div class="stat-box text-center q-pa-md bg-blue-1 rounded-borders">
                                                <q-icon name="email" size="32px" color="primary" />
                                                <div class="text-h6 text-weight-bold text-primary q-mt-sm">
                                                    {{ performanceData.weeklyInvites }}
                                                </div>
                                                <div class="text-caption text-grey-7">This Week</div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-sm-4">
                                            <div class="stat-box text-center q-pa-md bg-green-1 rounded-borders">
                                                <q-icon name="check_circle" size="32px" color="positive" />
                                                <div class="text-h6 text-weight-bold text-positive q-mt-sm">
                                                    {{ performanceData.monthlyConversions }}
                                                </div>
                                                <div class="text-caption text-grey-7">This Month</div>
                                            </div>
                                        </div>
                                        <div class="col-12 col-sm-4">
                                            <div class="stat-box text-center q-pa-md bg-amber-1 rounded-borders">
                                                <q-icon name="workspace_premium" size="32px" color="amber" />
                                                <div class="text-h6 text-weight-bold text-amber q-mt-sm">
                                                    {{ performanceData.monthlyPoints }}
                                                </div>
                                                <div class="text-caption text-grey-7">Points Earned</div>
                                            </div>
                                        </div>
                                    </div>
                                    <q-separator class="q-my-md" />
                                    <div class="text-subtitle2 text-weight-medium q-mb-sm">Monthly Trend</div>
                                    <q-linear-progress
                                        :value="performanceData.targetProgress / 100"
                                        color="primary"
                                        size="20px"
                                        class="q-mb-xs"
                                    >
                                        <div class="absolute-full flex flex-center">
                                            <q-badge color="white" text-color="primary" :label="`${performanceData.targetProgress}% of target`" />
                                        </div>
                                    </q-linear-progress>
                                </template>
                                <template v-else>
                                    <div class="text-center q-py-xl">
                                        <q-spinner size="40px" color="primary" />
                                        <p class="text-caption text-grey q-mt-sm">Loading performance data...</p>
                                    </div>
                                </template>
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Activity Timeline -->
                    <div class="col-12 col-md-4">
                        <q-card flat bordered class="shadow-2 full-height">
                            <q-card-section class="bg-secondary text-white">
                                <div class="text-h6 text-weight-bold">
                                    <q-icon name="history" class="q-mr-xs" />
                                    Recent Activity
                                </div>
                            </q-card-section>
                            <q-card-section class="q-pa-none">
                                <template v-if="!loading.activity">
                                    <q-timeline color="primary" class="q-pa-md">
                                        <q-timeline-entry
                                            v-for="(activity, index) in recentActivity"
                                            :key="index"
                                            :icon="activity.icon"
                                            :color="activity.color"
                                            :subtitle="activity.time"
                                        >
                                            <div class="text-weight-medium">{{ activity.title }}</div>
                                            <div class="text-caption text-grey-7">{{ activity.description }}</div>
                                        </q-timeline-entry>
                                    </q-timeline>
                                    <div v-if="recentActivity.length === 0" class="text-center q-pa-lg text-grey-7">
                                        <q-icon name="history" size="48px" />
                                        <div class="q-mt-sm">No recent activity</div>
                                    </div>
                                </template>
                                <template v-else>
                                    <div class="text-center q-py-xl">
                                        <q-spinner size="40px" color="secondary" />
                                        <p class="text-caption text-grey q-mt-sm">Loading activity...</p>
                                    </div>
                                </template>
                            </q-card-section>
                        </q-card>
                    </div>
                </div>
            </div>
        </section>

        <!-- Invites List Section -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <div class="text-h6 text-weight-medium q-mb-md">
                    <q-icon name="mail" class="q-mr-xs" />
                    Recent Invites
                </div>
                <q-card flat bordered class="shadow-2">
                    <div class="reset-grid">
                        <list-invites-page
                            ref="invitesListPage"
                            :limit="10"
                            :show-header="false"
                            :show-breadcrumbs="false"
                            :show-footer="true"
                            :paginate="true"
                            page-store-key="MARKETER-DASHBOARD-INVITES"
                            is-sub-page
                        />
                    </div>
                </q-card>
            </div>
        </section>

        <!-- Referral Link Dialog -->
        <q-dialog v-model="showReferralDialog">
            <q-card style="min-width: 350px">
                <q-card-section class="bg-primary text-white">
                    <div class="text-h6">Your Referral Link</div>
                </q-card-section>

                <q-card-section>
                    <q-input
                        v-model="referralLink"
                        readonly
                        outlined
                        dense
                    >
                        <template v-slot:append>
                            <q-btn
                                flat
                                dense
                                icon="content_copy"
                                @click="copyReferralLink"
                            >
                                <q-tooltip>Copy to clipboard</q-tooltip>
                            </q-btn>
                        </template>
                    </q-input>
                    <div class="text-caption text-grey-7 q-mt-sm">
                        Share this link to earn referral points
                    </div>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Close" color="primary" v-close-popup />
                    <q-btn
                        unelevated
                        label="Share"
                        color="primary"
                        icon="share"
                        @click="shareReferralLink"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useApp } from 'src/composables/app.js';
import { useAuth } from 'src/composables/auth.js';
import { ApiService } from 'src/services/api';
import listInvitesPage from "../invites/list.vue";

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
const router = useRouter();

const pageReady = ref(true);
const showReferralDialog = ref(false);
const invitesListPage = ref(null);

// Reactive data stores
const dashboardData = ref({
    conversionRate: 0,
    activeReferrals: 0,
    weeklyGrowth: 0
});

const performanceData = ref({
    weeklyInvites: 0,
    monthlyConversions: 0,
    monthlyPoints: 0,
    targetProgress: 0
});

const recentActivity = ref([]);

// Earnings data
const earningsData = ref({
    total_points: 0,
    redeemed_points: 0,
    available_points: 0,
    point_value: 10,
    potential_cash: 0,
    commission_rate: 0.10,
    total_earnings: 0,
    pending_earnings: 0,
    withdrawn_earnings: 0
});

// Loading states
const loading = ref({
    dashboard: false,
    performance: false,
    activity: false,
    earnings: false
});

const referralLink = computed(() => {
    const baseUrl = window.location.origin;
    const userId = auth.user?.id || auth.user?.user_id || 'USER';
    return `${baseUrl}/ref/${userId}`;
});

// Format currency
const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Fetch earnings data
const fetchEarningsData = async () => {
    loading.value.earnings = true;
    try {
        const response = await ApiService.get("components_data/marketer_earnings_summary");
        const data = response.data || {};
        earningsData.value = {
            total_points: data.total_points || 0,
            redeemed_points: data.redeemed_points || 0,
            available_points: data.available_points || 0,
            point_value: data.point_value || 10,
            potential_cash: data.potential_cash || 0,
            commission_rate: data.commission_rate || 0.10,
            total_earnings: data.total_earnings || 0,
            pending_earnings: data.pending_earnings || 0,
            withdrawn_earnings: data.withdrawn_earnings || 0
        };
    } catch (err) {
        console.error("Error fetching earnings data:", err);
    } finally {
        loading.value.earnings = false;
    }
};

// Fetch dashboard data
const fetchDashboardData = async () => {
    loading.value.dashboard = true;
    try {
        const response = await ApiService.get("components_data/marketer_dashboard_data");
        const data = Array.isArray(response.data) ? response.data[0] || {} : response.data;

        dashboardData.value = {
            conversionRate: data.conversion_rate || 0,
            activeReferrals: data.active_referrals || 0,
            weeklyGrowth: data.weekly_growth || 0
        };
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        // Set default values on error
        dashboardData.value = {
            conversionRate: 0,
            activeReferrals: 0,
            weeklyGrowth: 0
        };
    } finally {
        loading.value.dashboard = false;
    }
};

// Fetch performance data
const fetchPerformanceData = async () => {
    loading.value.performance = true;
    try {
        const response = await ApiService.get("components_data/marketer_performance_data");
        const data = Array.isArray(response.data) ? response.data[0] || {} : response.data;

        performanceData.value = {
            weeklyInvites: data.weekly_invites || 0,
            monthlyConversions: data.monthly_conversions || 0,
            monthlyPoints: data.monthly_points || 0,
            targetProgress: data.target_progress || 0
        };
    } catch (err) {
        console.error("Error fetching performance data:", err);
        performanceData.value = {
            weeklyInvites: 0,
            monthlyConversions: 0,
            monthlyPoints: 0,
            targetProgress: 0
        };
    } finally {
        loading.value.performance = false;
    }
};

// Fetch recent activity
const fetchRecentActivity = async () => {
    loading.value.activity = true;
    try {
        const response = await ApiService.get("components_data/marketer_recent_activity");
        recentActivity.value = response.data || [];
    } catch (err) {
        console.error("Error fetching recent activity:", err);
        recentActivity.value = [];
    } finally {
        loading.value.activity = false;
    }
};

// Fetch all data
const fetchAllData = async () => {
    await Promise.all([
        fetchDashboardData(),
        fetchPerformanceData(),
        fetchRecentActivity(),
        fetchEarningsData()
    ]);
};

// Navigation methods
const goToRedeem = () => {
    router.push('/marketer-redeem');
};

const goToWithdraw = () => {
    router.push('/marketer-withdraw');
};

// Methods
const showReferralLink = () => {
    showReferralDialog.value = true;
};

const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink.value);
    $q.notify({
        type: 'positive',
        message: 'Referral link copied to clipboard!',
        position: 'top',
        timeout: 2000,
    });
};

const shareReferralLink = () => {
    if (navigator.share) {
        navigator.share({
            title: 'Join BTC Learning Platform',
            text: 'Join me on BTC Learning Platform and start your learning journey!',
            url: referralLink.value,
        }).catch(() => {
            copyReferralLink();
        });
    } else {
        copyReferralLink();
    }
};

const viewReports = () => {
    $q.notify({
        type: 'info',
        message: 'Reports feature coming soon!',
        position: 'top',
    });
};

const viewLeaderboard = () => {
    $q.notify({
        type: 'info',
        message: 'Leaderboard feature coming soon!',
        position: 'top',
    });
};

const refreshDashboard = () => {
    if (invitesListPage.value && invitesListPage.value.load) {
        invitesListPage.value.load();
    }
    fetchAllData();
    $q.notify({
        type: 'positive',
        message: 'Dashboard refreshed!',
        position: 'top',
        timeout: 1500,
    });
};

// Initialize on mount
onMounted(() => {
    fetchAllData();
});
</script>

<style scoped>
.welcome-banner {
    border-radius: 8px;
}

.gradient-marketer {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card {
    border-radius: 8px;
    transition: all 0.3s ease;
}

.hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
}

.action-btn {
    border-radius: 8px;
    padding: 16px 8px;
    transition: all 0.2s ease;
}

.action-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.stat-box {
    border-radius: 8px;
}

.full-height {
    height: 100%;
}
</style>

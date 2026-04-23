<template>
    <q-page class="main-page">
        <!-- Header -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <q-card flat bordered class="welcome-banner gradient-earnings text-white q-pa-md">
                    <div class="row items-center">
                        <div class="col-12 col-md-8">
                            <div class="text-h5 text-weight-bold q-mb-xs">
                                <q-icon name="account_balance_wallet" size="sm" class="q-mr-sm" />
                                My Earnings
                            </div>
                            <p class="text-body2 q-mb-none">
                                Track your commissions, redemptions, and withdrawals
                            </p>
                        </div>
                        <div class="col-12 col-md-4 text-right">
                            <q-btn
                                rounded outline color="white"
                                icon="refresh" label="Refresh"
                                no-caps unelevated
                                @click="fetchAllData"
                                class="q-mt-sm q-mt-md-none"
                            />
                        </div>
                    </div>
                </q-card>
            </div>
        </section>

        <!-- Earnings Summary -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6 col-md-3">
                        <q-card flat bordered class="stat-card shadow-2 full-height">
                            <q-card-section class="text-center">
                                <q-icon name="paid" size="48px" color="positive" />
                                <div class="text-h6 text-weight-bold q-mt-sm">KES {{ formatCurrency(summary.total_earnings) }}</div>
                                <div class="text-caption text-grey-7">Total Earned</div>
                            </q-card-section>
                        </q-card>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                        <q-card flat bordered class="stat-card shadow-2 full-height">
                            <q-card-section class="text-center">
                                <q-icon name="account_balance_wallet" size="48px" color="info" />
                                <div class="text-h6 text-weight-bold q-mt-sm">KES {{ formatCurrency(summary.pending_earnings) }}</div>
                                <div class="text-caption text-grey-7">Available for Withdrawal</div>
                            </q-card-section>
                        </q-card>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                        <q-card flat bordered class="stat-card shadow-2 full-height">
                            <q-card-section class="text-center">
                                <q-icon name="check_circle" size="48px" color="positive" />
                                <div class="text-h6 text-weight-bold q-mt-sm">KES {{ formatCurrency(summary.withdrawn_earnings) }}</div>
                                <div class="text-caption text-grey-7">Already Withdrawn</div>
                            </q-card-section>
                        </q-card>
                    </div>
                    <div class="col-12 col-sm-6 col-md-3">
                        <q-card flat bordered class="stat-card shadow-2 full-height">
                            <q-card-section class="text-center">
                                <q-icon name="stars" size="48px" color="amber" />
                                <div class="text-h6 text-weight-bold q-mt-sm">{{ summary.available_points }}</div>
                                <div class="text-caption text-grey-7">Available Points</div>
                                <div class="text-caption text-amber">= KES {{ formatCurrency(summary.potential_cash) }}</div>
                            </q-card-section>
                        </q-card>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tabs: Commissions, Redemptions, Withdrawals -->
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <q-tabs v-model="activeTab" class="text-primary" align="left" active-color="primary" indicator-color="primary">
                    <q-tab name="commissions" label="Commissions" icon="percent" />
                    <q-tab name="redemptions" label="Point Redemptions" icon="redeem" />
                    <q-tab name="withdrawals" label="Withdrawals" icon="payments" />
                </q-tabs>
                <q-separator />

                <q-tab-panels v-model="activeTab" animated>
                    <!-- Commissions Tab -->
                    <q-tab-panel name="commissions">
                        <q-markup-table flat bordered>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Purchase Amount</th>
                                    <th>Rate</th>
                                    <th>Commission</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="c in commissions" :key="c.id">
                                    <td>{{ formatDate(c.created_at) }}</td>
                                    <td>{{ c.purchase_type }}</td>
                                    <td>KES {{ formatCurrency(c.purchase_amount) }}</td>
                                    <td>{{ (c.commission_rate * 100).toFixed(1) }}%</td>
                                    <td class="text-positive text-weight-bold">KES {{ formatCurrency(c.commission_amount) }}</td>
                                    <td><q-badge :color="statusColor(c.status)">{{ c.status }}</q-badge></td>
                                </tr>
                                <tr v-if="commissions.length === 0">
                                    <td colspan="6" class="text-center text-grey-7">No commissions yet</td>
                                </tr>
                            </tbody>
                        </q-markup-table>
                    </q-tab-panel>

                    <!-- Redemptions Tab -->
                    <q-tab-panel name="redemptions">
                        <q-markup-table flat bordered>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Points</th>
                                    <th>Point Value</th>
                                    <th>Cash Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="r in redemptions" :key="r.id">
                                    <td>{{ formatDate(r.created_at) }}</td>
                                    <td>{{ r.points_redeemed }}</td>
                                    <td>KES {{ formatCurrency(r.point_value) }}</td>
                                    <td class="text-weight-bold">KES {{ formatCurrency(r.cash_amount) }}</td>
                                    <td><q-badge :color="statusColor(r.status)">{{ r.status }}</q-badge></td>
                                </tr>
                                <tr v-if="redemptions.length === 0">
                                    <td colspan="5" class="text-center text-grey-7">No redemption requests yet</td>
                                </tr>
                            </tbody>
                        </q-markup-table>
                    </q-tab-panel>

                    <!-- Withdrawals Tab -->
                    <q-tab-panel name="withdrawals">
                        <q-markup-table flat bordered>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Phone</th>
                                    <th>M-Pesa Receipt</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="w in withdrawals" :key="w.id">
                                    <td>{{ formatDate(w.created_at) }}</td>
                                    <td class="text-weight-bold">KES {{ formatCurrency(w.amount) }}</td>
                                    <td>{{ w.phone_number }}</td>
                                    <td>{{ w.mpesa_receipt || '-' }}</td>
                                    <td><q-badge :color="statusColor(w.status)">{{ w.status }}</q-badge></td>
                                </tr>
                                <tr v-if="withdrawals.length === 0">
                                    <td colspan="5" class="text-center text-grey-7">No withdrawal requests yet</td>
                                </tr>
                            </tbody>
                        </q-markup-table>
                    </q-tab-panel>
                </q-tab-panels>
            </div>
        </section>
    </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { ApiService } from 'src/services/api';

const $q = useQuasar();
const activeTab = ref('commissions');

const summary = ref({
    total_earnings: 0,
    pending_earnings: 0,
    withdrawn_earnings: 0,
    available_points: 0,
    potential_cash: 0
});

const commissions = ref([]);
const redemptions = ref([]);
const withdrawals = ref([]);

const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
};

const statusColor = (status) => {
    const colors = { pending: 'warning', approved: 'positive', rejected: 'negative', completed: 'positive', processing: 'info', failed: 'negative' };
    return colors[status] || 'grey';
};

const fetchSummary = async () => {
    try {
        const response = await ApiService.get('marketer_earnings/summary');
        summary.value = response.data || summary.value;
    } catch (err) {
        console.error('Error fetching summary:', err);
    }
};

const fetchCommissions = async () => {
    try {
        const response = await ApiService.get('marketer_earnings/commissions');
        commissions.value = response.data?.records || [];
    } catch (err) {
        console.error('Error fetching commissions:', err);
    }
};

const fetchRedemptions = async () => {
    try {
        const response = await ApiService.get('marketer_earnings/redemptions');
        redemptions.value = response.data?.records || [];
    } catch (err) {
        console.error('Error fetching redemptions:', err);
    }
};

const fetchWithdrawals = async () => {
    try {
        const response = await ApiService.get('marketer_earnings/withdrawals');
        withdrawals.value = response.data?.records || [];
    } catch (err) {
        console.error('Error fetching withdrawals:', err);
    }
};

const fetchAllData = async () => {
    await Promise.all([fetchSummary(), fetchCommissions(), fetchRedemptions(), fetchWithdrawals()]);
};

onMounted(() => {
    fetchAllData();
});
</script>

<style scoped>
.gradient-earnings {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}
.stat-card {
    border-radius: 8px;
    transition: all 0.3s ease;
}
.hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
}
</style>

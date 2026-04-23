<template>
    <q-page class="main-page">
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container-fluid">
                <!-- Dashboard Stats -->
                <div class="text-h5 text-weight-bold q-mb-md">
                    <q-icon name="admin_panel_settings" class="q-mr-sm" />
                    Marketer Management Dashboard
                </div>

                <div class="row q-col-gutter-md q-mb-lg">
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-card flat bordered class="shadow-2 text-center q-pa-md">
                            <q-icon name="people" size="32px" color="primary" />
                            <div class="text-h6 text-weight-bold">{{ stats.total_marketers }}</div>
                            <div class="text-caption text-grey-7">Total Marketers</div>
                        </q-card>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-card flat bordered class="shadow-2 text-center q-pa-md">
                            <q-icon name="paid" size="32px" color="positive" />
                            <div class="text-h6 text-weight-bold">KES {{ formatCurrency(stats.total_earnings) }}</div>
                            <div class="text-caption text-grey-7">Total Earnings</div>
                        </q-card>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-card flat bordered class="shadow-2 text-center q-pa-md">
                            <q-icon name="account_balance_wallet" size="32px" color="warning" />
                            <div class="text-h6 text-weight-bold">KES {{ formatCurrency(stats.pending_payouts) }}</div>
                            <div class="text-caption text-grey-7">Pending Payouts</div>
                        </q-card>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-card flat bordered class="shadow-2 text-center q-pa-md">
                            <q-icon name="check_circle" size="32px" color="positive" />
                            <div class="text-h6 text-weight-bold">KES {{ formatCurrency(stats.withdrawn_total) }}</div>
                            <div class="text-caption text-grey-7">Total Withdrawn</div>
                        </q-card>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-card flat bordered class="shadow-2 text-center q-pa-md">
                            <q-icon name="redeem" size="32px" color="amber" />
                            <div class="text-h6 text-weight-bold">{{ stats.pending_redemptions }}</div>
                            <div class="text-caption text-grey-7">Pending Redemptions</div>
                        </q-card>
                    </div>
                    <div class="col-6 col-sm-4 col-md-2">
                        <q-card flat bordered class="shadow-2 text-center q-pa-md">
                            <q-icon name="payments" size="32px" color="info" />
                            <div class="text-h6 text-weight-bold">{{ stats.pending_withdrawals }}</div>
                            <div class="text-caption text-grey-7">Pending Withdrawals</div>
                        </q-card>
                    </div>
                </div>

                <!-- Tabs: Marketers, Redemptions, Withdrawals, Settings -->
                <q-tabs v-model="activeTab" class="text-primary" align="left" active-color="primary" indicator-color="primary">
                    <q-tab name="marketers" label="All Marketers" icon="people" />
                    <q-tab name="redemptions" label="Redemptions" icon="redeem" />
                    <q-tab name="withdrawals" label="Withdrawals" icon="payments" />
                    <q-tab name="commissions" label="Commissions" icon="percent" />
                    <q-tab name="settings" label="Settings" icon="settings" />
                </q-tabs>
                <q-separator />

                <q-tab-panels v-model="activeTab" animated>
                    <!-- Marketers Tab -->
                    <q-tab-panel name="marketers">
                        <q-input v-model="searchQuery" dense outlined placeholder="Search marketers..." class="q-mb-md" @keyup.enter="fetchMarketers">
                            <template v-slot:append>
                                <q-icon name="search" @click="fetchMarketers" class="cursor-pointer" />
                            </template>
                        </q-input>

                        <q-markup-table flat bordered dense>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Referral Code</th>
                                    <th>Points</th>
                                    <th>Commission Rate</th>
                                    <th>Total Earned</th>
                                    <th>Pending</th>
                                    <th>Withdrawn</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="m in marketers" :key="m.id">
                                    <td>{{ m.id }}</td>
                                    <td>{{ m.name }}</td>
                                    <td>{{ m.phone }}</td>
                                    <td><code>{{ m.referral_code }}</code></td>
                                    <td>{{ m.points || 0 }}</td>
                                    <td>{{ ((m.commission_rate || 0.10) * 100).toFixed(1) }}%</td>
                                    <td>KES {{ formatCurrency(m.total_earnings) }}</td>
                                    <td>KES {{ formatCurrency(m.pending_earnings) }}</td>
                                    <td>KES {{ formatCurrency(m.withdrawn_earnings) }}</td>
                                    <td>
                                        <q-btn flat dense color="primary" icon="visibility" @click="viewMarketer(m)" />
                                        <q-btn flat dense color="amber" icon="edit" @click="editMarketerRate(m)" />
                                        <q-btn flat dense color="positive" icon="add" @click="adjustPoints(m, 'add')" />
                                        <q-btn flat dense color="negative" icon="remove" @click="adjustPoints(m, 'subtract')" />
                                    </td>
                                </tr>
                            </tbody>
                        </q-markup-table>
                    </q-tab-panel>

                    <!-- Redemptions Tab -->
                    <q-tab-panel name="redemptions">
                        <div class="row q-mb-md q-gutter-sm">
                            <q-select v-model="redemptionFilter" :options="['all', 'pending', 'approved', 'rejected']" label="Status" outlined dense style="width: 150px" @update:model-value="fetchRedemptions" />
                        </div>
                        <q-markup-table flat bordered>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Marketer ID</th>
                                    <th>Points</th>
                                    <th>Cash Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="r in redemptions" :key="r.id">
                                    <td>{{ r.id }}</td>
                                    <td>{{ r.marketer_id }}</td>
                                    <td>{{ r.points_redeemed }}</td>
                                    <td class="text-weight-bold">KES {{ formatCurrency(r.cash_amount) }}</td>
                                    <td>{{ formatDate(r.created_at) }}</td>
                                    <td><q-badge :color="statusColor(r.status)">{{ r.status }}</q-badge></td>
                                    <td>
                                        <q-btn v-if="r.status === 'pending'" flat dense color="positive" icon="check" @click="approveRedemption(r.id)" :loading="processing === r.id" />
                                        <q-btn v-if="r.status === 'pending'" flat dense color="negative" icon="close" @click="rejectRedemption(r.id)" :loading="processing === r.id" />
                                    </td>
                                </tr>
                            </tbody>
                        </q-markup-table>
                    </q-tab-panel>

                    <!-- Withdrawals Tab -->
                    <q-tab-panel name="withdrawals">
                        <div class="row q-mb-md q-gutter-sm">
                            <q-select v-model="withdrawalFilter" :options="['all', 'pending', 'processing', 'completed', 'failed']" label="Status" outlined dense style="width: 150px" @update:model-value="fetchWithdrawals" />
                        </div>
                        <q-markup-table flat bordered>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Marketer ID</th>
                                    <th>Amount</th>
                                    <th>Phone</th>
                                    <th>M-Pesa Receipt</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="w in withdrawals" :key="w.id">
                                    <td>{{ w.id }}</td>
                                    <td>{{ w.marketer_id }}</td>
                                    <td class="text-weight-bold">KES {{ formatCurrency(w.amount) }}</td>
                                    <td>{{ w.phone_number }}</td>
                                    <td>{{ w.mpesa_receipt || '-' }}</td>
                                    <td>{{ formatDate(w.created_at) }}</td>
                                    <td><q-badge :color="statusColor(w.status)">{{ w.status }}</q-badge></td>
                                    <td>
                                        <q-btn v-if="w.status === 'pending'" flat dense color="info" icon="send" @click="processWithdrawal(w.id)" :loading="processing === w.id" label="Process" />
                                    </td>
                                </tr>
                            </tbody>
                        </q-markup-table>
                    </q-tab-panel>

                    <!-- Commissions Tab -->
                    <q-tab-panel name="commissions">
                        <q-markup-table flat bordered>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Marketer ID</th>
                                    <th>User ID</th>
                                    <th>Type</th>
                                    <th>Purchase Amt</th>
                                    <th>Rate</th>
                                    <th>Commission</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="c in commissions" :key="c.id">
                                    <td>{{ c.id }}</td>
                                    <td>{{ c.marketer_id }}</td>
                                    <td>{{ c.user_id }}</td>
                                    <td>{{ c.purchase_type }}</td>
                                    <td>KES {{ formatCurrency(c.purchase_amount) }}</td>
                                    <td>{{ (c.commission_rate * 100).toFixed(1) }}%</td>
                                    <td class="text-positive text-weight-bold">KES {{ formatCurrency(c.commission_amount) }}</td>
                                    <td>{{ formatDate(c.created_at) }}</td>
                                </tr>
                            </tbody>
                        </q-markup-table>
                    </q-tab-panel>

                    <!-- Settings Tab -->
                    <q-tab-panel name="settings">
                        <div class="text-h6 q-mb-md">Commission Settings</div>
                        <q-form @submit="saveSettings" class="q-gutter-md">
                            <div class="row q-col-gutter-md">
                                <div class="col-12 col-md-6">
                                    <q-input v-model.number="settings.default_commission_rate" type="number" step="0.01" label="Default Commission Rate (0.10 = 10%)" outlined />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input v-model.number="settings.point_value" type="number" step="0.01" label="Point Value (KES)" outlined />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input v-model.number="settings.min_withdrawal_amount" type="number" step="0.01" label="Minimum Withdrawal Amount (KES)" outlined />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input v-model.number="settings.min_points_redemption" type="number" label="Minimum Points for Redemption" outlined />
                                </div>
                            </div>
                            <q-btn type="submit" color="primary" label="Save Settings" :loading="savingSettings" unelevated />
                        </q-form>
                    </q-tab-panel>
                </q-tab-panels>
            </div>
        </section>

        <!-- Marketer Detail Dialog -->
        <q-dialog v-model="showMarketerDialog" maximized>
            <q-card>
                <q-toolbar class="bg-primary text-white">
                    <q-toolbar-title>Marketer Details: {{ selectedMarketer?.name }}</q-toolbar-title>
                    <q-btn flat round dense icon="close" v-close-popup />
                </q-toolbar>
                <q-card-section v-if="selectedMarketer">
                    <div class="row q-col-gutter-md">
                        <div class="col-12 col-md-6">
                            <q-card flat bordered>
                                <q-card-section>
                                    <div class="text-h6">Profile</div>
                                    <q-list dense>
                                        <q-item><q-item-section>Name: {{ selectedMarketer.name }}</q-item-section></q-item>
                                        <q-item><q-item-section>Email: {{ selectedMarketer.email }}</q-item-section></q-item>
                                        <q-item><q-item-section>Phone: {{ selectedMarketer.phone }}</q-item-section></q-item>
                                        <q-item><q-item-section>Referral Code: <code>{{ selectedMarketer.referral_code }}</code></q-item-section></q-item>
                                        <q-item><q-item-section>Points: {{ selectedMarketer.points || 0 }}</q-item-section></q-item>
                                        <q-item><q-item-section>Commission Rate: {{ ((selectedMarketer.commission_rate || 0.10) * 100).toFixed(1) }}%</q-item-section></q-item>
                                    </q-list>
                                </q-card-section>
                            </q-card>
                        </div>
                        <div class="col-12 col-md-6">
                            <q-card flat bordered>
                                <q-card-section>
                                    <div class="text-h6">Earnings</div>
                                    <q-list dense>
                                        <q-item><q-item-section>Total Earned: KES {{ formatCurrency(selectedMarketer.total_earnings) }}</q-item-section></q-item>
                                        <q-item><q-item-section>Pending: KES {{ formatCurrency(selectedMarketer.pending_earnings) }}</q-item-section></q-item>
                                        <q-item><q-item-section>Withdrawn: KES {{ formatCurrency(selectedMarketer.withdrawn_earnings) }}</q-item-section></q-item>
                                    </q-list>
                                </q-card-section>
                            </q-card>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- Edit Commission Rate Dialog -->
        <q-dialog v-model="showRateDialog">
            <q-card style="min-width: 350px">
                <q-card-section>
                    <div class="text-h6">Edit Commission Rate</div>
                </q-card-section>
                <q-card-section>
                    <q-input v-model.number="newCommissionRate" type="number" step="0.01" label="Commission Rate (0.10 = 10%)" outlined />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cancel" v-close-popup />
                    <q-btn color="primary" label="Save" @click="saveCommissionRate" :loading="processing" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { ApiService } from 'src/services/api';

const $q = useQuasar();
const activeTab = ref('marketers');
const processing = ref(null);
const savingSettings = ref(false);
const searchQuery = ref('');
const redemptionFilter = ref('all');
const withdrawalFilter = ref('all');

const stats = ref({
    total_marketers: 0,
    total_earnings: 0,
    pending_payouts: 0,
    withdrawn_total: 0,
    pending_redemptions: 0,
    pending_withdrawals: 0
});

const marketers = ref([]);
const redemptions = ref([]);
const withdrawals = ref([]);
const commissions = ref([]);
const settings = ref({
    default_commission_rate: 0.10,
    point_value: 10.00,
    min_withdrawal_amount: 100.00,
    min_points_redemption: 10
});

const showMarketerDialog = ref(false);
const selectedMarketer = ref(null);
const showRateDialog = ref(false);
const newCommissionRate = ref(0.10);
const editingMarketerId = ref(null);

const formatCurrency = (v) => parseFloat(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
const statusColor = (s) => ({ pending: 'warning', approved: 'positive', rejected: 'negative', completed: 'positive', processing: 'info', failed: 'negative' }[s] || 'grey');

const fetchStats = async () => {
    try {
        const r = await ApiService.get('marketer_earnings/admin/dashboard-stats');
        stats.value = r.data || stats.value;
    } catch (e) { console.error(e); }
};

const fetchMarketers = async () => {
    try {
        const r = await ApiService.get(`marketer_earnings/admin/marketers?search=${searchQuery.value}`);
        marketers.value = r.data?.records || [];
    } catch (e) { console.error(e); }
};

const fetchRedemptions = async () => {
    try {
        const status = redemptionFilter.value === 'all' ? '' : redemptionFilter.value;
        const r = await ApiService.get(`marketer_earnings/admin/all-redemptions?status=${status}`);
        redemptions.value = r.data?.records || [];
    } catch (e) { console.error(e); }
};

const fetchWithdrawals = async () => {
    try {
        const status = withdrawalFilter.value === 'all' ? '' : withdrawalFilter.value;
        const r = await ApiService.get(`marketer_earnings/admin/all-withdrawals?status=${status}`);
        withdrawals.value = r.data?.records || [];
    } catch (e) { console.error(e); }
};

const fetchCommissions = async () => {
    try {
        const r = await ApiService.get('marketer_earnings/admin/all-commissions');
        commissions.value = r.data?.records || [];
    } catch (e) { console.error(e); }
};

const fetchSettings = async () => {
    try {
        const r = await ApiService.get('marketer_earnings/settings');
        const d = r.data || {};
        settings.value = {
            default_commission_rate: parseFloat(d.default_commission_rate) || 0.10,
            point_value: parseFloat(d.point_value) || 10.00,
            min_withdrawal_amount: parseFloat(d.min_withdrawal_amount) || 100.00,
            min_points_redemption: parseInt(d.min_points_redemption) || 10
        };
    } catch (e) { console.error(e); }
};

const viewMarketer = (m) => { selectedMarketer.value = m; showMarketerDialog.value = true; };

const editMarketerRate = (m) => {
    editingMarketerId.value = m.id;
    newCommissionRate.value = m.commission_rate || 0.10;
    showRateDialog.value = true;
};

const saveCommissionRate = async () => {
    processing.value = true;
    try {
        await ApiService.put(`marketer_earnings/commission-rate/${editingMarketerId.value}`, { commission_rate: newCommissionRate.value });
        $q.notify({ type: 'positive', message: 'Commission rate updated' });
        showRateDialog.value = false;
        await fetchMarketers();
    } catch (e) {
        $q.notify({ type: 'negative', message: e.response?.data?.error || 'Failed to update' });
    } finally { processing.value = null; }
};

const adjustPoints = async (m, action) => {
    const amount = parseInt(prompt(`Enter points to ${action}:`));
    if (isNaN(amount) || amount <= 0) return;
    const adjustment = action === 'add' ? amount : -amount;
    try {
        await ApiService.put(`marketer_earnings/admin/marketer/${m.id}/points`, { adjustment, reason: `Admin ${action}` });
        $q.notify({ type: 'positive', message: `Points ${action === 'add' ? 'added' : 'subtracted'}` });
        await fetchMarketers();
    } catch (e) {
        $q.notify({ type: 'negative', message: e.response?.data?.error || 'Failed' });
    }
};

const approveRedemption = async (id) => {
    processing.value = id;
    try {
        await ApiService.post(`marketer_earnings/approve-redemption/${id}`);
        $q.notify({ type: 'positive', message: 'Redemption approved' });
        await Promise.all([fetchRedemptions(), fetchStats()]);
    } catch (e) {
        $q.notify({ type: 'negative', message: e.response?.data?.error || 'Failed' });
    } finally { processing.value = null; }
};

const rejectRedemption = async (id) => {
    processing.value = id;
    try {
        await ApiService.post(`marketer_earnings/reject-redemption/${id}`, { remarks: 'Rejected by admin' });
        $q.notify({ type: 'info', message: 'Redemption rejected' });
        await Promise.all([fetchRedemptions(), fetchStats()]);
    } catch (e) {
        $q.notify({ type: 'negative', message: e.response?.data?.error || 'Failed' });
    } finally { processing.value = null; }
};

const processWithdrawal = async (id) => {
    processing.value = id;
    try {
        await ApiService.post(`marketer_earnings/process-withdrawal/${id}`);
        $q.notify({ type: 'positive', message: 'Withdrawal processing initiated' });
        await Promise.all([fetchWithdrawals(), fetchStats()]);
    } catch (e) {
        $q.notify({ type: 'negative', message: e.response?.data?.error || 'Failed' });
    } finally { processing.value = null; }
};

const saveSettings = async () => {
    savingSettings.value = true;
    try {
        await ApiService.put('marketer_earnings/settings', settings.value);
        $q.notify({ type: 'positive', message: 'Settings saved' });
    } catch (e) {
        $q.notify({ type: 'negative', message: e.response?.data?.error || 'Failed' });
    } finally { savingSettings.value = false; }
};

onMounted(() => {
    fetchStats();
    fetchMarketers();
    fetchRedemptions();
    fetchWithdrawals();
    fetchCommissions();
    fetchSettings();
});
</script>

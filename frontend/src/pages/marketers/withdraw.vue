<template>
    <q-page class="main-page">
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container">
                <div class="row justify-center">
                    <div class="col-12 col-md-6">
                        <q-card flat bordered class="shadow-2">
                            <q-card-section class="bg-info text-white">
                                <div class="text-h6 text-weight-bold">
                                    <q-icon name="payments" class="q-mr-xs" />
                                    Withdraw Earnings
                                </div>
                            </q-card-section>

                            <q-card-section>
                                <div class="text-center q-mb-lg">
                                    <q-icon name="account_balance_wallet" size="64px" color="info" />
                                    <div class="text-h4 text-weight-bold q-mt-sm">KES {{ formatCurrency(pendingEarnings) }}</div>
                                    <div class="text-caption text-grey-7">Available for Withdrawal</div>
                                </div>

                                <q-form @submit="submitWithdrawal" class="q-gutter-md">
                                    <q-input
                                        v-model.number="withdrawAmount"
                                        type="number"
                                        label="Amount (KES)"
                                        outlined
                                        :rules="[
                                            val => val >= minWithdrawal || `Minimum KES ${minWithdrawal}`,
                                            val => val <= pendingEarnings || 'Insufficient balance'
                                        ]"
                                    >
                                        <template v-slot:hint>
                                            Minimum withdrawal: KES {{ minWithdrawal }}
                                        </template>
                                    </q-input>

                                    <q-input
                                        v-model="phoneNumber"
                                        label="M-Pesa Phone Number"
                                        outlined
                                        hint="Enter the phone number to receive M-Pesa payment"
                                        :rules="[val => !!val || 'Phone number is required']"
                                    />

                                    <q-btn
                                        type="submit"
                                        color="info"
                                        label="Request Withdrawal"
                                        icon="payments"
                                        class="full-width"
                                        :loading="submitting"
                                        :disable="withdrawAmount < minWithdrawal || withdrawAmount > pendingEarnings || !phoneNumber"
                                        unelevated
                                        size="lg"
                                    />
                                </q-form>
                            </q-card-section>
                        </q-card>

                        <!-- Recent Withdrawals -->
                        <q-card flat bordered class="shadow-2 q-mt-md">
                            <q-card-section>
                                <div class="text-h6 text-weight-medium q-mb-md">
                                    <q-icon name="history" class="q-mr-xs" />
                                    Recent Withdrawals
                                </div>
                                <q-list separator>
                                    <q-item v-for="w in recentWithdrawals" :key="w.id">
                                        <q-item-section>
                                            <q-item-label>KES {{ formatCurrency(w.amount) }}</q-item-label>
                                            <q-item-label caption>{{ w.phone_number }} - {{ formatDate(w.created_at) }}</q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-badge :color="statusColor(w.status)">{{ w.status }}</q-badge>
                                            <div v-if="w.mpesa_receipt" class="text-caption text-grey-6 q-mt-xs">
                                                Receipt: {{ w.mpesa_receipt }}
                                            </div>
                                        </q-item-section>
                                    </q-item>
                                    <q-item v-if="recentWithdrawals.length === 0">
                                        <q-item-section class="text-center text-grey-7">
                                            No withdrawal requests yet
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-card-section>
                        </q-card>
                    </div>
                </div>
            </div>
        </section>
    </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { ApiService } from 'src/services/api';

const $q = useQuasar();

const pendingEarnings = ref(0);
const minWithdrawal = ref(100);
const withdrawAmount = ref(0);
const phoneNumber = ref('');
const submitting = ref(false);
const recentWithdrawals = ref([]);

const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
};

const statusColor = (status) => {
    const colors = { pending: 'warning', processing: 'info', completed: 'positive', failed: 'negative' };
    return colors[status] || 'grey';
};

const fetchData = async () => {
    try {
        const response = await ApiService.get('marketer_earnings/summary');
        const data = response.data || {};
        pendingEarnings.value = data.pending_earnings || 0;
    } catch (err) {
        console.error('Error fetching data:', err);
    }
};

const fetchWithdrawals = async () => {
    try {
        const response = await ApiService.get('marketer_earnings/withdrawals?limit=5');
        recentWithdrawals.value = response.data?.records || [];
    } catch (err) {
        console.error('Error fetching withdrawals:', err);
    }
};

const fetchSettings = async () => {
    try {
        const response = await ApiService.get('marketer_earnings/settings');
        const data = response.data || {};
        minWithdrawal.value = parseFloat(data.min_withdrawal_amount) || 100;
    } catch (err) {
        // Settings might not be accessible, use defaults
    }
};

const submitWithdrawal = async () => {
    submitting.value = true;
    try {
        const response = await ApiService.post('marketer_earnings/withdraw', {
            amount: withdrawAmount.value,
            phone_number: phoneNumber.value
        });
        $q.notify({
            type: 'positive',
            message: response.data?.message || 'Withdrawal request submitted!',
            position: 'top'
        });
        withdrawAmount.value = 0;
        await Promise.all([fetchData(), fetchWithdrawals()]);
    } catch (err) {
        $q.notify({
            type: 'negative',
            message: err.response?.data?.error || 'Failed to submit withdrawal request',
            position: 'top'
        });
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    fetchData();
    fetchWithdrawals();
    fetchSettings();
});
</script>

<style scoped>
.main-page {
    background: #f5f5f5;
}
</style>

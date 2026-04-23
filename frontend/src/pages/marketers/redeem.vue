<template>
    <q-page class="main-page">
        <section class="page-section q-pa-sm q-pa-md-md">
            <div class="container">
                <div class="row justify-center">
                    <div class="col-12 col-md-6">
                        <q-card flat bordered class="shadow-2">
                            <q-card-section class="bg-amber text-white">
                                <div class="text-h6 text-weight-bold">
                                    <q-icon name="redeem" class="q-mr-xs" />
                                    Redeem Points
                                </div>
                            </q-card-section>

                            <q-card-section>
                                <div class="text-center q-mb-lg">
                                    <q-icon name="stars" size="64px" color="amber" />
                                    <div class="text-h4 text-weight-bold q-mt-sm">{{ availablePoints }}</div>
                                    <div class="text-caption text-grey-7">Available Points</div>
                                    <div class="text-subtitle1 text-amber q-mt-xs">
                                        = KES {{ formatCurrency(potentialCash) }}
                                    </div>
                                    <div class="text-caption text-grey-6">
                                        (1 point = KES {{ pointValue }})
                                    </div>
                                </div>

                                <q-form @submit="submitRedemption" class="q-gutter-md">
                                    <q-input
                                        v-model.number="pointsToRedeem"
                                        type="number"
                                        label="Points to Redeem"
                                        outlined
                                        :rules="[
                                            val => val >= minRedemption || `Minimum ${minRedemption} points required`,
                                            val => val <= availablePoints || 'Insufficient points'
                                        ]"
                                    >
                                        <template v-slot:hint>
                                            Minimum redemption: {{ minRedemption }} points
                                        </template>
                                    </q-input>

                                    <q-card flat bordered class="bg-grey-1">
                                        <q-card-section class="text-center">
                                            <div class="text-caption text-grey-7">You will receive</div>
                                            <div class="text-h5 text-weight-bold text-positive">
                                                KES {{ formatCurrency(cashAmount) }}
                                            </div>
                                            <div class="text-caption text-grey-6">
                                                Added to your pending earnings after admin approval
                                            </div>
                                        </q-card-section>
                                    </q-card>

                                    <q-btn
                                        type="submit"
                                        color="amber"
                                        text-color="dark"
                                        label="Request Redemption"
                                        icon="redeem"
                                        class="full-width"
                                        :loading="submitting"
                                        :disable="pointsToRedeem < minRedemption || pointsToRedeem > availablePoints"
                                        unelevated
                                        size="lg"
                                    />
                                </q-form>
                            </q-card-section>
                        </q-card>

                        <!-- Recent Redemptions -->
                        <q-card flat bordered class="shadow-2 q-mt-md">
                            <q-card-section>
                                <div class="text-h6 text-weight-medium q-mb-md">
                                    <q-icon name="history" class="q-mr-xs" />
                                    Recent Redemption Requests
                                </div>
                                <q-list separator>
                                    <q-item v-for="r in recentRedemptions" :key="r.id">
                                        <q-item-section>
                                            <q-item-label>{{ r.points_redeemed }} points</q-item-label>
                                            <q-item-label caption>{{ formatDate(r.created_at) }}</q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <div class="text-weight-bold">KES {{ formatCurrency(r.cash_amount) }}</div>
                                            <q-badge :color="statusColor(r.status)">{{ r.status }}</q-badge>
                                        </q-item-section>
                                    </q-item>
                                    <q-item v-if="recentRedemptions.length === 0">
                                        <q-item-section class="text-center text-grey-7">
                                            No redemption requests yet
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
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { ApiService } from 'src/services/api';

const $q = useQuasar();

const availablePoints = ref(0);
const pointValue = ref(10);
const minRedemption = ref(10);
const pointsToRedeem = ref(0);
const submitting = ref(false);
const recentRedemptions = ref([]);

const potentialCash = computed(() => availablePoints.value * pointValue.value);
const cashAmount = computed(() => (pointsToRedeem.value || 0) * pointValue.value);

const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
};

const statusColor = (status) => {
    const colors = { pending: 'warning', approved: 'positive', rejected: 'negative' };
    return colors[status] || 'grey';
};

const fetchData = async () => {
    try {
        const response = await ApiService.get('marketer_earnings/summary');
        const data = response.data || {};
        availablePoints.value = data.available_points || 0;
        pointValue.value = data.point_value || 10;
    } catch (err) {
        console.error('Error fetching data:', err);
    }
};

const fetchRedemptions = async () => {
    try {
        const response = await ApiService.get('marketer_earnings/redemptions?limit=5');
        recentRedemptions.value = response.data?.records || [];
    } catch (err) {
        console.error('Error fetching redemptions:', err);
    }
};

const fetchSettings = async () => {
    try {
        const response = await ApiService.get('marketer_earnings/settings');
        const data = response.data || {};
        minRedemption.value = parseInt(data.min_points_redemption) || 10;
    } catch (err) {
        // Settings might not be accessible, use defaults
    }
};

const submitRedemption = async () => {
    submitting.value = true;
    try {
        const response = await ApiService.post('marketer_earnings/redeem-points', {
            points_to_redeem: pointsToRedeem.value
        });
        $q.notify({
            type: 'positive',
            message: response.data?.message || 'Redemption request submitted!',
            position: 'top'
        });
        pointsToRedeem.value = 0;
        await Promise.all([fetchData(), fetchRedemptions()]);
    } catch (err) {
        $q.notify({
            type: 'negative',
            message: err.response?.data?.error || 'Failed to submit redemption request',
            position: 'top'
        });
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    fetchData();
    fetchRedemptions();
    fetchSettings();
});
</script>

<style scoped>
.main-page {
    background: #f5f5f5;
}
</style>

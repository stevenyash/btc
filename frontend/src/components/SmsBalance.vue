<template>
  <div class="q-pa-md">
    <q-badge
      :color="getBadgeColor()"
      rounded
      class="q-pa-sm"
    >
      <q-icon v-if="isLoading" name="hourglass_empty" class="q-mr-xs" size="16px" />
      <span v-else>SMS: {{ smsbalance }}</span>
    </q-badge>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ApiService } from "src/services/api";

const smsbalance = ref(0);
const isLoading = ref(false);

const getBadgeColor = () => {
  if (isLoading.value) return 'grey';
  if (smsbalance.value === 0) return 'red';
  if (smsbalance.value < 10) return 'orange';
  if (smsbalance.value < 50) return 'yellow';
  return 'green';
};

const fetchSmsBalance = async () => {
  isLoading.value = true;
  try {
    const response = await ApiService.get("components_data/smsbalance");
    smsbalance.value = response.data.balanceInfo.balance;
    //console.log("Fetched SMS balance:", response.data);
  } catch (error) {
    console.error("Error fetching SMS balance:", error);
    smsbalance.value = 0;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchSmsBalance();
});
</script>

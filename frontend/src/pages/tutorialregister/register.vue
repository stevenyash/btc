<template>
  <q-page class="flex flex-center" style="min-height: 500px;">
    <q-card class="q-pa-md q-mt-lg shadow-2" style="width: 350px; text-align: center;">
      <q-card-section>
        <h4>Get This Weekend Tutorial Access for only Ksh {{ amount }}/-</h4>
        <q-input
          v-model="email"
          type="email"
          label="Enter valid email"
          :rules="[val => !!val || 'Email is required', isValidEmail]"
        />
        <q-input
          v-model="phone"
          filled
          dense
          label="Enter payment number"
          class="q-mb-md"
          mask="### ### ######"
          unmasked-value
          hint="Format: 0712345678 or 254712345678"
          :rules="[
            val => !!val || 'Phone number is required',
            val => validateKenyanNumber(val) || 'Enter valid Kenyan number'
          ]"
        />
        <q-btn
          label="Click to pay"
          color="primary"
          unelevated
          class="full-width"
          :loading="isLoading"
          @click="initiateMpesa"
          :disable="!formValid"
        />
        <div v-if="feedbackMessage" class="q-mt-md text-caption text-weight-bold text-blue">
          {{ feedbackMessage }}
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuth } from 'src/composables/auth';
import { useQuasar } from 'quasar';
import { ApiService } from 'src/services/api';
import { utils } from 'src/utils';
import { useGuestStore } from 'src/stores/guestStore';

const props = defineProps({
  lessonId: {
    type: Number,
    required: true
  },
});

const emit = defineEmits(['paymentSuccess', 'updateFee']);

const $q = useQuasar();
const auth = useAuth();
const guestStore = useGuestStore();

const phone = ref(auth?.user?.phone || "254");
const amount = ref(1);
const email = ref("");
const isLoading = ref(false);
const transaction = ref(null);
const feedbackMessage = ref("");
const paymentConfirmed = ref(false);

onMounted(() => {
  getFee();
  // Initialize phone from store if available
  if (guestStore.phone) {
    phone.value = guestStore.phone;
  }
});

const formValid = computed(() => {
  return validateKenyanNumber(phone.value) && isValidEmail(email.value);
});

function validateKenyanNumber(number) {
  const cleaned = number.replace(/\D/g, '');
  return /^(?:254|\+254|0)?(7[0-9]{8})$/.test(cleaned);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatKenyanNumber(number) {
  const cleaned = number.replace(/\D/g, '');

  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }

  if (cleaned.startsWith('7') && cleaned.length === 9) {
    return `254${cleaned}`;
  }

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `254${cleaned.substring(1)}`;
  }

  return null;
}

async function getFee() {
  try {
    const response = await ApiService.get("tutorialssettings/index");
    amount.value = response.data.records[0].fee;
    emit('updateFee', amount.value); // Emit event to parent component
  } catch (error) {
    console.error("Error fetching fee:", error);
  }
}

async function initiateMpesa() {
  // Format phone number to 254 format
  const formattedPhone = formatKenyanNumber(phone.value);

  if (!formattedPhone) {
    $q.notify({ type: 'negative', message: 'Invalid phone number format' });
    return;
  }

  isLoading.value = true;
  feedbackMessage.value = "";

  try {
    // Store phone number in guest store
    guestStore.phone = formattedPhone;

    const response = await ApiService.post('components_data/propmtstk', {
      amount: amount.value,
      phone: formattedPhone,
      callback_Url: 'components_data/callback',
      transactionData: {
        phone_number: formattedPhone,
        amount: amount.value,
        checkout_request_id: "",
        transaction_reference: utils.dateTimeNow(),
        description: "tutorials",
        payment_status: "awaiting",
        details_id: props.lessonId,
        transactiondate: utils.dateTimeNow(),
        user_id: auth.userId,
      }
    });

    if (response.data.success) {
      transaction.value = response.data.transaction;
      pollPaymentStatus();
      $q.notify({ type: 'positive', message: 'Kindly input PIN to complete the transfer...' });
    }
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: e.response?.data?.error || 'Failed to initiate payment.' });
  } finally {
    isLoading.value = false;
  }
}

async function pollPaymentStatus() {
  if (!transaction.value) return;

  let attemptCount = 0;
  const maxAttempts = 12;
  const intervalTime = 5000;

  const intervalId = setInterval(async () => {
    attemptCount++;

    try {
      const response = await ApiService.post("components_data/checkstatus", {
        payment_id: transaction.value.id,
      });

      const status = response.data.status;

      if (status === "success") {
        feedbackMessage.value = "Transaction completed successfully!";
        paymentConfirmed.value = true;
        await completePurchase();
        clearInterval(intervalId);
      } else if (status === "failed") {
        feedbackMessage.value = "Transaction failed.";
        clearInterval(intervalId);
      } else if (attemptCount >= maxAttempts) {
        feedbackMessage.value = "Transaction pending. You can confirm payment manually.";
        clearInterval(intervalId);
      }
    } catch (error) {
      feedbackMessage.value = "Error occurred while checking status.";
      console.error("Polling error:", error);
      clearInterval(intervalId);
    }
  }, intervalTime);
}

async function completePurchase() {
  if (!transaction.value) return;

  try {
    isLoading.value = true;
    const formattedPhone = formatKenyanNumber(phone.value);

    const postData = {
      transaction_id: transaction.value.id,
      email: email.value,
      details_id: props.lessonId,
      phone_number: formattedPhone
    };

    const response = await ApiService.post("components_data/subscribetutorial", postData);

    feedbackMessage.value = response?.data?.message || "Subscription completed successfully!";

    // Update guest store with latest info
    await guestStore.getGuest(formattedPhone);

    // Emit success event to parent
    emit('paymentSuccess', {
      tutorial_id: props.lessonId,
      email: email.value,
      phone: formattedPhone
    });

  } catch (error) {
    feedbackMessage.value = error?.response?.data?.message || "Error completing purchase.";
    console.error("Error completing purchase:", error);
  } finally {
    isLoading.value = false;
  }
}
</script>

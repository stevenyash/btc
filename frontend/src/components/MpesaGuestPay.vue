<template>
  <div class="col items-center justify-center">
    <div class="text-h6 text-center q-my-md row items-center justify-center">
      Enter your Mpesa number to pay
    </div>

    <!-- Phone Input -->
    <div class="col items-center justify-center">
      <div class="row items-center justify-center q-pa-md">
        <q-input
          v-model="phone"
          label="Mobile"
          placeholder="e.g., 07XXXXXXXX, 7XXXXXXXX, or 254XXXXXXXXX"
          :rules="[validatePhone]"
        >
          <template v-slot:append>
            <q-icon name="phone" />
          </template>
        </q-input>
      </div>

      <!-- Pay Now Button -->
      <div class="row items-center justify-center q-pa-md">
        <q-btn
          label="Pay Now"
          color="teal"
          @click="payWithMpesa"
          :disable="!isValidPhone"
          :loading="isLoading"
        />
      </div>
    </div>

    <!-- Feedback Banner -->
    <div>
      <q-banner inline-actions class="text-white bg-red" v-if="feedbackMessage">
        <div class="q-my-md text-primary">{{ feedbackMessage }}</div>
        <template v-slot:action>
          <q-btn
            v-if="pollingCompleted && !paymentConfirmed"
            color="primary"
            @click="confirmPaymentManually"
            :loading="loading"
            unelevated
          >
            Confirm Payment Manually
          </q-btn>
        </template>
      </q-banner>
    </div>
  </div>
</template>

<script setup>
import { useQuasar } from "quasar";
import { ref, computed, reactive, onMounted } from "vue";
import { useTransactionPolling } from "src/composables/useTransactionPolling";
import { ApiService } from "src/services/api";
import { useGuestStore } from "src/stores/guestStore";
import { utils } from "src/utils";
import { useRoute } from "vue-router";
import { retrieveFingerprint } from "src/fingerprint";
import { LocalStorage } from 'quasar';

// Import the phone validation utility
import { validateKenyanPhone, formatKenyanPhone } from "src/services/phone-validator";

const emit = defineEmits(['completed']);
const guestStore = useGuestStore();
const $q = useQuasar();
const loading = ref(false);

// Props
const props = defineProps({
  amount: { type: Number, required: true },
  callback_Url: { type: String, required: true },
  phoneNumber: { type: String },
  lesson_id: { type: String, required: true },
});

const transactionData = reactive({
  phone_number: '254',
  amount: props.amount * 1,
  checkout_request_id: '',
  transaction_reference: utils.uuid,
  description: "lesson guest payments",
  payment_status: 'awaiting',
  details_id: 0,
  transactiondate: utils.dateTimeNow(),
  user_id: 0
});

const transaction = ref();
const phone = ref(props.phoneNumber || "");
const feedbackMessage = ref("");
const isLoading = ref(false);
const paymentConfirmed = ref(false);
const pollingCompleted = ref(false);

// Updated validation using the utility
const validatePhone = (val) => {
  const result = validateKenyanPhone(val);
  if (result.error) return result.error;
  return true;
};

const isValidPhone = computed(() => {
  const result = validateKenyanPhone(phone.value);
  return result.isValid;
});

// Payment Logic with formatted phone number
async function payWithMpesa() {
  if (!isValidPhone.value) return;

  feedbackMessage.value = "Initiating transaction. Please wait...";
  isLoading.value = true;

  // Format the phone number before sending
  const formattedPhone = formatKenyanPhone(phone.value);
  transactionData.phone_number = formattedPhone;

  try {
    const postData = {
      amount: props.amount,
      phone: formattedPhone,
      callback_Url: props.callback_Url || "components_data/callback",
      lesson_id: props.lesson_id,
      transactionData,
    };

    const response = await ApiService.post("components_data/propmtstk", postData);

    if (response.data.success) {
      feedbackMessage.value = "Transaction initiated. Please enter your PIN on the prompt.";
      const transactionId = response.data.transaction.id;
      transaction.value = response.data.transaction;

      // Start polling for transaction status
      const { startPolling, paymentStatus, pollingMessage } = useTransactionPolling(
        ApiService,
        transactionId,
        12,
        5000
      );
      startPolling();

      // Await the payment status result
      const status = await paymentStatus.value;
      if (status === "success") {
        feedbackMessage.value = "Transaction completed successfully!";
        paymentConfirmed.value = true;
        // Store guest data
        const guestData = {
          phone: formattedPhone,
          lesson_id: props.lesson_id,
          status: "active",
          transaction_id: transactionId,
          fingerprint: LocalStorage.getItem('deviceFingerprint'),
        };
        await guestStore.storeGuest(guestData);
        console.log("store", guestData);
        if (guestStore.lessons.length > 0) {
          emit("completed", props.lesson_id);
        }
      } else if (status === "failed") {
        feedbackMessage.value = "Transaction failed. Please try again.";
      } else if (status === "manual") {
        feedbackMessage.value = pollingMessage.value;
        pollingCompleted.value = true;
      }
    } else {
      feedbackMessage.value = response.data.message || "Failed to initiate payment.";
    }
  } catch (e) {
    feedbackMessage.value = "Error initiating transaction. Please try again.";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

// Manual Confirmation
async function confirmPaymentManually() {
  isLoading.value = true;
  feedbackMessage.value = "Checking payment status manually...";

  try {
    const response = await ApiService.post("components_data/checktrans", {
      payment_id: transaction.value.id,
      checkout_request_id: transaction.value.checkout_request_id
    });

    if (response.data.success && response.data.resultCode === "0") {
      feedbackMessage.value = "Transaction confirmed successfully!";
      paymentConfirmed.value = true;

      // Store guest data with formatted phone number
      const guestData = {
        phone: formatKenyanPhone(phone.value),
        lesson_id: props.lesson_id,
        status: "active",
        transaction_id: transaction.value.id,
      };
      await guestStore.storeGuest(guestData);
      console.log("store", guestData);
      if (guestStore.lessons.length > 0) {
        console.log("Guest SVIDs:", guestStore.lessons);
        console.log("Emitting completed event...");
        emit("completed", props.lesson_id);
      }
    } else {
      feedbackMessage.value = response.data.ResultDesc || "Transaction failed. Please try again.";
    }
  } catch (e) {
    feedbackMessage.value = "Error confirming payment. Please try again.";
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await retrieveFingerprint();
});
</script>

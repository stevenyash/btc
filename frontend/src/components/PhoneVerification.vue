<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="text-h6 text-primary text-center">
      {{ title }}
    </q-card-section>
    <q-separator />
    <q-card-section>
      <div class="row items-center q-gutter-sm">
        <q-input
          v-model="phoneNumber"
          label="Enter your phone number"
          mask="### ### ######"
          unmasked-value
          class="col-grow"
          :rules="[
            val => !!val || 'Phone is required',
            val => validateKenyanNumber(val) || 'Enter valid Kenyan number'
          ]"
        />
        <q-btn
          label="Verify"
          color="primary"
          @click="verify"
          :loading="loading"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useGuestStore } from 'src/stores/guestStore';

const props = defineProps({
  title: {
    type: String,
    default: 'Verify Your Phone Number'
  }
});

const emit = defineEmits(['verified']);
const $q = useQuasar();
const guestStore = useGuestStore();
const phoneNumber = ref('254');
const loading = ref(false);

function validateKenyanNumber(number) {
  const cleaned = number.replace(/\D/g, '');
  return /^(?:254|\+254|0)?(7[0-9]{8})$/.test(cleaned);
}

function formatKenyanNumber(number) {
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith('7') && cleaned.length === 9) return `254${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length === 10) return `254${cleaned.substring(1)}`;
  return null;
}

async function verify() {
  const formattedPhone = formatKenyanNumber(phoneNumber.value);
  if (!formattedPhone) {
    $q.notify({ type: 'negative', message: 'Invalid phone number format' });
    return;
  }

  loading.value = true;
  try {
    await guestStore.getGuest(formattedPhone);
    if (guestStore.phone) {
      $q.notify({ type: 'positive', message: 'Phone verified successfully' });
      emit('verified');
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message });
  } finally {
    loading.value = false;
  }
}
</script>

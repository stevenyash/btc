<template>
  <div class="col item-center justify-center">
    <div class="text-h6 text-center q-my-md row item-center justify-center">Enter your Mpesa number to pay</div>
   
    <div class="col item-center justify-center">
      <div class="row item-center justify-center q-pa-md">
        <q-input 
          v-model="phone" 
          label="Mobile" 
          placeholder="e.g., 07XXXXXXXX, 7XXXXXXXX, or 254XXXXXXXXX" 
          :rules="[validatePhone]"
        >
          <template v-slot:append>
            <q-icon name="phone"></q-icon>
          </template>
        </q-input>
        
        <q-input 
          v-model="email" 
          label="Email" 
          placeholder="Your email address" 
          :rules="[validateEmail]"
        >
          <template v-slot:append>
            <q-icon name="email"></q-icon>
          </template>
        </q-input>
      </div>
      
      <div class="row item-center justify-center q-pa-md">
        <q-btn 
          label="Subscribe now" 
          color="teal" 
          @click="payWithMpesa" 
          :disable="!isValidPhone"
          :loading="isLoading" 
        />
      </div>
    </div> 
    
    <div>
      <div class="row item-center justify-center q-pa-md">
        If paid using M-Pesa PayBill, kindly type your M-Pesa reference here and complete subscription
      </div>
      <div class="row item-center justify-center q-pa-md">
        <q-input type="text" v-model="reference" label="Reference">
          <template v-slot:append>
            <q-btn label="Complete Payment" @click="searchReference" color="blue"/>
          </template>
        </q-input>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar';
import { ApiService } from 'src/services/api';
import { useApp } from 'src/composables/app';
import { useAuth } from 'src/composables/auth';
import { ref, computed, onMounted } from 'vue';
import { validateKenyanPhone, formatKenyanPhone } from 'src/services/phone-validator';

const auth = useAuth();
const app = useApp();
const $q = useQuasar();

// Refs
const phone = ref('');
const email = ref('');
const reference = ref('');
const isLoading = ref(false);

// Emits and props
const emit = defineEmits(["insertTransaction", 'processSubscription', 'userdata']);

const props = defineProps({
  amount: {
    type: Number,
    required: true,
  },
  callback_Url: {
    type: String
  },
  phoneNumber: {
    type: String,
  }
});

// Phone validation using utility
const validatePhone = (val) => {
  const result = validateKenyanPhone(val);
  if (result.error) return result.error;
  return true;
};

const isValidPhone = computed(() => {
  const result = validateKenyanPhone(phone.value);
  return result.isValid;
});

// Email validation
const validateEmail = (val) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!val) return 'Email is required.';
  if (!emailRegex.test(val)) return 'Please enter a valid email address.';
  return true;
};

async function searchReference() {
  isLoading.value = true;
  try {
    const postData = {
      reference: reference.value,
    };
    
    const response = await ApiService.post("components_data/searchtransaction", postData);
    
    if (response.status === 200) {
      emit("processSubscription", response.data.transaction_id);
    }
  } catch (e) {
    console.error(e);
    if (e.response?.status === 404) {
      $q.notify({
        type: 'negative',
        message: 'Transaction not found. Please check your reference number.',
      });
    } else if (e.response?.status === 400) {
      $q.notify({
        type: 'negative',
        message: 'This reference has already been used. Please pay again or contact customer care.',
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'An error occurred. Please try again.',
      });
    }
  } finally {
    isLoading.value = false;
  }
}

async function payWithMpesa() {
  if (!isValidPhone.value) {
    $q.notify({
      type: 'negative',
      message: 'Please enter a valid Kenyan phone number.',
    });
    return;
  }

  isLoading.value = true;
  
  try {
    // Format phone number before sending
    const formattedPhone = formatKenyanPhone(phone.value);
    
    const response = await ApiService.post('components_data/propmtstk', {
      amount: props.amount * 1,
      phone: formattedPhone,
      callback_Url: props.callback_Url
    });

    if (response.data.success) {
      emit("userdata", {
        phone: formattedPhone,
        email: email.value
      });
      
      emit("insertTransaction", response.data.paymentDetails.CheckoutRequestID);
      
      $q.notify({
        type: 'positive',
        message: 'Please enter your M-PESA PIN to complete the payment.',
      });
    }
  } catch (e) {
    console.error(e);
    $q.notify({
      type: 'negative',
      message: e.response?.data?.error || 'Failed to initiate payment. Please try again.',
    });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  phone.value = props.phoneNumber || auth.userPhone || '';
});
</script>
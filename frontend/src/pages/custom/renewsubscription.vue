<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pa-md" >
            <div class="container-fluid">
                <div class="row items-center q-col-gutter-x-md justify-center">
                    <div  class="col-12 comp-grid"  v-if="!showMpesaPrompt">
                        <div class="">
                            <api-data-source   api-path="components_data/subscriptionshow_data_repeater"  v-slot="req">
                                <div >
                                    <div v-if="req.loading" class="text-center q-my-lg">
                                        <q-spinner size="30px" />
                                    </div>
                                    <template v-if="!req.loading">
                                        <q-page padding>
                                            <div class="q-pa-md">
                                                <q-toolbar>
                                                <q-toolbar-title class="text-center">Subscription Plans</q-toolbar-title>
                                            </q-toolbar>
                                            <!-- Display loading spinner -->
                                            <!-- Display subscription cards -->
                                            <q-card v-for="(data, index) in req.response" :key="index" class="q-my-md shadow-2 col">
                                                <q-card-section>
                                                    <div class="text-h6">{{ data.name }}</div>
                                                    <div class="text-body1 text-secondary q-my-xs">
                                                        {{ data.description }}
                                                    </div>
                                                </q-card-section>
                                                <q-separator />
                                                <q-card-section class="q-pb-none">
                                                    <div class="row items-center justify-between">
                                                        <div class="text-h6 text-primary">
                                                            Ksh. {{ Number(data.membership_fee).toFixed(2) }}
                                                        </div>
                                                        <q-btn
                                                            flat
                                                            color="primary"
                                                            icon="info"
                                                            label="subscribe"
                                                            @click="subscribe(data)"
                                                            />
                                                        </div>
                                                    </q-card-section>
                                                </q-card>
                                            </div>
                                        </q-page>
                                    </template>
                                    
                                </div>
                                
                            </api-data-source>
                            
                        </div>
                    </div>
                    
                    <div  class="col-6 col-sm-12 col-md-6 justify-center items center comp-grid" >
                        <q-card class="nice-shadow-5 rounded-borders animated fadeIn">
                            <div class="">
                                <div v-if="showMpesaPrompt">  <q-banner inline-actions class="text-white bg-red">
                                    <div v-if="feedbackMessage" class="q-my-md text-primary">
                                        {{ feedbackMessage }}
                                    </div>
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
                                </q-banner></div>
                            </div>
                            
                        </q-card>
                    </div>
                </div>
            </div>
        </section>
    </q-page>

</template>
<script setup>
	import {  computed, ref, reactive } from 'vue';
	import { utils } from 'src/utils';
	import { ApiService } from 'src/services/api';
	import { useApp } from 'src/composables/app.js';
	import { useAuth } from 'src/composables/auth';
	
	  import { useQuasar,QSpinnerGears } from 'quasar';

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
			type : Boolean,
			default : false,
		},
	});
	const app = useApp();
	const auth = useAuth();
	const pageReady = ref(true);
	const $q = useQuasar();
const showMpesaPrompt=ref(false);
 const loading=ref()
const feedbackMessage = ref("");
const pollingCompleted = ref(false); // Indicates if automatic polling has finished
const paymentConfirmed = ref(false); 
const callback_Url='components_data/callback'
let intervalId = null;
const transaction=ref()
const transactionData=reactive({
        phone_number:auth.user.phone,
     subscription_type_id:'',
     amount:'',
     checkout_request_id:'',
     transaction_reference:'',
     description:"subscription",
     payment_status:'awaiting',
     details_id:'',
     transactiondate:utils.dateTimeNow(),
     user_id:0
 });
 
 async function subscribe(data){
     showMpesaPrompt.value=true;
     transactionData.amount=data.membership_fee*1;
     transactionData.details_id=data.id
   //console.log(props.subscriptiondata)
     feedbackMessage.value = "Initiating transaction. Please wait...";
   transactionData.transaction_reference = utils.dateTimeNow();
 
               $q.loading.show()
  loading.value=true;
 try {
     let postData={
        amount: data.membership_fee*1,
        phone: auth.user.phone,
        callback_Url:`${callback_Url}`,
        transactionData
    };
    //console.log("mp",postData)
   const response = await ApiService.post('components_data/propmtstk', postData);
 $q.loading.hide()
    if (response.data.success) {
          transaction.value = response.data.transaction;
               feedbackMessage.value = "Transaction initiated. Please enter your PIN on the prompt.";
          getStatus();
      $q.notify({
        type: 'positive',
        message: 'Kindly input PIN to complete the transfer...',
      });
    }
    loading.value=false;
           $q.loading.hide()
  } catch (e) {
   feedbackMessage.value = "Failed to initiate transaction. Please try again.";
         $q.loading.hide()
    loading.value=false;
    console.error(e);
    $q.notify({
      type: 'negative',
      message: e.response?.data?.error || 'Failed to initiate payment. Please try again.',
    });
  }
}
function getStatus() {
  let attemptCount = 0;
  const maxAttempts = 12;
  intervalId = setInterval(async () => {
    attemptCount++;
    try {
      const response = await ApiService.post("components_data/checkstatus", {
        payment_id: transaction.value.id,
      });
      const status = response.data.status;
      if (status === "success") {
        feedbackMessage.value = "Transaction completed successfully!";
        paymentConfirmed.value = true;
        subscribeuser()
        clearInterval(intervalId);
      } else if (status === "failed") {
        feedbackMessage.value = "Transaction failed.";
        clearInterval(intervalId);
        pollingCompleted.value=true
      } else if (attemptCount >= maxAttempts) {
      feedbackMessage.value = "We could get your payment automatically kindly  confirm payment manually.";
        pollingCompleted.value = true;
        clearInterval(intervalId);
      }
    } catch (error) {
      feedbackMessage.value = "Error occurred while checking status.";
      console.error("Polling error:", error);
      pollingCompleted.value = true;
      clearInterval(intervalId);
    }
  }, 5000);
}
  async function subscribeuser(){
        $q.loading.show({
            spinner: QSpinnerGears,
            spinnerColor: 'red',
            messageColor: 'black',
            backgroundColor: 'yellow',
            message: 'We will send you a message with login details if you wont get it within 10min kindly contact us'
        })
        try{
            console.log("transaction",transaction.value);
            const response=await ApiService.post('components_data/subscription',{transaction_id:transaction.value.id,user_id:transaction.value.user_id});
            console.log(response)
            if(response.data.status==="success"){
                const subscription_id=transactionData.details_id
                  smsUser(subscription_id)
            }
              $q.loading.hide()
            }catch(e){
            $q.loading.hide()
            console.log(e)
        }
    }
    
     async function smsUser(subscription_id){
        try{
            let postData={
                phone:auth.user.phone,
                user_id:auth.userId,
                subscription_id:subscription_id,
            }
            console.log("sms data",postData)
            const response=await ApiService.post("components_data/smsuser",postData)
            console.log("response",response);
            app.navigateTo('/')
            }catch(e){
            console.log(e)
        }
    }
    
    async function confirmPaymentManually() {
  try {
    loading.value = true;
    feedbackMessage.value = "Checking payment status manually...";
    const response = await ApiService.post("components_data/checktrans", {
        payment_id: transaction.value.id,checkout_request_id:transaction.value.checkout_request_id
    });
    console.log(response.data)
    const status = response.data.success;
    if (status && response.data.resultCode==="0" ) {
      feedbackMessage.value = "Transaction confirmed successfully!";
      paymentConfirmed.value = true;
      subscribeuser();
      } else if (status && response.data.resultCode !="0") {
      feedbackMessage.value = "Transaction failed. Please try again."+response.data.resultDescription;
    } else {
      feedbackMessage.value = "Transaction is still pending. Please try again later.";
    }
  } catch (error) {
    feedbackMessage.value = "An error occurred while checking the payment status.";
    console.error("Manual confirmation error:", error);
  } finally {
    loading.value = false;
  }
}
    

</script>

<style scoped>

</style>

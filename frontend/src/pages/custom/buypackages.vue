<template>
    <q-page class="main-page"  id="">
        <q-card  :flat="isSubPage" class="page-section q-pa-md nice-shadow-6" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class="">
                            <div>
                                <q-banner inline-actions class="text-white bg-info payment-banner">
                                    <div v-if="feedbackMessage" class="q-my-md">
                                        <q-icon :name="paymentConfirmed ? 'check_circle' : 'info'" class="q-mr-sm" />
                                        {{ feedbackMessage }}
                                    </div>
                                    <div v-else class="q-my-md text-body2">
                                        <q-icon name="shopping_cart" class="q-mr-sm" />
                                        Select a package below to get started
                                    </div>
                                    <template v-slot:action>
                                        <q-btn
                                            v-if="pollingCompleted && !paymentConfirmed"
                                            color="white"
                                            text-color="info"
                                            @click="confirmPaymentManually"
                                            :loading="loading"
                                            outline
                                            >
                                            Confirm Payment Manually
                                        </q-btn>
                                    </template>
                                </q-banner>
                            </div>
                            <div v-if="isSubscribe"><div>
                                Dear Customer Your are subscribe to {{subscribedpackage.package}} which expirires on {{subscribedpackage.expirery_date}} you can either extend by purchasing the same package or buy a different one.
                            </div>
                        </div>

                    </div>

                    <q-card  :flat="isSubPage" class=" nice-shadow-6">
                        <div >
                            <q-tabs v-model="TabPage388" align="left" :dense="true"  :inline-label="false" no-caps active-color="primary" indicator-color="primary">
                                <q-tab name="TabPage388Page1" icon="perm_identity" label="Individual Packages " />

                                <q-tab name="TabPage388Page2" icon="group" label="Home Schooling/School/Institution Packages " />

                            </q-tabs>
                            <q-separator></q-separator>
                            <q-tab-panels keep-alive v-model="TabPage388" animated>
                                <q-tab-panel  class="q-pa-md packages-panel" name="TabPage388Page1">
                                    <div class="">
                                        <api-data-source   api-path="components_data/subscribe_data_repeater_4"  v-slot="req">
                                            <div >
                                                <div class="q-pa-sm text-bold text-primary" >
                                                    <q-badge color="primary">Individual Packages</q-badge>
                                                </div>
                                                <div class="row q-col-gutter-lg q-pa-md">
                                                    <div
                                                        class="col-12 col-sm-6 col-md-4 col-lg-3"
                                                        v-for="(data, i) in req.response"
                                                        :key="i"
                                                        >
                                                        <q-card flat bordered class="q-pa-md nice-shadow-2">

                                                            <!-- Product Title -->
                                                            <q-card-section>
                                                                <div class="text-h6 text-center text-primary">{{ data.name }}</div>
                                                                <div class="text-subtitle2 text-center text-grey-7">{{ data.label }}</div>
                                                            </q-card-section>
                                                            <!-- Product Description -->
                                                            <q-card-section>
                                                                <div class="text-body2 text-justify">{{ data.description }}</div>
                                                            </q-card-section>
                                                            <!-- Product Fee -->
                                                            <q-card-section>
                                                                <div class="text-h6 text-bold text-primary text-center">
                                                                   Ksh {{ data.fee  }} for {{ data.no_of_lessons }} lessons
                                                                </div>
                                                                <div class="text-subtitle2 text-center">
                                                                    Duration: {{data.duration_amount}}{{ data.duration_unit }}
                                                                </div>
                                                            </q-card-section>
                                                            <!-- Subscribe Button -->
                                                            <q-card-actions align="center" v-if="subscribedpackage?.id!=data.id">
                                                                <q-btn
                                                                    color="positive"
                                                                    label="Buy Now"
                                                                    icon="add_shopping_cart"
                                                                    @click="buyPackage(data)"
                                                                    class="full-width"
                                                                    :loading="loading"
                                                                    />
                                                                </q-card-actions>
                                                                <q-card-actions align="center" v-if=" subscribedpackage?.id==data.id">
                                                                    <q-btn
                                                                        color="warning"
                                                                        label="Extend Now"
                                                                        icon="add_shopping_cart"
                                                                        @click="subscribeToProduct(data)"
                                                                        class="full-width"
                                                                        :loading="loading"
                                                                        />
                                                                    </q-card-actions>
                                                                </q-card>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </api-data-source>

                                            </div>

                                        </q-tab-panel>

                                        <q-tab-panel  class="q-pa-md packages-panel" name="TabPage388Page2">
                                            <div class="">
                                                <api-data-source   api-path="components_data/subscribe_data_repeater_5"  v-slot="req">
                                                    <div >
                                                        <div class="row q-col-gutter-lg q-pa-md">
                                                            <div
                                                                class="col-12 col-sm-6 col-md-4 col-lg-3"
                                                                v-for="(data, i) in req.response"
                                                                :key="i"
                                                                >
                                                                <q-card flat bordered class="q-pa-md nice-shadow-2">
                                                                    <!-- Product Title -->
                                                                    <q-card-section>
                                                                        <div class="text-h6 text-center text-primary">{{ data.name }}</div>
                                                                        <div class="text-subtitle2 text-center text-grey-7">{{ data.label }}</div>
                                                                    </q-card-section>
                                                                    <!-- Product Description -->
                                                                    <q-card-section>
                                                                        <div class="text-body2 text-justify">{{ data.description }}</div>
                                                                    </q-card-section>
                                                                    <!-- Product Fee -->
                                                                    <q-card-section>
                                                                        <div class="text-h6 text-bold text-primary text-center">
                                                                            {{ data.fee  }}
                                                                        </div>
                                                                        <div class="text-subtitle2 text-center">
                                                                            Duration: {{ data.duration_amount }} {{ data.duration_unit }}
                                                                        </div>
                                                                    </q-card-section>
                                                                    <!-- Subscribe Button -->
                                                                    <q-card-actions align="center" v-if="subscribedpackage?.id!=data.id">
                                                                        <q-btn
                                                                            color="positive"
                                                                            label="Buy Now"
                                                                            icon="add_shopping_cart"
                                                                            @click="buyPackage(data)"
                                                                            class="full-width"
                                                                            />
                                                                        </q-card-actions>
                                                                        <q-card-actions align="center" v-if=" subscribedpackage?.id==data.id">
                                                                            <q-btn
                                                                                color="warning"
                                                                                label="Extend"
                                                                                icon="add_shopping_cart"
                                                                                @click="subscribeToProduct(data)"
                                                                                class="full-width"
                                                                                />
                                                                            </q-card-actions>
                                                                        </q-card>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </api-data-source>

                                                    </div>

                                                </q-tab-panel>

                                            </q-tab-panels>

                                        </div>

                                    </q-card>
                                </div>
                            </div>
                        </div>
                    </q-card>
                </q-page>

</template>
<script setup>
	import {  computed, ref, reactive, onMounted } from 'vue';
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
	const TabPage388 = ref();

	 const $q = useQuasar();
 onMounted(()=>{

    if(auth.userRole==="superadmin" || auth.isAdmin){
        app.navigateTo("packages")
    }
});
const transactionData = reactive({
    phone_number: auth?.user?.phone ,
    amount: "",
    checkout_request_id: "",
    transaction_reference: "not set",
    description: "package",
    payment_status: "awaiting",
    details_id: "",
    transactiondate: utils.dateTimeNow(),
    user_id: auth.userId,
});
const boughtPackage=ref();
const transaction = ref(null);
const feedbackMessage = ref("");
const loading = ref(false);
const pollingCompleted = ref(false); // Indicates if automatic polling has finished
const paymentConfirmed = ref(false);
// Tracks if payment was confirmed manually or automatically
let intervalId = null;
async function buyPackage(data){

  try{
    //fetch data from the api
    loading.value=true
    const response = await ApiService.get("components_data/checksubscription")//
    loading.value=false
    console.log("res",response.data);
    if(response.data.length===0 || !auth.isLoggedIn){


          $q.dialog({
              title: 'Hi ',
              message: 'Hi only subscribe members can purchase this product .Do you want to subscribe?'
      }).onOk(() => {

      app.navigateTo("subscriptionshow")
      }).onCancel(() => {
      app.navigateTo("/")
      }).onDismiss(() => {
      app.navigateTo("/")
      })


        }else{
        if(data.subscription_type_id  !=response.data[0].subscription_type_id){
      $q.dialog({
          title: 'Hi',
          message:` ${response.data[0].name} can not purchase these packages consider changing subscription or chose a different package please`
      }).onOk(() => {
        // console.log('OK')
      }).onCancel(() => {
        // console.log('Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })


    }else{
    checkSubscription(data);
}
}
}
  catch(e){
      loading.value=false;
    console.error(e);
  }
}
async function checkSubscription(data) {
    transactionData.amount = data.fee * 1;
    transactionData.details_id = data.id;
    transactionData.transaction_reference = utils.dateTimeNow();

    try {
        loading.value = true;
        feedbackMessage.value = "Initiating transaction. Please wait...";

        const postData = {
            callback_Url: "components_data/callback",
            amount: data.fee * 1,
            transactionData: transactionData,
        };

        const response = await ApiService.post("components_data/propmtstk", postData);

        if (response.data.success) {
            transaction.value = response.data.transaction;
            feedbackMessage.value = "Transaction initiated. Please enter your PIN on the prompt.";
            console.log("Transaction ID:", transaction.value.id);
            getStatus(); // Start polling for status
            } else {
            feedbackMessage.value = "Failed to initiate transaction. Please try again.";
            console.error("Failed to initiate transaction:", response.data.message);
        }
        } catch (e) {
        feedbackMessage.value = "An error occurred while initiating the transaction. Please try again.";
        console.error("Error initiating transaction:", e);
        } finally {
        loading.value = false;
    }
}
// Function to confirm payment manually
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
            completePurchase();
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
// Function to get status via polling
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
                completePurchase();
                clearInterval(intervalId);
                } else if (status === "failed") {
                feedbackMessage.value = "Transaction failed.";
                clearInterval(intervalId);
                pollingCompleted.value=true
                } else if (attemptCount >= maxAttempts) {
                feedbackMessage.value = "completed. You can confirm payment manually.";
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
// Function to complete purchase
async function completePurchase() {
    try {
        loading.value = true;

        const postData = {
            transaction_id: transaction.value.id,
        };

        const response = await ApiService.post("components_data/buypackage", postData);
        console.log("Purchase completed:", response.data);
        feedbackMessage.value = "Purchase completed go ahead to view lessons "
  } catch (error) {
  feedbackMessage.value = error.response.data.message
    console.error("Error completing purchase:", error);
  } finally {
    loading.value = false;
  }
}
onMounted(()=>{
    checkpackage();
});
async function checkpackage(){
  try{
    //fetch data from the api
    const response = await ApiService.get("components_data/checkpackage");
    boughtPackage.value = response.data;
  }
  catch(e){
    console.error(e);
  }
}

</script>

<style scoped>
.packages-panel {
    background: #f8f9fa;
    min-height: 400px;
}

.payment-banner {
    border-radius: 8px;
    margin-bottom: 16px;
}
</style>

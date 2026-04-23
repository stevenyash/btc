<template>
    <main class="main-page" id="">
        <template v-if="pageReady">
            <template v-if="showHeader">
                <section class="page-section q-pa-md" >
                    <div class="container">
                        <div class="row justify-between items-center q-col-gutter-md">
                            <div  v-if="!isSubPage"  class="col-auto " >
                                <q-btn @click="$router.go(-1)"      flat :rounded="false"  size=""  color="primary"  no-caps  unelevated   class="" >
                                    <q-icon name="arrow_back"></q-icon>
                                </q-btn>
                            </div>
                            <div  class="col " >
                                <div class=" text-h6 text-primary" >
                                    We are about to subscribe you kindly fill the details
                                </div>
                                <div class="">
                                    <div>   <q-banner inline-actions class="text-white bg-red">
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
                                            <q-btn
                                                v-else-if="paymentConfirmed"
                                                color="green"
                                                :disabled="!paymentConfirmed"
                                                unelevated
                                                @click="app.navigateTo('home')"
                                                >
                                                Payment Confirmed go home
                                            </q-btn>
                                        </template>
                                    </q-banner></div>
                                </div>
                            </div>
                            <!--topcardactiontemplates-->
                        </div>
                    </div>
                </section>
            </template>
            <section class="page-section " >
                <div class="container">
                    <div class="row items-center q-col-gutter-x-md">
                        <div  class="col-12 comp-grid" >
                            <div >
                                <q-form ref="observer" @submit.prevent="checker()">
                                <q-card  :flat="isSubPage" class="q-pa-md nice-shadow-6">
                                    <div class="row q-col-gutter-x-md">
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Phone *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <check-duplicate error-msg="You are Subscribed already login" v-model="formData.phone" check-path="components_data/users_phone_exist/" v-slot="checker">
                                                    <q-input ref="ctrlphone" @blur="checker.check" :loading="checker.loading" v-model.trim="formData.phone" label="Phone" type="number" placeholder="Enter Phone(254)"
                                                    class="" :error="isFieldValid('phone') || checker.alreadyExist" :error-message="getFieldError('phone') || checker.errorMsg">
                                                    <template v-slot:append>
                                                        <q-icon name="contact_phone"></q-icon>
                                                    </template>
                                                    </q-input>
                                                    </check-duplicate>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Email *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <check-duplicate error-msg="You are Subscribed already login" v-model="formData.email" check-path="components_data/users_email_exist/" v-slot="checker">
                                                    <q-input ref="ctrlemail" @blur="checker.check" :loading="checker.loading" v-model.trim="formData.email" label="Email" type="email" placeholder="Enter Email"
                                                    class="" :error="isFieldValid('email') || checker.alreadyExist" :error-message="getFieldError('email') || checker.errorMsg">
                                                    <template v-slot:append>
                                                        <q-icon name="email"></q-icon>
                                                    </template>
                                                    </q-input>
                                                    </check-duplicate>
                                                </div>
                                            </div>
                                        </div>
                                        <input name="ctrlsubscription_code" ref="ctrlsubscription_code" v-model="formData.subscription_code" type="hidden" />
                                        <input name="ctrlusercode" ref="ctrlusercode" v-model="formData.usercode" type="hidden" />
                                    </div>
                                    <div v-if="showSubmitButton" class="text-center q-my-md">
                                        <q-btn type="submit" :rounded="false" :disable="saving" color="primary" no-caps unelevated icon-right="send" :loading="saving">
                                            {{ submitButtonLabel }}
                                            <template v-slot:loading>
                                                <q-spinner-oval />
                                            </template>
                                        </q-btn>
                                    </div>
                                    <div class="q-pa-md">
                                        <q-btn label="Login instead" color="blue-12" @click="login=true" />
                                            <q-space />
                                        </div>
                                    </q-card>
                                    </q-form>
                                    <slot :submit="submitForm" :saving="saving" ></slot>
                                </div>
                            </div>
                            <div  class="col-sm-6 col-md-6 col-12 comp-grid" >
                                <div class="">
                                    <div>
                                        <q-dialog v-model="login" @hide="onLoginHide" >
                                            <q-card>
                                            <Login class="q-dialog-plugin"/>
                                        </q-card>
                                    </q-dialog>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </template>
    </main>
</template>
<script setup>
    import {  watchEffect,computed, ref, reactive, toRefs, onMounted } from 'vue';
    import { required, email, } from 'src/services/validators';
    import { usePageStore } from 'src/stores/page';
    import { useMeta } from 'quasar';
    import { useApp } from 'src/composables/app';
    import { ApiService } from 'src/services/api';
    import { utils } from 'src/utils';
    import { useAddPage } from 'src/composables/addpage';
    import { useQuasar,QSpinnerGears } from 'quasar';
    import Login from "src/pages/index/login.vue"
    import { validateKenyanPhone, formatKenyanPhone } from 'src/services/phone-validator'
    //[--PAGE-IMPORT-STATEMENT--]
    const props = defineProps({
        pageName : {
            type : String,
            default : 'users',
        },
        pageStoreKey: {
            type: String,
            default: 'USERS',
        },
        routeName : {
            type : String,
            default : 'userssubscribeuser',
        },
        apiPath : {
            type : String,
            default : 'users/subscribeuser',
        },
        submitButtonLabel: {
            type: String,
            default: "Subscribe Now",
        },
        formValidationError: {
            type: String,
            default: "Form is invalid",
        },
        formValidationMsg: {
            type: String,
            default: "Please complete the form",
        },
        msgTitle: {
            type: String,
            default: "Create Record",
        },
        msgAfterSave: {
            type: String,
            default: "Record added successfully",
        },
        msgBeforeSave: {
            type: String,
            default: "",
        },
        showHeader: {
            type: Boolean,
            default: true,
        },
        showSubmitButton: {
            type: Boolean,
            default: true,
        },
        redirect: {
            type : Boolean,
            default : true,
        },
        isSubPage: {
            type : Boolean,
            default : false,
        },
        subscriptiondata:{
            type:Object
        },
        referral_code:{
        type:String
    },
        pageData: { // use to set formData default values from another page
            type: Object,
            default: () => ({
                phone: "254", email: "", subscription_code: "", usercode: "v", confirm_usercode: "v",  referred_by: "NULL",
            })
        },
    });
    const $q = useQuasar();
    const store = usePageStore(props.pageStoreKey);
    const app = useApp();// application state and methods
    const callback_Url='components_data/callback'
    const amount=ref();
    const formData = reactive({ ...props.pageData });
    const paymentId=ref();
    const login=ref(false);
    const isSubmit=ref(false);
const feedbackMessage = ref("");
const pollingCompleted = ref(false); // Indicates if automatic polling has finished
const paymentConfirmed = ref(false);
// Tracks if payment was confirmed manually or automatically
let intervalId = null;
    const transaction=ref()
    const transactionData=reactive({
     phone_number:'254',
     subscription_type_id:'',
     amount:props.subscriptiondata.membership_fee*1,
     checkout_request_id:'',
     transaction_reference:'',
     description:"subscription",
     payment_status:'awaiting',
     details_id:props.subscriptiondata.id,
     transactiondate:utils.dateTimeNow(),
     user_id:0
 })
    //vuelidate form validation rules
 const rules = computed(() => {
    return {
        phone: {
            required,
            validator: val => {
                const result = validateKenyanPhone(val);
                return result.isValid || result.error || 'Invalid phone number';
            }
        },
        email: { required, email },
        usercode: { required }
    }
});
    const loading=ref()
    const page = useAddPage({ store, props, formData, rules, beforeSubmit, afterSubmit });// page form hook
    //event raised before form submit
    function beforeSubmit(){
        return true;
    }
    //event raised after form submit
    function afterSubmit(response) {
         $q.loading.hide()
         transaction.value.user_id=response.id;
        subscribeuser()
        app.flashMsg(props.msgTitle, props.msgAfterSave);
        //page.setFormDefaultValues(); // reset form data
        $q.loading.hide()
    }
    const {  saving, pageReady,   } = toRefs(page.state);
    const { submitForm, isFieldValid, getFieldError, mapOptionField } = page.methods;
    useMeta(() => {
        return {
            //set browser title
            title: "subscription"
        }
    });
    onMounted(()=>{
        if(props.referral_code){
            formData.referred_by=$q.localStorage.getItem('referral_code') ||props.referral_code || null
        }
    });
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
                const subscription_id=response.data.subscription.id
               login.value=true

            }
              $q.loading.hide()
            }catch(e){
            $q.loading.hide()
            console.log(e)
        }
    }

    async function checker() {
    // Validate phone number first
    const phoneValidation = validateKenyanPhone(formData.phone);
    if (!phoneValidation.isValid) {
        $q.notify({
            type: 'negative',
            position: "center",
            message: phoneValidation.error || 'Invalid phone number format'
        });
        return;
    }
    // Format phone number before checking
    const formattedPhone = formatKenyanPhone(formData.phone);
    try {
        const response = await ApiService.get(`components_data/users_phone_exist/${formattedPhone}`);
        if (response.data) {
            $q.notify({
                type: 'warning',
                position: "center",
                message: 'Kindly login. The number already exists...',
            });
            login.value = true;
        } else {
            payWithMpesa();
        }
    } catch (e) {
        console.log(e);
    }
}
  async function payWithMpesa() {
    // Validate phone number first
    const phoneValidation = validateKenyanPhone(formData.phone);
    if (!phoneValidation.isValid) {
        $q.notify({
            type: 'negative',
            message: phoneValidation.error || 'Invalid phone number format'
        });
        return;
    }
    // Format phone number before processing
    const formattedPhone = formatKenyanPhone(formData.phone);
    formData.phone = formattedPhone; // Update formData with formatted number
    transactionData.phone_number = formattedPhone;
    feedbackMessage.value = "Initiating transaction. Please wait...";
    transactionData.amount = props.subscriptiondata.membership_fee * 1;
    transactionData.details_id = props.subscriptiondata.id;
    transactionData.transaction_reference = utils.dateTimeNow();
    $q.loading.show();
    loading.value = true;
    try {
        let postData = {
            amount: props.subscriptiondata.membership_fee * 1,
            phone: formattedPhone, // Use formatted phone
            callback_Url: `${callback_Url}`,
            transactionData
        };
        const response = await ApiService.post('components_data/propmtstk', postData);
        $q.loading.hide();
        if (response.data.success) {
            transaction.value = response.data.transaction;
            feedbackMessage.value = "Transaction initiated. Please enter your PIN on the prompt.";
            getStatus();
            $q.notify({
                type: 'positive',
                message: 'Kindly input PIN to complete the transfer...',
            });
        }
        loading.value = false;
        $q.loading.hide();
    } catch (e) {
        feedbackMessage.value = "Failed to initiate transaction. Please try again.";
        $q.loading.hide();
        loading.value = false;
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
         await submitForm();
        clearInterval(intervalId);
      } else if (status === "failed") {
        feedbackMessage.value = "Transaction failed.";
        clearInterval(intervalId);
        pollingCompleted.value=true
      } else if (attemptCount >= maxAttempts) {
      feedbackMessage.value = "We could not get your payment automatically.Kindly  confirm payment manually.";
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
      submitForm();
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
    // expose page object for other components access
    defineExpose({
        page
    });

</script>

<style scoped>

</style>
<style scoped>

</style>

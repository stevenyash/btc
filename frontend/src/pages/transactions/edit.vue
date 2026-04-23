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
                                    Edit Transaction
                                </div>
                            </div>
                            <!--topcardactiontemplates-->
                        </div>
                    </div>
                </section>
            </template>
            <section class="page-section " >
                <div class="container">
                    <div class="row q-col-gutter-x-md">
                        <div  class="col-md-9 col-12 comp-grid" >
                            <div >
                                <q-card  :flat="isSubPage" class="q-pa-md nice-shadow-6">
                                    <q-form ref="observer"  @submit.prevent="submitForm()">
                                    <!--[form-content-start]-->
                                    <div class="row q-col-gutter-x-md">
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    User Id *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <api-data-source @loaded="response => mapOptionField(response, 'user_id')"  api-path="components_data/user_id_option_list"  v-slot="req">
                                                        <nice-select     :loading="req.loading"   ref="ctrluser_id" v-model="formData.user_id" :options="req.response" label="User Id"  :error="isFieldValid('user_id')" :error-message="getFieldError('user_id')">
                                                        </nice-select>  
                                                    </api-data-source>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Phone Number *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlphone_number" v-model.trim="formData.phone_number"  label="Phone Number" type="text" placeholder="Enter Phone Number"      
                                                    class="" :error="isFieldValid('phone_number')" :error-message="getFieldError('phone_number')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Amount *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlamount" v-model.trim="formData.amount"  label="Amount" type="number" placeholder="Enter Amount"   step="0.1"    
                                                    class="" :error="isFieldValid('amount')" :error-message="getFieldError('amount')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Transaction Reference 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrltransaction_reference" v-model.trim="formData.transaction_reference"  label="Transaction Reference" type="text" placeholder="Enter Transaction Reference"      
                                                    class="" :error="isFieldValid('transaction_reference')" :error-message="getFieldError('transaction_reference')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Checkout Request Id 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlcheckout_request_id" v-model.trim="formData.checkout_request_id"  label="Checkout Request Id" type="text" placeholder="Enter Checkout Request Id"      
                                                    class="" :error="isFieldValid('checkout_request_id')" :error-message="getFieldError('checkout_request_id')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Status 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <nice-select        ref="ctrlstatus" v-model="formData.status" :options="app.menus.status2" label="Status"  :error="isFieldValid('status')" :error-message="getFieldError('status')">
                                                    </nice-select>  
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Description 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input  ref="ctrldescription" rows="5"  v-model="formData.description" placeholder="Enter Description"    type="textarea" :error="isFieldValid('description')" :error-message="getFieldError('description')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Response Code 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlresponse_code" v-model.trim="formData.response_code"  label="Response Code" type="text" placeholder="Enter Response Code"      
                                                    class="" :error="isFieldValid('response_code')" :error-message="getFieldError('response_code')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Response Description 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input  ref="ctrlresponse_description" rows="5"  v-model="formData.response_description" placeholder="Enter Response Description"    type="textarea" :error="isFieldValid('response_description')" :error-message="getFieldError('response_description')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Transactiondate *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input  ref="ctrltransactiondate" v-model="formData.transactiondate"    :error="isFieldValid('transactiondate')" :error-message="getFieldError('transactiondate')">
                                                    <template v-slot:prepend>
                                                        <q-icon name="date_range" class="cursor-pointer">
                                                        <q-popup-proxy transition-show="scale" transition-hide="scale">
                                                        <q-date      mask="YYYY-MM-DD HH:mm" v-model="formData.transactiondate" />
                                                        </q-popup-proxy>
                                                        </q-icon>
                                                    </template>
                                                    <template v-slot:append>
                                                        <q-icon name="access_time" class="cursor-pointer">
                                                        <q-popup-proxy transition-show="scale" transition-hide="scale">
                                                        <q-time v-model="formData.transactiondate" mask="YYYY-MM-DD HH:mm" />
                                                        </q-popup-proxy>
                                                        </q-icon>
                                                    </template>
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Payment Status *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlpayment_status" v-model.trim="formData.payment_status"  label="Payment Status" type="text" placeholder="Enter Payment Status"      
                                                    class="" :error="isFieldValid('payment_status')" :error-message="getFieldError('payment_status')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Details Id *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrldetails_id" v-model.trim="formData.details_id"  label="Details Id" type="number" placeholder="Enter Details Id"   step="any"    
                                                    class="" :error="isFieldValid('details_id')" :error-message="getFieldError('details_id')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!--[form-content-end]-->
                                    <div v-if="showSubmitButton" class="text-center q-my-md">
                                        <q-btn    :rounded="false"  color="primary"  no-caps  unelevated   type="submit" icon-right="send" :loading="saving">
                                            {{ submitButtonLabel }}
                                            <template v-slot:loading>
                                                <q-spinner-oval />
                                            </template>
                                        </q-btn>
                                    </div>
                                    </q-form>
                                    <slot :submit="submitForm" :saving="saving"></slot>
                                </q-card>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </template>
        <template v-if="loading">
            <div style="min-height:200px" class="q-pa-sm text-center relative-position">
                <q-inner-loading color="primary" label="Loading..." showing></q-inner-loading>
            </div>
        </template>
    </main>
</template>
<script setup>
	import {  computed, ref, reactive, toRefs, onMounted } from 'vue';
	import { required, numeric, } from 'src/services/validators';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useEditPage } from 'src/composables/editpage';
	import { usePageStore } from 'src/stores/page';
	
	const props = defineProps({
		id: [String, Number],
		pageName: {
			type: String,
			default: 'transactions',
		},
		pageStoreKey: {
			type: String,
			default: 'TRANSACTIONS',
		},
		routeName: {
			type: String,
			default: 'transactionsedit',
		},
		pagePath: {
			type : String,
			default : 'transactions/edit',
		},
		apiPath: {
			type: String,
			default: 'transactions/edit',
		},
		submitButtonLabel: {
			type: String,
			default: "Update",
		},
		msgTitle: {
			type: String,
			default: "Update Record",
		},
		msgBeforeSave: {
			type: String,
			default: "",
		},
		msgAfterSave: {
			type: String,
			default: "Record updated successfully",
		},
		formValidationError: {
			type: String,
			default: "Form is invalid",
		},
		formValidationMsg: {
			type: String,
			default: "Please complete the form",
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
	});
	
	const store = usePageStore(props.pageStoreKey);
	const app = useApp();
	
	const formDefaultValues = Object.assign({
		user_id: "", phone_number: "", amount: "", transaction_reference: "NULL", checkout_request_id: "NULL", status: "", description: "", response_code: "NULL", response_description: "", transactiondate: new Date(), payment_status: "'waiting proccess'", details_id: "", 
	}, props.pageData);
	
	const formData = reactive({ ...formDefaultValues });
	
	//event raised after form submit
	function afterSubmit(response) {
		app.flashMsg(props.msgTitle, props.msgAfterSave);
		if(app.isDialogOpen()){
			app.closeDialogs(); // if page is open as dialog, close dialog
		}
		else if(props.redirect){
			app.navigateTo(`/transactions`);
		}

	}
	
	//vuelidate form validation rules
	const rules = computed(() => {
		return {
			user_id: { required },
		phone_number: { required },
		amount: { required, numeric },
		transactiondate: { required },
		payment_status: { required },
		details_id: { required, numeric }
		}
	});
	
	const page = useEditPage({ store, props, formData, rules, afterSubmit });
	
	const {  saving, loading, pageReady,   } = toRefs(page.state);
	
	const {  currentRecord: editRecord } = toRefs(store.state);
	
	const { load, submitForm, isFieldValid, getFieldError, mapOptionField, } = page.methods;
	
	useMeta(() => {
		return {
			//set browser title
			title: "Edit Transaction"
		}
	});

	
	onMounted(()=>{ 
	});

</script>

<style scoped>

</style>

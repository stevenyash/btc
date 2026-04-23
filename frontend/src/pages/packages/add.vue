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
                                    Add New Package
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
                                <q-form ref="observer" @submit.prevent="submitForm()">
                                <q-card  :flat="isSubPage" class="q-pa-md nice-shadow-6">
                                    <div class="row q-col-gutter-x-md">
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Subscription Type  *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <api-data-source @loaded="response => mapOptionField(response, 'subscription_type_id')"  api-path="components_data/subscription_type_id_option_list"  v-slot="req">
                                                        <nice-select     :loading="req.loading"   ref="ctrlsubscription_type_id" v-model="formData.subscription_type_id" :options="req.response" label="Subscription Type "  :error="isFieldValid('subscription_type_id')" :error-message="getFieldError('subscription_type_id')">
                                                        </nice-select>
                                                    </api-data-source>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Name *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlname" v-model.trim="formData.name"  label="Name" type="text" placeholder="Enter Name"
                                                    class="" :error="isFieldValid('name')" :error-message="getFieldError('name')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Description *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrldescription" v-model.trim="formData.description"  label="Description" type="text" placeholder="Enter Description"
                                                    class="" :error="isFieldValid('description')" :error-message="getFieldError('description')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Fee *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input  prefix="KES"  ref="ctrlfee" v-model.trim="formData.fee"  label="Fee" type="number" placeholder="Enter Fee"   step="0.1"
                                                    class="" :error="isFieldValid('fee')" :error-message="getFieldError('fee')">
                                                    <template v-slot:append>
                                                        <q-icon name="attach_money"></q-icon>
                                                    </template>
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Concurrent Access *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlconcurrent_access" v-model.trim="formData.concurrent_access"  label="Concurrent Access" type="number" placeholder="Enter Concurrent Access"   step="any"
                                                    class="" :error="isFieldValid('concurrent_access')" :error-message="getFieldError('concurrent_access')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <input name="ctrlcreated_at"  ref="ctrlcreated_at" v-model="formData.created_at" type="hidden" />
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    No Of Lessons *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlno_of_lessons" v-model.trim="formData.no_of_lessons"  label="No Of Lessons" type="number" placeholder="Enter No Of Lessons"   step="any"
                                                    class="" :error="isFieldValid('no_of_lessons')" :error-message="getFieldError('no_of_lessons')">
                                                    <template v-slot:append>
                                                        <q-icon name="accessible"></q-icon>
                                                    </template>
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <fieldset class="q-ml-sm q-my-md col-12"><legend class="text-h6 text-bold">duration of the package eg 1 week etc</legend>
                                            <div class="row q-col-gutter-md">
                                                <div class="col-12">
                                                    <div class="row">
                                                        <div class="col-sm-3 col-12">
                                                            Duration Length *
                                                        </div>
                                                        <div class="col-sm-9 col-12">
                                                            <q-input   ref="ctrlduration_amount" v-model.trim="formData.duration_amount"  label="Duration Length" type="number" placeholder="Enter Duration Length"   step="any" list="duration_amount_list"
                                                            class="" :error="isFieldValid('duration_amount')" :error-message="getFieldError('duration_amount')">
                                                            </q-input>
                                                            <datalist id="duration_amount_list">
                                                            <option v-for="(menu, index) in app.menus.durationAmount" :key="index" :value="menu.value">{{ menu.label }}</option>
                                                            </datalist>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-12">
                                                    <div class="row">
                                                        <div class="col-sm-3 col-12">
                                                            Duration Unit *
                                                        </div>
                                                        <div class="col-sm-9 col-12">
                                                            <div class="q-mb-md">
                                                                <q-btn-toggle  ref="ctrlduration_unit" v-model="formData.duration_unit" :options="app.menus.durationUnit" toggle-color="positive" color="grey-7"     :rounded="false"  no-caps  unelevated    :error="isFieldValid('duration_unit')" :error-message="getFieldError('duration_unit')" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div></fieldset>
                                        </div>
                                        <div v-if="showSubmitButton" class="text-center q-my-md">
                                            <q-btn type="submit"    :rounded="false"  color="primary"  no-caps  unelevated    icon-right="send" :loading="saving">
                                                {{ submitButtonLabel }}
                                                <template v-slot:loading>
                                                    <q-spinner-oval />
                                                </template>
                                            </q-btn>
                                        </div>
                                    </q-card>
                                    </q-form>
                                    <slot :submit="submitForm" :saving="saving"></slot>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </template>
        </main>
</template>
<script setup>
	import {  computed, ref, reactive, toRefs, onMounted } from 'vue';
	import { required, numeric, } from 'src/services/validators';
	import { usePageStore } from 'src/stores/page';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useAddPage } from 'src/composables/addpage';
import  {utils} from 'src/utils';
	const props = defineProps({
		pageName : {
			type : String,
			default : 'packages',
		},
		pageStoreKey: {
			type: String,
			default: 'PACKAGES',
		},
		routeName : {
			type : String,
			default : 'packagesadd',
		},
		apiPath : {
			type : String,
			default : 'packages/add',
		},
		submitButtonLabel: {
			type: String,
			default: "Submit",
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
		pageData: { // use to set formData default values from another page
			type: Object,
			default: () => ({
				subscription_type_id: "", name: "", description: "", fee: "", concurrent_access: "", created_at: "", no_of_lessons: "-1", duration_amount: "1", duration_unit: "month",
			})
		},
	});

	const store = usePageStore(props.pageStoreKey);
	const app = useApp();// application state and methods

	const formData = reactive({ ...props.pageData });


	//vuelidate form validation rules
	const rules = computed(() => {
		return {
			subscription_type_id: { required },
		name: { required },
		description: { required },
		fee: { required, numeric },
		concurrent_access: { required, numeric },
		created_at: { required },
		no_of_lessons: { required, numeric },
		duration_amount: { required, numeric },
		duration_unit: { required }
		}
	});


	const page = useAddPage({ store, props, formData, rules, beforeSubmit, afterSubmit });// page form hook

	//event raised before form submit
	function beforeSubmit(){
		return true;
	}

	//event raised after form submit
	function afterSubmit(response) {
		app.flashMsg(props.msgTitle, props.msgAfterSave);
		page.setFormDefaultValues(); // reset form data
		if(app.isDialogOpen()){
			app.closeDialogs(); // if page is open as dialog, close dialog
		}
		else if(props.redirect){
			app.navigateTo(`/packages`);
		}

	}


	const {  saving, pageReady,   } = toRefs(page.state);

	const { submitForm, isFieldValid, getFieldError, mapOptionField } = page.methods;

	useMeta(() => {
		return {
			//set browser title
			title: "Add New Package"
		}
	});


	onMounted(()=>{
        formData.created_at = utils.dateNow();
	});

	// expose page object for other components access
	defineExpose({
		page
	});

</script>

<style scoped>

</style>

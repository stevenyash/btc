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
                                    Edit Guest User
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
                                                    Guest Id *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlguest_id" v-model.trim="formData.guest_id"  label="Guest Id" type="text" placeholder="Enter Guest Id"      
                                                    class="" :error="isFieldValid('guest_id')" :error-message="getFieldError('guest_id')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Ip Address 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlip_address" v-model.trim="formData.ip_address"  label="Ip Address" type="text" placeholder="Enter Ip Address"      
                                                    class="" :error="isFieldValid('ip_address')" :error-message="getFieldError('ip_address')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    User Agent 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input  ref="ctrluser_agent" rows="5"  v-model="formData.user_agent" placeholder="Enter User Agent"    type="textarea" :error="isFieldValid('user_agent')" :error-message="getFieldError('user_agent')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Fingerprint 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlfingerprint" v-model.trim="formData.fingerprint"  label="Fingerprint" type="text" placeholder="Enter Fingerprint"      
                                                    class="" :error="isFieldValid('fingerprint')" :error-message="getFieldError('fingerprint')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Is Active 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlis_active" v-model.trim="formData.is_active"  label="Is Active" type="number" placeholder="Enter Is Active"   step="any"    
                                                    class="" :error="isFieldValid('is_active')" :error-message="getFieldError('is_active')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Platiform *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlplatiform" v-model.trim="formData.platiform"  label="Platiform" type="text" placeholder="Enter Platiform"      
                                                    class="" :error="isFieldValid('platiform')" :error-message="getFieldError('platiform')">
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
			default: 'guestusers',
		},
		pageStoreKey: {
			type: String,
			default: 'GUESTUSERS',
		},
		routeName: {
			type: String,
			default: 'guestusersedit',
		},
		pagePath: {
			type : String,
			default : 'guestusers/edit',
		},
		apiPath: {
			type: String,
			default: 'guestusers/edit',
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
		guest_id: "", ip_address: "NULL", user_agent: "", fingerprint: "NULL", is_active: "1", platiform: "", 
	}, props.pageData);
	
	const formData = reactive({ ...formDefaultValues });
	
	//event raised after form submit
	function afterSubmit(response) {
		app.flashMsg(props.msgTitle, props.msgAfterSave);
		if(app.isDialogOpen()){
			app.closeDialogs(); // if page is open as dialog, close dialog
		}
		else if(props.redirect){
			app.navigateTo(`/guestusers`);
		}

	}
	
	//vuelidate form validation rules
	const rules = computed(() => {
		return {
			guest_id: { required },
		is_active: { numeric },
		platiform: { required }
		}
	});
	
	const page = useEditPage({ store, props, formData, rules, afterSubmit });
	
	const {  saving, loading, pageReady,   } = toRefs(page.state);
	
	const {  currentRecord: editRecord } = toRefs(store.state);
	
	const { load, submitForm, isFieldValid, getFieldError,  } = page.methods;
	
	useMeta(() => {
		return {
			//set browser title
			title: "Edit Guest User"
		}
	});

	
	onMounted(()=>{ 
	});

</script>

<style scoped>

</style>

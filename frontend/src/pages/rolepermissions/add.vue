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
                                    Add New Role Permission
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
                                                    List *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrllist" v-model.trim="formData.list"  label="List" type="number" placeholder="Enter List"   step="any"    
                                                    class="" :error="isFieldValid('list')" :error-message="getFieldError('list')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Edit *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-field  borderless   :error="isFieldValid('edit')" :error-message="getFieldError('edit')">
                                                    <q-option-group  ref="ctrledit" v-model="formData.edit" type="toggle" :options="app.menus.edit" inline size="md" ></q-option-group>
                                                    </q-field>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Remove *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlremove" v-model.trim="formData.remove"  label="Remove" type="number" placeholder="Enter Remove"   step="any"    
                                                    class="" :error="isFieldValid('remove')" :error-message="getFieldError('remove')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    View *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlview" v-model.trim="formData.view"  label="View" type="number" placeholder="Enter View"   step="any"    
                                                    class="" :error="isFieldValid('view')" :error-message="getFieldError('view')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Page *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlpage" v-model.trim="formData.page"  label="Page" type="text" placeholder="Enter Page"      
                                                    class="" :error="isFieldValid('page')" :error-message="getFieldError('page')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Role Id *
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <api-data-source @loaded="response => mapOptionField(response, 'role_id')"  api-path="components_data/role_id_option_list_2"  v-slot="req">
                                                        <nice-select     :loading="req.loading"   ref="ctrlrole_id" v-model="formData.role_id" :options="req.response" label="Role Id"  :error="isFieldValid('role_id')" :error-message="getFieldError('role_id')">
                                                        </nice-select>  
                                                    </api-data-source>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Store 
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlstore" v-model.trim="formData.store"  label="Store" type="number" placeholder="Enter Store"   step="any"    
                                                    class="" :error="isFieldValid('store')" :error-message="getFieldError('store')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
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
	
	const props = defineProps({
		pageName : {
			type : String,
			default : 'rolepermissions',
		},
		pageStoreKey: {
			type: String,
			default: 'ROLEPERMISSIONS',
		},
		routeName : {
			type : String,
			default : 'rolepermissionsadd',
		},
		apiPath : {
			type : String,
			default : 'rolepermissions/add',
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
				list: "", edit: [], remove: "", view: "", page: "", role_id: "", store: "NULL", 
			})
		},
	});

	const store = usePageStore(props.pageStoreKey);
	const app = useApp();// application state and methods
	
	const formData = reactive({ ...props.pageData });
	
	
	//vuelidate form validation rules
	const rules = computed(() => {
		return {
			list: { required, numeric },
		edit: { required },
		remove: { required, numeric },
		view: { required, numeric },
		page: { required },
		role_id: { required },
		store: { numeric }
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
			app.navigateTo(`/rolepermissions`);
		}

	}

	
	const {  saving, pageReady,   } = toRefs(page.state);
	
	const { submitForm, isFieldValid, getFieldError, mapOptionField } = page.methods;
	
	useMeta(() => {
		return {
			//set browser title
			title: "Add New Role Permission"
		}
	});

	
	onMounted(()=>{ 
	});
	
	// expose page object for other components access
	defineExpose({
		page
	});

</script>

<style scoped>

</style>

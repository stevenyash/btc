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
                                    Uploade Videos
                                    <div class="text-caption text-grey"> not you will need a fast and consistent network,you can view the red progress bar on the top of the screen .this might take sometime to upload take a cup of tea  </div>
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
                                        <fieldset class="q-ml-sm q-my-md col-12"><legend class="text-h6 text-bold">Please provide a meanfull title</legend>
                                            <div class="row q-col-gutter-md">
                                                <div class="col-12">
                                                    <div class="row">
                                                        <div class="col-sm-3 col-12">
                                                            Title/Strand/Topic 
                                                        </div>
                                                        <div class="col-sm-9 col-12">
                                                            <q-input   ref="ctrltitle" v-model.trim="formData.title"  label="Title/Strand/Topic" type="text" placeholder="Enter Title/Strand/Topic"      
                                                            class="" :error="isFieldValid('title')" :error-message="getFieldError('title')">
                                                            </q-input>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-12">
                                                    <div class="row">
                                                        <div class="col-sm-3 col-12">
                                                            File 
                                                        </div>
                                                        <div class="col-sm-9 col-12">
                                                            <div class="q-mb-sm">
                                                                <q-uploader-input :max-files="1" :max-file-size="5000" accept=".mp3,.mp4,.webm,.wav,.avi,.mpg,.mpeg" :multiple="false" delete-icon="clear" style="width:100%" label="Choose files or drop files here" upload-path="fileuploader/upload/file" v-model="formData.file"></q-uploader-input>
                                                                <!-- <small class="q-pa-sm text-negative"></small> -->
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <input name="ctrlcollection"  ref="ctrlcollection" v-model="formData.collection" type="hidden" />
                                                <div class="col-12">
                                                    <div class="row">
                                                        <div class="col-sm-3 col-12">
                                                            Visibility 
                                                        </div>
                                                        <div class="col-sm-9 col-12">
                                                            <nice-select        ref="ctrlvisibility" v-model="formData.visibility" :options="app.menus.visibility" label="Visibility"  :error="isFieldValid('visibility')" :error-message="getFieldError('visibility')">
                                                            </nice-select>  
                                                        </div>
                                                    </div>
                                                </div>
                                                <input name="ctrlstatus"  ref="ctrlstatus" v-model="formData.status" type="hidden" />
                                                <input name="ctrlcategory"  ref="ctrlcategory" v-model="formData.category" type="hidden" />
                                                <div class="col-12">
                                                    <div class="row">
                                                        <div class="col-sm-3 col-12">
                                                            Sub-strand/sub-topic 
                                                        </div>
                                                        <div class="col-sm-9 col-12">
                                                            <q-input   ref="ctrldescription" v-model.trim="formData.description"  label="Sub-strand/sub-topic" type="text" placeholder="Enter Sub-strand/sub-topic"      
                                                            class="" :error="isFieldValid('description')" :error-message="getFieldError('description')">
                                                            </q-input>
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
	import { required, } from 'src/services/validators';
	import { usePageStore } from 'src/stores/page';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useAddPage } from 'src/composables/addpage';
	
	const props = defineProps({
		pageName : {
			type : String,
			default : 'video',
		},
		pageStoreKey: {
			type: String,
			default: 'VIDEO',
		},
		routeName : {
			type : String,
			default : 'videoadd',
		},
		apiPath : {
			type : String,
			default : 'video/add',
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
				title: "NULL", file: "", collection: "NULL", visibility: "hidden", status: "pending", category: "NULL", description: "NULL", 
			})
		},
	});

	const store = usePageStore(props.pageStoreKey);
	const app = useApp();// application state and methods
	
	const formData = reactive({ ...props.pageData });
	
	
	//vuelidate form validation rules
	const rules = computed(() => {
		return {
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
			app.navigateTo(`/collections`);
		}

	}

	
	const {  saving, pageReady,   } = toRefs(page.state);
	
	const { submitForm, isFieldValid, getFieldError, mapOptionField } = page.methods;
	
	useMeta(() => {
		return {
			//set browser title
			title: "Add New Videos"
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

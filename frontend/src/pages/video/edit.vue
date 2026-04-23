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
                                    Edit Videos
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
                                                                <q-uploader-input show-uploaded-files :max-files="1" :max-file-size="5000" accept=".mp3,.mp4,.webm,.wav,.avi,.mpg,.mpeg" :multiple="false" delete-icon="clear" style="width:100%" label="Choose files or drop files here" upload-path="fileuploader/upload/file" v-model="formData.file"  ></q-uploader-input>
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
	import { required, } from 'src/services/validators';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useEditPage } from 'src/composables/editpage';
	import { usePageStore } from 'src/stores/page';
	
	const props = defineProps({
		id: [String, Number],
		pageName: {
			type: String,
			default: 'video',
		},
		pageStoreKey: {
			type: String,
			default: 'VIDEO',
		},
		routeName: {
			type: String,
			default: 'videoedit',
		},
		pagePath: {
			type : String,
			default : 'video/edit',
		},
		apiPath: {
			type: String,
			default: 'video/edit',
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
		title: "NULL", file: "", collection: "NULL", visibility: "hidden", status: "pending", category: "NULL", description: "NULL", 
	}, props.pageData);
	
	const formData = reactive({ ...formDefaultValues });
	
	//event raised after form submit
	function afterSubmit(response) {
		app.flashMsg(props.msgTitle, props.msgAfterSave);
		if(app.isDialogOpen()){
			app.closeDialogs(); // if page is open as dialog, close dialog
		}
		else if(props.redirect){
			app.navigateTo(`/video`);
		}

	}
	
	//vuelidate form validation rules
	const rules = computed(() => {
		return {
		}
	});
	
	const page = useEditPage({ store, props, formData, rules, afterSubmit });
	
	const {  saving, loading, pageReady,   } = toRefs(page.state);
	
	const {  currentRecord: editRecord } = toRefs(store.state);
	
	const { load, submitForm, isFieldValid, getFieldError,  } = page.methods;
	
	useMeta(() => {
		return {
			//set browser title
			title: "Edit Videos"
		}
	});

	
	onMounted(()=>{ 
	});

</script>

<style scoped>

</style>

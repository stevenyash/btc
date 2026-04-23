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
                                    Add New Scheduler
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
                                                    Teacher
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <api-data-source @loaded="response => mapOptionField(response, 'user_id')"  api-path="components_data/user_id_option_list_2"  v-slot="req">
                                                        <nice-select     :loading="req.loading"   ref="ctrluser_id" v-model="formData.user_id" :options="req.response" label="Teacher"  :error="isFieldValid('user_id')" :error-message="getFieldError('user_id')">
                                                        <template v-slot:option="scope">
                                                            <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                                                                <q-item-section v-if="scope.opt.image" avatar>
                                                                    <image-viewer :src="scope.opt.image" image-size="small"></image-viewer>
                                                                </q-item-section>
                                                                <q-item-section>
                                                                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                                                                    <q-item-label v-if="scope.opt.caption" caption>{{ scope.opt.caption }}</q-item-label>
                                                                </q-item-section>
                                                            </q-item>
                                                        </template>
                                                        <template v-slot:selected-item="scope">
                                                            <q-item  v-if="scope.opt">
                                                                <q-item-section v-if="scope.opt.image" avatar>
                                                                    <image-viewer :src="scope.opt.image" image-size="small"></image-viewer>
                                                                </q-item-section>
                                                                <q-item-section>
                                                                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                                                                    <q-item-label v-if="scope.opt.caption" caption>{{ scope.opt.caption }}</q-item-label>
                                                                </q-item-section>
                                                            </q-item>
                                                        </template>
                                                        </nice-select>
                                                    </api-data-source>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Grade
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <api-data-source @loaded="response => mapOptionField(response, 'grade')"  api-path="components_data/grade_option_list"  v-slot="req">
                                                        <nice-select     :loading="req.loading"   ref="ctrlgrade" v-model="formData.grade" :options="req.response" label="Grade"  :error="isFieldValid('grade')" :error-message="getFieldError('grade')">
                                                        <template v-slot:option="scope">
                                                            <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
                                                                <q-item-section v-if="scope.opt.image" avatar>
                                                                    <image-viewer :src="scope.opt.image" image-size="small"></image-viewer>
                                                                </q-item-section>
                                                                <q-item-section>
                                                                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                                                                    <q-item-label v-if="scope.opt.caption" caption>{{ scope.opt.caption }}</q-item-label>
                                                                </q-item-section>
                                                            </q-item>
                                                        </template>
                                                        <template v-slot:selected-item="scope">
                                                            <q-item  v-if="scope.opt">
                                                                <q-item-section v-if="scope.opt.image" avatar>
                                                                    <image-viewer :src="scope.opt.image" image-size="small"></image-viewer>
                                                                </q-item-section>
                                                                <q-item-section>
                                                                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                                                                    <q-item-label v-if="scope.opt.caption" caption>{{ scope.opt.caption }}</q-item-label>
                                                                </q-item-section>
                                                            </q-item>
                                                        </template>
                                                        </nice-select>
                                                    </api-data-source>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Learning Area/Subject/
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrllearning_area" v-model.trim="formData.learning_area"  label="Learning Area/Subject/" type="text" placeholder="Enter Learning Area/Subject/"
                                                    class="" :error="isFieldValid('learning_area')" :error-message="getFieldError('learning_area')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Strand/Topic
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlstrand" v-model.trim="formData.strand"  label="Strand/Topic" type="text" placeholder="Enter Strand/Topic"
                                                    class="" :error="isFieldValid('strand')" :error-message="getFieldError('strand')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Start Date
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input  ref="ctrlstart_date" v-model="formData.start_date"    :error="isFieldValid('start_date')" :error-message="getFieldError('start_date')">
                                                    <template v-slot:prepend>
                                                        <q-icon name="date_range" class="cursor-pointer">
                                                        <q-popup-proxy transition-show="scale" transition-hide="scale">
                                                        <q-date      mask="YYYY-MM-DD HH:mm" v-model="formData.start_date" />
                                                        </q-popup-proxy>
                                                        </q-icon>
                                                    </template>
                                                    <template v-slot:append>
                                                        <q-icon name="access_time" class="cursor-pointer">
                                                        <q-popup-proxy transition-show="scale" transition-hide="scale">
                                                        <q-time v-model="formData.start_date" mask="YYYY-MM-DD HH:mm" />
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
                                                    End Date
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input  ref="ctrlend_date" v-model="formData.end_date"    :error="isFieldValid('end_date')" :error-message="getFieldError('end_date')">
                                                    <template v-slot:prepend>
                                                        <q-icon name="date_range" class="cursor-pointer">
                                                        <q-popup-proxy transition-show="scale" transition-hide="scale">
                                                        <q-date      mask="YYYY-MM-DD HH:mm" v-model="formData.end_date" />
                                                        </q-popup-proxy>
                                                        </q-icon>
                                                    </template>
                                                    <template v-slot:append>
                                                        <q-icon name="access_time" class="cursor-pointer">
                                                        <q-popup-proxy transition-show="scale" transition-hide="scale">
                                                        <q-time v-model="formData.end_date" mask="YYYY-MM-DD HH:mm" />
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
                                                    Status
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlstatus" v-model.trim="formData.status"  label="Status" type="text" placeholder="Enter Status"
                                                    class="" :error="isFieldValid('status')" :error-message="getFieldError('status')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Link
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrllink" v-model.trim="formData.link"  label="Link" type="text" placeholder="Enter Link"
                                                    class="" :error="isFieldValid('link')" :error-message="getFieldError('link')">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-sm-3 col-12">
                                                    Meetingid
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input   ref="ctrlmeetingid" v-model.trim="formData.meetingid"  label="Meetingid" type="text" placeholder="Enter Meetingid"
                                                    class="" :error="isFieldValid('meetingid')" :error-message="getFieldError('meetingid')">
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
	import { required, } from 'src/services/validators';
	import { usePageStore } from 'src/stores/page';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useAddPage } from 'src/composables/addpage';

	const props = defineProps({
		pageName : {
			type : String,
			default : 'scheduler',
		},
		pageStoreKey: {
			type: String,
			default: 'SCHEDULER',
		},
		routeName : {
			type : String,
			default : 'scheduleradd',
		},
		apiPath : {
			type : String,
			default : 'scheduler/add',
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
				user_id: "", grade: "", learning_area: "", strand: "", start_date: new Date(), end_date: new Date(), status: "upcoming", link: "NULL", meetingid: "NULL",
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
        console.log("beforeSubmit", formData);
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
			app.navigateTo(`/scheduler`);
		}

	}


	const {  saving, pageReady,   } = toRefs(page.state);

	const { submitForm, isFieldValid, getFieldError, mapOptionField } = page.methods;

	useMeta(() => {
		return {
			//set browser title
			title: "Add New Scheduler"
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

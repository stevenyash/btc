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
                                    Add New Question
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
                                            Question Text *
                                            <div id="ctrl-question_text-holder">
                                                <div class="q-mb-sm">
                                                    <full-q-editor label="Question Text" ref="ctrlquestion_text" placeholder="Enter Question(s) Text" v-model="formData.question_text" min-height=""></full-q-editor>
                                                    <!-- <small class="q-pa-sm text-negative"></small> -->
                                                </div>
                                            </div>
                                        </div>
                                        <input name="ctrlstatus"  ref="ctrlstatus" v-model="formData.status" type="hidden" />
                                        <input name="ctrlscheduler_id"  ref="ctrlscheduler_id" v-model="formData.scheduler_id" type="hidden" />
                                        <input name="ctrlcreated_at"  ref="ctrlcreated_at" v-model="formData.created_at" type="hidden" />
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
	import { utils } from 'src/utils';
	import { useAddPage } from 'src/composables/addpage';

	const props = defineProps({
		pageName : {
			type : String,
			default : 'questions',
		},
		pageStoreKey: {
			type: String,
			default: 'QUESTIONS',
		},
		routeName : {
			type : String,
			default : 'questionsadd',
		},
		apiPath : {
			type : String,
			default : 'questions/add',
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
			default: "Thank you for your submission",
		},
		msgAfterSave: {
			type: String,
			default: "Question added successfully .We will get back to you soon",
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
				question_text: "", status: "unanswered", scheduler_id: "NULL", created_at: "",
			})
		},
	});
const emit = defineEmits(['addComplete']);
	const store = usePageStore(props.pageStoreKey);
	const app = useApp();// application state and methods

	const formData = reactive({ ...props.pageData });


	//vuelidate form validation rules
	const rules = computed(() => {
		return {
			question_text: { required },
		created_at: { required }
		}
	});


	const page = useAddPage({ store, props, formData, rules, beforeSubmit, afterSubmit });// page form hook

	//event raised before form submit
	function beforeSubmit(){
		return true;
	}

	//event raised after form submit
	function afterSubmit(response) {
        emit('addComplete', true);
		app.flashMsg(props.msgTitle, props.msgAfterSave);
		page.setFormDefaultValues(); // reset form data
		if(app.isDialogOpen()){
			app.closeDialogs(); // if page is open as dialog, close dialog
		}
		else if(props.redirect){
			app.navigateTo(`/weekendtutorials`);
		}

	}


	const {  saving, pageReady,   } = toRefs(page.state);

	const { submitForm,   mapOptionField } = page.methods;

	useMeta(() => {
		return {
			//set browser title
			title: "Tutorial Question"
		}
	});


	onMounted(()=>{
			formData.created_at = utils.dateTimeNow();
	});

	// expose page object for other components access
	defineExpose({
		page
	});

</script>

<style scoped>

</style>

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
                                    Edit Topic
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


                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Education Level *</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <template v-if="selectedLevel?.level_id">
                                                        <div class="selected-level-info">
                                                            <q-input
                                                                :model-value="selectedLevel.name"
                                                                label="Education Level"
                                                                type="text"
                                                                readonly
                                                                class="full-width"
                                                                filled
                                                            >
                                                                <template v-slot:append>
                                                                    <q-icon name="layers" color="primary" />
                                                                </template>
                                                            </q-input>
                                                            <input type="hidden" v-model="formData.level_id" />
                                                            <div class="text-caption text-positive q-mt-xs">
                                                                <q-icon name="info" size="xs" />
                                                                Level selected from learning hierarchy
                                                            </div>
                                                        </div>
                                                    </template>
                                                    <template v-else>
                                                        <api-data-source
                                                            @loaded="response => mapOptionField(response, 'level_id')"
                                                            api-path="components_data/levels_option_list"
                                                            v-slot="req"
                                                        >
                                                            <nice-select
                                                                :loading="req.loading"
                                                                ref="ctrllevel_id"
                                                                v-model="formData.level_id"
                                                                :options="req.response"
                                                                label="Select Education Level"
                                                                :error="isFieldValid('level_id')"
                                                                :error-message="getFieldError('level_id')"
                                                                class="full-width"
                                                            >
                                                                <template v-slot:option="scope">
                                                                    <q-item v-bind="scope.itemProps">
                                                                        <q-item-section avatar>
                                                                            <q-icon name="layers" color="primary" />
                                                                        </q-item-section>
                                                                        <q-item-section>
                                                                            <q-item-label>{{ scope.opt.label }}</q-item-label>
                                                                        </q-item-section>
                                                                    </q-item>
                                                                </template>
                                                            </nice-select>
                                                        </api-data-source>
                                                        <div class="text-caption text-grey q-mt-xs">
                                                            Select the education level for this grade
                                                        </div>
                                                    </template>
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
			default: 'topics',
		},
		pageStoreKey: {
			type: String,
			default: 'TOPICS',
		},
		routeName: {
			type: String,
			default: 'topicsedit',
		},
		pagePath: {
			type : String,
			default : 'topics/edit',
		},
		apiPath: {
			type: String,
			default: 'topics/edit',
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
		area_id: "NULL", name: "",
	}, props.pageData);

	const formData = reactive({ ...formDefaultValues });

	//event raised after form submit
	function afterSubmit(response) {
		app.flashMsg(props.msgTitle, props.msgAfterSave);
		if(app.isDialogOpen()){
			app.closeDialogs(); // if page is open as dialog, close dialog
		}
		else if(props.redirect){
			app.navigateTo(`/topics`);
		}

	}

	//vuelidate form validation rules
	const rules = computed(() => {
		return {
			area_id: { numeric },
		name: { required }
		}
	});

	const page = useEditPage({ store, props, formData, rules, afterSubmit });

	const {  saving, loading, pageReady,   } = toRefs(page.state);

	const {  currentRecord: editRecord } = toRefs(store.state);

	const { load, submitForm, isFieldValid, getFieldError,  } = page.methods;

	useMeta(() => {
		return {
			//set browser title
			title: "Edit Topic"
		}
	});


	onMounted(()=>{
	});

</script>

<style scoped>

</style>

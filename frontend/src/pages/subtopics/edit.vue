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
                                    Edit Subtopic
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
                                <q-card  :flat="isSubPage" class="q-pa-lg nice-shadow-6">
                                    <q-form ref="observer"  @submit.prevent="submitForm()">
                                    <!--[form-content-start]-->
                                    <div class="form-rows-container">

                                        <!-- Area Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Area *</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <api-data-source
                                                        @loaded="response => mapOptionField(response, 'area_id')"
                                                        api-path="components_data/areas_option_list"
                                                        v-slot="req"
                                                    >
                                                        <nice-select
                                                            :loading="req.loading"
                                                            ref="ctrlarea_id"
                                                            v-model="formData.area_id"
                                                            :options="req.response"
                                                            label="Select Area"
                                                            :error="isFieldValid('area_id')"
                                                            :error-message="getFieldError('area_id')"
                                                            class="full-width"
                                                        >
                                                            <template v-slot:option="scope">
                                                                <q-item v-bind="scope.itemProps">
                                                                    <q-item-section avatar>
                                                                        <q-icon name="category" color="primary" />
                                                                    </q-item-section>
                                                                    <q-item-section>
                                                                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                                                                    </q-item-section>
                                                                </q-item>
                                                            </template>
                                                        </nice-select>
                                                    </api-data-source>
                                                    <div class="text-caption text-grey q-mt-xs">
                                                        Select the learning area to filter available topics
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Topic Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Topic *</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <api-data-source
                                                        @loaded="response => mapOptionField(response, 'topic_id')"
                                                        :api-path="`components_data/topics_option_list?area_id=${formData.area_id}`"
                                                        :load-on-mount="!!formData.area_id"
                                                        v-slot="req"
                                                    >
                                                        <nice-select
                                                            :loading="req.loading"
                                                            ref="ctrltopic_id"
                                                            v-model="formData.topic_id"
                                                            :options="req.response"
                                                            label="Select Topic"
                                                            :error="isFieldValid('topic_id')"
                                                            :error-message="getFieldError('topic_id')"
                                                            class="full-width"
                                                            :disable="!formData.area_id"
                                                        >
                                                            <template v-slot:option="scope">
                                                                <q-item v-bind="scope.itemProps">
                                                                    <q-item-section avatar>
                                                                        <q-icon name="topic" color="primary" />
                                                                    </q-item-section>
                                                                    <q-item-section>
                                                                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                                                                    </q-item-section>
                                                                </q-item>
                                                            </template>
                                                        </nice-select>
                                                    </api-data-source>
                                                    <div v-if="!formData.area_id" class="text-caption text-warning q-mt-xs">
                                                        Please select an area first to load topics
                                                    </div>
                                                    <div v-else class="text-caption text-grey q-mt-xs">
                                                        Select the topic for this subtopic
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Subtopic Name Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Subtopic Name *</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input
                                                        ref="ctrlname"
                                                        v-model.trim="formData.name"
                                                        label="Subtopic Name"
                                                        type="text"
                                                        placeholder="Enter subtopic name"
                                                        class="full-width"
                                                        :error="isFieldValid('name')"
                                                        :error-message="getFieldError('name')"
                                                    >
                                                        <template v-slot:prepend>
                                                            <q-icon name="subject" />
                                                        </template>
                                                    </q-input>
                                                    <div class="text-caption text-grey q-mt-xs">
                                                        Enter a descriptive name for the subtopic
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                    <!--[form-content-end]-->
                                    <div v-if="showSubmitButton" class="text-center q-mt-xl submit-section">
                                        <q-btn
                                            :rounded="false"
                                            color="primary"
                                            no-caps
                                            unelevated
                                            type="submit"
                                            icon-right="send"
                                            :loading="saving"
                                            :disable="!formData.area_id || !formData.topic_id || !formData.name"
                                            size="lg"
                                            class="submit-btn"
                                        >
                                            {{ submitButtonLabel }}
                                            <template v-slot:loading>
                                                <q-spinner-oval />
                                                Updating Subtopic...
                                            </template>
                                        </q-btn>

                                        <!-- Form Status Messages -->
                                        <div v-if="!formData.area_id" class="q-mt-md">
                                            <q-banner inline-actions class="bg-warning text-dark">
                                                <template v-slot:avatar>
                                                    <q-icon name="warning" color="dark" />
                                                </template>
                                                Please select an area to continue
                                            </q-banner>
                                        </div>

                                        <div v-if="!formData.topic_id || formData.topic_id === 'NULL'" class="q-mt-md">
                                            <q-banner inline-actions class="bg-warning text-dark">
                                                <template v-slot:avatar>
                                                    <q-icon name="warning" color="dark" />
                                                </template>
                                                Please select a topic to continue
                                            </q-banner>
                                        </div>

                                        <div v-if="!formData.name" class="q-mt-md">
                                            <q-banner inline-actions class="bg-warning text-dark">
                                                <template v-slot:avatar>
                                                    <q-icon name="warning" color="dark" />
                                                </template>
                                                Please enter a subtopic name
                                            </q-banner>
                                        </div>
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
	import {  computed, ref, reactive, toRefs, onMounted, watch } from 'vue';
	import { required, numeric, } from 'src/services/validators';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useEditPage } from 'src/composables/editpage';
	import { usePageStore } from 'src/stores/page';

	const props = defineProps({
		id: [String, Number],
		pageName: {
			type: String,
			default: 'subtopics',
		},
		pageStoreKey: {
			type: String,
			default: 'SUBTOPICS',
		},
		routeName: {
			type: String,
			default: 'subtopicsedit',
		},
		pagePath: {
			type : String,
			default : 'subtopics/edit',
		},
		apiPath: {
			type: String,
			default: 'subtopics/edit',
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
		area_id: "",
		topic_id: "NULL",
		name: "",
	}, props.pageData);

	const formData = reactive({ ...formDefaultValues });

	// Watch for area_id changes to reset topic_id if needed
	watch(() => formData.area_id, (newAreaId) => {
		if (newAreaId) {
			// If area changes and current topic doesn't belong to new area, reset topic
			// This will be handled by the API filtering, but we can add additional logic if needed
		}
	});

	// Event raised before form submit
	function beforeSubmit(){
		if (!formData.area_id) {
			app.flashMsg('Validation Error', 'Please select an area', 'error');
			return false;
		}
		if (!formData.topic_id || formData.topic_id === 'NULL') {
			app.flashMsg('Validation Error', 'Please select a topic', 'error');
			return false;
		}
		if (!formData.name) {
			app.flashMsg('Validation Error', 'Please enter a subtopic name', 'error');
			return false;
		}
		return true;
	}

	//event raised after form submit
	function afterSubmit(response) {
		app.flashMsg(props.msgTitle, props.msgAfterSave);
		if(app.isDialogOpen()){
			app.closeDialogs(); // if page is open as dialog, close dialog
		}
		else if(props.redirect){
			app.navigateTo(`/subtopics`);
		}
	}

	//vuelidate form validation rules
	const rules = computed(() => {
		return {
			area_id: { required },
			topic_id: { required },
			name: { required }
		}
	});

	const page = useEditPage({ store, props, formData, rules, afterSubmit, beforeSubmit });

	const {  saving, loading, pageReady,   } = toRefs(page.state);

	const {  currentRecord: editRecord } = toRefs(store.state);

	const { load, submitForm, isFieldValid, getFieldError, mapOptionField } = page.methods;

	useMeta(() => {
		return {
			//set browser title
			title: "Edit Subtopic"
		}
	});

	// Load area_id based on the current topic_id when editing
	async function loadAreaForTopic(topicId) {
		if (topicId && topicId !== 'NULL') {
			try {
				// You might need to implement an API to get area_id from topic_id
				// For now, we'll assume the topic API returns area information
				// This would be implemented based on your backend API
				console.log('Loading area for topic:', topicId);
			} catch (error) {
				console.error('Error loading area for topic:', error);
			}
		}
	}

	// Watch for when the record loads to set the area_id
	watch(() => store.state.currentRecord, (newRecord) => {
		if (newRecord && newRecord.topic_id) {
			// If the record has a topic_id, we should load the corresponding area_id
			// This would typically come from your API response
			// For now, we'll assume the area_id is provided in the record
			if (newRecord.area_id) {
				formData.area_id = newRecord.area_id;
			}
		}
	}, { immediate: true });

	onMounted(()=>{
		// Load the record when component mounts
		load();
	});

</script>

<style scoped>
.form-rows-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.form-row {
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 16px;
}

.form-row:last-of-type {
    border-bottom: none;
}

.form-label {
    font-weight: 500;
    color: #424242;
    font-size: 14px;
}

.submit-section {
    border-top: 1px solid #e0e0e0;
    padding-top: 24px;
}

.submit-btn {
    min-width: 200px;
    padding: 12px 32px;
    font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .form-label {
        margin-bottom: 8px;
        font-size: 16px;
    }

    .submit-btn {
        min-width: 100%;
        padding: 16px 24px;
    }
}

@media (max-width: 599px) {
    .q-pa-lg {
        padding: 16px;
    }

    .form-row {
        padding-bottom: 20px;
        margin-bottom: 20px;
    }
}

/* Animation for better UX */
.submit-btn {
    transition: all 0.3s ease;
}

/* Focus states for better accessibility */
:deep(.q-field--focused) .q-field__control {
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

:deep(.nice-select .q-field__control) {
    border-radius: 8px;
}
</style>

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
                                    Add New Learning Area
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
                                <q-card  :flat="isSubPage" class="q-pa-lg nice-shadow-6">
                                    <div class="form-rows-container">

                                        <!-- Grade Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Grade *</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <template v-if="selectedGrade?.id">
                                                        <div class="selected-grade-info">
                                                            <q-input
                                                                :model-value="selectedGrade.name"
                                                                label="Grade"
                                                                type="text"
                                                                readonly
                                                                class="full-width"
                                                                filled
                                                            >
                                                                <template v-slot:append>
                                                                    <q-icon name="school" color="primary" />
                                                                </template>
                                                            </q-input>
                                                            <input type="hidden" v-model="formData.grade_id" />
                                                            <div class="text-caption text-positive q-mt-xs">
                                                                <q-icon name="info" size="xs" />
                                                                Grade selected from learning hierarchy
                                                            </div>
                                                        </div>
                                                    </template>
                                                    <template v-else>
                                                        <api-data-source
                                                            @loaded="response => mapOptionField(response, 'grade_id')"
                                                            api-path="components_data/grades_option_list"
                                                            v-slot="req"
                                                        >
                                                            <nice-select
                                                                :loading="req.loading"
                                                                ref="ctrlgrade"
                                                                v-model="formData.grade_id"
                                                                :options="req.response"
                                                                label="Select Grade"
                                                                :error="isFieldValid('grade_id')"
                                                                :error-message="getFieldError('grade_id')"
                                                                class="full-width"
                                                            >
                                                                <template v-slot:option="scope">
                                                                    <q-item v-bind="scope.itemProps">
                                                                        <q-item-section avatar>
                                                                            <q-icon name="school" color="primary" />
                                                                        </q-item-section>
                                                                        <q-item-section>
                                                                            <q-item-label>{{ scope.opt.label }}</q-item-label>
                                                                        </q-item-section>
                                                                    </q-item>
                                                                </template>
                                                            </nice-select>
                                                        </api-data-source>
                                                        <div class="text-caption text-grey q-mt-xs">
                                                            Select the grade for this learning area
                                                        </div>
                                                    </template>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Name Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Learning Area Name *</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input
                                                        ref="ctrlname"
                                                        v-model.trim="formData.name"
                                                        label="Learning Area Name"
                                                        type="text"
                                                        placeholder="Enter learning area name (e.g., Mathematics, English, Science)"
                                                        class="full-width"
                                                        :error="isFieldValid('name')"
                                                        :error-message="getFieldError('name')"
                                                    >
                                                        <template v-slot:prepend>
                                                            <q-icon name="category" />
                                                        </template>
                                                    </q-input>
                                                    <div class="text-caption text-grey q-mt-xs">
                                                        Enter a descriptive name for the learning area
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Description Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-start q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Description</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input
                                                        ref="ctrldescription"
                                                        v-model.trim="formData.description"
                                                        label="Learning Area Description"
                                                        type="textarea"
                                                        placeholder="Enter a brief description of this learning area"
                                                        class="full-width"
                                                        rows="3"
                                                        :error="isFieldValid('description')"
                                                        :error-message="getFieldError('description')"
                                                    />
                                                    <div class="text-caption text-grey q-mt-xs">
                                                        Optional: Describe what this learning area covers
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Sort Order Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Sort Order</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input
                                                        ref="ctrlsort_order"
                                                        v-model.number="formData.sort_order"
                                                        label="Display Order"
                                                        type="number"
                                                        placeholder="Enter sort order"
                                                        class="full-width"
                                                        :error="isFieldValid('sort_order')"
                                                        :error-message="getFieldError('sort_order')"
                                                    >
                                                        <template v-slot:prepend>
                                                            <q-icon name="sort" />
                                                        </template>
                                                    </q-input>
                                                    <div class="text-caption text-grey q-mt-xs">
                                                        Lower numbers appear first
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Active Status Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Status</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-checkbox
                                                        ref="ctrlis_active"
                                                        v-model="formData.is_active"
                                                        label="Active - Make this learning area available to users"
                                                        color="primary"
                                                        :true-value="true"
                                                        :false-value="false"
                                                    />
                                                    <div class="text-caption text-grey q-mt-xs">
                                                        Inactive learning areas won't be visible to students
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    <!-- Submit Button -->
                                    <div v-if="showSubmitButton" class="text-center q-mt-xl submit-section">
                                        <q-btn
                                            type="submit"
                                            :rounded="false"
                                            color="primary"
                                            no-caps
                                            unelevated
                                            icon-right="send"
                                            :loading="saving"
                                            size="lg"
                                            class="submit-btn"
                                        >
                                            {{ submitButtonLabel }}
                                            <template v-slot:loading>
                                                <q-spinner-oval />
                                                Creating Learning Area...
                                            </template>
                                        </q-btn>

                                        <!-- Form Status Messages -->
                                        <div v-if="!formData.grade_id" class="q-mt-md">
                                            <q-banner inline-actions class="bg-warning text-dark">
                                                <template v-slot:avatar>
                                                    <q-icon name="warning" color="dark" />
                                                </template>
                                                Please select a grade to continue
                                            </q-banner>
                                        </div>

                                        <div v-if="!formData.name" class="q-mt-md">
                                            <q-banner inline-actions class="bg-warning text-dark">
                                                <template v-slot:avatar>
                                                    <q-icon name="warning" color="dark" />
                                                </template>
                                                Please enter a learning area name
                                            </q-banner>
                                        </div>
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

        <!-- Loading State -->
        <template v-if="!pageReady">
            <div style="min-height:200px" class="q-pa-sm text-center relative-position">
                <q-inner-loading color="primary" label="Loading..." showing></q-inner-loading>
            </div>
        </template>
    </main>
</template>

<script setup>
	import {  computed, ref, reactive, toRefs, onMounted } from 'vue';
	import { required, numeric } from 'src/services/validators';
	import { usePageStore } from 'src/stores/page';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useAddPage } from 'src/composables/addpage';
	import { useLearningHierarchyStore } from "src/stores/learningHierarchyStore";

	const LearningHierarchy = useLearningHierarchyStore();
	const props = defineProps({
		pageName : {
			type : String,
			default : 'learningareas',
		},
		pageStoreKey: {
			type: String,
			default: 'LEARNINGAREAS',
		},
		routeName : {
			type : String,
			default : 'learningareasadd',
		},
		apiPath : {
			type : String,
			default : 'learningareas/add',
		},
		submitButtonLabel: {
			type: String,
			default: "Create Learning Area",
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
			default: "Learning area created successfully",
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
		pageData: {
			type: Object,
			default: () => ({
				name: "",
				grade_id: "",
				description: "",
				sort_order: 0,
				is_active: true,
			})
		},
	});

	const store = usePageStore(props.pageStoreKey);
	const app = useApp();
	const formData = reactive({ ...props.pageData });
	const selectedGrade = LearningHierarchy.selectedGrade;

	// Form validation rules
	const rules = computed(() => {
		return {
			name: { required },
			grade_id: { required },
			sort_order: { numeric }
		}
	});

	// Event raised before form submit
	function beforeSubmit(){
		if (!formData.grade_id) {
			app.flashMsg('Validation Error', 'Please select a grade', 'error');
			return false;
		}
		if (!formData.name) {
			app.flashMsg('Validation Error', 'Please enter a learning area name', 'error');
			return false;
		}
		return true;
	}

	// Event raised after form submit
	function afterSubmit(response) {
		app.flashMsg(props.msgTitle, props.msgAfterSave);
		page.setFormDefaultValues();

		if(app.isDialogOpen()){
			app.closeDialogs();
		}
		else if(props.redirect){
			app.navigateTo(`/learningareas`);
		}
	}

	const page = useAddPage({ store, props, formData, rules, beforeSubmit, afterSubmit });

	const {  saving, pageReady } = toRefs(page.state);
	const { submitForm, isFieldValid, getFieldError, mapOptionField } = page.methods;

	useMeta(() => {
		return {
			title: "Add New Learning Area"
		}
	});

	onMounted(() => {
		// Set grade_id from learning hierarchy if available
		if (selectedGrade?.id) {
			formData.grade_id = selectedGrade.id;
		}

		// Set default sort order if not set
		if (formData.sort_order === undefined || formData.sort_order === null) {
			formData.sort_order = 0;
		}

		// Set default active status if not set
		if (formData.is_active === undefined || formData.is_active === null) {
			formData.is_active = true;
		}
	});

	// expose page object for other components access
	defineExpose({
		page
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

.selected-grade-info {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e9ecef;
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

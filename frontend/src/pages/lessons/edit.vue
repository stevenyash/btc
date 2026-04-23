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
                                    Edit Lesson
                                </div>
                            </div>
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
                                                        />
                                                    </api-data-source>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Topic Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Topic</label>
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
                                                        />
                                                    </api-data-source>
                                                    <div v-if="!formData.area_id" class="text-caption text-warning q-mt-xs">
                                                        Please select an area first to load topics
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Subtopic Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Subtopic</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <api-data-source
                                                        @loaded="response => mapOptionField(response, 'subtopic_id')"
                                                        :api-path="`components_data/subtopics_option_list?topic_id=${formData.topic_id}`"
                                                        :load-on-mount="!!formData.topic_id"
                                                        v-slot="req"
                                                    >
                                                        <nice-select
                                                            :loading="req.loading"
                                                            ref="ctrlsubtopic_id"
                                                            v-model="formData.subtopic_id"
                                                            :options="req.response"
                                                            label="Select Subtopic"
                                                            :error="isFieldValid('subtopic_id')"
                                                            :error-message="getFieldError('subtopic_id')"
                                                            class="full-width"
                                                            :disable="!formData.topic_id"
                                                        />
                                                    </api-data-source>
                                                    <div v-if="!formData.topic_id" class="text-caption text-warning q-mt-xs">
                                                        Please select a topic first to load subtopics
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Title Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Title *</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input
                                                        ref="ctrltitle"
                                                        v-model.trim="formData.title"
                                                        label="Lesson Title"
                                                        type="text"
                                                        placeholder="Enter lesson title"
                                                        class="full-width"
                                                        :error="isFieldValid('title')"
                                                        :error-message="getFieldError('title')">
                                                    </q-input>
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
                                                        label="Lesson Description"
                                                        type="textarea"
                                                        placeholder="Enter lesson description"
                                                        class="full-width"
                                                        :error="isFieldValid('description')"
                                                        :error-message="getFieldError('description')"
                                                        rows="4">
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Thumbnail Upload Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-start q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Thumbnail Image</label>
                                                    <div class="text-caption text-grey q-mt-xs">
                                                        Recommended: 16:9 ratio, JPG, PNG, WebP
                                                    </div>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <div class="upload-section thumbnail-upload">
                                                        <!-- Current Thumbnail Preview -->
                                                        <div v-if="formData.thumbnail_url && !currentThumbnailFile" class="current-thumbnail q-mb-md">
                                                            <div class="text-caption text-weight-medium q-mb-xs">Current Thumbnail:</div>
                                                            <div class="preview-container thumbnail-preview">
                                                                <img
                                                                    :src="formData.thumbnail_url"
                                                                    alt="Current thumbnail"
                                                                    class="thumbnail-image"
                                                                    @error="onCurrentThumbnailError"
                                                                />
                                                                <div class="thumbnail-overlay">
                                                                    <q-btn
                                                                        icon="delete"
                                                                        color="negative"
                                                                        size="sm"
                                                                        round
                                                                        @click="removeCurrentThumbnail"
                                                                        title="Remove thumbnail"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <q-uploader-input
                                                            ref="thumbnailUploader"
                                                            :max-files="1"
                                                            :max-file-size="10"
                                                            accept=".jpg,.jpeg,.png,.webp,.gif"
                                                            :multiple="false"
                                                            delete-icon="clear"
                                                            class="full-width"
                                                            label="Choose new thumbnail image"
                                                            upload-path="fileuploader/upload/image"
                                                            field-name="thumbnail"
                                                            v-model="formData.thumbnail_url"
                                                            :show-uploaded-files="false"
                                                            @files-added="onThumbnailFilesAdded"
                                                            @file-uploaded="onThumbnailUploadComplete"
                                                            @file-removed="onThumbnailRemoved"
                                                            @files-rejected="onThumbnailRejected"
                                                        />

                                                        <!-- New Thumbnail Preview -->
                                                        <div v-if="thumbnailPreviewUrl" class="thumbnail-preview-section q-mt-md">
                                                            <div class="text-caption text-weight-medium q-mb-xs">New Thumbnail Preview:</div>
                                                            <div class="preview-container thumbnail-preview">
                                                                <img
                                                                    :src="thumbnailPreviewUrl"
                                                                    alt="Thumbnail preview"
                                                                    class="thumbnail-image"
                                                                    @error="onThumbnailError"
                                                                    @load="onThumbnailLoad"
                                                                />
                                                                <div class="thumbnail-overlay">
                                                                    <q-btn
                                                                        icon="delete"
                                                                        color="negative"
                                                                        size="sm"
                                                                        round
                                                                        @click="removeThumbnail"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- Thumbnail Upload Progress -->
                                                        <div v-if="thumbnailUploading" class="upload-progress q-mt-md">
                                                            <div class="row items-center q-col-gutter-sm">
                                                                <div class="col">
                                                                    <q-linear-progress
                                                                        :value="thumbnailProgress / 100"
                                                                        color="secondary"
                                                                        class="q-mb-xs"
                                                                        size="10px"
                                                                    />
                                                                    <div class="text-caption text-center">Uploading Thumbnail: {{ thumbnailProgress }}%</div>
                                                                </div>
                                                                <div class="col-auto">
                                                                    <q-spinner-oval color="secondary" size="20px" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Video Upload Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-start q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Lesson Video</label>
                                                    <div class="text-caption text-grey q-mt-xs">
                                                        Max 600MB, MP4, WebM, AVI
                                                    </div>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <div class="upload-section">
                                                        <!-- Current Video Info -->
                                                        <div v-if="formData.s3_url && !currentVideoFile" class="current-video q-mb-md">
                                                            <div class="text-caption text-weight-medium q-mb-xs">Current Video:</div>
                                                            <div class="file-info">
                                                                <div class="row items-center q-col-gutter-sm">
                                                                    <div class="col-auto">
                                                                        <q-icon name="ondemand_video" color="primary" size="20px" />
                                                                    </div>
                                                                    <div class="col">
                                                                        <div class="text-weight-medium">Existing video file</div>
                                                                        <div class="text-caption text-grey">
                                                                            Duration: {{ formatDuration(formData.duration) }} •
                                                                            Size: {{ formatFileSize(formData.file_size) }}
                                                                        </div>
                                                                        <q-btn
                                                                            v-if="formData.s3_url"
                                                                            @click="previewCurrentVideo"
                                                                            flat
                                                                            size="sm"
                                                                            color="primary"
                                                                            icon="play_arrow"
                                                                            class="q-mt-xs"
                                                                        >
                                                                            Preview Current Video
                                                                        </q-btn>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <q-uploader-input
                                                            ref="videoUploader"
                                                            :max-files="1"
                                                            :max-file-size="600"
                                                            accept=".mp4,.webm,.avi,.mpg,.mpeg"
                                                            :multiple="false"
                                                            delete-icon="clear"
                                                            class="full-width"
                                                            label="Choose new video file"
                                                            upload-path="fileuploader/upload/video"
                                                            field-name="video"
                                                            v-model="formData.file"
                                                            :show-uploaded-files="false"
                                                            @files-added="onVideoFilesAdded"
                                                            @file-uploaded="onVideoUploadComplete"
                                                            @file-removed="onVideoRemoved"
                                                            @files-rejected="onFileRejected"
                                                        />

                                                        <!-- New File Info -->
                                                        <div v-if="currentVideoFile" class="file-info q-mt-sm">
                                                            <div class="row items-center q-col-gutter-sm">
                                                                <div class="col-auto">
                                                                    <q-icon name="description" color="positive" size="20px" />
                                                                </div>
                                                                <div class="col">
                                                                    <div class="text-weight-medium">{{ currentVideoFile.name }}</div>
                                                                    <div class="text-caption text-grey">
                                                                        {{ formatFileSize(currentVideoFile.size) }} •
                                                                        {{ currentVideoFile.type || 'Unknown type' }}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- Video Preview -->
                                                        <div v-if="videoPreviewUrl && currentVideoFile" class="video-preview-section q-mt-md">
                                                            <div class="text-caption text-weight-medium q-mb-xs">New Video Preview:</div>
                                                            <div class="preview-container">
                                                                <video
                                                                    :src="videoPreviewUrl"
                                                                    controls
                                                                    class="video-preview"
                                                                    @error="onVideoError"
                                                                    @loadedmetadata="onVideoLoadedMetadata"
                                                                >
                                                                    Your browser does not support the video tag.
                                                                </video>
                                                            </div>
                                                        </div>

                                                        <!-- Upload Progress -->
                                                        <div v-if="uploading" class="upload-progress q-mt-md">
                                                            <div class="row items-center q-col-gutter-sm">
                                                                <div class="col">
                                                                    <q-linear-progress
                                                                        :value="uploadProgress / 100"
                                                                        color="primary"
                                                                        class="q-mb-xs"
                                                                        size="10px"
                                                                    />
                                                                    <div class="text-caption text-center">Uploading: {{ uploadProgress }}%</div>
                                                                </div>
                                                                <div class="col-auto">
                                                                    <q-spinner-oval color="primary" size="20px" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Duration Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Duration (seconds)</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input
                                                        ref="ctrlduration"
                                                        v-model.number="formData.duration"
                                                        label="Video duration in seconds"
                                                        type="number"
                                                        placeholder="Enter duration"
                                                        class="full-width"
                                                        :error="isFieldValid('duration')"
                                                        :error-message="getFieldError('duration')">
                                                        <template v-slot:append>
                                                            <q-btn
                                                                v-if="currentVideoFile && formData.duration === 0"
                                                                @click="extractVideoDuration(currentVideoFile)"
                                                                flat
                                                                icon="schedule"
                                                                size="sm"
                                                                title="Extract duration from video"
                                                                color="primary"
                                                            />
                                                        </template>
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Price Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Price (KSH)</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-input
                                                        ref="ctrlprice"
                                                        v-model.number="formData.price"
                                                        label="Lesson price"
                                                        type="number"
                                                        placeholder="Enter price"
                                                        class="full-width"
                                                        :error="isFieldValid('price')"
                                                        :error-message="getFieldError('price')">
                                                        <template v-slot:prepend>
                                                            <q-icon name="payments" />
                                                        </template>
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Preview Settings -->
                                        <div class="preview-settings-section q-mb-lg">
                                            <div class="row items-start q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Preview Settings</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <!-- Preview Available Checkbox -->
                                                    <div class="preview-available q-mb-md">
                                                        <q-checkbox
                                                            ref="ctrlis_preview_available"
                                                            v-model="formData.is_preview_available"
                                                            label="Enable preview for this lesson"
                                                            color="primary"
                                                        />
                                                    </div>

                                                    <!-- Preview Duration Field -->
                                                    <div v-if="formData.is_preview_available" class="preview-duration q-ml-md">
                                                        <q-input
                                                            ref="ctrlpreview_duration"
                                                            v-model.number="formData.preview_duration"
                                                            label="Preview duration (seconds)"
                                                            type="number"
                                                            placeholder="Enter preview duration"
                                                            class="full-width"
                                                            :error="isFieldValid('preview_duration')"
                                                            :error-message="getFieldError('preview_duration')">
                                                        </q-input>
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
                                                        label="Display order"
                                                        type="number"
                                                        placeholder="Enter sort order"
                                                        class="full-width"
                                                        :error="isFieldValid('sort_order')"
                                                        :error-message="getFieldError('sort_order')">
                                                        <template v-slot:prepend>
                                                            <q-icon name="sort" />
                                                        </template>
                                                    </q-input>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Active Field -->
                                        <div class="form-row q-mb-lg">
                                            <div class="row items-center q-col-gutter-md">
                                                <div class="col-sm-3 col-12">
                                                    <label class="form-label">Active</label>
                                                </div>
                                                <div class="col-sm-9 col-12">
                                                    <q-checkbox
                                                        ref="ctrlis_active"
                                                        v-model="formData.is_active"
                                                        label="Lesson is active and visible to users"
                                                        color="primary"
                                                    />
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
                                            :disable="uploading || thumbnailUploading"
                                            size="lg"
                                            class="submit-btn"
                                        >
                                            {{ submitButtonLabel }}
                                            <template v-slot:loading>
                                                <q-spinner-oval />
                                                Updating Lesson...
                                            </template>
                                        </q-btn>
                                        <div v-if="uploading || thumbnailUploading" class="text-center q-mt-sm">
                                            <q-banner v-if="uploading" inline-actions class="bg-info text-white">
                                                <template v-slot:avatar>
                                                    <q-icon name="cloud_upload" />
                                                </template>
                                                Please wait for the video upload to complete
                                            </q-banner>
                                            <q-banner v-else-if="thumbnailUploading" inline-actions class="bg-info text-white">
                                                <template v-slot:avatar>
                                                    <q-icon name="cloud_upload" />
                                                </template>
                                                Please wait for the thumbnail upload to complete
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
	import {  computed, ref, reactive, toRefs, onMounted, watch, onUnmounted } from 'vue';
	import { required, numeric, } from 'src/services/validators';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useEditPage } from 'src/composables/editpage';
	import { usePageStore } from 'src/stores/page';

	const props = defineProps({
		id: [String, Number],
		pageName: {
			type: String,
			default: 'lessons',
		},
		pageStoreKey: {
			type: String,
			default: 'LESSONS',
		},
		routeName: {
			type: String,
			default: 'lessonsedit',
		},
		pagePath: {
			type : String,
			default : 'lessons/edit',
		},
		apiPath: {
			type: String,
			default: 'lessons/edit',
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

	// Add reactive properties for file upload
	const uploadProgress = ref(0);
	const uploading = ref(false);
	const videoPreviewUrl = ref('');
	const currentVideoFile = ref(null);
	const videoUploader = ref(null);

	// Thumbnail upload properties
	const thumbnailProgress = ref(0);
	const thumbnailUploading = ref(false);
	const thumbnailPreviewUrl = ref('');
	const currentThumbnailFile = ref(null);
	const thumbnailUploader = ref(null);

	const formDefaultValues = Object.assign({
		area_id: "",
		topic_id: "",
		subtopic_id: "",
		title: "",
		description: "",
		file: null,
		s3_key: "",
		s3_url: "",
		file_size: 0,
		duration: 0,
		thumbnail_url: "",
		price: 0,
		is_preview_available: false,
		preview_duration: 0,
		sort_order: 0,
		is_active: true,
	}, props.pageData);

	const formData = reactive({ ...formDefaultValues });

	// Watch for area_id changes to reset dependent fields
	watch(() => formData.area_id, (newAreaId) => {
		if (newAreaId) {
			// Reset topic and subtopic when area changes
			formData.topic_id = '';
			formData.subtopic_id = '';
		}
	});

	// Watch for topic_id changes to reset subtopic
	watch(() => formData.topic_id, (newTopicId) => {
		if (newTopicId) {
			formData.subtopic_id = '';
		}
	});

	//event raised after form submit
	function afterSubmit(response) {
		uploadProgress.value = 0;
		uploading.value = false;
		thumbnailProgress.value = 0;
		thumbnailUploading.value = false;

		// Cleanup preview URLs
		cleanupPreviewUrl();
		cleanupThumbnailPreviewUrl();
		currentVideoFile.value = null;
		currentThumbnailFile.value = null;

		app.flashMsg(props.msgTitle, props.msgAfterSave);
		if(app.isDialogOpen()){
			app.closeDialogs(); // if page is open as dialog, close dialog
		}
		else if(props.redirect){
			app.navigateTo(`/lessons`);
		}
	}

	// Enhanced beforeSubmit with file validation
	async function beforeSubmit() {
		// Validate that uploads are complete
		if (uploading.value) {
			app.flashMsg('Error', 'Please wait for the video upload to complete', 'error');
			return false;
		}

		if (thumbnailUploading.value) {
			app.flashMsg('Error', 'Please wait for the thumbnail upload to complete', 'error');
			return false;
		}

		return true;
	}

	//vuelidate form validation rules
	const rules = computed(() => {
		return {
			area_id: { required },
			title: { required },
			file_size: { numeric },
			duration: { numeric },
			price: { numeric },
			preview_duration: { numeric },
			sort_order: { numeric }
		}
	});

	const page = useEditPage({ store, props, formData, rules, afterSubmit, beforeSubmit });

	const {  saving, loading, pageReady,   } = toRefs(page.state);

	const {  currentRecord: editRecord } = toRefs(store.state);

	const { load, submitForm, isFieldValid, getFieldError, mapOptionField,  } = page.methods;

	// Helper methods
	function formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatDuration(seconds) {
		if (!seconds) return '0s';
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
	}

	function previewCurrentVideo() {
		if (formData.s3_url) {
			window.open(formData.s3_url, '_blank');
		}
	}

	function removeCurrentThumbnail() {
		formData.thumbnail_url = '';
	}

	function onCurrentThumbnailError() {
		console.warn('Could not load current thumbnail');
	}

	// Thumbnail upload handlers
	function onThumbnailFilesAdded(files) {
		if (files && files.length > 0) {
			const thumbnailFile = files[0];
			currentThumbnailFile.value = thumbnailFile;
			createThumbnailPreview(thumbnailFile);
			thumbnailUploading.value = true;
			thumbnailProgress.value = 10;

			const progressInterval = setInterval(() => {
				if (thumbnailProgress.value < 90) {
					thumbnailProgress.value += 10;
				} else {
					clearInterval(progressInterval);
				}
			}, 300);
		}
	}

	function onThumbnailUploadComplete(uploadData) {
		console.log('Thumbnail upload completed:', uploadData);
		thumbnailUploading.value = false;
		thumbnailProgress.value = 100;

		setTimeout(() => {
			thumbnailProgress.value = 0;
		}, 1000);
	}

	function onThumbnailRemoved(file) {
		resetThumbnailUpload();
	}

	function onThumbnailRejected(rejectedEntries) {
		const reasons = rejectedEntries.map(entry => {
			if (entry.failedPropValidation === 'max-file-size') {
				return `File too large: ${entry.file.name}`;
			}
			if (entry.failedPropValidation === 'filter') {
				return `Invalid file type: ${entry.file.name}`;
			}
			return `Cannot upload: ${entry.file.name}`;
		});

		app.flashMsg('Thumbnail Upload Error', reasons.join(', '), 'error');
		resetThumbnailUpload();
	}

	function resetThumbnailUpload() {
		formData.thumbnail_url = '';
		currentThumbnailFile.value = null;
		thumbnailUploading.value = false;
		thumbnailProgress.value = 0;
		cleanupThumbnailPreviewUrl();
	}

	function createThumbnailPreview(file) {
		try {
			if (!file || !(file instanceof File) || !file.type) {
				console.warn('Invalid file object for thumbnail preview');
				return;
			}

			const supportedImageTypes = [
				'image/jpeg',
				'image/jpg',
				'image/png',
				'image/webp',
				'image/gif'
			];

			if (!supportedImageTypes.includes(file.type)) {
				console.warn('File type not supported for thumbnail:', file.type);
				app.flashMsg('Info', 'File type not supported for thumbnail', 'info');
				return;
			}

			try {
				cleanupThumbnailPreviewUrl();
				thumbnailPreviewUrl.value = URL.createObjectURL(file);
			} catch (urlError) {
				console.error('Error creating thumbnail object URL:', urlError);
				app.flashMsg('Warning', 'Cannot preview this image file', 'warning');
			}
		} catch (error) {
			console.error('Error in createThumbnailPreview:', error);
		}
	}

	function onThumbnailError(event) {
		console.error('Thumbnail image error:', event);
		app.flashMsg('Preview Error', 'Cannot load thumbnail preview', 'warning');
	}

	function onThumbnailLoad(event) {
		console.log('Thumbnail loaded successfully');
	}

	function removeThumbnail() {
		resetThumbnailUpload();
		if (thumbnailUploader.value) {
			thumbnailUploader.value.reset();
		}
	}

	function cleanupThumbnailPreviewUrl() {
		if (thumbnailPreviewUrl.value) {
			try {
				URL.revokeObjectURL(thumbnailPreviewUrl.value);
			} catch (error) {
				console.warn('Error revoking thumbnail object URL:', error);
			}
			thumbnailPreviewUrl.value = '';
		}
	}

	// Video upload handlers
	function onVideoFilesAdded(files) {
		if (files && files.length > 0) {
			const videoFile = files[0];
			currentVideoFile.value = videoFile;
			createVideoPreview(videoFile);
			uploading.value = true;
			uploadProgress.value = 10;

			const progressInterval = setInterval(() => {
				if (uploadProgress.value < 90) {
					uploadProgress.value += 10;
				} else {
					clearInterval(progressInterval);
				}
			}, 500);
		}
	}

	function onFileRejected(rejectedEntries) {
		const reasons = rejectedEntries.map(entry => {
			if (entry.failedPropValidation === 'max-file-size') {
				return `File too large: ${entry.file.name}`;
			}
			if (entry.failedPropValidation === 'filter') {
				return `Invalid file type: ${entry.file.name}`;
			}
			return `Cannot upload: ${entry.file.name}`;
		});

		app.flashMsg('Upload Error', reasons.join(', '), 'error');
		resetFileUpload();
	}

	function onVideoUploadComplete(uploadData) {
		console.log('Video upload completed:', uploadData);
		uploading.value = false;
		uploadProgress.value = 100;

		// Extract duration if not set
		if (currentVideoFile.value && formData.duration === 0) {
			extractVideoDuration(currentVideoFile.value);
		}

		setTimeout(() => {
			currentVideoFile.value = null;
			uploadProgress.value = 0;
			cleanupPreviewUrl();
		}, 1000);
	}

	function onVideoRemoved(file) {
		resetFileUpload();
	}

	function resetFileUpload() {
		formData.file = null;
		currentVideoFile.value = null;
		uploading.value = false;
		uploadProgress.value = 0;
		cleanupPreviewUrl();
	}

	function onVideoError(event) {
		console.error('Video playback error:', event);
		app.flashMsg('Preview Error', 'Cannot play video preview', 'warning');
	}

	function onVideoLoadedMetadata(event) {
		const video = event.target;
		if (formData.duration === 0 && video.duration) {
			formData.duration = Math.round(video.duration);
			console.log('Extracted duration from preview:', formData.duration, 'seconds');
		}
	}

	function createVideoPreview(file) {
		try {
			if (!file || !(file instanceof File) || !file.type) {
				console.warn('Invalid file object for preview');
				return;
			}

			const supportedVideoTypes = [
				'video/mp4',
				'video/webm',
				'video/ogg',
				'video/quicktime',
				'video/x-msvideo',
				'video/mpeg'
			];

			const isSupported = supportedVideoTypes.some(type =>
				file.type.includes(type.replace('video/', ''))
			);

			if (!isSupported) {
				console.warn('File type not supported for preview:', file.type);
				app.flashMsg('Info', 'File type not supported for preview', 'info');
				return;
			}

			try {
				cleanupPreviewUrl();
				videoPreviewUrl.value = URL.createObjectURL(file);
			} catch (urlError) {
				console.error('Error creating object URL:', urlError);
				app.flashMsg('Warning', 'Cannot preview this file type', 'warning');
			}
		} catch (error) {
			console.error('Error in createVideoPreview:', error);
		}
	}

	function extractVideoDuration(file) {
		console.log("Extracting duration from file:", file);
		if (!file || !file.type.startsWith('video/')) {
			console.warn('Not a video file or file is missing');
			return;
		}

		const video = document.createElement('video');
		video.preload = 'metadata';

		let timeoutId;

		const cleanup = () => {
			if (timeoutId) clearTimeout(timeoutId);
			if (video.src) {
				try {
					URL.revokeObjectURL(video.src);
				} catch (error) {
					console.warn('Error revoking URL in duration extraction:', error);
				}
			}
		};

		timeoutId = setTimeout(() => {
			console.warn('Video duration extraction timed out');
			cleanup();
		}, 15000);

		video.onloadedmetadata = function() {
			cleanup();
			formData.duration = Math.round(video.duration);
			console.log('Extracted video duration:', formData.duration, 'seconds');
		};

		video.onerror = function() {
			cleanup();
			console.warn('Could not extract video duration from file:', file.name);
		};

		try {
			video.src = URL.createObjectURL(file);
		} catch (error) {
			cleanup();
			console.error('Error setting video source for duration extraction:', error);
		}
	}

	function cleanupPreviewUrl() {
		if (videoPreviewUrl.value) {
			try {
				URL.revokeObjectURL(videoPreviewUrl.value);
			} catch (error) {
				console.warn('Error revoking object URL:', error);
			}
			videoPreviewUrl.value = '';
		}
	}

	useMeta(() => {
		return {
			//set browser title
			title: "Edit Lesson"
		}
	});

	// Enhanced cleanup on unmount
	onUnmounted(() => {
		cleanupPreviewUrl();
		cleanupThumbnailPreviewUrl();
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

.upload-section {
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    background: #fafafa;
}

.upload-section:hover {
    border-color: #2196f3;
    background: #f3f8ff;
}

.thumbnail-upload {
    border-color: #9c27b0;
}

.thumbnail-upload:hover {
    border-color: #7b1fa2;
}

.file-info {
    background: white;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
}

.preview-container {
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}

.video-preview {
    max-width: 100%;
    max-height: 300px;
    border-radius: 8px;
}

.thumbnail-preview {
    position: relative;
    max-width: 300px;
    max-height: 200px;
    background: #f5f5f5;
}

.thumbnail-image {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
}

.thumbnail-overlay {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.thumbnail-preview:hover .thumbnail-overlay {
    opacity: 1;
}

.upload-progress {
    background: white;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
}

.preview-settings-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e9ecef;
}

.preview-available {
    margin-bottom: 12px;
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

.current-video,
.current-thumbnail {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e9ecef;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .form-label {
        margin-bottom: 8px;
        font-size: 16px;
    }

    .upload-section {
        padding: 12px;
    }

    .video-preview {
        max-height: 200px;
    }

    .thumbnail-preview {
        max-width: 100%;
        max-height: 150px;
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
.file-info, .upload-progress, .preview-container {
    transition: all 0.3s ease;
}

/* Focus states for better accessibility */
:deep(.q-field--focused) .q-field__control {
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

:deep(.q-uploader-input) {
    border: none !important;
}

:deep(.q-uploader-input .q-uploader__header) {
    background: transparent !important;
    border: none !important;
}
</style>

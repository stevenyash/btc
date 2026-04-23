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
                                    Lesson Details
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </template>
            <section class="page-section " >
                <div class="container">
                    <div class="row q-col-gutter-x-md">
                        <div  class="col comp-grid" >
                            <div >
                                <div class="q-pa-md">
                                    <!-- Video Player Section -->
                                    <div v-if="item.s3_url" class="col-12 q-mb-md">
                                        <q-card class="q-pa-md nice-shadow-6">
                                            <div class="text-h6 q-mb-md">Video Lesson</div>
                                            <video
                                                controls
                                                style="width: 100%; max-height: 500px;"
                                                :poster="item.thumbnail_url"
                                            >
                                                <source :src="item.s3_url" type="video/mp4">
                                                Your browser does not support the video tag.
                                            </video>
                                        </q-card>
                                    </div>

                                    <!-- Thumbnail Preview -->
                                    <div v-if="!item.s3_url && item.thumbnail_url" class="col-12 q-mb-md">
                                        <q-card class="q-pa-md nice-shadow-6">
                                            <div class="text-h6 q-mb-md">Lesson Preview</div>
                                            <q-img
                                                :src="item.thumbnail_url"
                                                :ratio="16/9"
                                                class="rounded-borders"
                                                :error-src="missingImage"
                                            >
                                                <template v-slot:error>
                                                    <div class="absolute-full flex flex-center bg-negative text-white">
                                                        <q-icon name="image_not_supported" size="lg" />
                                                    </div>
                                                </template>
                                            </q-img>
                                        </q-card>
                                    </div>

                                    <!-- Lesson Information -->
                                    <div class="q-mb-3 row justify-start q-col-gutter-sm">
                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Title</div>
                                                        <div class="text-h5 text-bold">{{ item.title }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>

                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Description</div>
                                                        <div class="text-bold">{{ item.description || 'No description available' }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>

                                        <div class="col-md-6 col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Area</div>
                                                        <div class="text-bold">{{ item.learning_area ? item.learning_area.name : 'Not specified' }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>

                                        <div class="col-md-6 col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Topic</div>
                                                        <div class="text-bold">{{ item.topic ? item.topic.name : 'Not specified' }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>

                                        <div class="col-md-6 col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Duration</div>
                                                        <div class="text-bold">{{ formatDuration(item.duration) }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>

                                        <div class="col-md-6 col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Price</div>
                                                        <div class="text-bold">{{ formatPrice(item.price) }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>

                                        <div class="col-md-6 col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Preview Available</div>
                                                        <div class="text-bold">
                                                            <q-badge :color="item.is_preview_available ? 'positive' : 'negative'" :label="item.is_preview_available ? 'Yes' : 'No'" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>

                                        <div v-if="item.is_preview_available" class="col-md-6 col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Preview Duration</div>
                                                        <div class="text-bold">{{ formatDuration(item.preview_duration) }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>

                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Status</div>
                                                        <div class="text-bold">
                                                            <q-badge :color="item.is_active ? 'positive' : 'negative'" :label="item.is_active ? 'Active' : 'Inactive'" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>
                                    </div>

                                    <div  class=" row q-col-gutter-xs justify-start q-ma-md">
                                        <template v-if="auth.canView('lessons')">
                                            <div><q-btn icon="edit" label="Edit"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="positive" title="Edit"  @click="app.openPageDialog({ page:'lessons/edit', url: `/lessons/edit/${item.id}` , closeBtn: true })">
                                            </q-btn></div>
                                        </template>
                                        <template v-if="auth.canView('lessons')">
                                            <div><q-btn icon="delete_sweep" label="Delete"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="negative" title="Delete"  @click="deleteItem(item.id)">
                                            </q-btn></div>
                                        </template>
                                    </div>
                                </div>
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
    import {  computed, ref, toRefs, onMounted } from 'vue';
    import { useMeta } from 'quasar';
    import { useApp } from 'src/composables/app.js';
    import { useAuth } from 'src/composables/auth';
    import { useViewPage } from 'src/composables/viewpage.js';
    import { usePageStore } from 'src/stores/page';
    import {useLearningHierarchyStore} from "src/stores/learningHierarchyStore";

    const props = defineProps({
        id: [String, Number],
        primaryKey: {
            type: String,
            default: 'id',
        },
        pageStoreKey: {
            type: String,
            default: 'LESSONS',
        },
        pageName: {
            type: String,
            default: 'lessons',
        },
        routeName: {
            type: String,
            default: 'lessonsview',
        },
        apiPath: {
            type: String,
            default: 'lessons/view',
        },
        autoLoad: {
            type: Boolean,
            default: true,
        },
        exportButton: {
            type: Boolean,
            default: true,
        },
        scrollIntoView: {
            type: Boolean,
            default: true,
        },
        isSubPage: {
            type : Boolean,
            default : false,
        },
        showHeader: {
            type: Boolean,
            default: true,
        },
        showFooter: {
            type: Boolean,
            default: true,
        },
        titleBeforeDelete: {
            type: String,
            default: "Delete record",
        },
        msgBeforeDelete: {
            type: String,
            default: "Are you sure you want to delete this record?",
        },
        msgAfterDelete: {
            type: String,
            default: "Record deleted successfully",
        },
    });


    const store = usePageStore(props.pageStoreKey);
    const app = useApp(props);
    const auth = useAuth();
    const LearningHierarchy=useLearningHierarchyStore()


    const page = useViewPage({store, props}); // where page logics resides

    const {  currentRecord } = toRefs(store.state);
    const { loading, pageReady } = toRefs(page.state);
    const item = currentRecord;

    const  { load, deleteItem,    } = page.methods;

    // Missing image placeholder
    const missingImage = 'https://via.placeholder.com/800x450?text=No+Thumbnail';

    // Format duration in minutes
    const formatDuration = (seconds) => {
        if (!seconds) return 'Not specified';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')} min`;
    };

    // Format price as currency
    const formatPrice = (price) => {
        if (!price && price !== 0) return 'Free';
        return `$${parseFloat(price).toFixed(2)}`;
    };

    useMeta(() => {
        return {
            //set browser title
            title: "Lesson Details"
        }
    });

    onMounted(()=>{
        LearningHierarchy.selectLesson(item)
    });
</script>

<style scoped>
/* Video player styling */
video {
    background-color: #000;
    border-radius: 4px;
}

/* Card hover effect */
.q-card:hover {
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    transition: box-shadow 0.3s ease;
}

/* Make title more prominent */
.text-h5 {
    font-weight: bold;
    color: #1976d2;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .q-col-gutter-x-md > div {
        margin-bottom: 16px;
    }
}
</style>

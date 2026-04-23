<template>
    <q-page class="main-page">
        <section class="page-section q-pa-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div class="col-sm-4 col-md-4 col-12 comp-grid">
                        <div class="">
                            <div><q-btn @click="goBackToLevels" icon="arrow_back" label="Go back to grades/class/form"/></div>
                        </div>
                    </div>

                    <div class="col comp-grid">
                        <div class=" text-h6 text-bold" >
                            Subject/Learning Areas
                            <div class="text-caption text-grey"> choose one  </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="page-section q-mb-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div class="col-12 comp-grid">
                        <div class="">
                            <div>Get Exciting Lessons For this Class. Choose your subject</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="page-section q-mb-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div class="col-sm-6 col-md-12 col-12 comp-grid">
                        <div class="">
                            <template v-if="filteredCollections && filteredCollections.length > 0">
                                <!-- Responsive Horizontal Cards -->
                                <div class="row justify-start q-gutter-md">
                                    <q-card
                                        v-for="(data, ) in filteredCollections"
                                        :key="data.id"
                                        flat
                                        bordered
                                        class="col-12 col-md-6 col-lg-4"
                                        style="max-width: 300px;"
                                    >
                                        <div class="row no-wrap">
                                            <!-- Right Section (Content) -->
                                            <div class="col q-pa-md">
                                                <!-- Main Collection Information -->
                                                <q-card-section>
                                                    <div class="text-h6">{{ data.name?.toUpperCase() }}</div>
                                                    <div class="text-caption row items-center">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            class="q-mr-sm"
                                                            style="width: 16px; height: 16px;"
                                                        >
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                                                        </svg>
                                                    </div>
                                                </q-card-section>
                                                <!-- Action Buttons -->
                                                <q-card-actions align="right" class="q-mt-md column items-end">
                                                    <q-btn
                                                        :disable="!hasContent(data)"
                                                        color="primary"
                                                        label="Go To Lessons"
                                                        icon="visibility"
                                                        @click="ViewLessons(data)"
                                                        flat
                                                    ></q-btn>
                                                    <div v-if="!hasContent(data)" class="text-caption text-grey q-mt-xs">
                                                        Coming Soon
                                                    </div>
                                                </q-card-actions>
                                            </div>
                                        </div>
                                    </q-card>
                                </div>
                            </template>

                            <template v-else-if="loading">
                                <!-- Loading Spinner -->
                                <div class="text-center">
                                    <q-spinner size="30px" />
                                    <p>Loading learning areas...</p>
                                </div>
                            </template>

                            <template v-else>
                                <!-- No Data -->
                                <div class="text-center">
                                    <q-icon name="folder_open" size="64px" color="grey-5" />
                                    <p class="text-grey-6">No learning areas available</p>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </q-page>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useLearningHierarchyStore } from "src/stores/learningHierarchyStore";

const props = defineProps({
    pageName: {
        type: String,
        default: 'home',
    },
    routeName: {
        type: String,
        default: 'home',
    },
    isSubPage: {
        type : Boolean,
        default : false,
    },
});

const learningStore = useLearningHierarchyStore();
const router = useRouter();
const loading = ref(false);

// Computed properties
const filteredCollections = computed(() => learningStore.currentData.areas);
const currentGrade = computed(() => learningStore.selectedGrade);

onMounted(() => {
    initializeComponent();
});

// Watch for selected grade changes and load areas
watch(
    () => learningStore.selectedGrade,
    (newGrade) => {
        if (newGrade) {
            loadAreasForGrade(newGrade.id);
        }
    },
    { immediate: true }
);

async function initializeComponent() {
    loading.value = true;
    try {
        // If we have a selected grade, load its areas
        if (learningStore.selectedGrade) {
            await loadAreasForGrade(learningStore.selectedGrade.id);
        } else {
            // If no grade is selected, redirect to levels
            console.warn('No grade selected, redirecting to levels');
            goBackToLevels();
        }
    } catch (error) {
        console.error('Error initializing component:', error);
    } finally {
        loading.value = false;
    }
}

async function loadAreasForGrade(gradeId) {
    try {
        await learningStore.fetchAreasByGrade(gradeId, false); // false = don't show loading
    } catch (error) {
        console.error('Error loading learning areas:', error);
        // Error handling is already done in the store
    }
}

function ViewLessons(area) {
    learningStore.selectArea(area);
    router.push({ name: 'subscriberclass' });
}

function goBackToLevels() {
    // Clear grade selection and go back
    learningStore.clearSelectionFrom('grade');
    router.push({ name: 'viewlessons', query: { showView: true } });
}

function hasContent(data) {
    return true;
}
</script>

<style scoped>
/* Add any custom styles here */
</style>
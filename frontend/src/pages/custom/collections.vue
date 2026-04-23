<template>
    <q-page class="main-page">
        <section class="page-section q-pa-md">
            <div class="container-fluid">
                <!-- Breadcrumb -->
                <div class="q-mb-md">
                    <q-breadcrumbs>
                        <q-breadcrumbs-el label="Home" icon="home" to="/" />
                        <q-breadcrumbs-el 
                            label="Learning Levels" 
                            icon="school" 
                            to="/learninglevels" 
                        />
                        <q-breadcrumbs-el 
                            :label="store.selectedLevel?.name || 'Grades'" 
                            icon="class" 
                        />
                    </q-breadcrumbs>
                </div>

                <div class="row q-col-gutter-x-md">
                    <div class="col-12">
                        <div class="flex items-center justify-between q-mb-md">
                            <div class="text-h5">
                                Grades for {{ store.selectedLevel?.name || 'Selected Level' }}
                            </div>
                            <q-btn
                                label="Back to Levels"
                                color="primary"
                                icon="arrow_back"
                                unelevated
                                @click="goBackToLevels"
                            />
                        </div>

                        <!-- Grades will be automatically filtered by the selected level -->
                        <template v-if="store.loadingStates.grades">
                            <div class="text-center">
                                <q-spinner size="30px" />
                                <p>Loading grades...</p>
                            </div>
                        </template>

                        <template v-else-if="store.currentData.grades.length > 0">
                            <div class="row q-col-gutter-md">
                                <div 
                                    v-for="grade in store.currentData.grades" 
                                    :key="grade.id"
                                    class="col-12 col-md-6 col-lg-4"
                                >
                                    <q-card class="grade-card">
                                        <q-card-section>
                                            <div class="text-h6">{{ grade.name }}</div>
                                            <div class="text-caption">{{ grade.description }}</div>
                                        </q-card-section>
                                        <q-card-actions>
                                            <q-btn 
                                                label="View Subjects" 
                                                color="primary" 
                                                @click="viewSubjects(grade)"
                                                flat
                                            />
                                        </q-card-actions>
                                    </q-card>
                                </div>
                            </div>
                        </template>

                        <template v-else>
                            <div class="text-center q-pa-lg">
                                <q-icon name="class" size="64px" color="grey-5" />
                                <p class="text-grey-6 q-mt-md">No grades found for this level.</p>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </section>
    </q-page>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLearningHierarchyStore } from 'src/stores/learningHierarchyStore';

const route = useRoute();
const router = useRouter();
const store = useLearningHierarchyStore();

const goBackToLevels = () => {
    store.clearSelection(); // Or store.clearSelectionFrom('level') to keep higher selections
    router.push('/learninglevels');
};

const viewSubjects = (grade) => {
    store.selectGrade(grade);
    router.push({
        name: 'learningareas',
        query: {
            grade_id: grade.id,
            grade_name: grade.name,
            level_id: store.selectedLevel.level_id,
            level_name: store.selectedLevel.name
        }
    });
};

onMounted(async () => {
    // If no level is selected but we have level_id in route, select it
    if (!store.selectedLevel && route.query.level_id) {
        const levels = await store.fetchLearningLevels(false);
        const level = levels.find(l => l.level_id == route.query.level_id);
        if (level) {
            store.selectLevel(level);
        }
    }
    
    // Fetch grades for the selected level
    if (store.selectedLevel) {
        await store.fetchGradesByLevel();
    }
});

// Watch for selected level changes
watch(() => store.selectedLevel, async (newLevel) => {
    if (newLevel) {
        await store.fetchGradesByLevel();
    }
});
</script>

<style scoped>
.learning-level-card {
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.learning-level-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.q-card__section {
    padding: 16px;
}

.q-card__actions {
    padding: 8px 16px 16px;
}

/* Sync button styles */
.sync-button {
    border: 1px solid #1976d2;
}

/* Responsive button group */
@media (max-width: 768px) {
    .q-gutter-sm {
        flex-direction: column;
        align-items: stretch;
    }
    
    .q-gutter-sm .q-btn {
        margin-bottom: 8px;
    }
}
</style>
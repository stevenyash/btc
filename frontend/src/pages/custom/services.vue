<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pt-md" >
            <div class="container-fluid">
                <div class="row ">
                    <div  class="col comp-grid" >
                        <div class="bg-accent">
                            <div class="">
                                <api-data-source   api-path="components_data/services_data_repeater"  v-slot="req">
                                    <div >
                                        <template v-if="!req.loading">
                                            <q-tabs
                                                v-model="activeTab"
                                                align="left"
                                                class="bg-green-5 text-white"
                                                indicator-color="green-10"
                                                >
                                                <q-tab v-for="(data, i) in req.response" :key="i" :name="i" :label="data.title" />
                                            </q-tabs>
                                            <q-tab-panels v-model="activeTab" animated>
                                                <q-tab-panel v-for="(data, i) in req.response" :key="i" :name="i">
                                                    <q-card class="q-pa-md bg-green-2">
                                                        <q-card-section>
                                                            <div class="row">
                                                                <div class="text-h6 text-center">
                                                                    <q-btn flat size="md" :to="`viewlessons?level=${data.level}`" :disable="isLevelEmpty(data.level, data.title)">
                                                                        {{ data.title }}
                                                                        <span v-if="isLevelEmpty(data.level, data.title)" class="text-negative q-ml-sm text-caption">(Coming Soon)</span>
                                                                    </q-btn>
                                                                </div>
                                                                <q-space />
                                                                <div align="right">
                                                                    <q-btn
                                                                        color="black"
                                                                        size="md"
                                                                        :to="`viewlessons?level=${data.level}`"
                                                                        :disable="isLevelEmpty(data.level, data.title)"
                                                                    >
                                                                        Go To {{ data.title }}
                                                                    </q-btn>
                                                                </div>
                                                            </div>
                                                        </q-card-section>
                                                        <q-card-section>
                                                            <div v-html="data.description" class="text-subtitle1"></div>
                                                            <div v-if="isLevelEmpty(data.level, data.title)" class="text-center q-mt-md">
                                                                <q-icon name="folder_open" size="48px" color="grey-5" />
                                                                <p class="text-body2 text-grey-6">Coming Soon.....</p>
                                                            </div>
                                                        </q-card-section>
                                                        <q-card-actions align="right">
                                                            <q-btn
                                                                :label="'More about ' + data.title"
                                                                color="primary"
                                                                @click="$router.push(`viewlessons?level=${data.level}`)"
                                                                :disable="isLevelEmpty(data.level, data.title)"
                                                            />
                                                        </q-card-actions>
                                                    </q-card>
                                                </q-tab-panel>
                                            </q-tab-panels>
                                        </template>

                                    </div>

                                </api-data-source>

                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    </q-page>

</template>
<script setup>
	import {  computed, ref, onMounted } from 'vue';


	import { useApp } from 'src/composables/app.js';
	import { useAuth } from 'src/composables/auth';
	import { ApiService } from 'src/services/api';
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
	const app = useApp();
	const auth = useAuth();
	const pageReady = ref(true);
	const activeTab = ref(0);
	const learningStore = useLearningHierarchyStore();
	const levelGradeCounts = ref({});

	// Function to check if a level is empty (has no grades)
	const isLevelEmpty = (levelName, title = '') => {
		if (!levelName) return false;

		// First check hardcoded disabled levels - Elementary/General Education is coming soon
		// Check both level name and title for "elementary" or "general"
		const disabledKeywords = ['elementary', 'general'];
		const checkText = `${levelName} ${title}`.toLowerCase();

		if (disabledKeywords.some(keyword => checkText.includes(keyword))) {
			return true;
		}

		// Try to find matching level using flexible matching (handles typos and variations)
		const level = learningStore.currentData.levels.find(l => {
			const levelNameLower = levelName.toLowerCase();
			const dbNameLower = l.name.toLowerCase();

			// Exact match
			if (levelNameLower === dbNameLower) return true;

			// Partial match (e.g., "Senior Jecondary" matches "Senior Secondary")
			if (levelNameLower.includes('senior') && dbNameLower.includes('senior')) return true;
			if (levelNameLower.includes('junior') && dbNameLower.includes('junior')) return true;

			// Map "Advanced" to "Senior Secondary"
			if (levelNameLower.includes('advanced') && dbNameLower.includes('senior')) return true;

			// Map "JSS" to "Junior Secondary"
			if (levelNameLower.includes('jss') && dbNameLower.includes('junior')) return true;

			return false;
		});

		// If level doesn't exist in learning_levels table, mark as coming soon
		if (!level) {
			console.log(`Level not found: ${levelName}`);
			return true;
		}

		if (level && levelGradeCounts.value[level.level_id] !== undefined) {
			const isEmpty = levelGradeCounts.value[level.level_id] === 0;
			console.log(`Level ${levelName} (${level.name}): ${levelGradeCounts.value[level.level_id]} grades, isEmpty: ${isEmpty}`);
			return isEmpty;
		}

		return false;
	};

	// Fetch grade counts for all levels
	const fetchLevelGradeCounts = async () => {
		await learningStore.fetchLearningLevels();
		const levels = learningStore.currentData.levels;

		for (const level of levels) {
			try {
				const response = await ApiService.get(`grades/index/level_id/${level.level_id}`);
				const grades = response.data?.records || [];
				levelGradeCounts.value[level.level_id] = grades.length;
			} catch (error) {
				console.error(`Error fetching grades for level ${level.name}:`, error);
				levelGradeCounts.value[level.level_id] = 0;
			}
		}
		console.log("Level grade counts:", levelGradeCounts.value);
	};

onMounted(async ()=>{

    if(auth.userRole==="superadmin" || auth.isAdmin){
        app.navigateTo("servicessettings")
    }

    // Fetch grade counts for all levels to determine which are empty
    await fetchLevelGradeCounts();
});

</script>

<style scoped>

</style>

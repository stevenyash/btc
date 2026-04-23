<template>
    <div id="master-detailpage">
        <q-tabs  inline-label v-model="selectedTab" active-color="primary" indicator-color="primary" align="left">
            <template v-if="auth.canView('scheduler/view')">
                <q-tab no-caps name="scheduler" icon="extension" label="Question Scheduler" />
            </template>
        </q-tabs>
        <q-separator></q-separator>
        <q-tab-panels keep-alive v-model="selectedTab" animated>
            <template v-if="auth.canView('scheduler/view')">
                <q-tab-panel class="q-pa-none" name="scheduler">
                    <div class="reset-grid">
                        <view-scheduler-page ref="schedulerViewPage"  :id="masterRecord.scheduler_id" :show-header="false" :show-breadcrumbs="false" isSubPage>
                        </view-scheduler-page>
                    </div>
                </q-tab-panel>
            </template>
        </q-tab-panels>
    </div>
</template>
<script setup>
import { watch, computed, ref, onMounted } from 'vue';
import { usePageStore } from 'src/stores/page';
import { useApp } from 'src/composables/app.js';
import { useAuth } from 'src/composables/auth';

import viewSchedulerPage from "../scheduler/view.vue";
const props = defineProps({
	isSubPage: {
		type : Boolean,
		default : true,
	},
	scrollIntoView: {
		type : Boolean,
		default : false,
	},
});
const app = useApp();
const auth = useAuth();
const store = usePageStore('QUESTIONS');

const masterRecord = computed(() => store.state.currentRecord);
const pageReady = computed(() => masterRecord.value != null);

const selectedTab = ref("scheduler");

function scrollToDetailPage() {
	if (props.scrollIntoView) {
		const pageElement = document.getElementById('master-detailpage');
		if(pageElement){
			pageElement.scrollIntoView({behavior:'smooth', block:'start'});
		}
	}
}

// pass form data from master to detail
function setDetailPageFormData(){
	const record = masterRecord.value;
	 
	// set scheduler form data
	const schedulerStore = usePageStore('scheduler');
	schedulerStore.setFormData({  });

}

watch(() => masterRecord, (current) => {
		setDetailPageFormData();
		scrollToDetailPage();
	},
	{ deep: true, immediate: true }
);

onMounted(()=>{
    scrollToDetailPage();
});

</script>

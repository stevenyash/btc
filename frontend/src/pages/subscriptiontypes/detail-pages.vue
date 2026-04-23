<template>
    <div id="master-detailpage">
        <q-tabs  inline-label v-model="selectedTab" active-color="primary" indicator-color="primary" align="left">
            <template v-if="auth.canView('packages')">
                <q-tab no-caps name="packages" icon="extension" label="Subscription Type Packages" />
            </template>
        </q-tabs>
        <q-separator></q-separator>
        <q-tab-panels keep-alive v-model="selectedTab" animated>
            <template v-if="auth.canView('packages')">
                <q-tab-panel class="q-pa-none" name="packages">
                    <div class="reset-grid">
                        <list-packages-page ref="packagesListPage"  field-name="packages.subscription_type_id" :field-value="masterRecord.id" :show-header="false" :show-breadcrumbs="false" isSubPage>
                            </list-packages-page>
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

import listPackagesPage from "../packages/list.vue";
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
const store = usePageStore('SUBSCRIPTIONTYPES');

const masterRecord = computed(() => store.state.currentRecord);
const pageReady = computed(() => masterRecord.value != null);

const selectedTab = ref("packages");

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
	 
	// set packages form data
	const packagesStore = usePageStore('packages');
	packagesStore.setFormData({ subscription_type_id:record?.id });

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

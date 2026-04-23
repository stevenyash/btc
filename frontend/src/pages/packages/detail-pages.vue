<template>
    <div id="master-detailpage">
        <q-tabs  inline-label v-model="selectedTab" active-color="primary" indicator-color="primary" align="left">
            <template v-if="auth.canView('purchases')">
                <q-tab no-caps name="purchases" icon="extension" label="Package Purchases" />
            </template>
        </q-tabs>
        <q-separator></q-separator>
        <q-tab-panels keep-alive v-model="selectedTab" animated>
            <template v-if="auth.canView('purchases')">
                <q-tab-panel class="q-pa-none" name="purchases">
                    <div class="reset-grid">
                        <list-purchases-page ref="purchasesListPage"  field-name="purchases.package_id" :field-value="masterRecord.id" :show-header="false" :show-breadcrumbs="false" isSubPage>
                            </list-purchases-page>
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

import listPurchasesPage from "../purchases/list.vue";
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
const store = usePageStore('PACKAGES');

const masterRecord = computed(() => store.state.currentRecord);
const pageReady = computed(() => masterRecord.value != null);

const selectedTab = ref("purchases");

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
	 
	// set purchases form data
	const purchasesStore = usePageStore('purchases');
	purchasesStore.setFormData({ package_id:record?.id });

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

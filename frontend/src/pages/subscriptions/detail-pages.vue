<template>
    <div id="master-detailpage">
        <q-tabs  inline-label v-model="selectedTab" active-color="primary" indicator-color="primary" align="left">
            <template v-if="auth.canView('users/view')">
                <q-tab no-caps name="users" icon="extension" label="Subscription Users" />
            </template>
        </q-tabs>
        <q-separator></q-separator>
        <q-tab-panels keep-alive v-model="selectedTab" animated>
            <template v-if="auth.canView('users/view')">
                <q-tab-panel class="q-pa-none" name="users">
                    <div class="reset-grid">
                        <view-users-page ref="usersViewPage"  :id="masterRecord.user_id" :show-header="false" :show-breadcrumbs="false" isSubPage>
                        </view-users-page>
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

import viewUsersPage from "../users/view.vue";
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
const store = usePageStore('SUBSCRIPTIONS');

const masterRecord = computed(() => store.state.currentRecord);
const pageReady = computed(() => masterRecord.value != null);

const selectedTab = ref("users");

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
	 
	// set users form data
	const usersStore = usePageStore('users');
	usersStore.setFormData({  });

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

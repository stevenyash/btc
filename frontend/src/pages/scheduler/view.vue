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
                                    Scheduler Details
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
                                <div class="row q-col-gutter-x-md ">
                                    <div class="col">
                                        <div class="q-pa-md">
                                            <div class="q-mb-3 row justify-start q-col-gutter-sm">
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Id</div>
                                                                <div class="text-bold">{{ item.id }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">User Id</div>
                                                                <div class="text-bold">{{ item.user_id }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Grade</div>
                                                                <div class="text-bold">{{ item.grade }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Learning Area</div>
                                                                <div class="text-bold">{{ item.learning_area }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Strand</div>
                                                                <div class="text-bold">{{ item.strand }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Start Date</div>
                                                                <div class="text-bold">{{ item.start_date }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">End Date</div>
                                                                <div class="text-bold">{{ item.end_date }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Status</div>
                                                                <div class="text-bold">{{ item.status }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Link</div>
                                                                <div class="text-bold">{{ item.link }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Meetingid</div>
                                                                <div class="text-bold">{{ item.meetingid }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Id</div>
                                                                <div class="text-bold">{{ item.users_id }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Username</div>
                                                                <div class="text-bold">{{ item.users_username }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Image</div>
                                                                <div class="text-bold">
                                                                    <image-viewer image-size="medium" image-preview-size="large" :src="item.users_image" width="320px" height="320px" :num-display="1">
                                                                    </image-viewer>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Phone</div>
                                                                <div class="text-bold">{{ item.users_phone }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Email</div>
                                                                <div class="text-bold">{{ item.users_email }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Account Status</div>
                                                                <div class="text-bold">{{ item.users_account_status }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users User Role Id</div>
                                                                <div class="text-bold">
                                                                    <q-btn v-if="item.users_user_role_id" @click="app.openPageDialog({ page: 'roles/view', url: `/roles/view/${item.user_role_id}` , closeBtn: true })" padding="xs" flat color="primary" no-caps >
                                                                        <q-icon name="visibility" size="xs"  class="q-mr-xs"></q-icon>  Roles Detail
                                                                    </q-btn>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Nhif</div>
                                                                <div class="text-bold">{{ item.users_nhif }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Nssf</div>
                                                                <div class="text-bold">{{ item.users_nssf }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users National Id</div>
                                                                <div class="text-bold">{{ item.users_national_id }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Subscription Code</div>
                                                                <div class="text-bold">{{ item.users_subscription_code }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Status</div>
                                                                <div class="text-bold">{{ item.users_status }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                                <div class="col-12">
                                                    <q-card  class="q-pa-md nice-shadow-6">
                                                        <div class="row q-col-gutter-x-md items-center">
                                                            <div class="col">
                                                                <div class="text-grey text-weight-medium mb-1">Users Referred By</div>
                                                                <div class="text-bold">{{ item.users_referred_by }}</div>
                                                            </div>
                                                        </div>
                                                    </q-card>
                                                </div>
                                            </div>
                                            <div  class=" row q-col-gutter-xs justify-start q-ma-md">
                                                <template v-if="auth.canView('')">
                                                    <div><q-btn icon="edit" label="Edit"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="positive" title="Edit"  @click="app.openPageDialog({ page:'scheduler/edit', url: `/scheduler/edit/${item.id}` , closeBtn: true })">
                                                    </q-btn></div>
                                                </template>
                                                <template v-if="auth.canView('')">
                                                    <div><q-btn icon="delete_sweep" label="Delete"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="negative" title="Delete"  @click="deleteItem(item.id)">
                                                    </q-btn></div>
                                                </template>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Detal Page Column -->
                                    <div class="col-12" v-if="currentRecord && !isSubPage">
                                        <q-card  :flat="isSubPage" class="q-my-md nice-shadow-6">
                                            <component :is="masterDetailPage" :scroll-into-view="false"></component>
                                        </q-card>
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
	import { defineAsyncComponent, computed, ref, toRefs, onMounted } from 'vue';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app.js';
	import { useAuth } from 'src/composables/auth';
	import { useViewPage } from 'src/composables/viewpage.js';
	import { usePageStore } from 'src/stores/page';
	
	const props = defineProps({
		id: [String, Number],
		primaryKey: {
			type: String,
			default: 'id',
		},
		pageStoreKey: {
			type: String,
			default: 'SCHEDULER',
		},
		pageName: {
			type: String,
			default: 'scheduler',
		},
		routeName: {
			type: String,
			default: 'schedulerview',
		},
		apiPath: {
			type: String,
			default: 'scheduler/view',
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

	
	const page = useViewPage({store, props}); // where page logics resides
	
	const {  currentRecord } = toRefs(store.state);
	const { loading, pageReady } = toRefs(page.state);
	const item = currentRecord;
	
	const  { load, deleteItem,    } = page.methods;

	
	const masterDetailPage = computed(() => defineAsyncComponent(() => import("./detail-pages.vue")));
	
	useMeta(() => {
		return {
			//set browser title
			title: "Scheduler Details"
		}
	});
	
	onMounted(()=>{ 
	});
</script>

<style scoped>

</style>

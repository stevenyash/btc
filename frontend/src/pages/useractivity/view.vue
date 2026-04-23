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
                                    User Activity Details
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
                                    <div class="q-mb-3 row justify-start q-col-gutter-sm">
                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Activity Id</div>
                                                        <div class="text-bold">{{ item.activity_id }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>
                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">User Id</div>
                                                        <div class="text-bold">
                                                            <q-btn v-if="item.user_id" @click="app.openPageDialog({ page: 'users/view', url: `/users/view/${item.user_id}` , closeBtn: true })" padding="xs" flat color="primary" no-caps >
                                                                <q-icon name="visibility" size="xs"  class="q-mr-xs"></q-icon>  Users Detail
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
                                                        <div class="text-grey text-weight-medium mb-1">Fingerprint</div>
                                                        <div class="text-bold">{{ item.fingerprint }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>
                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Session Duration</div>
                                                        <div class="text-bold">{{ item.session_duration }}</div>
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
                                                        <div class="text-grey text-weight-medium mb-1">Activity Type</div>
                                                        <div class="text-bold">{{ item.activity_type }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>
                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Activity Time</div>
                                                        <div class="text-bold">{{ item.activity_time }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>
                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Platiform</div>
                                                        <div class="text-bold">{{ item.platiform }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>
                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Device</div>
                                                        <div class="text-bold">{{ item.device }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>
                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Ip Address</div>
                                                        <div class="text-bold">{{ item.ip_address }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>
                                        <div class="col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Phone</div>
                                                        <div class="text-bold">{{ item.phone }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>
                                    </div>
                                    <div  class=" row q-col-gutter-xs justify-start q-ma-md">
                                        <template v-if="auth.canView('')">
                                            <div><q-btn icon="edit" label="Edit"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="positive" title="Edit"  @click="app.openPageDialog({ page:'useractivity/edit', url: `/useractivity/edit/${item.activity_id}` , closeBtn: true })">
                                            </q-btn></div>
                                        </template>
                                        <template v-if="auth.canView('')">
                                            <div><q-btn icon="delete_sweep" label="Delete"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="negative" title="Delete"  @click="deleteItem(item.activity_id)">
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
	
	const props = defineProps({
		id: [String, Number],
		primaryKey: {
			type: String,
			default: 'activity_id',
		},
		pageStoreKey: {
			type: String,
			default: 'USERACTIVITY',
		},
		pageName: {
			type: String,
			default: 'useractivity',
		},
		routeName: {
			type: String,
			default: 'useractivityview',
		},
		apiPath: {
			type: String,
			default: 'useractivity/view',
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

	
	
	useMeta(() => {
		return {
			//set browser title
			title: "User Activity Details"
		}
	});
	
	onMounted(()=>{ 
	});
</script>

<style scoped>

</style>

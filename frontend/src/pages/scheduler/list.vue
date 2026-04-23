<template>
    <main class="main-page" id="">
        <template v-if="showHeader">
            <section class="page-section q-pa-md" >
                <div class="container-fluid">
                    <div class="row justify-between items-center q-col-gutter-md">
                        <div  class="col " >
                            <div class=" text-h6 text-primary" >
                                Scheduler
                            </div>
                        </div>
                        <div  class="col-md-auto col-12 " >
                            <template v-if="auth.canView('')">
                                <q-btn       :rounded="false"  size=""  color="primary" no-caps  unelevated   :to="`/scheduler/add`" class="full-width" >
                                    <q-icon name="add"></q-icon>                                
                                    Add New Scheduler 
                                </q-btn>
                            </template>
                        </div>
                        <div  class="col-md-auto col-12 " >
                            <q-input debounce="1000"  placeholder="Search" v-model="filters.search.value" >
                            <template v-slot:append>
                                <q-icon name="search"></q-icon>
                            </template>
                            </q-input>
                        </div>
                        <!--topcardactiontemplates-->
                    </div>
                </div>
            </section>
        </template>
        <section class="page-section " >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid"  v-if="!showMeeting">
                        <div class="row q-gutter-sm">
                            <filter-tags :controller="page.filterController" />
                        </div>
                        <div >
                            <template v-if="showBreadcrumbs && pageBreadCrumb.fieldName">
                                <q-card class="q-pa-md q-mb-sm text-bold nice-shadow-6">
                                    <q-breadcrumbs>
                                    <q-breadcrumbs-el icon="arrow_back" class="text-capitalize" :label="pageBreadCrumb.fieldName" to="/scheduler"></q-breadcrumbs-el>
                                    <q-breadcrumbs-el :label="pageBreadCrumb.fieldValue" ></q-breadcrumbs-el>
                                </q-breadcrumbs>
                            </q-card>
                        </template>
                        <div class="row q-col-gutter-x-md justify-start q-col-gutter-sm">
                            <div class="col">
                                <!-- page records template -->
                                <div >
                                    <q-table 
                                    :grid="$q.screen.lt.md"
                                    :flat="$q.screen.gt.md"
                                    table-header-class="text-h4 bg-grey-2"
                                    :bordered="false"
                                    :columns="app.menus.schedulerlistheader" 
                                    :rows="records"
                                    :binary-state-sort="true"
                                    separator="horizontal"
                                    :dense="true"
                                    v-model:selected="selectedItems"
                                    selection="multiple"
                                    row-key="id" 
                                    v-model:pagination="pagination"
                                    hide-bottom
                                    @request="setPagination"
                                    :loading="loading">
                                    <!-- Start of Table Layout -->
                                    <template v-slot:body="props">
                                        <q-tr :class="{selected: isCurrentRecord(props.row)}" :props="props">
                                            <q-td auto-width>
                                                <q-checkbox dense v-model="props.selected"></q-checkbox>
                                            </q-td>
                                            <q-td auto-width key="masterdetailbtn" :props="props">
                                                <q-btn @click="setCurrentRecord(props.row)" flat padding="xs" color="primary" no-caps  icon="more_vert">
                                                </q-btn>
                                            </q-td>
                                            <q-td  key="users_username" :props="props">
                                                {{ props.row.users_username }}
                                            </q-td>
                                            <q-td  key="users_phone" :props="props">
                                                {{ props.row.users_phone }}
                                            </q-td>
                                            <q-td  key="users_email" :props="props">
                                                {{ props.row.users_email }}
                                            </q-td>
                                            <q-td  key="grade" :props="props">
                                                {{ props.row.grade }}
                                            </q-td>
                                            <q-td  key="learning_area" :props="props">
                                                {{ props.row.learning_area }}
                                            </q-td>
                                            <q-td  key="strand" :props="props">
                                                {{ props.row.strand }}
                                            </q-td>
                                            <q-td  key="start_date" :props="props">
                                                {{ props.row.start_date }}
                                            </q-td>
                                            <q-td  key="end_date" :props="props">
                                                {{ props.row.end_date }}
                                            </q-td>
                                            <q-td  key="status" :props="props">
                                                {{ props.row.status }}
                                            </q-td>
                                            <q-td  key="link" :props="props">
                                                <q-chip
                                                clickable
                                                @click="openMeeting(props.row)"
                                                >
                                                Click to join
                                                </q-chip>
                                            </q-td>
                                            <q-td key="btnactions" :props="props" auto-width>
                                                <div class="row q-col-gutter-xs justify-end">
                                                    <q-btn icon="menu" padding="xs" round flat color="grey">
                                                        <q-menu auto-close transition-show="flip-right"  transition-hide="flip-left" self="center middle" anchor="center middle">
                                                            <q-list dense rounded nav>
                                                                <template v-if="auth.canView('scheduler')">
                                                                    <q-item link clickable v-ripple :to="`/scheduler/view/${props.row.id}`">
                                                                        <q-item-section>
                                                                            <q-icon color="primary" size="sm" name="visibility"></q-icon>
                                                                        </q-item-section>
                                                                        <q-item-section>View</q-item-section>
                                                                    </q-item>
                                                                </template>
                                                                <template v-if="auth.canView('scheduler')">
                                                                    <q-item link clickable v-ripple :to="`/scheduler/edit/${props.row.id}`">
                                                                        <q-item-section>
                                                                            <q-icon color="positive" size="sm" name="edit"></q-icon>
                                                                        </q-item-section>
                                                                        <q-item-section>Edit</q-item-section>
                                                                    </q-item>
                                                                </template>
                                                                <template v-if="auth.canView('scheduler')">
                                                                    <q-item link clickable v-ripple @click="deleteItem(props.row.id)">
                                                                        <q-item-section>
                                                                            <q-icon color="negative" size="sm" name="delete_sweep"></q-icon>
                                                                        </q-item-section>
                                                                        <q-item-section>Delete</q-item-section>
                                                                    </q-item>
                                                                </template>
                                                            </q-list>
                                                        </q-menu>
                                                    </q-btn>
                                                </div>
                                            </q-td>
                                        </q-tr>
                                    </template>
                                    <!-- End of Table Layout-->
                                    <!-- Start of Mobile Grid Layout-->
                                    <template v-slot:item="props">
                                        <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition" :style="props.selected ? 'transform: scale(0.95);' : ''">
                                            <q-card  :flat="isSubPage" class="q-pa-md nice-shadow-6">
                                                <q-card-section>
                                                    <q-btn @click="setCurrentRecord(props.row)" flat padding="xs" color="primary" no-caps  icon="more_vert">
                                                    </q-btn>
                                                    <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                        <div class="col-auto text-caption">
                                                            Teachers Name
                                                        </div>
                                                        <div class="col text-right">
                                                            {{ props.row.users_username }}
                                                        </div>
                                                    </div>
                                                    <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                        <div class="col-auto text-caption">
                                                            Teachers Phone
                                                        </div>
                                                        <div class="col text-right">
                                                            {{ props.row.users_phone }}
                                                        </div>
                                                    </div>
                                                    <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                        <div class="col-auto text-caption">
                                                            Teachers Email
                                                        </div>
                                                        <div class="col text-right">
                                                            {{ props.row.users_email }}
                                                        </div>
                                                    </div>
                                                    <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                        <div class="col-auto text-caption">
                                                            Grade
                                                        </div>
                                                        <div class="col text-right">
                                                            {{ props.row.grade }}
                                                        </div>
                                                    </div>
                                                    <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                        <div class="col-auto text-caption">
                                                            Learning Area
                                                        </div>
                                                        <div class="col text-right">
                                                            {{ props.row.learning_area }}
                                                        </div>
                                                    </div>
                                                    <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                        <div class="col-auto text-caption">
                                                            Strand
                                                        </div>
                                                        <div class="col text-right">
                                                            {{ props.row.strand }}
                                                        </div>
                                                    </div>
                                                    <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                        <div class="col-auto text-caption">
                                                            Start Date
                                                        </div>
                                                        <div class="col text-right">
                                                            {{ props.row.start_date }}
                                                        </div>
                                                    </div>
                                                    <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                        <div class="col-auto text-caption">
                                                            End Date
                                                        </div>
                                                        <div class="col text-right">
                                                            {{ props.row.end_date }}
                                                        </div>
                                                    </div>
                                                    <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                        <div class="col-auto text-caption">
                                                            Status
                                                        </div>
                                                        <div class="col text-right">
                                                            {{ props.row.status }}
                                                        </div>
                                                    </div>
                                                    <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                        <div class="col-auto text-caption">
                                                            Link
                                                        </div>
                                                        <div class="col text-right">
                                                            <q-chip
                                                            clickable
                                                            @click="openMeeting(props.row)"
                                                            >
                                                            Click to join
                                                            </q-chip>
                                                        </div>
                                                    </div>
                                                </q-card-section>
                                                <q-separator></q-separator>
                                                <div class="row justify-between">
                                                    <div class="q-pa-sm"><q-checkbox  dense v-model="props.selected"></q-checkbox></div>
                                                    <q-card-actions auto-width>
                                                        <div class="row q-col-gutter-xs justify-end">
                                                            <q-btn icon="menu" padding="xs" round flat color="grey">
                                                                <q-menu auto-close transition-show="flip-right"  transition-hide="flip-left" self="center middle" anchor="center middle">
                                                                    <q-list dense rounded nav>
                                                                        <template v-if="auth.canView('scheduler')">
                                                                            <q-item link clickable v-ripple :to="`/scheduler/view/${props.row.id}`">
                                                                                <q-item-section>
                                                                                    <q-icon color="primary" size="sm" name="visibility"></q-icon>
                                                                                </q-item-section>
                                                                                <q-item-section>View</q-item-section>
                                                                            </q-item>
                                                                        </template>
                                                                        <template v-if="auth.canView('scheduler')">
                                                                            <q-item link clickable v-ripple :to="`/scheduler/edit/${props.row.id}`">
                                                                                <q-item-section>
                                                                                    <q-icon color="positive" size="sm" name="edit"></q-icon>
                                                                                </q-item-section>
                                                                                <q-item-section>Edit</q-item-section>
                                                                            </q-item>
                                                                        </template>
                                                                        <template v-if="auth.canView('scheduler')">
                                                                            <q-item link clickable v-ripple @click="deleteItem(props.row.id)">
                                                                                <q-item-section>
                                                                                    <q-icon color="negative" size="sm" name="delete_sweep"></q-icon>
                                                                                </q-item-section>
                                                                                <q-item-section>Delete</q-item-section>
                                                                            </q-item>
                                                                        </template>
                                                                    </q-list>
                                                                </q-menu>
                                                            </q-btn>
                                                        </div>
                                                    </q-card-actions>
                                                </div>
                                            </q-card>
                                        </div>
                                    </template>
                                    <!-- End of Mobile Grid Layout-->
                                    </q-table>
                                    <div class="row justify-center">
                                        <q-td></q-td>
                                    </div>
                                </div>
                                <!-- page loading indicator template -->
                                <template v-if="loading">
                                    <q-inner-loading :showing="loading">
                                        <q-spinner color="primary" size="30px"> 
                                        </q-spinner>
                                    </q-inner-loading>
                                </template>
                                <!-- page empty record template -->
                                <template v-if="pageReady && !records.length">
                                    <q-card :flat="$q.screen.gt.md">
                                        <q-card-section>
                                            <div class="text-grey text-h6 text-center">
                                                No record found
                                            </div>
                                        </q-card-section>
                                    </q-card>
                                </template>
                                <!-- page footer template-->
                                <template v-if="showFooter">
                                    <div class="">
                                        <div  v-show="pageReady">
                                            <div class="row items-center justify-between">
                                                <div class="row items-center q-col-gutter-md">
                                                    <template v-if="auth.canView('scheduler')">
                                                        <div>
                                                            <q-btn round flat   no-caps  unelevated   color="negative" @click="deleteItem(selectedItems)" v-if="selectedItems.length" icon="delete_sweep" class="q-my-xs" title="Delete Selected">
                                                                <q-tooltip>Delete Selected Items</q-tooltip>
                                                            </q-btn>
                                                        </div>
                                                    </template>
                                                </div>
                                                <div v-if="paginate && totalRecords > 0" class="row  items-center justify-between">
                                                    <div class="col-auto">
                                                        <q-chip square>Records {{recordsPosition}} of {{totalRecords}}</q-chip>
                                                    </div>
                                                    <div v-if="totalPages > 1">
                                                        <q-pagination  color="primary"  v-model="pagination.page" :direction-links="true" :boundary-links="true" :max-pages="5" :boundary-numbers="true" :max="totalPages"></q-pagination>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                            <!-- Detal Page Column -->
                            <div class="col-12" v-if="currentRecord && !isSubPage">
                                <q-card  :flat="isSubPage" class=" nice-shadow-6">
                                    <component :is="masterDetailPage" :scroll-into-view="true"></component>
                                </q-card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <section class="page-section q-mb-md" >
        <div class="container-fluid">
            <div class="row q-col-gutter-x-md">
                <div  class="col-12 comp-grid"  v-if="showMeeting">
                    <div class="">
                        <div> <MeetEmbed 
                            :meeting-url="meeting.link" 
                            v-if="meeting.link && meeting.status === 'active'"
                        /></div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>
</template>
<script setup>
	import { defineAsyncComponent, computed, ref, toRefs, onMounted } from 'vue';
	import { useMeta } from 'quasar';
	import { useApp } from 'src/composables/app';
	import { useAuth } from 'src/composables/auth';
	import { ApiService } from 'src/services/api';
	import { useListPage } from 'src/composables/listpage';
	import { usePageStore } from 'src/stores/page';
	import { useQuasar } from 'quasar';
	
	const props = defineProps({
		primaryKey : {
			type : String,
			default : 'id',
		},
		pageStoreKey: {
			type: String,
			default: 'SCHEDULER',
		},
		pageName : {
			type : String,
			default : 'scheduler',
		},
		routeName : {
			type : String,
			default : 'schedulerlist',
		},
		apiPath : {
			type : String,
			default : 'scheduler/index',
		},
		autoLoad: {
			type: Boolean,
			default: true,
		},
		enableCache: {
			type: Boolean,
			default: false,
		},
		paginate: {
			type: Boolean,
			default: true,
		},
		scrollIntoView: {
			type: Boolean,
			default: true,
		},
		isSubPage: {
			type: Boolean,
			default: false,
		},
		showHeader: {
			type: Boolean,
			default: true,
		},
		showFooter: {
			type: Boolean,
			default: true,
		},
		showBreadcrumbs: {
			type: Boolean,
			default: true,
		},
		exportButton: {
			type: Boolean,
			default: true,
		},
		importButton: {
			type: Boolean,
			default: false,
		},
		multiCheckbox: {
			type: Boolean,
			default: true,
		},
		mergeRecords: {
			type: Boolean,
			default: false,
		},
		page: {
			type: Number,
			default: 1,
		},
		limit: {
			type: Number,
			default: 10,
		},
		search: {
			type: String,
			default: '',
		},
		fieldName: null,
		fieldValue: null,
		queryParams: { 
			type: Object,
			default: () => ({})
		},
		sortBy: {
			type: String,
			default: '',
		},
		sortType: {
			type: String,
			default: 'desc', //desc or asc
		},
		emptyRecordMsg: {
			type: String,
			default: "No record found",
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
	
	const app = useApp();
	const auth = useAuth();
	
	const defaultStoreState = {
		filters: {
			search: {
				tag: "Search",
				value: '',
				valueType: 'single',
				options: [],
			}
		},
		pagination: {
			page: props.page,
			rowsPerPage: props.limit,
			rowsNumber: 0,
			sortBy: props.sortBy,
			descending: props.sortType == 'desc'
		},
		primaryKey: props.primaryKey
	}
	const store = usePageStore(props.pageStoreKey,  defaultStoreState);
	
	// page hooks where logics resides
	const page = useListPage({ store, props });
	
	const {records, filters, currentRecord, totalRecords,  selectedItems, expandedRows, pagination,} = toRefs(store.state);
	const { pageReady, loading, } = toRefs(page.state);
	
	const {  pageBreadCrumb,   totalPages, recordsPosition, } = page.computedProps;
	
	//page methods
	const { load,      setPagination, deleteItem, setCurrentRecord, isCurrentRecord,     } = page.methods;
	
	const pageTitle = computed({
		get: function () {
			return "Scheduler"
		}
	});
	const masterDetailPage = computed(() => defineAsyncComponent(() => import("./detail-pages.vue")));
	
	useMeta(() => {
		return {
			title: pageTitle.value //set browser title
		}
	});
	const googleUrl = ref("");
const meeting = ref(null);
const $q = useQuasar();
async function authenticate() {
    try {
        const response = await ApiService.get("components_data/authenticate");
        if (response.data?.url) {
            googleUrl.value = response.data.url;
            // Store meeting data if provided
            if (response.data.meeting) {
                meeting.value = response.data.meeting;
            }
            return true;
        }
        throw new Error('No authentication URL received');
    } catch (error) {
        console.error("Authentication Error:", error);
        $q.notify({
            type: 'negative',
            message: 'Failed to authenticate with Google'
        });
        return false;
    }
}
function openMeeting(meetData = null) {
    const meet = meetData || meeting.value;
    if (!meet?.link) {
        $q.notify({
            type: 'negative',
            message: 'Meeting link is missing or invalid'
        });
        return;
    }
    // Clean up the meeting link
    const cleanLink = meet.link.startsWith('http') ? meet.link : `https://${meet.link}`;
    // Always open in new tab
    window.open(cleanLink, '_blank', 'noopener,noreferrer');
}
onMounted(async () => {
    const authSuccess = await authenticate();
    if (authSuccess && meeting.value?.link) {
        openMeeting();
    }
});
</script>

<style scoped>

</style>

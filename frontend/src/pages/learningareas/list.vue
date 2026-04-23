<template>
    <main class="main-page" id="">
        <template v-if="showHeader">
            <section class="page-section q-pa-md" >
                <div class="container-fluid">
                    <div class="row justify-between items-center q-col-gutter-md">
                        <div  class="col " >
                            <div class=" text-h6 text-primary" >
                                Learning Areas
                            </div>
                        </div>
                        <div  class="col-md-auto col-12 " >
                            <template v-if="auth.canView('learningareas')">
                                <q-btn       :rounded="false"  size=""  color="primary" no-caps  unelevated   :to="`/learningareas/add`" class="full-width" >
                                    <q-icon name="add"></q-icon>
                                    Add New Learning Area
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
                    <div  class="col comp-grid" >
                        <div class="row q-gutter-sm">
                            <filter-tags :controller="page.filterController" />
                        </div>
                        <div >
                            <template v-if="showBreadcrumbs && pageBreadCrumb.fieldName">
                                <q-card class="q-pa-md q-mb-sm text-bold nice-shadow-6">
                                    <q-breadcrumbs>
                                    <q-breadcrumbs-el icon="arrow_back" class="text-capitalize" :label="pageBreadCrumb.fieldName" to="/learningareas"></q-breadcrumbs-el>
                                    <q-breadcrumbs-el :label="pageBreadCrumb.fieldValue" ></q-breadcrumbs-el>
                                </q-breadcrumbs>
                            </q-card>
                        </template>
                        <!-- page records template -->
                        <div >
                            <q-table
                            :grid="$q.screen.lt.md"
                            :flat="$q.screen.gt.md"
                            table-header-class="text-h4 bg-grey-2"
                            :bordered="false"
                            :columns="columns"
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
                                    <q-td  key="id" :props="props">
                                        <q-btn padding="xs"   :rounded="false"  color="primary"  no-caps  unelevated   flat :to="`/learningareas/view/${props.row.id}`">{{ props.row.id }}</q-btn>
                                    </q-td>
                                    <q-td  key="name" :props="props">
                                        <div class="text-weight-medium">{{ props.row.name }}</div>
                                    </q-td>
                                    <q-td  key="grade" :props="props">
                                        {{ props.row.grade ? props.row.grade.name : 'Not specified' }}
                                    </q-td>
                                    <q-td key="btnactions" :props="props" >
                                        <div class="row q-col-gutter-xs justify-end">
                                            <template v-if="auth.canView('learningareas')">
                                                <q-btn
                                                    icon="visibility"
                                                    label="View"
                                                    outline
                                                    :rounded="false"
                                                    no-caps
                                                    unelevated
                                                    padding="xs"
                                                    color="primary"
                                                    :to="`/learningareas/view/${props.row.id}`"
                                                    size="sm"
                                                >
                                                </q-btn>
                                            </template>
                                            <template v-if="auth.canView('learningareas')">
                                                <q-btn
                                                    icon="edit"
                                                    label="Edit"
                                                    outline
                                                    :rounded="false"
                                                    no-caps
                                                    unelevated
                                                    padding="xs"
                                                    color="positive"
                                                    :to="`/learningareas/edit/${props.row.id}`"
                                                    size="sm"
                                                >
                                                </q-btn>
                                            </template>
                                            <template v-if="auth.canView('learningareas')">
                                                <q-btn
                                                    icon="delete_sweep"
                                                    label="Delete"
                                                    outline
                                                    :rounded="false"
                                                    no-caps
                                                    unelevated
                                                    padding="xs"
                                                    color="negative"
                                                    @click="deleteItem(props.row.id)"
                                                    size="sm"
                                                >
                                                </q-btn>
                                            </template>
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
                                            <div class="text-h6 text-primary q-mb-sm">{{ props.row.name }}</div>
                                            <div class="text-caption text-grey">
                                                Grade: {{ props.row.grade ? props.row.grade.name : 'Not specified' }}
                                            </div>
                                        </q-card-section>
                                        <q-separator></q-separator>
                                        <div class="row justify-between">
                                            <div class="q-pa-sm"><q-checkbox  dense v-model="props.selected"></q-checkbox></div>
                                            <q-card-actions >
                                                <div class="row q-col-gutter-xs justify-end">
                                                    <template v-if="auth.canView('learningareas')">
                                                        <q-btn
                                                            icon="visibility"
                                                            label="View"
                                                            outline
                                                            :rounded="false"
                                                            no-caps
                                                            unelevated
                                                            padding="xs"
                                                            color="primary"
                                                            :to="`/learningareas/view/${props.row.id}`"
                                                            size="sm"
                                                        >
                                                        </q-btn>
                                                    </template>
                                                    <template v-if="auth.canView('learningareas')">
                                                        <q-btn
                                                            icon="edit"
                                                            label="Edit"
                                                            outline
                                                            :rounded="false"
                                                            no-caps
                                                            unelevated
                                                            padding="xs"
                                                            color="positive"
                                                            :to="`/learningareas/edit/${props.row.id}`"
                                                            size="sm"
                                                        >
                                                        </q-btn>
                                                    </template>
                                                    <template v-if="auth.canView('learningareas')">
                                                        <q-btn
                                                            icon="delete_sweep"
                                                            label="Delete"
                                                            outline
                                                            :rounded="false"
                                                            no-caps
                                                            unelevated
                                                            padding="xs"
                                                            color="negative"
                                                            @click="deleteItem(props.row.id)"
                                                            size="sm"
                                                        >
                                                        </q-btn>
                                                    </template>
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
                                        No learning areas found
                                    </div>
                                    <div class="text-center q-mt-md">
                                        <q-btn
                                            v-if="auth.canView('learningareas')"
                                            color="primary"
                                            icon="add"
                                            label="Add First Learning Area"
                                            :to="`/learningareas/add`"
                                        />
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
                                            <template v-if="auth.canView('learningareas')">
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
                </div>
            </div>
        </div>
    </section>
</main>
</template>
<script setup>
    import {  computed, ref, toRefs } from 'vue';
    import { useMeta } from 'quasar';
    import { useApp } from 'src/composables/app';
    import { useAuth } from 'src/composables/auth';
    import { useListPage } from 'src/composables/listpage';
    import { usePageStore } from 'src/stores/page';

    const props = defineProps({
        primaryKey : {
            type : String,
            default : 'id',
        },
        pageStoreKey: {
            type: String,
            default: 'learningareas',
        },
        pageName : {
            type : String,
            default : 'learningareas',
        },
        routeName : {
            type : String,
            default : 'learningareaslist',
        },
        apiPath : {
            type: String,
            default : 'learningareas/index',
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

    // Define table columns
    const columns = computed(() => [
        {
            name: 'id',
            required: true,
            label: 'ID',
            align: 'left',
            field: 'id',
            sortable: true
        },
        {
            name: 'name',
            required: true,
            label: 'Name',
            align: 'left',
            field: 'name',
            sortable: true
        },
        {
            name: 'grade',
            label: 'Grade',
            align: 'left',
            field: row => row.grade ? row.grade.name : 'Not specified',
            sortable: true
        },
        {
            name: 'btnactions',
            label: 'Actions',
            align: 'left',
            field: 'btnactions',
            sortable: false
        }
    ]);

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

    const {records, filters,  totalRecords,  selectedItems, expandedRows, pagination,} = toRefs(store.state);
    const { pageReady, loading, } = toRefs(page.state);

    const {  pageBreadCrumb,   totalPages, recordsPosition, } = page.computedProps;

    //page methods
    const { load,      setPagination, deleteItem,  isCurrentRecord,     } = page.methods;

    const pageTitle = computed({
        get: function () {
            return "Learning Areas"
        }
    });

    useMeta(() => {
        return {
            title: pageTitle.value //set browser title
        }
    });
</script>

<style scoped>
/* Card hover effect */
.q-card:hover {
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    transition: box-shadow 0.3s ease;
}

/* Make name more prominent in table */
.text-weight-medium {
    font-weight: 500;
    color: #333;
}

/* Mobile card styling */
.grid-style-transition {
    transition: transform 0.3s ease;
}

/* Empty state styling */
.text-center {
    text-align: center;
}

/* Action buttons styling */
.q-btn {
    min-width: 80px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .q-card-actions {
        flex-wrap: wrap;
        justify-content: center;
    }

    .q-card-actions .q-btn {
        margin: 2px;
        font-size: 0.75rem;
    }

    /* Make action buttons smaller on mobile */
    .q-btn[size="sm"] {
        padding: 2px 8px;
        font-size: 0.7rem;
    }
}

/* Ensure buttons are properly spaced */
.q-col-gutter-xs > div {
    padding: 2px;
}
</style>

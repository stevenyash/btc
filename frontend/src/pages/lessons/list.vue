<template>
    <main class="main-page" id="">
        <template v-if="showHeader">
            <section class="page-section q-pa-md" >
                <div class="container-fluid">
                    <div class="row justify-between items-center q-col-gutter-md">
                        <div  class="col " >
                            <div class=" text-h6 text-primary" >
                                Lessons
                            </div>
                        </div>
                        <div  class="col-md-auto col-12 " >
                            <template v-if="auth.canView('lessons')">
                                <q-btn       :rounded="false"  size=""  color="primary" no-caps  unelevated   :to="`/lessons/add`" class="full-width" >
                                    <q-icon name="add"></q-icon>
                                    Add New Lesson
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
                                    <q-breadcrumbs-el icon="arrow_back" class="text-capitalize" :label="pageBreadCrumb.fieldName" to="/lessons"></q-breadcrumbs-el>
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
                                    <!-- Image Column -->
                                    <q-td key="image" :props="props">

                                        <q-img
                                            :src="utils.setImgUrl(props.row.thumbnail_url,'medium') || missingImage"
                                            :ratio="16/9"
                                            style="max-width: 100px; max-height: 60px;"
                                            contain
                                            class="rounded-borders"
                                            :error-src="missingImage"
                                        >
                                            <template v-slot:error>
                                                <div class="absolute-full flex flex-center bg-negative text-white">
                                                    <q-icon name="image_not_supported" size="lg" />
                                                </div>
                                            </template>
                                        </q-img>
                                    </q-td>
                                    <q-td  key="title" :props="props">
                                        <q-btn padding="xs"   :rounded="false"  color="primary"  no-caps  unelevated   flat :to="`/lessons/view/${props.row.id}`">{{ props.row.title }}</q-btn>
                                    </q-td>
                                    <q-td  key="area" :props="props">
                                        {{ props.row.learning_area ? props.row.learning_area.name : '' }}
                                    </q-td>
                                    <q-td  key="topic" :props="props">
                                        {{ props.row.topic ? props.row.topic.name : '' }}
                                    </q-td>
                                    <q-td  key="duration" :props="props">
                                        {{ props.row.duration }} min
                                    </q-td>
                                    <q-td  key="price" :props="props">
                                        ${{ props.row.price }}
                                    </q-td>
                                    <q-td  key="is_preview_available" :props="props">
                                        <q-badge :color="props.row.is_preview_available ? 'positive' : 'negative'" :label="props.row.is_preview_available ? 'Available' : 'Not Available'" />
                                    </q-td>
                                    <q-td key="btnactions" :props="props" >
                                        <div class="row q-col-gutter-xs justify-end">
                                            <template v-if="auth.canView('lessons')">
                                                <div><q-btn icon="visibility" label="View"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="primary"   :to="`/lessons/view/${props.row.id}`">
                                                </q-btn></div>
                                            </template>
                                            <template v-if="auth.canView('lessons')">
                                                <div><q-btn icon="edit" label="Edit"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="positive"   :to="`/lessons/edit/${props.row.id}`">
                                                </q-btn></div>
                                            </template>
                                            <template v-if="auth.canView('lessons')">
                                                <div><q-btn icon="delete_sweep" label="Delete"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="negative"   @click="deleteItem(props.row.id)">
                                                </q-btn></div>
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

                                        <!-- Image at the top of the card -->
                                        <q-img
                                            :src="utils.setImgUrl(props.row.thumbnail_url,'medium' )|| missingImage"
                                            :ratio="16/9"
                                            class="q-mb-md rounded-borders"
                                            :error-src="missingImage"
                                        >
                                            <template v-slot:error>
                                                <div class="absolute-full flex flex-center bg-negative text-white">
                                                    <q-icon name="image_not_supported" size="lg" />
                                                </div>
                                            </template>
                                        </q-img>

                                        <q-card-section>
                                            <div class="text-h6 q-mb-sm">{{ props.row.title }}</div>

                                            <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                <div class="col-auto text-caption">
                                                    Area
                                                </div>
                                                <div class="col text-right">
                                                    {{ props.row.learning_area ? props.row.learning_area.name : '' }}
                                                </div>
                                            </div>

                                            <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                <div class="col-auto text-caption">
                                                    Topic
                                                </div>
                                                <div class="col text-right">
                                                    {{ props.row.topic ? props.row.topic.name : '' }}
                                                </div>
                                            </div>

                                            <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                <div class="col-auto text-caption">
                                                    Duration
                                                </div>
                                                <div class="col text-right">
                                                    {{ props.row.duration }} min
                                                </div>
                                            </div>

                                            <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                <div class="col-auto text-caption">
                                                    Price
                                                </div>
                                                <div class="col text-right">
                                                    ${{ props.row.price }}
                                                </div>
                                            </div>

                                            <div class="row q-py-sm q-col-gutter-md justify-content-between">
                                                <div class="col-auto text-caption">
                                                    Preview
                                                </div>
                                                <div class="col text-right">
                                                    <q-badge :color="props.row.is_preview_available ? 'positive' : 'negative'" :label="props.row.is_preview_available ? 'Available' : 'Not Available'" />
                                                </div>
                                            </div>
                                        </q-card-section>
                                        <q-separator></q-separator>
                                        <div class="row justify-between">
                                            <div class="q-pa-sm"><q-checkbox  dense v-model="props.selected"></q-checkbox></div>
                                            <q-card-actions >
                                                <div class="row q-col-gutter-xs justify-end">
                                                    <template v-if="auth.canView('lessons')">
                                                        <div><q-btn icon="visibility" label="View"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="primary"   :to="`/lessons/view/${props.row.id}`">
                                                        </q-btn></div>
                                                    </template>
                                                    <template v-if="auth.canView('lessons')">
                                                        <div><q-btn icon="edit" label="Edit"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="positive"   :to="`/lessons/edit/${props.row.id}`">
                                                        </q-btn></div>
                                                    </template>
                                                    <template v-if="auth.canView('lessons')">
                                                        <div><q-btn icon="delete_sweep" label="Delete"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="negative"   @click="deleteItem(props.row.id)">
                                                        </q-btn></div>
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
                                            <template v-if="auth.canView('lessons')">
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
    import {utils} from 'src/utils'

    const props = defineProps({
        primaryKey : {
            type : String,
            default : 'id',
        },
        pageStoreKey: {
            type: String,
            default: 'LESSONS',
        },
        pageName : {
            type : String,
            default : 'lessons',
        },
        routeName : {
            type : String,
            default : 'lessonslist',
        },
        apiPath : {
            type : String,
            default : 'lessons/index',
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

    // Missing image placeholder
    const missingImage = 'https://via.placeholder.com/100x60?text=No+Thumbnail';

    // Define table columns including only relevant fields
    const columns = computed(() => [
        {
            name: 'image',
            required: true,
            label: 'Thumbnail',
            align: 'left',
            field: 'thumbnail_url',
            sortable: false
        },
        {
            name: 'title',
            required: true,
            label: 'Title',
            align: 'left',
            field: 'title',
            sortable: true
        },
        {
            name: 'area',
            label: 'Area',
            align: 'left',
            field: row => row.learning_area ? row.learning_area.name : '',
            sortable: true
        },
        {
            name: 'topic',
            label: 'Topic',
            align: 'left',
            field: row => row.topic ? row.topic.name : '',
            sortable: true
        },
        {
            name: 'duration',
            label: 'Duration',
            align: 'left',
            field: 'duration',
            sortable: true,
            format: val => `${val} min`
        },
        {
            name: 'price',
            label: 'Price',
            align: 'left',
            field: 'price',
            sortable: true,
            format: val => `$${val}`
        },
        {
            name: 'is_preview_available',
            label: 'Preview',
            align: 'left',
            field: 'is_preview_available',
            sortable: false,
            format: val => val ? 'Available' : 'Not Available'
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
            return "Lessons"
        }
    });

    useMeta(() => {
        return {
            title: pageTitle.value //set browser title
        }
    });
</script>

<style scoped>
/* Add custom styles for image placeholders */
.q-img__image {
  background-color: #f5f5f5;
}

.q-img__content .q-icon {
  color: #9e9e9e;
}

/* Card hover effect */
.q-card:hover {
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  transition: box-shadow 0.3s ease;
}

/* Image container styling */
.image-container {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}

/* Responsive image sizing */
@media (max-width: 600px) {
  .q-img {
    max-height: 120px !important;
  }
}

/* Make title more prominent in mobile view */
.text-h6 {
  font-weight: bold;
  color: #1976d2;
}
</style>

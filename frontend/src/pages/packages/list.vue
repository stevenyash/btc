<template>
  <main class="main-page">
    <!-- Header Section -->
    <template v-if="showHeader">
      <section class="page-section q-pa-sm q-pa-md-md">
        <div class="container-fluid">
          <div class="row items-center q-col-gutter-sm">
            <div class="col-12 col-sm-auto">
              <div class="text-h6 text-primary text-weight-bold">
                Packages
              </div>
            </div>
            <div class="col-12 col-sm-auto q-ml-auto">
              <div class="row q-col-gutter-sm justify-end">
                <template v-if="auth.canView('')">
                  <div class="col-12 col-sm-auto">
                    <q-btn
                        rounded
                        size="sm"
                        color="primary"
                        no-caps
                        unelevated
                        :to="`/packages/add`"
                        class="full-width-mobile"
                        icon="add"
                        :label="$q.screen.gt.xs ? 'Add New Package' : ''"
                    >
                      <q-tooltip v-if="!$q.screen.gt.xs">Add New Package</q-tooltip>
                    </q-btn>
                  </div>
                </template>
                <div class="col-12 col-sm-6">
                  <q-input
                      debounce="1000"
                      placeholder="Search..."
                      v-model="filters.search.value"
                      dense
                      outlined
                      class="search-input"
                  >
                    <template v-slot:append>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Main Content Section -->
    <section class="page-section q-px-sm q-px-md-md">
      <div class="container-fluid">
        <div class="row q-col-gutter-md">
          <!-- Filters Sidebar - Hidden on small mobile, shown on larger screens -->
          <div class="col-12 col-md-3 comp-grid" v-if="$q.screen.gt.sm || showFilters">
            <div class="sticky-filters">
              <div class="row q-gutter-sm q-mb-md" v-if="$q.screen.lt.md">
                <q-btn
                    flat
                    dense
                    icon="close"
                    @click="showFilters = false"
                    class="q-ml-auto"
                />
              </div>

              <q-card flat class="filter-card nice-shadow-4">
                <api-data-source
                    @loaded="(response) => filters.subscription_type_id.options = response"
                    api-path="components_data/subscription_type_id_option_list_2"
                    v-slot="req"
                >
                  <div class="q-pa-md">
                    <div class="row items-center q-mb-md">
                      <q-avatar
                          font-size="18px"
                          size="32px"
                          color="primary"
                          text-color="white"
                          icon="filter_alt"
                          class="q-mr-sm"
                      />
                      <div class="text-bold text-primary">Filters</div>
                    </div>

                    <q-separator class="q-mb-md" />

                    <div class="text-caption text-weight-medium q-mb-sm">Subscription Type</div>
                    <q-select
                        v-model="filters.subscription_type_id.value"
                        :options="filters.subscription_type_id.options"
                        option-label="label"
                        option-value="value"
                        outlined
                        dense
                        emit-value
                        map-options
                        clearable
                        placeholder="All Types"
                        class="q-mb-md"
                    />

                    <filter-tags :controller="page.filterController" class="q-mt-md" />
                  </div>
                </api-data-source>
              </q-card>
            </div>
          </div>

          <!-- Content Area -->
          <div class="col-12 col-md-9 comp-grid">
            <!-- Breadcrumbs -->
            <template v-if="showBreadcrumbs && pageBreadCrumb.fieldName">
              <q-card class="q-pa-sm q-mb-md nice-shadow-4">
                <q-breadcrumbs>
                  <q-breadcrumbs-el
                      icon="arrow_back"
                      class="text-capitalize"
                      :label="pageBreadCrumb.fieldName"
                      to="/packages"
                  />
                  <q-breadcrumbs-el :label="pageBreadCrumb.fieldValue" />
                </q-breadcrumbs>
              </q-card>
            </template>

            <!-- Mobile Filter Toggle -->
            <div class="row justify-between items-center q-mb-md" v-if="$q.screen.lt.md">
              <q-btn
                  flat
                  icon="filter_list"
                  label="Filters"
                  @click="showFilters = !showFilters"
                  color="primary"
                  class="q-mb-sm"
              />
              <div class="text-caption text-grey">
                {{ totalRecords }} records
              </div>
            </div>

            <!-- Records Section -->
            <div class="records-section">
              <!-- Loading State -->
              <template v-if="loading">
                <q-inner-loading showing>
                  <div class="text-center">
                    <q-spinner color="primary" size="40px" />
                    <div class="q-mt-md text-caption">Loading packages...</div>
                  </div>
                </q-inner-loading>
              </template>

              <!-- Empty State -->
              <template v-else-if="pageReady && !records.length">
                <q-card flat class="text-center q-pa-xl empty-state">
                  <q-icon name="inventory_2" size="60px" color="grey-4" />
                  <div class="text-h6 text-grey-7 q-mt-md">No packages found</div>
                  <div class="text-caption text-grey-6 q-mt-sm">
                    Try adjusting your filters or add a new package
                  </div>
                  <template v-if="auth.canView('')">
                    <q-btn
                        color="primary"
                        unelevated
                        :to="`/packages/add`"
                        class="q-mt-md"
                        icon="add"
                        label="Add New Package"
                    />
                  </template>
                </q-card>
              </template>

              <!-- Records Grid/Table -->
              <template v-else-if="pageReady && records.length">
                <!-- Mobile Grid View -->
                <div v-if="$q.screen.lt.md" class="mobile-grid">
                  <div class="row q-col-gutter-sm">
                    <div v-for="record in records" :key="record.id" class="col-12">
                      <q-card class="package-card nice-shadow-3">
                        <q-card-section class="q-pa-md">
                          <!-- Package Header -->
                          <div class="row items-center justify-between q-mb-sm">
                            <div class="text-h6 text-weight-bold text-primary">
                              {{ record.name }}
                            </div>
                            <q-btn
                                flat
                                round
                                dense
                                icon="more_vert"
                                @click="setCurrentRecord(record)"
                            >
                              <q-menu auto-close>
                                <q-list dense style="min-width: 150px">
                                  <template v-if="auth.canView('packages')">
                                    <q-item clickable :to="`/packages/view/${record.id}`">
                                      <q-item-section avatar>
                                        <q-icon name="visibility" size="16px" />
                                      </q-item-section>
                                      <q-item-section>View</q-item-section>
                                    </q-item>
                                  </template>
                                  <template v-if="auth.canView('packages')">
                                    <q-item clickable :to="`/packages/edit/${record.id}`">
                                      <q-item-section avatar>
                                        <q-icon name="edit" size="16px" />
                                      </q-item-section>
                                      <q-item-section>Edit</q-item-section>
                                    </q-item>
                                  </template>
                                  <template v-if="auth.canView('packages')">
                                    <q-item clickable @click="deleteItem(record.id)" class="text-negative">
                                      <q-item-section avatar>
                                        <q-icon name="delete" size="16px" />
                                      </q-item-section>
                                      <q-item-section>Delete</q-item-section>
                                    </q-item>
                                  </template>
                                </q-list>
                              </q-menu>
                            </q-btn>
                          </div>

                          <!-- Package Details -->
                          <div class="package-details">
                            <div class="detail-item">
                              <div class="label">Description</div>
                              <div class="value text-caption line-clamp-2" :title="record.description">
                                {{ record.description || 'No description' }}
                              </div>
                            </div>

                            <div class="row q-col-gutter-sm">
                              <div class="col-6">
                                <div class="detail-item">
                                  <div class="label">Lessons</div>
                                  <div class="value text-weight-medium">{{ record.no_of_lessons }}</div>
                                </div>
                              </div>
                              <div class="col-6">
                                <div class="detail-item">
                                  <div class="label">Concurrent</div>
                                  <div class="value text-weight-medium">{{ record.concurrent_access }}</div>
                                </div>
                              </div>
                            </div>

                            <div class="row q-col-gutter-sm">
                              <div class="col-6">
                                <div class="detail-item">
                                  <div class="label">Duration</div>
                                  <div class="value text-weight-medium">
                                    {{ record.duration_amount }} {{ record.duration_unit }}
                                  </div>
                                </div>
                              </div>
                              <div class="col-6">
                                <div class="detail-item">
                                  <div class="label">Fee</div>
                                  <div class="value text-weight-bold text-primary">
                                    {{ formatCurrency(record.fee) }}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- Subscription Type -->
                            <div class="detail-item" v-if="record.subscription_type_id">
                              <div class="label">Subscription Type</div>
                              <q-btn
                                  flat
                                  dense
                                  size="sm"
                                  color="primary"
                                  @click="app.openPageDialog({
                                                                    page: 'subscriptiontypes/view',
                                                                    url: `/subscriptiontypes/view/${record.subscription_type_id}`,
                                                                    closeBtn: true
                                                                })"
                                  label="View Type"
                              />
                            </div>
                          </div>
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                </div>

                <!-- Desktop Table View -->
                <q-table
                    v-else
                    :flat="true"
                    table-header-class="bg-grey-2 text-weight-bold"
                    :columns="getTableColumns()"
                    :rows="records"
                    separator="cell"
                    :dense="$q.screen.lt.lg"
                    v-model:selected="selectedItems"
                    selection="multiple"
                    row-key="id"
                    v-model:pagination="pagination"
                    @request="setPagination"
                    :loading="loading"
                    class="desktop-table"
                >
                  <!-- Selection Column -->
                  <template v-slot:header-selection="scope">
                    <q-checkbox dense v-model="scope.selected" />
                  </template>

                  <template v-slot:body-selection="scope">
                    <q-checkbox dense v-model="scope.selected" />
                  </template>

                  <!-- Table Body -->
                  <template v-slot:body="props">
                    <q-tr :class="{ 'selected-row': isCurrentRecord(props.row) }" :props="props">
                      <!-- Actions Column -->
                      <q-td auto-width>
                        <q-btn
                            flat
                            round
                            dense
                            icon="more_vert"
                            @click="setCurrentRecord(props.row)"
                            size="sm"
                        >
                          <q-menu auto-close>
                            <q-list dense style="min-width: 150px">
                              <!-- Same menu items as mobile -->
                              <template v-if="auth.canView('packages')">
                                <q-item clickable :to="`/packages/view/${props.row.id}`">
                                  <q-item-section avatar>
                                    <q-icon name="visibility" size="16px" />
                                  </q-item-section>
                                  <q-item-section>View</q-item-section>
                                </q-item>
                              </template>
                              <template v-if="auth.canView('packages')">
                                <q-item clickable :to="`/packages/edit/${props.row.id}`">
                                  <q-item-section avatar>
                                    <q-icon name="edit" size="16px" />
                                  </q-item-section>
                                  <q-item-section>Edit</q-item-section>
                                </q-item>
                              </template>
                              <template v-if="auth.canView('packages')">
                                <q-item clickable @click="deleteItem(props.row.id)" class="text-negative">
                                  <q-item-section avatar>
                                    <q-icon name="delete" size="16px" />
                                  </q-item-section>
                                  <q-item-section>Delete</q-item-section>
                                </q-item>
                              </template>
                            </q-list>
                          </q-menu>
                        </q-btn>
                      </q-td>

                      <!-- Data Columns -->
                      <q-td key="name" :props="props">
                        <div class="text-weight-medium">{{ props.row.name }}</div>
                      </q-td>

                      <q-td key="description" :props="props">
                        <div class="truncate-text" :title="props.row.description">
                          {{ props.row.description || '-' }}
                        </div>
                      </q-td>

                      <q-td key="no_of_lessons" :props="props" class="text-center">
                        {{ props.row.no_of_lessons }}
                      </q-td>

                      <q-td key="concurrent_access" :props="props" class="text-center">
                        {{ props.row.concurrent_access }}
                      </q-td>

                      <q-td key="duration" :props="props">
                        {{ props.row.duration_amount }} {{ props.row.duration_unit }}
                      </q-td>

                      <q-td key="fee" :props="props" class="text-right">
                        <div class="text-weight-bold text-primary">
                          {{ formatCurrency(props.row.fee) }}
                        </div>
                      </q-td>

                      <q-td key="subscription_type" :props="props">
                        <q-btn
                            v-if="props.row.subscription_type_id"
                            flat
                            dense
                            size="sm"
                            color="primary"
                            label="View"
                            @click="app.openPageDialog({
                                                        page: 'subscriptiontypes/view',
                                                        url: `/subscriptiontypes/view/${props.row.subscription_type_id}`,
                                                        closeBtn: true
                                                    })"
                        />
                        <span v-else class="text-grey-6">-</span>
                      </q-td>
                    </q-tr>
                  </template>
                </q-table>

                <!-- Pagination and Footer -->
                <template v-if="showFooter && records.length">
                  <div class="row items-center justify-between q-mt-lg q-pt-md border-top">
                    <!-- Bulk Actions -->
                    <div class="col-12 col-sm-auto q-mb-sm">
                      <template v-if="selectedItems.length">
                        <q-btn
                            round
                            flat
                            color="negative"
                            icon="delete"
                            @click="deleteItem(selectedItems)"
                            size="sm"
                        >
                          <q-tooltip>Delete Selected ({{ selectedItems.length }})</q-tooltip>
                          <q-badge v-if="selectedItems.length" color="red" floating>
                            {{ selectedItems.length }}
                          </q-badge>
                        </q-btn>
                      </template>
                    </div>

                    <!-- Pagination -->
                    <div v-if="paginate && totalRecords > 0" class="col-12 col-sm-auto">
                      <div class="row items-center q-col-gutter-md">
                        <div class="col-auto">
                          <q-chip square size="sm">
                            {{ recordsPosition }} of {{ totalRecords }}
                          </q-chip>
                        </div>
                        <div v-if="totalPages > 1" class="col-auto">
                          <q-pagination
                              v-model="pagination.page"
                              :max="totalPages"
                              :max-pages="6"
                              direction-links
                              boundary-links
                              color="primary"
                              size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { defineAsyncComponent, computed, ref, toRefs } from 'vue';
import { useMeta } from 'quasar';
import { useApp } from 'src/composables/app';
import { useAuth } from 'src/composables/auth';
import { useListPage } from 'src/composables/listpage';
import { usePageStore } from 'src/stores/page';

const props = defineProps({
  primaryKey: {
    type: String,
    default: 'id',
  },
  pageStoreKey: {
    type: String,
    default: 'PACKAGES',
  },
  pageName: {
    type: String,
    default: 'packages',
  },
  routeName: {
    type: String,
    default: 'packageslist',
  },
  apiPath: {
    type: String,
    default: 'packages/index',
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

// Reactive state for mobile
const showFilters = ref(false);

const defaultStoreState = {
  filters: {
    search: {
      tag: "Search",
      value: '',
      valueType: 'single',
      options: [],
    },
    subscription_type_id: {
      tag: "Subscription Type",
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

const store = usePageStore(props.pageStoreKey, defaultStoreState);

// Page hooks
const page = useListPage({ store, props });

const { records, filters, currentRecord, totalRecords, selectedItems, expandedRows, pagination } = toRefs(store.state);
const { pageReady, loading } = toRefs(page.state);
const { pageBreadCrumb, totalPages, recordsPosition } = page.computedProps;

// Page methods
const { load, setPagination, deleteItem, setCurrentRecord, isCurrentRecord } = page.methods;

// Computed
const pageTitle = computed(() => "Packages");
const masterDetailPage = computed(() => defineAsyncComponent(() => import("./detail-pages.vue")));

// Methods
function formatCurrency(amount) {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(amount);
}

function getTableColumns() {
  return [
    { name: 'actions', label: '', field: 'actions', sortable: false, align: 'left' },
    { name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left' },
    { name: 'description', label: 'Description', field: 'description', sortable: true, align: 'left' },
    { name: 'no_of_lessons', label: 'Lessons', field: 'no_of_lessons', sortable: true, align: 'center' },
    { name: 'concurrent_access', label: 'Concurrent', field: 'concurrent_access', sortable: true, align: 'center' },
    { name: 'duration', label: 'Duration', field: row => `${row.duration_amount} ${row.duration_unit}`, sortable: true, align: 'left' },
    { name: 'fee', label: 'Fee', field: 'fee', sortable: true, align: 'right' },
    { name: 'subscription_type', label: 'Type', field: 'subscription_type_id', sortable: true, align: 'left' }
  ];
}

useMeta(() => ({
  title: pageTitle.value
}));
</script>

<style scoped>
/* Mobile-first responsive styles */
.full-width-mobile {
  width: 100%;
}

@media (min-width: 600px) {
  .full-width-mobile {
    width: auto;
  }
}

.sticky-filters {
  position: sticky;
  top: 80px;
  z-index: 100;
}

.search-input {
  min-width: 200px;
}

.mobile-grid {
  margin: 0 -4px;
}

.package-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #e0e0e0;
}

.package-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}

.package-details {
  space-y: 12px;
}

.detail-item {
  margin-bottom: 12px;
}

.detail-item .label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 2px;
}

.detail-item .value {
  font-size: 0.875rem;
  color: #374151;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.empty-state {
  border: 2px dashed #e5e7eb;
}

.border-top {
  border-top: 1px solid #e5e7eb;
}

.selected-row {
  background-color: #f0f9ff !important;
}

/* Responsive table adjustments */
@media (max-width: 1023px) {
  .desktop-table {
    font-size: 0.875rem;
  }
}

/* Filter sidebar behavior */
@media (max-width: 767px) {
  .sticky-filters {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    z-index: 2000;
    padding: 16px;
    overflow-y: auto;
  }

  .filter-card {
    box-shadow: none !important;
    border: none !important;
  }
}

/* Animation for filter sidebar */
.filter-enter-active,
.filter-leave-active {
  transition: all 0.3s ease;
}

.filter-enter-from,
.filter-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
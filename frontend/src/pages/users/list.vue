<template>
    <main class="main-page" id="">
        <template v-if="showHeader">
            <section class="page-section q-pa-md">
                <div class="container-fluid">
                    <div
                        class="row justify-between items-center q-col-gutter-md"
                    >
                        <div class="col">
                            <div class="text-h6 text-primary">Users</div>
                        </div>
                        <div class="col-md-auto col-12">
                            <template v-if="auth.canView('')">
                                <q-btn
                                    :rounded="false"
                                    size=""
                                    color="primary"
                                    no-caps
                                    unelevated
                                    :to="`/users/add`"
                                    class="full-width"
                                >
                                    <q-icon name="add"></q-icon>
                                    Add New User
                                </q-btn>
                            </template>
                        </div>
                        <div class="col-md-auto col-12">
                            <q-input
                                debounce="1000"
                                placeholder="Search"
                                v-model="filters.search.value"
                            >
                                <template v-slot:append>
                                    <q-icon name="search"></q-icon>
                                </template>
                            </q-input>
                        </div>
                    </div>
                </div>
            </section>
        </template>

        <section class="page-section">
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div class="col comp-grid">
                        <div class="row q-gutter-sm">
                            <filter-tags :controller="page.filterController" />
                        </div>

                        <template
                            v-if="showBreadcrumbs && pageBreadCrumb.fieldName"
                        >
                            <q-card
                                class="q-pa-md q-mb-sm text-bold nice-shadow-6"
                            >
                                <q-breadcrumbs>
                                    <q-breadcrumbs-el
                                        icon="arrow_back"
                                        class="text-capitalize"
                                        :label="pageBreadCrumb.fieldName"
                                        to="/users"
                                    ></q-breadcrumbs-el>
                                    <q-breadcrumbs-el
                                        :label="pageBreadCrumb.fieldValue"
                                    ></q-breadcrumbs-el>
                                </q-breadcrumbs>
                            </q-card>
                        </template>

                        <!-- Role Tabs -->
                        <q-card flat class="nice-shadow-6">
                            <q-tabs
                                v-model="activeRole"
                                align="left"
                                narrow-indicator
                                active-color="primary"
                                active-bg-color="blue-1"
                                class="text-grey-7"
                            >
                                <q-tab
                                    v-for="role in roles"
                                    :key="role.name"
                                    :name="role.name"
                                    :label="role.label"
                                >
                                    <div class="row items-center no-wrap">
                                        <span class="q-mr-xs">{{
                                            role.label
                                        }}</span>
                                        <q-badge color="primary" rounded>{{
                                            role.count
                                        }}</q-badge>
                                    </div>
                                </q-tab>
                            </q-tabs>

                            <q-separator />

                            <q-tab-panels v-model="activeRole" animated>
                                <q-tab-panel
                                    v-for="role in roles"
                                    :key="role.name"
                                    :name="role.name"
                                    class="q-pa-none"
                                >
                                    <div class="relative-position">
                                        <q-table
                                            :grid="$q.screen.lt.md"
                                            :flat="$q.screen.gt.md"
                                            table-header-class="text-h4 bg-grey-2"
                                            :bordered="false"
                                            :columns="app.menus.userslistheader"
                                            :rows="usersByRole[role.name]"
                                            :binary-state-sort="true"
                                            separator="horizontal"
                                            :dense="true"
                                            v-model:selected="selectedItems"
                                            selection="multiple"
                                            row-key="id"
                                            v-model:pagination="pagination"
                                            hide-bottom
                                            @request="setPagination"
                                            :loading="loading"
                                        >
                                            <!-- Desktop Table View -->
                                            <template v-slot:body="props">
                                                <q-tr
                                                    :class="{
                                                        selected:
                                                            isCurrentRecord(
                                                                props.row
                                                            ),
                                                    }"
                                                    :props="props"
                                                >
                                                    <q-td auto-width>
                                                        <q-checkbox
                                                            dense
                                                            v-model="
                                                                props.selected
                                                            "
                                                        ></q-checkbox>
                                                    </q-td>
                                                    <q-td
                                                        auto-width
                                                        key="masterdetailbtn"
                                                        :props="props"
                                                    >
                                                        <q-btn
                                                            @click="
                                                                setCurrentRecord(
                                                                    props.row
                                                                )
                                                            "
                                                            flat
                                                            padding="xs"
                                                            color="primary"
                                                            no-caps
                                                            icon="more_vert"
                                                        ></q-btn>
                                                    </q-td>
                                                    <q-td
                                                        key="roles_role_name"
                                                        :props="props"
                                                    >
                                                        {{
                                                            props.row
                                                                .roles_role_name
                                                        }}
                                                    </q-td>
                                                    <q-td
                                                        key="username"
                                                        :props="props"
                                                    >
                                                        {{ props.row.username }}
                                                    </q-td>
                                                    <q-td
                                                        key="image"
                                                        :props="props"
                                                    >
                                                        <image-viewer
                                                            image-size="small"
                                                            image-preview-size="large"
                                                            :src="
                                                                props.row.image
                                                            "
                                                            width="50px"
                                                            height="50px"
                                                            :num-display="1"
                                                        ></image-viewer>
                                                    </q-td>
                                                    <q-td
                                                        key="phone"
                                                        :props="props"
                                                    >
                                                        <q-btn
                                                            padding="xs"
                                                            flat
                                                            :rounded="false"
                                                            size=""
                                                            color="primary"
                                                            no-caps
                                                            unelevated
                                                            type="a"
                                                            :href="`tel:${props.row.phone}`"
                                                            >{{
                                                                props.row.phone
                                                            }}</q-btn
                                                        >
                                                    </q-td>
                                                    <q-td
                                                        key="email"
                                                        :props="props"
                                                    >
                                                        <q-btn
                                                            padding="xs"
                                                            flat
                                                            :rounded="false"
                                                            size=""
                                                            color="primary"
                                                            no-caps
                                                            unelevated
                                                            type="a"
                                                            :href="`mailto:${props.row.email}`"
                                                            >{{
                                                                props.row.email
                                                            }}</q-btn
                                                        >
                                                    </q-td>
                                                    <q-td
                                                        key="nhif"
                                                        :props="props"
                                                    >
                                                        {{ props.row.nhif }}
                                                    </q-td>
                                                    <q-td
                                                        key="nssf"
                                                        :props="props"
                                                    >
                                                        {{ props.row.nssf }}
                                                    </q-td>
                                                    <q-td
                                                        key="national_id"
                                                        :props="props"
                                                    >
                                                        {{
                                                            props.row
                                                                .national_id
                                                        }}
                                                    </q-td>
                                                    <q-td
                                                        key="account_status"
                                                        :props="props"
                                                    >
                                                        {{
                                                            props.row
                                                                .account_status
                                                        }}
                                                    </q-td>
                                                    <q-td
                                                        key="subscription_date"
                                                        :props="props"
                                                    >
                                                        {{
                                                            formatDate(
                                                                props.row
                                                                    .subscription_date
                                                            )
                                                        }}
                                                    </q-td>
                                                    <q-td
                                                        key="#Template#"
                                                        :props="props"
                                                    >
                                                        <q-btn
                                                            label="assign rights"
                                                            @click="
                                                                navigate(
                                                                    props.row.id
                                                                )
                                                            "
                                                        />
                                                    </q-td>
                                                    <q-td
                                                        key="btnactions"
                                                        :props="props"
                                                        auto-width
                                                    >
                                                        <div
                                                            class="row q-col-gutter-xs justify-end"
                                                        >
                                                            <q-btn
                                                                icon="menu"
                                                                padding="xs"
                                                                round
                                                                flat
                                                                color="grey"
                                                            >
                                                                <q-menu
                                                                    auto-close
                                                                    transition-show="flip-right"
                                                                    transition-hide="flip-left"
                                                                    self="center middle"
                                                                    anchor="center middle"
                                                                >
                                                                    <q-list
                                                                        dense
                                                                        rounded
                                                                        nav
                                                                    >
                                                                        <template
                                                                            v-if="
                                                                                auth.canView(
                                                                                    'users'
                                                                                )
                                                                            "
                                                                        >
                                                                            <q-item
                                                                                link
                                                                                clickable
                                                                                v-ripple
                                                                                :to="`/users/view/${props.row.id}`"
                                                                            >
                                                                                <q-item-section>
                                                                                    <q-icon
                                                                                        color="primary"
                                                                                        size="sm"
                                                                                        name="visibility"
                                                                                    ></q-icon>
                                                                                </q-item-section>
                                                                                <q-item-section
                                                                                    >View</q-item-section
                                                                                >
                                                                            </q-item>
                                                                        </template>
                                                                        <template
                                                                            v-if="
                                                                                auth.canView(
                                                                                    'users'
                                                                                )
                                                                            "
                                                                        >
                                                                            <q-item
                                                                                link
                                                                                clickable
                                                                                v-ripple
                                                                                :to="`/users/edit/${props.row.id}`"
                                                                            >
                                                                                <q-item-section>
                                                                                    <q-icon
                                                                                        color="positive"
                                                                                        size="sm"
                                                                                        name="edit"
                                                                                    ></q-icon>
                                                                                </q-item-section>
                                                                                <q-item-section
                                                                                    >Edit</q-item-section
                                                                                >
                                                                            </q-item>
                                                                        </template>
                                                                        <template
                                                                            v-if="
                                                                                auth.canView(
                                                                                    'users'
                                                                                )
                                                                            "
                                                                        >
                                                                            <q-item
                                                                                link
                                                                                clickable
                                                                                v-ripple
                                                                                @click="
                                                                                    deleteItem(
                                                                                        props
                                                                                            .row
                                                                                            .id
                                                                                    )
                                                                                "
                                                                            >
                                                                                <q-item-section>
                                                                                    <q-icon
                                                                                        color="negative"
                                                                                        size="sm"
                                                                                        name="delete_sweep"
                                                                                    ></q-icon>
                                                                                </q-item-section>
                                                                                <q-item-section
                                                                                    >Delete</q-item-section
                                                                                >
                                                                            </q-item>
                                                                        </template>
                                                                    </q-list>
                                                                </q-menu>
                                                            </q-btn>
                                                        </div>
                                                    </q-td>
                                                </q-tr>
                                            </template>

                                            <!-- Mobile Grid View -->
                                            <template v-slot:item="props">
                                                <div
                                                    class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition"
                                                >
                                                    <q-card
                                                        :flat="isSubPage"
                                                        class="q-pa-md nice-shadow-6"
                                                    >
                                                        <q-card-section>
                                                            <div
                                                                class="row q-py-sm q-col-gutter-md justify-content-between"
                                                            >
                                                                <div
                                                                    class="col-auto text-caption"
                                                                >
                                                                    Role
                                                                </div>
                                                                <div
                                                                    class="col text-right"
                                                                >
                                                                    {{
                                                                        props
                                                                            .row
                                                                            .roles_role_name
                                                                    }}
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="row q-py-sm q-col-gutter-md justify-content-between"
                                                            >
                                                                <div
                                                                    class="col-auto text-caption"
                                                                >
                                                                    Username
                                                                </div>
                                                                <div
                                                                    class="col text-right"
                                                                >
                                                                    {{
                                                                        props
                                                                            .row
                                                                            .username
                                                                    }}
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="row q-py-sm q-col-gutter-md justify-content-between"
                                                            >
                                                                <div
                                                                    class="col-auto text-caption"
                                                                >
                                                                    Phone
                                                                </div>
                                                                <div
                                                                    class="col text-right"
                                                                >
                                                                    <q-btn
                                                                        padding="xs"
                                                                        flat
                                                                        :rounded="
                                                                            false
                                                                        "
                                                                        size=""
                                                                        color="primary"
                                                                        no-caps
                                                                        unelevated
                                                                        type="a"
                                                                        :href="`tel:${props.row.phone}`"
                                                                        >{{
                                                                            props
                                                                                .row
                                                                                .phone
                                                                        }}</q-btn
                                                                    >
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="row q-py-sm q-col-gutter-md justify-content-between"
                                                            >
                                                                <div
                                                                    class="col-auto text-caption"
                                                                >
                                                                    Email
                                                                </div>
                                                                <div
                                                                    class="col text-right"
                                                                >
                                                                    <q-btn
                                                                        padding="xs"
                                                                        flat
                                                                        :rounded="
                                                                            false
                                                                        "
                                                                        size=""
                                                                        color="primary"
                                                                        no-caps
                                                                        unelevated
                                                                        type="a"
                                                                        :href="`mailto:${props.row.email}`"
                                                                        >{{
                                                                            props
                                                                                .row
                                                                                .email
                                                                        }}</q-btn
                                                                    >
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="row q-py-sm q-col-gutter-md justify-content-between"
                                                            >
                                                                <div
                                                                    class="col-auto text-caption"
                                                                >
                                                                    Subscription
                                                                    Date
                                                                </div>
                                                                <div
                                                                    class="col text-right"
                                                                >
                                                                    {{
                                                                        formatDate(
                                                                            props
                                                                                .row
                                                                                .subscription_date
                                                                        )
                                                                    }}
                                                                </div>
                                                            </div>
                                                        </q-card-section>
                                                        <q-separator></q-separator>
                                                        <div
                                                            class="row justify-between"
                                                        >
                                                            <div
                                                                class="q-pa-sm"
                                                            >
                                                                <q-checkbox
                                                                    dense
                                                                    v-model="
                                                                        props.selected
                                                                    "
                                                                ></q-checkbox>
                                                            </div>
                                                            <q-card-actions>
                                                                <q-btn
                                                                    label="Assign Rights"
                                                                    @click="
                                                                        navigate(
                                                                            props
                                                                                .row
                                                                                .id
                                                                        )
                                                                    "
                                                                    color="primary"
                                                                    size="sm"
                                                                    dense
                                                                />
                                                            </q-card-actions>
                                                        </div>
                                                    </q-card>
                                                </div>
                                            </template>
                                        </q-table>

                                        <template
                                            v-if="
                                                !usersByRole[activeRole]
                                                    ?.length && pageReady
                                            "
                                        >
                                            <q-card
                                                :flat="$q.screen.gt.md"
                                                class="q-mt-sm"
                                            >
                                                <q-card-section>
                                                    <div
                                                        class="text-grey text-h6 text-center"
                                                    >
                                                        No users found in this
                                                        role
                                                    </div>
                                                </q-card-section>
                                            </q-card>
                                        </template>
                                    </div>
                                </q-tab-panel>
                            </q-tab-panels>
                        </q-card>

                        <template v-if="loading">
                            <q-inner-loading :showing="loading">
                                <q-spinner
                                    color="primary"
                                    size="30px"
                                ></q-spinner>
                            </q-inner-loading>
                        </template>

                        <template v-if="pageReady && !records.length">
                            <q-card :flat="$q.screen.gt.md">
                                <q-card-section>
                                    <div class="text-grey text-h6 text-center">
                                        No record found
                                    </div>
                                </q-card-section>
                            </q-card>
                        </template>

                        <template v-if="showFooter">
                            <div class="q-mt-md">
                                <div v-show="pageReady">
                                    <div
                                        class="row items-center justify-between"
                                    >
                                        <div
                                            class="row items-center q-col-gutter-md"
                                        >
                                            <template
                                                v-if="auth.canView('users')"
                                            >
                                                <div>
                                                    <q-btn
                                                        round
                                                        flat
                                                        no-caps
                                                        unelevated
                                                        color="negative"
                                                        @click="
                                                            deleteItem(
                                                                selectedItems
                                                            )
                                                        "
                                                        v-if="
                                                            selectedItems.length
                                                        "
                                                        icon="delete_sweep"
                                                        class="q-my-xs"
                                                        title="Delete Selected"
                                                    >
                                                        <q-tooltip
                                                            >Delete Selected
                                                            Items</q-tooltip
                                                        >
                                                    </q-btn>
                                                </div>
                                            </template>
                                        </div>
                                        <div
                                            v-if="paginate && totalRecords > 0"
                                            class="row items-center justify-between"
                                        >
                                            <div class="col-auto">
                                                <q-chip square
                                                    >Records
                                                    {{ recordsPosition }} of
                                                    {{ totalRecords }}</q-chip
                                                >
                                            </div>
                                            <div v-if="totalPages > 1">
                                                <q-pagination
                                                    color="primary"
                                                    v-model="pagination.page"
                                                    :direction-links="true"
                                                    :boundary-links="true"
                                                    :max-pages="5"
                                                    :boundary-numbers="true"
                                                    :max="totalPages"
                                                ></q-pagination>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </section>
    </main>
</template>

<script setup>
import { defineAsyncComponent, computed, ref, toRefs } from "vue";
import { useMeta } from "quasar";
import { useApp } from "src/composables/app";
import { useAuth } from "src/composables/auth";
import { useListPage } from "src/composables/listpage";
import { usePageStore } from "src/stores/page";

const props = defineProps({
    primaryKey: {
        type: String,
        default: "id",
    },
    pageStoreKey: {
        type: String,
        default: "USERS",
    },
    pageName: {
        type: String,
        default: "users",
    },
    routeName: {
        type: String,
        default: "userslist",
    },
    apiPath: {
        type: String,
        default: "users/index",
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
        default: "",
    },
    fieldName: null,
    fieldValue: null,
    queryParams: {
        type: Object,
        default: () => ({}),
    },
    sortBy: {
        type: String,
        default: "",
    },
    sortType: {
        type: String,
        default: "desc",
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
            value: "",
            valueType: "single",
            options: [],
        },
    },
    pagination: {
        page: props.page,
        rowsPerPage: props.limit,
        rowsNumber: 0,
        sortBy: props.sortBy,
        descending: props.sortType == "desc",
    },
    primaryKey: props.primaryKey,
};

const store = usePageStore(props.pageStoreKey, defaultStoreState);
const page = useListPage({ store, props });

const {
    records,
    filters,
    currentRecord,
    totalRecords,
    selectedItems,
    expandedRows,
    pagination,
} = toRefs(store.state);
const { pageReady, loading } = toRefs(page.state);
const { pageBreadCrumb, totalPages, recordsPosition } = page.computedProps;
const { load, setPagination, deleteItem, setCurrentRecord, isCurrentRecord } =
    page.methods;

const pageTitle = computed({
    get: function () {
        return "Users";
    },
});

// Active tab state
const activeRole = ref("all");

// Computed property to group users by role
const usersByRole = computed(() => {
    const grouped = {
        all: [...records.value], // Include all users in 'all' tab
    };

    // Group users by their role
    records.value.forEach((user) => {
        const role = user.roles_role_name || "unassigned";
        if (!grouped[role]) {
            grouped[role] = [];
        }
        grouped[role].push(user);
    });

    return grouped;
});

// Computed property for tab definitions
const roles = computed(() => {
    const roleCounts = {};
    records.value.forEach((user) => {
        const role = user.roles_role_name || "unassigned";
        roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    // Start with 'all' tab
    const tabs = [
        {
            name: "all",
            label: "All Users",
            count: records.value.length,
        },
    ];

    // Add tabs for each role (sorted alphabetically)
    Object.keys(roleCounts)
        .sort()
        .forEach((role) => {
            tabs.push({
                name: role,
                label: role === "unassigned" ? "Unassigned" : role,
                count: roleCounts[role],
            });
        });

    return tabs;
});

// Date formatting function
function formatDate(dateString) {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch (e) {
        return dateString; // Return raw string if parsing fails
    }
}

function navigate(user_id) {
    app.navigateTo(`rightslist?user_id=${user_id}`);
}

useMeta(() => {
    return {
        title: pageTitle.value,
    };
});
</script>

<style scoped>
/* Custom tab styles */
.q-tabs {
    border-radius: 8px 8px 0 0;
    overflow: hidden;
}

.q-tab {
    min-width: 120px;
    position: relative;
    padding: 8px 16px;
    transition: all 0.3s ease;
}

.q-tab--active {
    background-color: white;
    font-weight: bold;
    color: var(--q-primary) !important;
}

.q-tab__indicator {
    height: 3px;
}

.q-tab-panels {
    background-color: white;
    border-radius: 0 0 8px 8px;
}

/* Badge styling */
.q-badge {
    font-size: 0.75em;
    margin-left: 4px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
    .q-tab {
        min-width: auto;
        padding: 8px;
        font-size: 0.8em;
    }

    .q-tab__label {
        flex-direction: column;
        align-items: center;
    }

    .q-badge {
        margin-left: 0;
        margin-top: 2px;
    }
}

/* Table styling */
.q-table__container {
    border-radius: 0 0 8px 8px;
}

/* Loading indicator positioning */
.relative-position {
    min-height: 200px;
}
</style>

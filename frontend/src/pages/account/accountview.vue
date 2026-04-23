<template>
    <main class="main-page" id="">
        <template v-if="pageReady">
            <section class="page-section" >
                <div class="container">
                    <div class="row q-col-gutter-x-md">
                        <div class="col comp-grid">
                            <div>
                                <div class="relative-position" style="min-height:100px">
                                    <div>
                                        <q-card class="q-pa-lg q-my-md nice-shadow-6">
                                            <div class="row q-col-gutter-lg">
                                                <div class="col-auto">
                                                    <image-viewer :ratio="1/1" image-size="medium" :src="$auth.userPhoto"></image-viewer>
                                                </div>
                                                <div class="col">
                                                    <div class="text-h5 text-bold text-primary text-capitalize">{{ $auth.userName }}</div>
                                                    <div class="text-caption">{{ $auth.userEmail }}</div>
                                                    <div v-if="$auth.userRole" class="text-capitalize text-grey text-bold">{{ $auth.userRole }}</div>
                                                </div>
                                            </div>
                                        </q-card>
                                        <div class="row q-col-gutter-md">
                                            <div class="col-sm-3 col-12">
                                                <q-card :flat="isSubPage" class="nice-shadow-6">
                                                    <q-tabs vertical class="text-primary" v-model="tab" no-caps inline-label>
                                                        <q-tab name="accountview" icon="account_box" label="Account Detail" style="justify-content:initial" />
                                                        <q-tab name="privileges" icon="vpn_key" label="My Privileges" style="justify-content:initial" />
                                                        <q-tab name="accountedit" icon="edit" label="Edit Account" style="justify-content:initial" />
                                                        <q-tab name="changeusercode" icon="lock" label="Change usercode" style="justify-content:initial" />
                                                    </q-tabs>
                                                </q-card>
                                            </div>
                                            <div class="col-sm-9 col-12">
                                                <q-tab-panels v-model="tab" animated transition-prev="jump-up" transition-next="jump-up">
                                                    <q-tab-panel name="accountview">
                                                        <div class="row justify-start q-col-gutter-sm">
                                                            <div class="col-12">
                                                                <q-card class="q-pa-md nice-shadow-6">
                                                                    <div class="row q-col-gutter-x-md items-center">
                                                                        <div class="col">
                                                                            <div class="text-grey text-weight-medium mb-1">Id</div>
                                                                            <div class="text-bold">{{ item.id }}</div>
                                                                        </div>
                                                                    </div>
                                                                </q-card>
                                                            </div>
                                                            <div class="col-12">
                                                                <q-card class="q-pa-md nice-shadow-6">
                                                                    <div class="row q-col-gutter-x-md items-center">
                                                                        <div class="col">
                                                                            <div class="text-grey text-weight-medium mb-1">Username</div>
                                                                            <div class="text-bold">{{ item.username }}</div>
                                                                        </div>
                                                                    </div>
                                                                </q-card>
                                                            </div>
                                                            <div class="col-12">
                                                                <q-card class="q-pa-md nice-shadow-6">
                                                                    <div class="row q-col-gutter-x-md items-center">
                                                                        <div class="col">
                                                                            <div class="text-grey text-weight-medium mb-1">Phone</div>
                                                                            <div class="text-bold">{{ item.phone }}</div>
                                                                        </div>
                                                                    </div>
                                                                </q-card>
                                                            </div>
                                                            <div class="col-12">
                                                                <q-card class="q-pa-md nice-shadow-6">
                                                                    <div class="row q-col-gutter-x-md items-center">
                                                                        <div class="col">
                                                                            <div class="text-grey text-weight-medium mb-1">Email</div>
                                                                            <div class="text-bold">{{ item.email }}</div>
                                                                        </div>
                                                                    </div>
                                                                </q-card>
                                                            </div>
                                                            <div class="col-12">
                                                                <q-card class="q-pa-md nice-shadow-6">
                                                                    <div class="row q-col-gutter-x-md items-center">
                                                                        <div class="col">
                                                                            <div class="text-grey text-weight-medium mb-1">Account Status</div>
                                                                            <div class="text-bold">{{ item.account_status }}</div>
                                                                        </div>
                                                                    </div>
                                                                </q-card>
                                                            </div>
                                                            <div class="col-12">
                                                                <q-card class="q-pa-md nice-shadow-6">
                                                                    <div class="row q-col-gutter-x-md items-center">
                                                                        <div class="col">
                                                                            <div class="text-grey text-weight-medium mb-1">Subscription Code</div>
                                                                            <div class="text-bold">{{ item.subscription_code }}</div>
                                                                        </div>
                                                                    </div>
                                                                </q-card>
                                                            </div>
                                                            <div class="col-12">
                                                                <q-card class="q-pa-md nice-shadow-6">
                                                                    <div class="row q-col-gutter-x-md items-center">
                                                                        <div class="col">
                                                                            <div class="text-grey text-weight-medium mb-1">Status</div>
                                                                            <div class="text-bold">{{ item.status }}</div>
                                                                        </div>
                                                                    </div>
                                                                </q-card>
                                                            </div>
                                                            <div class="col-12">
                                                                <q-card class="q-pa-md nice-shadow-6">
                                                                    <div class="row q-col-gutter-x-md items-center">
                                                                        <div class="col">
                                                                            <div class="text-grey text-weight-medium mb-1">Referred By</div>
                                                                            <div class="text-bold">{{ item.referred_by }}</div>
                                                                        </div>
                                                                    </div>
                                                                </q-card>
                                                            </div>
                                                        </div>
                                                    </q-tab-panel>
                                                    <q-tab-panel name="privileges">
                                                        <div class="row justify-start q-col-gutter-sm">
                                                            <div class="col-12">
                                                                <q-card class="q-pa-md nice-shadow-6">
                                                                    <div class="text-h6 q-mb-md">
                                                                        <q-icon name="verified_user" class="q-mr-sm" />
                                                                        My Role & Privileges
                                                                    </div>
                                                                    <div class="q-mb-md">
                                                                        <div class="text-grey text-weight-medium">Role</div>
                                                                        <q-chip :color="getRoleColor($auth.userRole)" text-color="white" icon="badge">
                                                                            {{ $auth.userRole }}
                                                                        </q-chip>
                                                                    </div>
                                                                    <div class="text-grey text-weight-medium q-mb-sm">Additional Privileges</div>
                                                                    <div v-if="loadingPrivileges" class="q-pa-md text-center">
                                                                        <q-spinner size="30px" color="primary" />
                                                                    </div>
                                                                    <div v-else-if="userPrivileges.length === 0" class="q-pa-md text-center bg-grey-2 rounded-borders">
                                                                        <q-icon name="check_circle" size="24px" color="positive" />
                                                                        <div class="text-grey-7 q-mt-sm">No additional privileges granted</div>
                                                                        <div class="text-caption text-grey-5">You have the standard privileges for your role</div>
                                                                    </div>
                                                                    <q-list v-else bordered separator>
                                                                        <q-item v-for="privilege in userPrivileges" :key="privilege.privilege">
                                                                            <q-item-section avatar>
                                                                                <q-icon name="vpn_key" color="purple" />
                                                                            </q-item-section>
                                                                            <q-item-section>
                                                                                <q-item-label>{{ privilege.privilege }}</q-item-label>
                                                                                <q-item-label caption>
                                                                                    Granted: {{ formatDate(privilege.granted_at) }}
                                                                                </q-item-label>
                                                                            </q-item-section>
                                                                        </q-item>
                                                                    </q-list>
                                                                </q-card>
                                                            </div>
                                                        </div>
                                                    </q-tab-panel>
                                                    <q-tab-panel name="accountedit">
                                                        <div class="reset-grid">
                                                            <account-edit-page is-sub-page></account-edit-page>
                                                        </div>
                                                    </q-tab-panel>
                                                    <q-tab-panel name="changeusercode">
                                                        <change-usercode-page is-sub-page></change-usercode-page>
                                                    </q-tab-panel>
                                                </q-tab-panels>
                                            </div>
                                        </div>
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
    import { ref, toRefs, watch } from 'vue';
    import { useMeta } from 'quasar';
    import { useApp } from 'src/composables/app.js';
    import { useAuth } from 'src/composables/auth';
    import AccountEditPage from "./accountedit.vue";
    import ChangeusercodePage from "./changeusercode.vue";
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
            default: 'ACCOUNT',
        },
        pageName: {
            type: String,
            default: 'users',
        },
        routeName: {
            type: String,
            default: 'usersaccountview',
        },
        apiPath: {
            type: String,
            default: 'account',
        },
        autoLoad: {
            type: Boolean,
            default: true,
        },
        exportButton: {
            type: Boolean,
            default: true,
        },
        showFooter: {
            type: Boolean,
            default: true,
        },
        isSubPage: {
            type: Boolean,
            default: false,
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
        showHeader: {
            type: Boolean,
            default: true,
        },
    });

    const store = usePageStore(props.pageStoreKey);
    const app = useApp(props);
    const auth = useAuth();
    const page = useViewPage({ store, props });

    const { currentRecord } = toRefs(store.state);
    const { loading, pageReady } = toRefs(page.state);
    const item = currentRecord;
    const { load, deleteItem } = page.methods;

    const tab = ref('accountview');
    const userPrivileges = ref([]);
    const loadingPrivileges = ref(false);

    async function loadUserPrivileges() {
        if (!auth.user?.id) return;
        loadingPrivileges.value = true;
        try {
            const response = await fetch(`/api/userprivileges/user/${auth.user.id}`, {
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });
            if (response.ok) {
                userPrivileges.value = await response.json();
            }
        } catch (error) {
            console.error('Error loading privileges:', error);
            userPrivileges.value = [];
        } finally {
            loadingPrivileges.value = false;
        }
    }

    function getRoleColor(role) {
        const colors = {
            'superadmin': 'purple',
            'admin': 'primary',
            'client': 'teal',
            'subscriber': 'green',
            'marketer': 'orange',
            'teacher': 'blue-grey'
        };
        return colors[role?.toLowerCase()] || 'grey';
    }

    function formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    watch(tab, (newTab) => {
        if (newTab === 'privileges') {
            loadUserPrivileges();
        }
    });

    if (tab.value === 'privileges') {
        loadUserPrivileges();
    }

    useMeta(() => {
        return {
            title: "My Account"
        }
    });
</script>

<style scoped>
</style>

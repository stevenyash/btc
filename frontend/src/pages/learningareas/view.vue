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
                                    Learning Area Details
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
                                    <!-- Main Information Card -->
                                    <div class="col-12 q-mb-md">
                                        <q-card class="q-pa-md nice-shadow-6">
                                            <div class="text-h4 text-bold q-mb-md">{{ item.name }}</div>
                                            <div class="text-grey-8">
                                                {{ item.description || 'No description available for this learning area.' }}
                                            </div>
                                        </q-card>
                                    </div>

                                    <!-- Additional Information -->
                                    <div class="q-mb-3 row justify-start q-col-gutter-sm">
                                        <div class="col-md-6 col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Learning Area ID</div>
                                                        <div class="text-bold">{{ item.id }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>

                                        <div class="col-md-6 col-12">
                                            <q-card  class="q-pa-md nice-shadow-6">
                                                <div class="row q-col-gutter-x-md items-center">
                                                    <div class="col">
                                                        <div class="text-grey text-weight-medium mb-1">Grade</div>
                                                        <div class="text-bold">{{ item.grade ? item.grade.name : 'Not specified' }}</div>
                                                    </div>
                                                </div>
                                            </q-card>
                                        </div>
                                    </div>

                                    <!-- Action Buttons -->
                                    <div  class=" row q-col-gutter-xs justify-start q-ma-md">
                                        <template v-if="auth.canView('learningareas')">
                                            <div>
                                                <q-btn icon="edit" label="Edit"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="positive" title="Edit"  @click="app.openPageDialog({ page:'learningareas/edit', url: `/learningareas/edit/${item.id}` , closeBtn: true })">
                                                </q-btn>
                                            </div>
                                        </template>
                                        <template v-if="auth.canView('learningareas')">
                                            <div>
                                                <q-btn icon="delete_sweep" label="Delete"  outline  :rounded="false"  no-caps  unelevated   padding="xs" color="negative" title="Delete"  @click="deleteItem(item.id)">
                                                </q-btn>
                                            </div>
                                        </template>
                                    </div>

                                    <!-- Related Topics Section -->
                                    <div class="q-mt-md">
                                        <q-card class="q-pa-md nice-shadow-6">
                                            <div class="text-h6 q-mb-md">Topics in this Learning Area</div>
                                            <TopicsPage is-subPage="true" fieldName="area_id" :fieldValue="props.id"/>
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
    import {  computed, ref, toRefs, onMounted } from 'vue';
    import { useMeta } from 'quasar';
    import { useApp } from 'src/composables/app.js';
    import { useAuth } from 'src/composables/auth';
    import { useViewPage } from 'src/composables/viewpage.js';
    import { usePageStore } from 'src/stores/page';
    import TopicsPage from 'src/pages/topics/list.vue';
        import {useLearningHierarchyStore} from "src/stores/learningHierarchyStore";
     const LearningHierarchy=useLearningHierarchyStore()
    const props = defineProps({
        id: [String, Number],
        primaryKey: {
            type: String,
            default: 'id',
        },
        pageStoreKey: {
            type: String,
            default: 'learningareas',
        },
        pageName: {
            type: String,
            default: 'learningareas',
        },
        routeName: {
            type: String,
            default: 'learningareasview',
        },
        apiPath: {
            type: String,
            default: 'learningareas/view',
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
            title: "Learning Area Details"
        }
    });

    onMounted(()=>{
         LearningHierarchy.selectArea(item)
    });
</script>

<style scoped>
/* Card hover effect */
.q-card:hover {
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    transition: box-shadow 0.3s ease;
}

/* Make title more prominent */
.text-h4 {
    font-weight: bold;
    color: #1976d2;
}

/* Add some spacing between sections */
.q-mb-md {
    margin-bottom: 1.5rem;
}

.q-mt-md {
    margin-top: 1.5rem;
}

/* Style for description text */
.text-grey-8 {
    line-height: 1.6;
    font-size: 1.1rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .text-h4 {
        font-size: 1.5rem;
    }

    .text-grey-8 {
        font-size: 1rem;
    }
}
</style>

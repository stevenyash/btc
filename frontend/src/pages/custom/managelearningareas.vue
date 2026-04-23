<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pa-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class=" text-h6 text-bold" >
                            Managel Larning Areas
                            <div class="text-caption text-grey"> Group into different learning areas/subjects </div>

                        </div>
                        <div class="">
                            <div class="row items-center q-py-md">
                                <div class="col">
                                    <h4 class="text-h5 text-dark">{{ grade.name?.toUpperCase() }}</h4>
                                    <p class="text-caption text-dark">Manage Areas here.Add or delete</p>
                                </div>
                                <q-btn
                                    label="Create Learning Area"
                                    color="green"
                                    icon="add"
                                    @click="showCreate=true"
                                    class="q-ml-auto"
                                    flat
                                    glossy
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section class="page-section q-mb-md" >
                <div class="container-fluid">
                    <div class="row q-col-gutter-x-md">
                        <div  class="col comp-grid" >
                            <div class="">
                                <div><template v-if="filteredCollections">
                                    <!-- Responsive Horizontal Cards -->
                                    <div class="row justify-start q-gutter-md">
                                        <q-card
                                            v-for="(data, i) in filteredCollections"
                                            :key="data.scid"
                                            flat
                                            bordered
                                            class="col-12 col-md-6 col-lg-4"
                                            style="max-width: 300px;"
                                            >
                                            <div class="row no-wrap" >
                                                <!-- Right Section (Content) -->
                                                <div class="col q-pa-md">
                                                    <!-- Main Collection Information -->
                                                    <q-card-section>
                                                        <div class="text-h6">{{ data.name.toUpperCase() }}</div>
                                                        <div class="text-caption row items-center">
                                                            <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            class="q-mr-sm"
                                                            style="width: 16px; height: 16px;"
                                                            >
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                                                            </svg>
                                                            Category: {{ data.category || 'N/A' }}
                                                        </div>
                                                        <div class="text-caption row items-center">
                                                            <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            class="q-mr-sm"
                                                            style="width: 16px; height: 16px;"
                                                            >
                                                            <path d="M21 6h-2.2L15 3H9L5.2 6H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-9 12H6v-6h6v6zm8-8h-4V8h4v2z" />
                                                            </svg>
                                                            Description: {{ data.description || 'No description available' }}
                                                        </div>
                                                        <div class="text-caption row items-center">
                                                            <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            class="q-mr-sm"
                                                            style="width: 16px; height: 16px;"
                                                            >
                                                            <path d="M12 6.5C9.46 6.5 7.5 8.46 7.5 11S9.46 15.5 12 15.5 16.5 13.54 16.5 11 14.54 6.5 12 6.5zm0 6c-1.11 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2z" />
                                                            </svg>
                                                            Visibility: {{ data.visibility }}
                                                        </div>
                                                        <div class="text-caption row items-center">
                                                            <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            class="q-mr-sm"
                                                            style="width: 16px; height: 16px;"
                                                            >
                                                            <path d="M7 11h10v2H7zm0-4h10v2H7zm0 8h10v2H7zm14-9V4h-4v2h2.99L19 19H5l.01-13H8V4H4v2H2v16h20V6z" />
                                                            </svg>
                                                            Created At: {{ utils.humanDate(data.tcreated) }}
                                                        </div>
                                                        <div class="text-caption row items-center">
                                                            <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            class="q-mr-sm"
                                                            style="width: 16px; height: 16px;"
                                                            >
                                                            <path d="M10 4v4l2-2 2 2V4zm9 14V6H5v12H3V6c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v12h-2zm-4-4v-4l-2 2-2-2v4z" />
                                                            </svg>
                                                            Videos: {{ data.videos.length }} video(s)
                                                        </div>
                                                    </q-card-section>
                                                    <!-- Action Buttons -->
                                                    <q-card-actions align="right" class="q-mt-md">
                                                        <q-btn
                                                            color="primary"
                                                            label="View"
                                                            icon="visibility"
                                                            @click="viewLesson(data)"
                                                            flat
                                                        ></q-btn>
                                                        <q-btn
                                                            v-if="$auth.isSuperadmin"
                                                            color="negative"
                                                            label="Delete"
                                                            icon="delete"
                                                            @click="confirmDelete(data.scid)"
                                                            flat
                                                        ></q-btn>
                                                    </q-card-actions>
                                                </div>
                                            </div>
                                        </q-card>
                                    </div>
                                </template>
                                <template v-else>
                                    <!-- Loading Spinner -->
                                    <div class="text-center">
                                        <q-spinner size="30px" />
                                        <p>Loading collections...</p>
                                    </div>
                                </template>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section class="page-section q-mb-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class="">
                            <q-dialog v-model="showCreate" >
                                <q-card style="min-width:400px">
                                    <div>
                                        <CollectionAdd :parent="scid" category="learning areas" :description="`${collection.name} learning area`" title="learning area"/>
                                    </div>
                                </q-card>
                            </q-dialog>
                        </div>

                        <div class="">
                            <div></div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    </q-page>

</template>
<script setup>
	import {  computed, ref, onMounted } from 'vue';
	import { utils } from 'src/utils';
	import { ApiService } from 'src/services/api';
	import { useApp } from 'src/composables/app.js';
	import { useAuth } from 'src/composables/auth';

	import {useLearningHierarchyStore} from "src/stores/learningHierarchyStore";
import CollectionAdd from "src/pages/collections/add.vue"
    import { useQuasar } from 'quasar';

	const props = defineProps({
		pageName: {
			type: String,
			default: 'home',
		},
		routeName: {
			type: String,
			default: 'home',
		},
		isSubPage: {
			type : Boolean,
			default : false,
		},
	});
	const app = useApp();
	const auth = useAuth();
	const pageReady = ref(true);
	const path=ref();
const collection=ref([]);
const grade=ref([])
const scid=ref();
const showCreate=ref(false);
const loading=ref(false)
const $q = useQuasar();
const store=useLearningHierarchyStore()
const filteredCollections = computed(() =>
collection.value.filter((data) => data.path === `${path.value}`) || []
);
const confirmDelete = (scid) => {
  $q.dialog({
    title: 'Confirm Deletion',
    message: 'Are you sure you want to delete this collection?',

    cancel: true,
        persistent: true

  })
    .onOk(() => {
      deleteCollection(scid);
    })
    .onCancel(() => {
      console.log('Deletion canceled');
    })
    .onDismiss(() => {
      console.log('Dialog dismissed');
    });
};
onMounted(() => {
    // Get route params
    scid.value=store.scids.grade
    path.value=store.path
    console.log('Route parameter scid:',path.value);
    if(store.scids.grade){
        getCollections()
        getGrade()
        }else{
        app.navigateTo('collections')
    }

    // Perform actions with the parameter
});
async function getCollections(){
    try{
        //fetch data from the api
        const response = await ApiService.get("components_data/learningareas");
        collection.value = response.data.data;
        console.log("coll",collection.value)
    }
    catch(e){
        console.error(e);
    }
}
async function getGrade(){
    try{
        //fetch data from the api
        const response = await ApiService.post("components_data/viewlearningarea",{scid:store.scids.grade});
        grade.value = response.data.data;
        console.log(grade.value)
    }
    catch(e){
        console.error(e);
    }
}
const deleteCollection = async (scid) => {
  try {
    loading.value = true;
    const response = await ApiService.get(`components_data/deletelearningarea/${scid}`);
    if (response.data.success) {
      $q.notify({ color: 'positive', message: response.data.message });
      location.reload(); // Or handle collection removal locally
    } else {
      $q.notify({ color: 'negative', message: 'Failed to delete the collection.' });
    }
  } catch (error) {
    $q.notify({ color: 'negative', message: 'An error occurred while deleting the collection.' });
  } finally {
    loading.value = false; // Stop the loading indicator
  }
};
function viewLesson(data) {
       store.setPath(`${data.path}/${data.scid}`)
       store.setScid('learningArea',data.scid)
    app.navigateTo('managelessons');
  }

</script>

<style scoped>

</style>

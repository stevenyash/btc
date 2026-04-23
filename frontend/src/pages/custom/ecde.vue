<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pa-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class=" text-h6 text-bold" >
                            ecde
                        </div>
                    </div>
                    
                    <div  class="col-12 comp-grid" >
                        <div class="">
                            <div>{{filteredCollections}}</div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </q-page>

</template>
<script setup>
	import {  computed, ref, onMounted } from 'vue';
	
	import { ApiService } from 'src/services/api';
	import { useApp } from 'src/composables/app.js';
	
	
	import { useQuasar } from 'quasar';
import CollectionAdd from "src/pages/collections/add"
import CollectionView from "src/pages/collections/view"

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
	
	const pageReady = ref(true);
	const $q = useQuasar();
const loading = ref(false);
const showCreate=ref(false);
const showView=ref(false)
const scid=ref('');
const collections=ref([])
const filteredCollections = computed(() =>
  collections?.value.filter((data) => data.name === 'ecde') || []
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
function viewCollection(data){
    scid.value=data.scid
    showView.value=true
}
onMounted(()=>{
  getCollections();
});
async function getCollections(){
  try{
    //fetch data from the api
    const response = await ApiService.get("components_data/learningareas");
    collections.value = response.data.data;
    console.log(response.data)
  }
  catch(e){
    console.error(e); 
  }
}

</script>

<style scoped>

</style>

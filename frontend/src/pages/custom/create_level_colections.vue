<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pa-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class=" text-h6 text-bold" >
                            lesson colections
                        </div>
                    </div>
                    
                    <div  class="col-12 comp-grid" >
                        <div class="">
                            <div class="items-end text-center justify-content-end row">
                                <q-btn @click="openCreate" color="blue" icon="add">Create collection </q-btn>
                            </div>
                            
                        </div>
                    </div>
                    
                    <div  class="col-12 comp-grid" >
                        <div class="">
                            <div>
                                <q-dialog v-model="createShow">
                                    <q-card>
                                    <VideoCollectionAdd/>
                                </q-card>
                            </q-dialog>
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
                        <api-data-source   :api-path="`components_data/collections`"  v-slot="req">
                            <div >
                                <template v-if="!req.loading">
                                    <!-- Responsive Grid -->
                                    <div class="row">
                                        <q-card
                                            class="q-pa-md col-3 q-ma-sm"
                                            v-for="(data, i) in req.response.data"
                                            :key="data.scid"
                                            bordered
                                            flat
                                            hover
                                            >
                                            <!-- Card Header -->
                                            <q-card-section>
                                                <div class="text-h6">{{ data.name || "Untitled Collection" }}</div>
                                                <div class="text-subtitle2 text-grey">{{ data.category || "Uncategorized" }}</div>
                                            </q-card-section>
                                            <!-- Card Body -->
                                            <q-card-section>
                                                <!-- Description -->
                                                <div class="q-mb-sm">
                                                    <span class="text-caption text-grey">Description:</span>
                                                    <div class="text-body1">
                                                        {{ data.description || "No description provided." }}
                                                    </div>
                                                </div>
                                                <!-- Visibility -->
                                                <div>
                                                    <span class="text-caption text-grey">Visibility:</span>
                                                    <q-chip outline dense color="primary">
                                                    {{ data.visibility || "Unknown" }}
                                                    </q-chip>
                                                </div>
                                            </q-card-section>
                                            <!-- Card Footer -->
                                            <q-card-actions align="between">
                                                <q-btn flat size="sm" color="primary" label="View Details" @click="viewCollection(data)"/>
                                                    <q-btn flat size="sm" color="negative" icon="delete" label="Delete" @click="deleteCollection(data)" />
                                                    </q-card-actions>
                                                </q-card>
                                            </div>
                                        </template>
                                        <template v-else>
                                            <div class="text-center">
                                                <q-spinner size="30px" />
                                            </div>
                                        </template>
                                        
                                    </div>
                                    
                                </api-data-source>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </q-page>
    
</template>
<script setup>
	import {  computed, ref } from 'vue';
	
	import { ApiService } from 'src/services/api';
	import { useApp } from 'src/composables/app.js';
	
	
	import VideoCollectionAdd from "src/components/VideoCollectionAdd";
import { useQuasar } from 'quasar'

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
	  const $q = useQuasar()
const createShow=ref()
function openCreate(){
    createShow.value=true
}
async function viewCollection(data){
    app.navigateTo(`collection?scid=${data.scid}`)
}
async function vCollection(){
  try{
    //fetch data from the api
    const response = await ApiService.get(`components_data/viewcollection?scid=${data.scid}`);
  console.log(response.data);
  }
  catch(e){
    console.error(e); 
  }
}
function deleteCollection (data) {
      $q.dialog({
          title: 'Delete ',
          message: 'Would you like to delete this collection ? Note there is no reverse every video under this will be deleted permanently .Click ok to continue',
        cancel: true,
        persistent: true
      }).onOk(() => {
      deletec(data)
      }).onOk(() => {
        // console.log('>>>> second OK catcher')
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
async function deletec(data){
  try{
    //fetch data from the api
    const response = await ApiService.get(`components_data/deletecollection/${data.scid}`);
    console.log(response.data);
  }
  catch(e){
    console.error(e); 
  }
}

</script>

<style scoped>

</style>

<template>
    <q-page class="main-page"  id="">
        <section class="page-section q-pa-md" >
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div  class="col comp-grid" >
                        <div class=" text-h6 text-bold" >
                            manage lessons videos
                        </div>
                        <div class="">
                            <div class="row items-center q-py-md">
                                <div class="col">
                                    <h4 class="text-h5 text-dark">{{ collection.name?.toUpperCase() }}</h4>
                                    <p class="text-caption text-dark">Manage videos here.Add or delete</p>
                                </div>
                                <q-btn
                                    label="Create Learning Area/subject"
                                    color="green"
                                    icon="add"
                                    @click="showAdd=true"
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
                                <div>
                                    <q-dialog v-model="showAdd">
                                        <q-card>
                                        <VideoUploader :pageData="{collection:store.scid,visibility:'hidden'}"/>
                                    </q-card>
                                </q-dialog>
                            </div>

                        </div>

                        <div class="">
                            <div v-if="collection.videos?.length">
                                <!-- Videos Table -->
                                <q-table
                                :rows="collection.videos"
                                :columns="columns"
                                row-key="fid"
                                flat
                                dense
                                >
                                <template v-slot:body="props">
                                    <q-tr>
                                        <!-- Title Column -->
                                        <q-td>
                                            <q-chip color="primary" text-color="white" dense>
                                            {{ props.row.title }}
                                            </q-chip>
                                        </q-td>
                                        <!-- Videos Column -->
                                        <q-td>
                                            <q-btn
                                                label="Watch"
                                                icon="play_circle"
                                                flat
                                                dense
                                                @click="playVideo(props.row.lesson_id)"
                                                />
                                            </q-td>
                                            <!-- Visibility Column -->
                                            <q-td>
                                                <q-badge
                                                :color="props.row.visibility === 'private' ? 'red' : 'green'"
                                                outline
                                                >
                                                {{ props.row.visibility }}
                                                </q-badge>
                                            </q-td>
                                            <q-td>
                                                <q-btn label="delete" icon="remove" color="red" @click="deleteVid(props.row.fid)"/>
                                                    <q-btn label="edit" icon="remove" color="teal" @click="editVid(props.row.fid)"/>
                                                    </q-td>
                                                </q-tr>
                                            </template>
                                            </q-table>
                                            <!-- Videos Player Dialog -->
                                            <q-dialog v-model="isDialogOpen" persistent>
                                                <q-card style="height:600px;width:600px">
                                                    <q-card-section>
                                                        <MusePlayer
                                                        :video-id="currentVideoUrl"
                                                        :width="auto"
                                                        :autoplay="false"
                                                        :loop="true"
                                                        @play="onPlay"
                                                        @pause="onPause"
                                                        @timeupdate="onTimeUpdate"
                                                        />
                                                    </q-card-section>
                                                    <q-card-actions align="right">
                                                        <q-btn flat label="Close" @click="isDialogOpen = false" />
                                                        </q-card-actions>
                                                    </q-card>
                                                </q-dialog>
                                            </div>
                                        </div>
                                    </div>

                                    <div  class="col-12 comp-grid" >
                                        <div class="">
                                            <q-dialog v-model="edit" transition-show="rotate" transition-hide="rotate">
                                                <q-card class="q-pa-md" style="min-width: 400px">
                                                    <q-form
                                                    @submit="onSubmit"
                                                    class="q-gutter-md"
                                                    >
                                                    <q-input
                                                    filled
                                                    v-model="formData.title"
                                                    label="title*"
                                                    hint="Title of he vid"
                                                    />
                                                    <q-input
                                                    filled
                                                    v-model="formData.description"
                                                    label="description*"
                                                    hint="Title of he vid"
                                                    />
                                                    />
                                                    <div>
                                                        <q-btn label="Edit" type="submit" color="primary"/>
                                                        </div>
                                                        </q-form>
                                                    </q-card>
                                                </q-dialog>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </q-page>

</template>
<script setup>
	import {  computed, ref, reactive, onMounted } from 'vue';

	import { ApiService } from 'src/services/api';
	import { useApp } from 'src/composables/app.js';


	    import { useRoute } from 'vue-router';
import {useLearningHierarchyStore} from "src/stores/learningHierarchyStore";
import VideoUploader from "src/pages/video/add";
import MusePlayer from 'src/components/MusePlayer.vue';

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
	const onPlay = () => console.log('Videos is playing');
const onPause = () => console.log('Videos is paused');
const onTimeUpdate = (time) => console.log('Current time:', time);
const store=useLearningHierarchyStore()
const route = useRoute();
const scid=ref()
const collection=ref([])
const showAdd=ref(false);
const edit=ref(false);
const fid=ref('')
const formData=reactive({

    title:"",
    description:"",

})
onMounted(() => {
    // Get route params
    scid.value=store.scid
    console.log('Route parameter scid:', scid.value);
    if(scid.value){
        getCollection()

        }else{
        app.navigateTo('collections')
    }

    // Perform actions with the parameter
});
async function getCollection(){
    try{
        //fetch data from the api
        const response = await ApiService.post("components_data/viewlearningarea",{scid:scid.value});
        collection.value = response.data.data;
        console.log(collection.value)
    }
    catch(e){
        console.error(e);
    }
}
// Table Columns
const columns = [
  { name: "title", label: "Title", align: "left" },
  { name: "url", label: "Videos", align: "left" },
  { name: "visibility", label: "Visibility", align: "left" },
];
// Dialog State
const isDialogOpen = ref(false);
const currentVideoUrl = ref(null);
// Play Videos Handler
function playVideo(url) {
  currentVideoUrl.value = url;
  isDialogOpen.value = true;
}
async function deleteVid(fid){
  try{
    //fetch data from the api
    const response = await ApiService.get(`components_data/deletevid/${fid}`);
    app.flashMsg("Videos Deleted")
location.reload()
  }
  catch(e){
    console.error(e);
  }
}
function editVid(id){
    fid.value=id;
    edit.value=true
}
async function onSubmit(){
  try{
    //fetch data from the api

    const response = await ApiService.post("components_data/editvideo",{fid:fid.value,data:formData});
    app.flashMsg("Videos Edited");
    location.reload()
  }
  catch(e){
    console.error(e);
  }
}

</script>

<style scoped>

</style>

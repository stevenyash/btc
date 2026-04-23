<template>
    <q-page class="main-page">
        <section class="page-section q-pa-md">
            <div class="container-fluid">
                <div class="row q-col-gutter-x-md">
                    <div class="col comp-grid">
                        <div class="text-h6 text-bold">manage lessons videos</div>
                        <div class="row items-center q-py-md">
                            <div class="col">
                                <h4 class="text-h5 text-dark">{{ collection.name?.toUpperCase() }}</h4>
                                <p class="text-caption text-dark">Manage videos here.Add or delete</p>
                            </div>
                            <q-btn
                                label="upload a new video"
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
            </section>
            <section class="page-section q-mb-md">
                <div class="container-fluid">
                    <div class="row q-col-gutter-x-md">
                        <div class="col comp-grid">
                            <q-dialog v-model="showAdd">
                                <q-card>
                                    <VideoUploader :pageData="{visibility:'hidden',collection:`${store.scid}`}"/>
                                </q-card>
                            </q-dialog>
                        </div>
                        <div v-if="collection.videos?.length">
                            <q-table
                                :rows="collection.videos"
                                :columns="columns"
                                row-key="fid"
                                flat
                                dense
                            >
                                <template v-slot:body="props">
                                    <q-tr>
                                        <q-td>
                                            <q-chip color="primary" text-color="white" dense>
                                                {{ props.row.title }}
                                            </q-chip>
                                        </q-td>
                                        <q-td>
                                            <q-chip color="primary" text-color="white" dense>
                                                {{ props.row.description }}
                                            </q-chip>
                                        </q-td>
                                        <q-td>
                                            <q-btn
                                                label="Watch"
                                                icon="play_circle"
                                                flat
                                                dense
                                                @click="playVideo(props.row.lesson_id)"
                                            />
                                        </q-td>
                                        <q-td>
                                            <q-badge
                                                :color="props.row.visibility === 'private' ? 'red' : 'green'"
                                                outline
                                            >
                                                {{ props.row.visibility }}
                                            </q-badge>
                                        </q-td>
                                        <q-td>
                                            <q-btn v-if="auth.isSuperadmin" label="delete" icon="remove" color="red" @click="confirmDelete(props.row.fid)"/>
                                            <q-btn label="edit" icon="edit" color="teal" @click="editVid(props.row.fid)"/>
                                        </q-td>
                                    </q-tr>
                                </template>
                            </q-table>
                            <q-dialog v-model="isDialogOpen" persistent>
                                <q-card style="height:600px;width:600px">
                                    <q-card-section>
                                        <MusePlayer
                                            :video-id="currentVideoUrl"
                                            :autoplay="false"
                                            :loop="true"
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
                <div class="col-12 comp-grid">
                    <q-dialog v-model="edit" transition-show="rotate" transition-hide="rotate">
                        <q-card class="q-pa-md" style="min-width: 400px">
                            <q-form @submit="onSubmit" class="q-gutter-md">
                                <q-input filled v-model="formData.title" label="title*" hint="Title of the vid" />
                                <q-input filled v-model="formData.description" label="description*" hint="Description of the vid" />
                                <q-btn label="Edit" type="submit" color="primary"/>
                            </q-form>
                        </q-card>
                    </q-dialog>
                </div>
            </section>
        </q-page>
</template>
<script setup>
    import { ref, reactive, onMounted } from 'vue';
    import { ApiService } from 'src/services/api';
    import { useApp } from 'src/composables/app.js';
    import { useAuth } from 'src/composables/auth';
    import { useRoute } from 'vue-router';
    import { useLearningHierarchyStore } from 'src/stores/learningHierarchyStore';
    import VideoUploader from 'src/pages/video/add.vue';
    import MusePlayer from 'src/components/MusePlayer.vue';

    const app = useApp();
    const auth = useAuth();
    const store = useLearningHierarchyStore();
    const route = useRoute();

    const collection = ref([]);
    const showAdd = ref(false);
    const edit = ref(false);
    const formData = reactive({ title: '', description: '' });

    const isDialogOpen = ref(false);
    const currentVideoUrl = ref(null);
    let fid = '';

    const columns = [
        { name: 'title', label: 'Title', align: 'left' },
        { name: 'description', label: 'Description', align: 'left' },
        { name: 'url', label: 'Videos', align: 'left' },
        { name: 'visibility', label: 'Visibility', align: 'left' },
    ];

    function confirmDelete(videoId) {
        $q.dialog({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to delete this video?',
            cancel: true,
            persistent: true
        }).onOk(() => deleteVid(videoId));
    }

    onMounted(() => {
        if (store.scids.learningArea) getCollection();
    });

    async function getCollection() {
        try {
            const response = await ApiService.post('components_data/viewlearningarea', { scid: store.scids.learningArea });
            collection.value = response.data.data;
        } catch (e) { console.error(e); }
    }

    function playVideo(url) {
        currentVideoUrl.value = url;
        isDialogOpen.value = true;
    }

    async function deleteVid(videoId) {
        try {
            await ApiService.get(`components_data/deletevid/${videoId}`);
            app.flashMsg('Videos Deleted');
            location.reload();
        } catch (e) { console.error(e); }
    }

    function editVid(id) {
        fid = id;
        edit.value = true;
    }

    async function onSubmit() {
        try {
            await ApiService.post('components_data/editvideo', { fid, data: formData });
            app.flashMsg('Videos Edited');
            location.reload();
        } catch (e) { console.error(e); }
    }
</script>
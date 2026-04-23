<template>
    <div>
      <!-- Collection Header Section -->
      <div class="row items-center q-py-md">
        <div class="col">
          <h4 class="text-h5 text-primary">{{ collection.name?.toUpperCase() }}</h4>
          <p class="text-caption text-secondary">Manage grades and their visibility.</p>
        </div>
        <q-btn
          label="Create Sub-Collection"
          color="primary"
          icon="add"
          @click="showAdd"
          class="q-ml-auto"
          flat
          glossy
        />
      </div>

      <!-- Display Sub-Collections -->
      <div v-if="filteredCollections.length > 0" class="row q-gutter-md">
        <q-card
          v-for="item in filteredCollections"
          :key="item.scid"
          flat
          bordered
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <q-card-section class="bg-grey-1">
            <div class="text-body1 text-primary q-mb-xs">{{ item.name }}</div>
            <div class="text-caption text-grey-7 row items-center">
              <q-icon name="movie" class="q-mr-xs" size="16px" />
              {{ item.videos?.length || 0 }} video(s)
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn label="View" icon="visibility" color="primary" flat @click="viewGrade(item)" />
            <q-btn label="Delete" icon="delete" color="negative" flat @click="confirmDelete(item.scid)" v-if="$auth.isSuperadmin"/>
          </q-card-actions>
        </q-card>
      </div>

      <!-- No Sub-Collections -->
      <div v-else class="text-center q-my-md">
        <q-icon name="folder_open" size="64px" color="grey-5" />
        <p class="text-body2 text-grey-6">No sub-collections available.</p>
      </div>

      <!-- Create Collection Dialog -->
      <q-dialog v-model="showCreate">
        <q-card style="min-width: 400px;">
          <q-card-section class="text-h6 text-primary">Create Sub-Collection</q-card-section>
          <q-card-section>
            <q-input
              v-model="collectionName"
              label="Collection Name"
              placeholder="Enter the name of the sub-collection"
              dense
              clearable
            />
            <q-select
              v-model="collectionVisibilty"
              :options="['private', 'public', 'hidden', 'usercode']"
              label="Visibility"
              dense
              clearable
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn label="Cancel" color="secondary" flat @click="showCreate = false" />
            <q-btn label="Create" color="primary" @click="createSubCollection" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </template>

  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useQuasar } from 'quasar';
  import { ApiService } from 'src/services/api';
  import { useRoute, useRouter } from "vue-router";
  import {useLearningHierarchyStore} from "src/stores/learningHierarchyStore";
  const store=useLearningHierarchyStore()
  const route = useRoute();
const router = useRouter();
  const props = defineProps({
    scid: {
      type: String,
      required: true,
    },
  });

  const $q = useQuasar();
  const collection = ref({});
  const collections = ref([]);
  const collectionName = ref('');
  const collectionVisibilty = ref('private');
  const showCreate = ref(false);
  const loading = ref(false);

  const filteredCollections = computed(() =>
    collections.value.filter((data) => data.path === props.scid) || []
  );

  onMounted(() => {
    getCollections();
  });

  async function getCollections() {
    try {
      const response = await ApiService.get('components_data/learningareas');
      collections.value = response.data.data;
    } catch (error) {
      console.error(error);
    }
  }

  function showAdd() {
    showCreate.value = true;
  }

  async function createSubCollection() {
    const newCollection = {
      parent: props.scid,
      name: collectionName.value,
      visibility: collectionVisibilty.value,
    };

    try {
      const response = await ApiService.post('components_data/createlearningarea', newCollection);
      if (response.data.success) {
        $q.notify({ color: 'positive', message: 'Collection created successfully' });
        showCreate.value = false;
        getCollections(); // Refresh collection data
      } else {
        $q.notify({ color: 'negative', message: 'Failed to create collection' });
      }
    } catch (error) {
      $q.notify({ color: 'negative', message: 'An error occurred while creating the collection.' });
    }
  }
  function viewGrade(data) {

   //store.setScid(data.scid);
   store.setScid('grade', data.scid)
   store.setPath(`${data.path}/${data.scid}`);
   router.push({ name: 'managelearningareas' });
 }


  function confirmDelete(scid) {
    $q.dialog({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this collection?',
      cancel: true,
      persistent: true,
    })
      .onOk(() => deleteCollection(scid))
      .onCancel(() => console.log('Deletion canceled'))
      .onDismiss(() => console.log('Dialog dismissed'));
  }

  async function deleteCollection(scid) {
    try {
      loading.value = true;
      const response = await ApiService.get(`components_data/deletelearningarea/${scid}`);
      if (response.data.success) {
        $q.notify({ color: 'positive', message: response.data.message });
        const index = collections.value.findIndex((item) => item.scid === scid);
        if (index !== -1) collections.value.splice(index, 1); // Remove item locally
      } else {
        $q.notify({ color: 'negative', message: 'Failed to delete the collection.' });
      }
    } catch (error) {
      $q.notify({ color: 'negative', message: 'An error occurred while deleting the collection.' });
    } finally {
      loading.value = false;
    }
  }
  </script>

  <style scoped>
  .text-body2 {
    font-weight: 500;
    margin-bottom: 2px;
  }
  </style>

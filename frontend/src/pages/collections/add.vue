<template>
    <q-page padding>
      <q-form ref="collectionForm" @submit.prevent="createCollection">
        <q-card class="q-pa-lg" flat bordered>
          <q-card-section>
            <div class="text-h6 text-center q-mb-md">Create a {{ props.title }}</div>
          </q-card-section>
  
          <q-card-section>
            <!-- Name Input -->
            <q-input
              v-model="formData.name"
              label="Collection Name *"
              placeholder="Enter collection name"
              filled
              dense
              :error="!!formErrors.name"
              :error-message="formErrors.name"
            />
  
            <!-- Visibility Input -->
            <q-select
              v-model="formData.visibility"
              :options="visibilityOptions"
              label="Visibility *"
              placeholder="Select visibility"
              filled
              dense
              :error="!!formErrors.visibility"
              :error-message="formErrors.visibility"
            />
  
            <!-- Parent Input -->
            <q-input
            disable
              v-model="formData.parent"
              :label="`Parent Collection  ${props.parent}`"
              placeholder="Enter parent collection ID"
              filled
              dense
            />
          </q-card-section>
  
          <q-card-actions align="right">
            <q-btn
              type="submit"
              color="primary"
              :loading="saving"
              label="Create Collection"
              :disable="saving"
            />
          </q-card-actions>
        </q-card>
      </q-form>
  
      <!-- Success/Failure Dialog -->
      <q-dialog v-model="showDialog">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ dialogMessage }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn label="Close" color="primary" @click="close" flat />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  </template>
  
  <script setup>
  import { ref, reactive } from "vue";
  import { ApiService } from "src/services/api";
const props=defineProps({
  parent:{
    type:String
  },
  description:{
    type:String
  },
  category:{
    type:String

  },
  title:{
    type:String

  },
})
  const formData = reactive({
    name: "",
    visibility: "hidden",
    parent: "",
    description:props.description,
    category:props.category

  });
  
  const visibilityOptions = [
    { label: "Private", value: "private" },
    { label: "Hidden", value: "hidden" },
    { label: "usercode", value: "usercode" },
    { label: "Unlisted", value: "unlisted" },
    { label: "Public", value: "public" },
  ];
  
  const formErrors = reactive({
    name: null,
    visibility: null,
  });
  
  const saving = ref(false);
  const showDialog = ref(false); // For showing the dialog
  const dialogMessage = ref(""); // To store the message to show in the dialog
  
  const validateForm = () => {
    let isValid = true;
  
    // Clear previous errors
    formErrors.name = null;
    formErrors.visibility = null;
  
    // Validate Name
    if (!formData.name) {
      formErrors.name = "Collection name is required.";
      isValid = false;
    }
  
    // Validate Visibility
    if (!formData.visibility) {
      formErrors.visibility = "Visibility is required.";
      isValid = false;
    }
  
    return isValid;
  };
  
  const createCollection = async () => {
    if (!validateForm()) return;
  
    saving.value = true;
  let postData={
        name: formData.name,
        visibility: formData.visibility, // Correctly send the string value
        parent: props.parent||formData.parent || undefined,
        description:props.description,
        category:props.category
      }
      console.log(postData)
    try {
      const response = await ApiService.post("components_data/createlearningarea", postData);
  
      console.log("Collection created successfully:", response.data);
      dialogMessage.value = "Collection created successfully!";
      showDialog.value = true;
  
      // Reset form fields
      Object.assign(formData, { name: "", visibility: "", parent: "" });
    } catch (error) {
      console.error("Error creating collection:", error.response?.data || error);
      dialogMessage.value = "Failed to create collection. Please try again.";
      showDialog.value = true;
    } finally {
      saving.value = false;
    }
  };
  function close(){
    showDialog.value = false;
window.location.reload()
  }
  </script>
  
  <style scoped>
  .q-page {
    max-width: 500px;
    margin: auto;
  }
  </style>
  
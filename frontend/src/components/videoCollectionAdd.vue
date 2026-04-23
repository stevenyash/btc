<template>
    <q-page padding>
      <q-form ref="collectionForm" @submit.prevent="createCollection">
        <q-card class="q-pa-lg" flat bordered>
          <q-card-section>
            <div class="text-h6 text-center q-mb-md">Create a Collection</div>
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
              v-model="formData.parent"
              label="Parent Collection (Optional)"
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
    </q-page>
  </template>
  <script setup>
  import { ref, reactive } from "vue";
  import { ApiService } from "src/services/api";
  
  const formData = reactive({
    name: "",
    visibility: "private",
    parent: "",
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
  
    try {
      const response = await ApiService.post("components_data/createlearningarea", {
        name: formData.name,
        visibility: formData.visibility, // Correctly send the string value
        parent: formData.parent || undefined,
      });
  
     // console.log("Collection created successfully:", response.data);
      alert("Collection created successfully!");
  
      // Reset form fields
      Object.assign(formData, { name: "", visibility: "", parent: "" });
    } catch (error) {
     // console.error("Error creating collection:", error.response?.data || error);
      alert("Failed to create collection. Please try again.");
    } finally {
      saving.value = false;
    }
  };
  </script>
  
  
  <style scoped>
  .q-page {
    max-width: 500px;
    margin: auto;
  }
  </style>
  
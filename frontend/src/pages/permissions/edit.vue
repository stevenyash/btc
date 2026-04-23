<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Home" :to="{ name: 'home' }" />
        <q-breadcrumbs-el label="Permissions" :to="{ name: 'permissions-list' }" />
        <q-breadcrumbs-el label="Edit Permission" />
      </q-breadcrumbs>
    </div>

    <q-card>
      <q-card-section>
        <div class="text-h5">Edit Permission</div>
      </q-card-section>

      <q-card-section v-if="loading">
        <q-spinner-oval color="primary" size="50px" />
      </q-card-section>

      <q-card-section v-else>
        <q-form @submit="updatePermission" class="q-gutter-md">
          <q-select
            v-model="permission.permission"
            :options="filteredPermissions"
            label="Select Permission"
            outlined
            use-input
            input-debounce="0"
            @filter="filterPermissions"
            :rules="[val => !!val || 'Permission is required']"
            :loading="loadingPermissions"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No results
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-select
            v-model="permission.role_id"
            :options="roles"
            label="Select Role"
            outlined
            emit-value
            map-options
            option-value="value"
            option-label="label"
            :rules="[val => !!val || 'Role is required']"
            :loading="loadingRoles"
          />
          <div class="text-right">
            <q-btn label="Cancel" flat color="grey" @click="router.back()" class="q-mr-sm" />
            <q-btn label="Update Permission" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ApiService } from 'src/services/api'
import { Notify } from 'quasar'

const router = useRouter()
const route = useRoute()

const permission = ref({
  permission: '',
  role_id: null
})

const roles = ref([])
const availablePermissions = ref([])
const filteredPermissions = ref([])
const loading = ref(true)
const loadingRoles = ref(false)
const loadingPermissions = ref(false)

onMounted(async () => {
  await Promise.all([loadRoles(), loadAvailablePermissions()])
  await loadPermission()
})

const filterPermissions = (val, update) => {
  if (val === '') {
    update(() => {
      filteredPermissions.value = availablePermissions.value
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    filteredPermissions.value = availablePermissions.value.filter(v => v.toLowerCase().indexOf(needle) > -1)
  })
}

const loadAvailablePermissions = async () => {
  loadingPermissions.value = true
  try {
    const response = await ApiService.get('/permissions/unique')
    availablePermissions.value = response.data || []
    filteredPermissions.value = availablePermissions.value
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to load available permissions'
    })
  } finally {
    loadingPermissions.value = false
  }
}

const loadRoles = async () => {
  loadingRoles.value = true
  try {
    const response = await ApiService.get('/roles')
    roles.value = response.data.records.map(role => ({
      value: role.role_id,
      label: role.role_name
    }))
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to load roles'
    })
  } finally {
    loadingRoles.value = false
  }
}

const loadPermission = async () => {
  loading.value = true
  try {
    const response = await ApiService.get(`/permissions/edit/${route.params.id}`)
    permission.value = {
      permission: response.data.permission,
      role_id: response.data.role_id
    }
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to load permission'
    })
    router.back()
  } finally {
    loading.value = false
  }
}

const updatePermission = async () => {
  try {
    await ApiService.post(`/permissions/edit/${route.params.id}`, permission.value)
    Notify.create({
      type: 'positive',
      message: 'Permission updated successfully'
    })
    router.push({ name: 'permissions-list' })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to update permission'
    })
  }
}
</script>

<style scoped>
.q-page {
  max-width: 800px;
  margin: 0 auto;
}
</style>

<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Home" :to="{ name: 'home' }" />
        <q-breadcrumbs-el label="Permissions" :to="{ name: 'permissions-list' }" />
        <q-breadcrumbs-el label="Add Permission" />
      </q-breadcrumbs>
    </div>

    <q-card>
      <q-card-section>
        <div class="text-h5">Add New Permission</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="addPermission" class="q-gutter-md">
          <q-select
            v-model="newPermission.permission"
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
            v-model="newPermission.role_id"
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
          <q-input
            v-model="newPermission.user_id"
            label="User ID (optional)"
            outlined
            type="number"
          />
          <div class="text-right">
            <q-btn label="Add Permission" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ApiService } from 'src/services/api'
import { Notify } from 'quasar'

const router = useRouter()

const newPermission = ref({
  permission: '',
  role_id: null,
  user_id: null
})

const roles = ref([])
const availablePermissions = ref([])
const filteredPermissions = ref([])
const loadingRoles = ref(false)
const loadingPermissions = ref(false)

onMounted(async () => {
  await Promise.all([loadRoles(), loadPermissions()])
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

const loadPermissions = async () => {
  loadingPermissions.value = true
  try {
    const response = await ApiService.get('/permissions/unique')
    // Backend returns an array of permission strings
    availablePermissions.value = response.data || []
    filteredPermissions.value = availablePermissions.value
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to load permissions'
    })
  } finally {
    loadingPermissions.value = false
  }
}

const loadRoles = async () => {
  loadingRoles.value = true
  try {
    const response = await ApiService.get('/roles')
    roles.value = response.data.map(role => ({
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

const addPermission = async () => {
  try {
    await ApiService.post('/permissions/add', newPermission.value)
    Notify.create({
      type: 'positive',
      message: 'Permission added successfully'
    })
    router.push({ name: 'permissions-list' })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to add permission'
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

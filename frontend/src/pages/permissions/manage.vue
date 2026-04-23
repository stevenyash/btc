<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Home" :to="{ name: 'home' }" />
        <q-breadcrumbs-el label="Manage Permissions" />
      </q-breadcrumbs>
    </div>

    <q-card>
      <q-card-section>
        <div class="text-h5">Manage Permissions</div>
      </q-card-section>

      <q-card-section>
        <q-tabs v-model="tab" dense class="text-grey" active-color="primary">
          <q-tab name="add-permission" label="Add Permission" />
          <q-tab name="assign-role" label="Assign to Role" />
          <q-tab name="view-permissions" label="View All Permissions" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated>
          <!-- Add Permission Tab -->
          <q-tab-panel name="add-permission">
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
          </q-tab-panel>

          <!-- Assign to Role Tab -->
          <q-tab-panel name="assign-role">
            <q-form @submit="assignToRole" class="q-gutter-md">
              <q-select
                v-model="rolePermission.roleId"
                :options="roles"
                label="Select Role"
                outlined
                :rules="[val => !!val || 'Role is required']"
                emit-value
                map-options
              />
              <q-select
                v-model="rolePermission.permissionId"
                :options="permissions"
                label="Select Permission"
                outlined
                :rules="[val => !!val || 'Permission is required']"
                emit-value
                map-options
              />
              <div class="text-right">
                <q-btn label="Assign Permission" type="submit" color="primary" />
              </div>
            </q-form>
          </q-tab-panel>

          <!-- View Permissions Tab -->
          <q-tab-panel name="view-permissions">
            <q-table
              title="All Permissions"
              :rows="allPermissions"
              :columns="permissionColumns"
              row-key="permission_id"
            >
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn icon="edit" size="sm" color="primary" @click="editPermission(props.row)" class="q-mr-sm" />
                  <q-btn icon="delete" size="sm" color="negative" @click="deletePermission(props.row.permission_id)" />
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
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

const tab = ref('add-permission')

// Add Permission form
const newPermission = ref({
  permission: '',
  role_id: null,
  user_id: null
})

// Assign to Role form
const roles = ref([])
const permissions = ref([])
const rolePermission = ref({
  roleId: null,
  permissionId: null
})

// Permission dropdown filtering
const availablePermissions = ref([])
const filteredPermissions = ref([])
const loadingPermissions = ref(false)

// View Permissions table
const allPermissions = ref([])
const permissionColumns = [
  { name: 'permission_id', label: 'ID', field: 'permission_id', align: 'left' },
  { name: 'permission', label: 'Permission', field: 'permission', align: 'left' },
  { name: 'role_id', label: 'Role ID', field: 'role_id', align: 'left' },
  { name: 'user_id', label: 'User ID', field: 'user_id', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]

onMounted(async () => {
  await loadRoles()
  await loadPermissions()
  await loadAllPermissions()
})

const loadRoles = async () => {
  try {
    const response = await ApiService.get('/roles')
    roles.value = response.data.records.map(role => ({ value: role.role_id, label: role.role_name }))
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to load roles'
    })
  }
}

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
    // Also map for the "Assign to Role" tab dropdown
    permissions.value = response.data.map(perm => ({ value: perm, label: perm }))
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to load permissions'
    })
  } finally {
    loadingPermissions.value = false
  }
}

const loadAllPermissions = async () => {
  try {
    const response = await ApiService.get('/permissions')
    allPermissions.value = response.data.records
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to load all permissions'
    })
  }
}

const addPermission = async () => {
  try {
    await ApiService.post('/permissions/add', newPermission.value)
    Notify.create({
      type: 'positive',
      message: 'Permission added successfully'
    })
    newPermission.value = { permission: '', role_id: null, user_id: null }
    await loadAllPermissions()
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to add permission'
    })
  }
}

const assignToRole = async () => {
  try {
    await ApiService.post(`/rolepermissions/add`, {
      role_id: rolePermission.value.roleId,
      permission_id: rolePermission.value.permissionId
    })
    Notify.create({
      type: 'positive',
      message: 'Permission assigned to role successfully'
    })
    rolePermission.value = { roleId: null, permissionId: null }
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to assign permission to role'
    })
  }
}

const editPermission = (permission) => {
  router.push({
    name: 'permissionsedit',
    params: { id: permission.permission_id }
  })
}

const deletePermission = async (permissionId) => {
  try {
    await ApiService.delete(`/permissions/delete/${permissionId}`)
    Notify.create({
      type: 'positive',
      message: 'Permission deleted successfully'
    })
    await loadAllPermissions()
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to delete permission'
    })
  }
}
</script>

<style scoped>
.q-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

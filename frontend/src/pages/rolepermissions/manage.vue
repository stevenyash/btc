<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Home" :to="{ name: 'home' }" />
        <q-breadcrumbs-el label="Manage Role Permissions" />
      </q-breadcrumbs>
    </div>

    <q-card>
      <q-card-section>
        <div class="text-h5">Manage Role Permissions</div>
      </q-card-section>

      <q-card-section>
        <q-tabs v-model="tab" dense class="text-grey" active-color="primary">
          <q-tab name="assign-permission" label="Assign Permission to Role" />
          <q-tab name="remove-permission" label="Remove Permission from Role" />
          <q-tab name="view-role-permissions" label="View Role Permissions" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated>
          <!-- Assign Permission Tab -->
          <q-tab-panel name="assign-permission">
            <q-form @submit="assignPermissionToRole" class="q-gutter-md">
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
                label="Select Page/Permission"
                outlined
                :rules="[val => !!val || 'Permission is required']"
                emit-value
                map-options
              />
              <div class="q-mt-md">
                <div class="text-subtitle2 q-mb-sm">Select CRUD Permissions:</div>
                <div class="row q-gutter-md">
                  <q-checkbox v-model="rolePermission.list" label="List" />
                  <q-checkbox v-model="rolePermission.store" label="Store/Create" />
                  <q-checkbox v-model="rolePermission.edit" label="Edit/Update" />
                  <q-checkbox v-model="rolePermission.remove" label="Remove/Delete" />
                  <q-checkbox v-model="rolePermission.view" label="View" />
                </div>
              </div>
              <div class="text-right">
                <q-btn label="Assign Permission" type="submit" color="primary" />
              </div>
            </q-form>
          </q-tab-panel>

          <!-- Remove Permission Tab -->
          <q-tab-panel name="remove-permission">
            <q-form @submit="removePermissionFromRole" class="q-gutter-md">
              <q-select
                v-model="rolePermissionToRemove.roleId"
                :options="roles"
                label="Select Role"
                outlined
                :rules="[val => !!val || 'Role is required']"
                emit-value
                map-options
              />
              <q-select
                v-model="rolePermissionToRemove.permissionId"
                :options="rolePermissions"
                label="Select Permission to Remove"
                outlined
                :rules="[val => !!val || 'Permission is required']"
                emit-value
                map-options
              />
              <div class="text-right">
                <q-btn label="Remove Permission" type="submit" color="primary" />
              </div>
            </q-form>
          </q-tab-panel>

          <!-- View Role Permissions Tab -->
          <q-tab-panel name="view-role-permissions">
            <q-select
              v-model="selectedRole"
              :options="roles"
              label="Select Role to View Permissions"
              outlined
              emit-value
              map-options
              @update:model-value="loadRolePermissions"
            />
            <q-table
              v-if="selectedRole"
              title="Role Permissions"
              :rows="currentRolePermissions"
              :columns="permissionColumns"
              row-key="id"
            >
              <template v-slot:body-cell-list="props">
                <q-td :props="props">
                  <q-toggle
                    v-model="props.row.list"
                    :true-value="1"
                    :false-value="0"
                    @update:model-value="updatePermission(props.row)"
                  />
                </q-td>
              </template>
              <template v-slot:body-cell-store="props">
                <q-td :props="props">
                  <q-toggle
                    v-model="props.row.store"
                    :true-value="1"
                    :false-value="0"
                    @update:model-value="updatePermission(props.row)"
                  />
                </q-td>
              </template>
              <template v-slot:body-cell-edit="props">
                <q-td :props="props">
                  <q-toggle
                    v-model="props.row.edit"
                    :true-value="1"
                    :false-value="0"
                    @update:model-value="updatePermission(props.row)"
                  />
                </q-td>
              </template>
              <template v-slot:body-cell-remove="props">
                <q-td :props="props">
                  <q-toggle
                    v-model="props.row.remove"
                    :true-value="1"
                    :false-value="0"
                    @update:model-value="updatePermission(props.row)"
                  />
                </q-td>
              </template>
              <template v-slot:body-cell-view="props">
                <q-td :props="props">
                  <q-toggle
                    v-model="props.row.view"
                    :true-value="1"
                    :false-value="0"
                    @update:model-value="updatePermission(props.row)"
                  />
                </q-td>
              </template>
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn icon="delete" size="sm" color="negative" @click="removePermission(props.row.id)" />
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
import { ref, onMounted, computed } from 'vue'
import { ApiService } from 'src/services/api'
import { Notify } from 'quasar'

const tab = ref('assign-permission')

// Assign Permission form
const roles = ref([])
const permissions = ref([])
const rolePermission = ref({
  roleId: null,
  permissionId: null,
  list: true,
  store: true,
  edit: true,
  remove: true,
  view: true
})

// Remove Permission form
const rolePermissionToRemove = ref({
  roleId: null,
  permissionId: null
})

// View Role Permissions
const selectedRole = ref(null)
const rolePermissionsMap = ref({})
const currentRolePermissions = computed(() => rolePermissionsMap.value[selectedRole.value] || [])

const permissionColumns = [
  { name: 'page', label: 'Permission Name', field: 'page', align: 'left' },
  { name: 'list', label: 'List', field: 'list', align: 'center' },
  { name: 'store', label: 'Store', field: 'store', align: 'center' },
  { name: 'edit', label: 'Edit', field: 'edit', align: 'center' },
  { name: 'remove', label: 'Remove', field: 'remove', align: 'center' },
  { name: 'view', label: 'View', field: 'view', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]

onMounted(async () => {
  await loadRoles()
  await loadPermissions()
})

const loadRoles = async () => {
  try {
    const response = await ApiService.get('/roles')
    console.log('Roles response:', response.data)
    roles.value = response.data.records.map(role => ({ value: role.role_id, label: role.role_name }))
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to load roles'
    })
  }
}

const loadPermissions = async () => {
  try {
    const response = await ApiService.get('/permissions/unique')
    console.log('Permissions response:', response.data)
    // response.data is an array of strings, not objects
    permissions.value = response.data.map(perm => ({ value: perm, label: perm }))
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to load permissions'
    })
  }
}

const loadRolePermissions = async () => {
  if (!selectedRole.value) return

  try {
    const response = await ApiService.get(`/rolepermissions/by-role/${selectedRole.value}`)
    // Handle both array and object responses
    const data = Array.isArray(response.data) ? response.data : (response.data.records || [])
    rolePermissionsMap.value[selectedRole.value] = data
  } catch (error) {
    // If 404, it means no permissions exist for this role yet
    if (error.response && error.response.status === 404) {
      rolePermissionsMap.value[selectedRole.value] = []
      Notify.create({
        type: 'info',
        message: 'No permissions found for this role'
      })
    } else {
      Notify.create({
        type: 'negative',
        message: 'Failed to load role permissions'
      })
    }
  }
}

const assignPermissionToRole = async () => {
  try {
    await ApiService.post(`/rolepermissions/add`, {
      role_id: rolePermission.value.roleId,
      page: rolePermission.value.permissionId,
      list: rolePermission.value.list ? 1 : 0,
      store: rolePermission.value.store ? 1 : 0,
      edit: rolePermission.value.edit ? 1 : 0,
      remove: rolePermission.value.remove ? 1 : 0,
      view: rolePermission.value.view ? 1 : 0
    })
    Notify.create({
      type: 'positive',
      message: 'Permission assigned to role successfully'
    })
    const currentRoleId = rolePermission.value.roleId
    rolePermission.value = {
      roleId: null,
      permissionId: null,
      list: true,
      store: true,
      edit: true,
      remove: true,
      view: true
    }

    // Refresh role permissions if viewing the same role
    if (selectedRole.value === currentRoleId) {
      await loadRolePermissions()
    }
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to assign permission to role'
    })
  }
}

const removePermissionFromRole = async () => {
  try {
    await ApiService.delete(`/rolepermissions/delete/${rolePermissionToRemove.value.permissionId}`)
    Notify.create({
      type: 'positive',
      message: 'Permission removed from role successfully'
    })
    rolePermissionToRemove.value = { roleId: null, permissionId: null }

    // Refresh role permissions if viewing the same role
    if (selectedRole.value === rolePermissionToRemove.value.roleId) {
      await loadRolePermissions()
    }
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to remove permission from role'
    })
  }
}

const updatePermission = async (permission) => {
  try {
    await ApiService.post(`/rolepermissions/edit/${permission.id}`, {
      list: permission.list,
      store: permission.store,
      edit: permission.edit,
      remove: permission.remove,
      view: permission.view
    })
    Notify.create({
      type: 'positive',
      message: 'Permission updated successfully'
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to update permission'
    })
    // Refresh to revert changes on error
    if (selectedRole.value) {
      await loadRolePermissions()
    }
  }
}

const removePermission = async (permissionId) => {
  try {
    await ApiService.delete(`/rolepermissions/delete/${permissionId}`)
    Notify.create({
      type: 'positive',
      message: 'Permission removed successfully'
    })

    // Refresh role permissions
    if (selectedRole.value) {
      await loadRolePermissions()
    }
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to remove permission'
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

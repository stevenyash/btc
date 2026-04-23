<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Home" :to="{ name: 'home' }" />
        <q-breadcrumbs-el label="Permissions" />
      </q-breadcrumbs>
    </div>

    <q-card>
      <q-card-section>
        <div class="text-h5">All Permissions</div>
      </q-card-section>

      <q-card-section>
        <q-table
          title="Permissions List"
          :rows="permissions"
          :columns="columns"
          row-key="id"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn icon="edit" size="sm" color="primary" @click="editPermission(props.row.id)" />
              <q-btn icon="delete" size="sm" color="negative" @click="deletePermission(props.row.id)" />
            </q-td>
          </template>
        </q-table>
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

const permissions = ref([])
const columns = [
  { name: 'name', label: 'Permission Name', field: 'name' },
  { name: 'description', label: 'Description', field: 'description' },
  { name: 'actions', label: 'Actions', field: 'actions' }
]

onMounted(async () => {
  await loadPermissions()
})

const loadPermissions = async () => {
  try {
    const response = await ApiService.get('/permissions')
    permissions.value = response.data
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Failed to load permissions'
    })
  }
}

const editPermission = (id) => {
  router.push({ name: 'permissions-edit', params: { id } })
}

const deletePermission = async (id) => {
  try {
    await ApiService.delete(`/permissions/delete/${id}`)
    Notify.create({
      type: 'positive',
      message: 'Permission deleted successfully'
    })
    await loadPermissions()
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

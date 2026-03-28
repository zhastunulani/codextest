<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Бөлімдер</h1>
        <p class="text-gray-500 mt-1">Бөлімдерді басқару</p>
      </div>
      <button class="btn-primary" @click="openModal()">+ Қосу</button>
    </div>

    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-400">Жүктелуде...</div>
      <div v-else-if="!departments.length" class="text-center py-8 text-gray-400">Бөлімдер жоқ</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left">
            <th class="pb-3 font-semibold text-gray-600">#</th>
            <th class="pb-3 font-semibold text-gray-600">Атауы</th>
            <th class="pb-3 font-semibold text-gray-600 text-right">Әрекеттер</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(dept, i) in departments" :key="dept.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-3 text-gray-500">{{ i + 1 }}</td>
            <td class="py-3 font-medium">{{ dept.name }}</td>
            <td class="py-3 text-right">
              <button class="text-primary-600 hover:underline text-sm mr-3" @click="openModal(dept)">Өзгерту</button>
              <button class="text-red-600 hover:underline text-sm" @click="handleDelete(dept.id)">Жою</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showModal = false">
      <div class="card w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">{{ editingId ? 'Бөлімді өзгерту' : 'Жаңа бөлім' }}</h3>
        <form @submit.prevent="handleSave">
          <div class="mb-4">
            <label class="label">Атауы</label>
            <input v-model="form.name" type="text" class="input" placeholder="Бөлім атауы" required />
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-secondary" @click="showModal = false">Бас тарту</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Сақталуда...' : 'Сақтау' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const departments = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ name: '' })

const fetchDepartments = async () => {
  loading.value = true
  try {
    departments.value = await $fetch<any[]>('/api/departments')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openModal = (dept?: any) => {
  if (dept) {
    editingId.value = dept.id
    form.name = dept.name
  } else {
    editingId.value = null
    form.name = ''
  }
  showModal.value = true
}

const handleSave = async () => {
  saving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/departments/${editingId.value}`, { method: 'PUT', body: { name: form.name } })
    } else {
      await $fetch('/api/departments', { method: 'POST', body: { name: form.name } })
    }
    showModal.value = false
    await fetchDepartments()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Бөлімді жоюға сенімдісіз бе?')) return
  try {
    await $fetch(`/api/departments/${id}`, { method: 'DELETE' })
    await fetchDepartments()
  } catch (e) {
    console.error(e)
  }
}

fetchDepartments()
</script>

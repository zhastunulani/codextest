<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Лауазымдар</h1>
        <p class="text-gray-500 mt-1">Лауазымдарды басқару</p>
      </div>
      <button class="btn-primary" @click="openModal()">+ Қосу</button>
    </div>

    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-400">Жүктелуде...</div>
      <div v-else-if="!positions.length" class="text-center py-8 text-gray-400">Лауазымдар жоқ</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left">
            <th class="pb-3 font-semibold text-gray-600">#</th>
            <th class="pb-3 font-semibold text-gray-600">Атауы</th>
            <th class="pb-3 font-semibold text-gray-600">Бөлім</th>
            <th class="pb-3 font-semibold text-gray-600 text-right">Әрекеттер</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(pos, i) in positions" :key="pos.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-3 text-gray-500">{{ i + 1 }}</td>
            <td class="py-3 font-medium">{{ pos.name }}</td>
            <td class="py-3 text-gray-600">{{ getDepartmentName(pos.departmentId) }}</td>
            <td class="py-3 text-right">
              <button class="text-primary-600 hover:underline text-sm mr-3" @click="openModal(pos)">Өзгерту</button>
              <button class="text-red-600 hover:underline text-sm" @click="handleDelete(pos.id)">Жою</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showModal = false">
      <div class="card w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">{{ editingId ? 'Лауазымды өзгерту' : 'Жаңа лауазым' }}</h3>
        <form @submit.prevent="handleSave">
          <div class="mb-4">
            <label class="label">Атауы</label>
            <input v-model="form.name" type="text" class="input" placeholder="Лауазым атауы" required />
          </div>
          <div class="mb-4">
            <label class="label">Бөлім</label>
            <select v-model="form.departmentId" class="input" required>
              <option value="" disabled>Бөлімді таңдаңыз</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
            </select>
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
const positions = ref<any[]>([])
const departments = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ name: '', departmentId: '' as string | number })

const getDepartmentName = (id: number) => {
  return departments.value.find(d => d.id === id)?.name || '-'
}

const fetchData = async () => {
  loading.value = true
  try {
    const [posData, deptData] = await Promise.all([
      $fetch<any[]>('/api/positions'),
      $fetch<any[]>('/api/departments'),
    ])
    positions.value = posData
    departments.value = deptData
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openModal = (pos?: any) => {
  if (pos) {
    editingId.value = pos.id
    form.name = pos.name
    form.departmentId = pos.departmentId
  } else {
    editingId.value = null
    form.name = ''
    form.departmentId = ''
  }
  showModal.value = true
}

const handleSave = async () => {
  saving.value = true
  try {
    const body = { name: form.name, departmentId: Number(form.departmentId) }
    if (editingId.value) {
      await $fetch(`/api/positions/${editingId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/positions', { method: 'POST', body })
    }
    showModal.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Лауазымды жоюға сенімдісіз бе?')) return
  try {
    await $fetch(`/api/positions/${id}`, { method: 'DELETE' })
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

fetchData()
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Жұмыс кестелері</h1>
        <p class="text-gray-500 mt-1">Жұмыс уақытын басқару</p>
      </div>
      <button class="btn-primary" @click="openModal()">+ Қосу</button>
    </div>

    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-400">Жүктелуде...</div>
      <div v-else-if="!schedules.length" class="text-center py-8 text-gray-400">Кестелер жоқ</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-left">
              <th class="pb-3 font-semibold text-gray-600">Атауы</th>
              <th class="pb-3 font-semibold text-gray-600">Түрі</th>
              <th class="pb-3 font-semibold text-gray-600">Басталуы</th>
              <th class="pb-3 font-semibold text-gray-600">Аяқталуы</th>
              <th class="pb-3 font-semibold text-gray-600">Жұмыс күндері</th>
              <th class="pb-3 font-semibold text-gray-600 text-right">Әрекеттер</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="schedule in schedules" :key="schedule.id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 font-medium">{{ schedule.name }}</td>
              <td class="py-3">
                <span class="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                  {{ scheduleTypeLabel(schedule.type) }}
                </span>
              </td>
              <td class="py-3">{{ schedule.workStart || '-' }}</td>
              <td class="py-3">{{ schedule.workEnd || '-' }}</td>
              <td class="py-3">
                <div class="flex gap-1">
                  <span
                    v-for="day in 7"
                    :key="day"
                    class="w-7 h-7 rounded-full text-xs flex items-center justify-center font-medium"
                    :class="isWorkDay(schedule.workDays, day) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'"
                  >
                    {{ dayLabels[day - 1] }}
                  </span>
                </div>
              </td>
              <td class="py-3 text-right">
                <button class="text-primary-600 hover:underline text-sm mr-3" @click="openModal(schedule)">Өзгерту</button>
                <button class="text-red-600 hover:underline text-sm" @click="handleDelete(schedule.id)">Жою</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showModal = false">
      <div class="card w-full max-w-lg mx-4">
        <h3 class="text-lg font-semibold mb-4">{{ editingId ? 'Кестені өзгерту' : 'Жаңа кесте' }}</h3>
        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label class="label">Атауы</label>
            <input v-model="form.name" type="text" class="input" placeholder="Кесте атауы" required />
          </div>
          <div>
            <label class="label">Түрі</label>
            <select v-model="form.type" class="input" required>
              <option value="" disabled>Таңдаңыз</option>
              <option v-for="t in scheduleTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Басталуы</label>
              <input v-model="form.workStart" type="time" class="input" required />
            </div>
            <div>
              <label class="label">Аяқталуы</label>
              <input v-model="form.workEnd" type="time" class="input" required />
            </div>
          </div>
          <div>
            <label class="label mb-2">Жұмыс күндері</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="day in 7"
                :key="day"
                class="flex items-center gap-1.5 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  :checked="form.workDays.includes(day)"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="toggleDay(day)"
                />
                <span class="text-sm">{{ dayLabelsFull[day - 1] }}</span>
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2">
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
const dayLabels = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жк']
const dayLabelsFull = ['Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі', 'Жексенбі']

const scheduleTypes = [
  { value: '5/2', label: '5/2 (Стандарт)' },
  { value: '2/2', label: '2/2 (Ауысым)' },
  { value: '6/1', label: '6/1' },
  { value: 'shift', label: 'Ауысымдық' },
  { value: 'free', label: 'Еркін' },
]

const scheduleTypeLabel = (type: string) => scheduleTypes.find(t => t.value === type)?.label || type

const isWorkDay = (workDays: number[] | string | null, day: number) => {
  if (!workDays) return false
  const days = typeof workDays === 'string' ? JSON.parse(workDays) : workDays
  return Array.isArray(days) && days.includes(day)
}

const schedules = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  name: '',
  type: '' as string,
  workStart: '09:00',
  workEnd: '18:00',
  workDays: [] as number[],
})

const toggleDay = (day: number) => {
  const idx = form.workDays.indexOf(day)
  if (idx >= 0) form.workDays.splice(idx, 1)
  else form.workDays.push(day)
}

const fetchSchedules = async () => {
  loading.value = true
  try {
    schedules.value = await $fetch<any[]>('/api/schedules')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openModal = (schedule?: any) => {
  if (schedule) {
    editingId.value = schedule.id
    form.name = schedule.name
    form.type = schedule.type
    form.workStart = schedule.workStart || '09:00'
    form.workEnd = schedule.workEnd || '18:00'
    const days = typeof schedule.workDays === 'string' ? JSON.parse(schedule.workDays) : schedule.workDays
    form.workDays = Array.isArray(days) ? [...days] : []
  } else {
    editingId.value = null
    form.name = ''
    form.type = ''
    form.workStart = '09:00'
    form.workEnd = '18:00'
    form.workDays = [1, 2, 3, 4, 5]
  }
  showModal.value = true
}

const handleSave = async () => {
  saving.value = true
  try {
    const body = {
      name: form.name,
      type: form.type,
      workStart: form.workStart,
      workEnd: form.workEnd,
      workDays: form.workDays,
    }
    if (editingId.value) {
      await $fetch(`/api/schedules/${editingId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/schedules', { method: 'POST', body })
    }
    showModal.value = false
    await fetchSchedules()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Кестені жоюға сенімдісіз бе?')) return
  try {
    await $fetch(`/api/schedules/${id}`, { method: 'DELETE' })
    await fetchSchedules()
  } catch (e) {
    console.error(e)
  }
}

fetchSchedules()
</script>

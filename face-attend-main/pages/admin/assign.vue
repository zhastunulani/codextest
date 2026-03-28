<template>
  <div class="space-y-4">
    <div class="card">
      <h1 class="text-xl font-bold">Admin · Assign</h1>
      <p class="text-sm text-gray-500">Қызметкерді бөлімге бекіту және head тағайындау</p>
    </div>

    <div class="card space-y-3">
      <div class="grid md:grid-cols-3 gap-2">
        <input v-model.number="userId" type="number" class="input" placeholder="User ID" />
        <input v-model.number="departmentId" type="number" class="input" placeholder="Department ID" />
        <button class="btn-primary" @click="assignDept" :disabled="loading">Бекіту</button>
      </div>
      <button class="btn-primary w-full md:w-auto" @click="makeHead" :disabled="loading">Head қылу</button>
      <p v-if="msg" class="text-sm text-gray-600">{{ msg }}</p>
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const userId = ref<number | null>(null)
const departmentId = ref<number | null>(null)
const loading = ref(false)
const msg = ref('')
const error = ref('')

const assignDept = async () => {
  if (!userId.value || !departmentId.value) return
  loading.value = true
  msg.value = ''
  error.value = ''
  try {
    await $fetch('/api/employees/assign-department', { method: 'POST', body: { userId: userId.value, departmentId: departmentId.value } })
    msg.value = 'Бөлімге бекітілді'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Қате'
  } finally {
    loading.value = false
  }
}

const makeHead = async () => {
  if (!userId.value) return
  loading.value = true
  msg.value = ''
  error.value = ''
  try {
    await $fetch('/api/employees/make-head', { method: 'POST', body: { userId: userId.value, departmentId: departmentId.value } })
    msg.value = 'Head тағайындалды'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Қате'
  } finally {
    loading.value = false
  }
}
</script>

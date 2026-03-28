<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-700 px-4">
    <div class="card w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-emerald-600">FaceAttend</h1>
        <p class="text-gray-500 mt-2">Қызметкер тіркелуі</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="label">Аты-жөні</label>
          <input v-model="form.name" type="text" class="input" placeholder="Атыңыз" required />
        </div>
        <div>
          <label class="label">Логин</label>
          <input v-model="form.login" type="text" class="input" placeholder="employee.login" required />
        </div>
        <div>
          <label class="label">Пароль</label>
          <input v-model="form.password" type="password" class="input" placeholder="••••••••" required />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <button type="submit" :disabled="loading" class="btn-primary w-full">
          {{ loading ? 'Тіркелуде...' : 'Тіркелу' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm space-y-2">
        <NuxtLink to="/login" class="text-primary-600 hover:underline block">Кіру бетіне оралу</NuxtLink>
        <NuxtLink to="/admin/login" class="text-gray-500 hover:underline block">Админ кіруі</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const form = reactive({ name: '', login: '', password: '' })
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: form })
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Тіркелу кезінде қате болды'
  } finally {
    loading.value = false
  }
}
</script>

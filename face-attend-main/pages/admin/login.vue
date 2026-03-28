<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-700 px-4">
    <div class="card w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-red-600">Admin Login</h1>
        <p class="text-gray-500 mt-2">Жүйелік әкімші кіруі</p>
      </div>

      <form @submit.prevent="handleAdminLogin" class="space-y-4">
        <div>
          <label class="label">Логин</label>
          <input v-model="form.login" type="text" class="input" placeholder="admin" required />
        </div>
        <div>
          <label class="label">Пароль</label>
          <input v-model="form.password" type="password" class="input" placeholder="••••••••" required />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <button type="submit" :disabled="loading" class="btn-primary w-full bg-red-600 hover:bg-red-700">
          {{ loading ? 'Кіру...' : 'Admin кіру' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm space-y-2">
        <NuxtLink to="/login" class="text-primary-600 hover:underline block">Қалыпты кіру</NuxtLink>
        <NuxtLink to="/register" class="text-gray-500 hover:underline block">Қызметкер тіркелуі</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const form = reactive({ login: '', password: '' })
const loading = ref(false)
const error = ref('')

const handleAdminLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/admin-login', { method: 'POST', body: form })
    await navigateTo('/admin/dashboard')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Admin кіру кезінде қате болды'
  } finally {
    loading.value = false
  }
}
</script>

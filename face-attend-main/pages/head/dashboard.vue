<template>
  <div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
    <div class="card">
      <h1 class="text-2xl font-bold text-gray-900">Head Dashboard</h1>
      <p class="text-gray-500 mt-1">Бөлім басшысының панелі (skeleton)</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <NuxtLink to="/employees" class="card hover:shadow-md transition-shadow">
        <p class="font-semibold">Бөлім қызметкерлері</p>
        <p class="text-sm text-gray-500 mt-1">Өз бөліміңізді басқару</p>
      </NuxtLink>
      <NuxtLink to="/attendance" class="card hover:shadow-md transition-shadow">
        <p class="font-semibold">Attendance</p>
        <p class="text-sm text-gray-500 mt-1">Бөлім табелі мен есептер</p>
      </NuxtLink>
      <NuxtLink to="/payroll" class="card hover:shadow-md transition-shadow">
        <p class="font-semibold">Payroll</p>
        <p class="text-sm text-gray-500 mt-1">Бөлім айлық есептеу</p>
      </NuxtLink>
    </div>
  </div>
</template>


<script setup lang="ts">
definePageMeta({ layout: 'head' })
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top bar -->
    <div class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <NuxtLink to="/" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="text-sm font-medium">Артқа</span>
      </NuxtLink>
      <h1 class="text-lg font-bold text-gray-900">Сканерлеу</h1>
      <div class="w-16"></div>
    </div>

    <div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <!-- Status indicator -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 rounded-full transition-colors duration-300"
            :class="faceDetected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'"
          />
          <span class="text-sm font-medium" :class="faceDetected ? 'text-green-600' : 'text-gray-400'">
            {{ faceDetected ? 'Бет анықталды' : 'Бет табылмады' }}
          </span>
        </div>
        <button
          @click="autoScan = !autoScan"
          class="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
          :class="autoScan
            ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
        >
          {{ autoScan ? `Авто-сканер (${autoCountdown}с)` : 'Авто-сканер' }}
        </button>
      </div>

      <!-- Camera feed -->
      <div class="relative rounded-2xl overflow-hidden bg-black shadow-lg aspect-[4/3]">
        <video
          ref="videoRef"
          autoplay
          playsinline
          muted
          class="w-full h-full object-cover"
        />
        <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" />

        <!-- Loading overlay -->
        <div
          v-if="!modelsLoaded || !cameraReady"
          class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-3"
        >
          <div class="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p class="text-sm">{{ loadingMessage }}</p>
        </div>

        <!-- Processing overlay -->
        <div
          v-if="processing"
          class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-3"
        >
          <div class="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p class="text-sm">Тексерілуде...</p>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="handleScan('in')"
          :disabled="!faceDetected || processing || !modelsLoaded"
          class="py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200
            bg-green-500 hover:bg-green-600 active:scale-[0.97]
            disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Келді (Check-in)
        </button>
        <button
          @click="handleScan('out')"
          :disabled="!faceDetected || processing || !modelsLoaded"
          class="py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200
            bg-orange-500 hover:bg-orange-600 active:scale-[0.97]
            disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Кетті (Check-out)
        </button>
      </div>

      <!-- Result card -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div v-if="result" class="rounded-2xl p-5 shadow-md border" :class="result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              :class="result.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
            >
              {{ result.success ? result.employeeName?.charAt(0) || '?' : '!' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 truncate">
                {{ result.success ? result.employeeName : 'Қате' }}
              </p>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ result.message }}
              </p>
              <div v-if="result.success" class="flex flex-wrap gap-2 mt-2">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="result.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'">
                  {{ result.type === 'in' ? 'Келді' : 'Кетті' }}
                </span>
                <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  {{ result.time }}
                </span>
                <span v-if="result.isLate" class="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                  Кешікті: {{ result.lateMinutes }} мин
                </span>
                <span v-if="result.overtimeMinutes" class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  Үстеме: {{ result.overtimeMinutes }} мин
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Error message -->
      <div v-if="errorMsg" class="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
        {{ errorMsg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

let faceapi: any = null

// Refs
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// State
const modelsLoaded = ref(false)
const cameraReady = ref(false)
const faceDetected = ref(false)
const processing = ref(false)
const autoScan = ref(false)
const autoCountdown = ref(5)
const errorMsg = ref('')
const loadingMessage = ref('Модельдер жүктелуде...')

const result = ref<{
  success: boolean
  employeeName?: string
  message: string
  type?: 'in' | 'out'
  time?: string
  isLate?: boolean
  lateMinutes?: number
  overtimeMinutes?: number
} | null>(null)

// Employee face data
const employees = ref<Array<{
  id: number
  name: string
  descriptor: Float32Array
}>>([])

let currentDescriptor: Float32Array | null = null
let matchedEmployee: { id: number; name: string } | null = null
let detectionInterval: ReturnType<typeof setInterval> | null = null
let autoScanInterval: ReturnType<typeof setInterval> | null = null

// Compute loading message
const updateLoadingMessage = (msg: string) => {
  loadingMessage.value = msg
}

// Load face-api models
const loadModels = async () => {
  updateLoadingMessage('Модельдер жүктелуде...')
  try {
    faceapi = await import('@vladmandic/face-api')
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ])
    modelsLoaded.value = true
  } catch (e) {
    console.error('Failed to load face-api models:', e)
    errorMsg.value = 'Модельдерді жүктеу кезінде қате болды. Бетті жаңартып көріңіз.'
  }
}

// Load employee face descriptors
const loadEmployees = async () => {
  try {
    const data = await $fetch<Array<{ id: number; name: string; faceDescriptor: string | number[] }>>('/api/employees', {
      params: { withFace: 'true' },
    })
    employees.value = data
      .filter((e) => e.faceDescriptor)
      .map((e) => {
        const desc = typeof e.faceDescriptor === 'string' ? JSON.parse(e.faceDescriptor) : e.faceDescriptor
        return { id: e.id, name: e.name, descriptor: new Float32Array(desc) }
      })
      .filter((e) => e.descriptor.length === 128)
  } catch (e) {
    console.error('Failed to load employees:', e)
    errorMsg.value = 'Қызметкерлерді жүктеу кезінде қате болды.'
  }
}

// Start camera
const startCamera = async () => {
  updateLoadingMessage('Камера қосылуда...')
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await new Promise<void>((resolve) => {
        videoRef.value!.onloadedmetadata = () => resolve()
      })
      cameraReady.value = true
    }
  } catch (e) {
    console.error('Camera error:', e)
    errorMsg.value = 'Камераға қол жеткізу мүмкін болмады. Рұқсатты тексеріңіз.'
  }
}

// Euclidean distance
const euclideanDistance = (a: Float32Array, b: Float32Array): number => {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2
  }
  return Math.sqrt(sum)
}

// Find matching employee
const findMatch = (descriptor: Float32Array): { id: number; name: string; distance: number } | null => {
  let bestMatch: { id: number; name: string; distance: number } | null = null
  const threshold = 0.5

  for (const emp of employees.value) {
    const dist = euclideanDistance(descriptor, emp.descriptor)
    if (dist < threshold && (!bestMatch || dist < bestMatch.distance)) {
      bestMatch = { id: emp.id, name: emp.name, distance: dist }
    }
  }

  return bestMatch
}

// Detect faces in video
const detectFaces = async () => {
  if (!videoRef.value || !canvasRef.value || !modelsLoaded.value || !cameraReady.value || processing.value) return

  const video = videoRef.value
  const canvas = canvasRef.value

  const displaySize = { width: video.videoWidth, height: video.videoHeight }
  faceapi.matchDimensions(canvas, displaySize)

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor()

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  if (detection) {
    faceDetected.value = true
    currentDescriptor = detection.descriptor

    // Draw detection box
    const resizedDetection = faceapi.resizeResults(detection, displaySize)
    if (ctx) {
      const box = resizedDetection.detection.box
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 3
      ctx.strokeRect(box.x, box.y, box.width, box.height)
    }

    // Try to match
    const match = findMatch(detection.descriptor)
    matchedEmployee = match ? { id: match.id, name: match.name } : null
  } else {
    faceDetected.value = false
    currentDescriptor = null
    matchedEmployee = null
  }
}

// Capture photo from video
const capturePhoto = (): string | null => {
  if (!videoRef.value) return null
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = videoRef.value.videoWidth
  tempCanvas.height = videoRef.value.videoHeight
  const ctx = tempCanvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(videoRef.value, 0, 0)
  return tempCanvas.toDataURL('image/jpeg', 0.8)
}

// Handle scan (check-in / check-out)
const handleScan = async (type: 'in' | 'out') => {
  if (!faceDetected.value || !currentDescriptor || processing.value) return

  errorMsg.value = ''
  result.value = null
  processing.value = true

  try {
    const match = matchedEmployee || findMatch(currentDescriptor)

    if (!match) {
      result.value = {
        success: false,
        message: 'Бет анықталмады. Жүйеде тіркелген қызметкер табылмады.',
      }
      return
    }

    const photo = capturePhoto()

    const response = await $fetch<{
      success: boolean
      employeeName?: string
      time?: string
      isLate?: boolean
      lateMinutes?: number
      overtimeMinutes?: number
      message?: string
    }>('/api/attendance/checkin', {
      method: 'POST',
      body: {
        employeeId: match.id,
        type,
        photo,
      },
    })

    result.value = {
      success: true,
      employeeName: response.employeeName || match.name,
      message: type === 'in' ? 'Сәтті тіркелді!' : 'Шығу сәтті тіркелді!',
      type,
      time: response.time || new Date().toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' }),
      isLate: response.isLate,
      lateMinutes: response.lateMinutes,
      overtimeMinutes: response.overtimeMinutes,
    }
  } catch (e: any) {
    result.value = {
      success: false,
      message: e.data?.statusMessage || e.message || 'Тіркеу кезінде қате пайда болды.',
    }
  } finally {
    processing.value = false
  }
}

// Auto-scan watcher
watch(autoScan, (enabled) => {
  if (autoScanInterval) {
    clearInterval(autoScanInterval)
    autoScanInterval = null
  }

  if (enabled) {
    autoCountdown.value = 5
    autoScanInterval = setInterval(() => {
      if (!faceDetected.value || processing.value) {
        autoCountdown.value = 5
        return
      }

      autoCountdown.value--

      if (autoCountdown.value <= 0) {
        handleScan('in')
        autoCountdown.value = 5
      }
    }, 1000)
  }
})

// Lifecycle
onMounted(async () => {
  await Promise.all([loadModels(), loadEmployees()])
  await startCamera()

  // Start detection loop
  detectionInterval = setInterval(detectFaces, 500)
})

onBeforeUnmount(() => {
  if (detectionInterval) clearInterval(detectionInterval)
  if (autoScanInterval) clearInterval(autoScanInterval)

  // Stop camera
  if (videoRef.value?.srcObject) {
    const tracks = (videoRef.value.srcObject as MediaStream).getTracks()
    tracks.forEach((track) => track.stop())
  }
})
</script>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  title: string
  content?: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  editable: false,
})

const emit = defineEmits<{
  (e: 'update:content', value: string): void
}>()

const localContent = ref(props.content)

watch(
  () => props.content,
  (val) => {
    localContent.value = val
  },
)

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  localContent.value = target.value
  emit('update:content', target.value)
}
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <p class="text-sm font-medium text-gray-500 mb-2">
      {{ title }}
    </p>

    <textarea
      v-if="editable"
      :value="localContent"
      class="w-full min-h-[100px] p-2 text-sm text-gray-700 border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-tamarindo-500 focus:border-transparent"
      placeholder="Enter text content..."
      @input="handleInput"
    />

    <div
      v-else
      class="text-sm text-gray-700 whitespace-pre-wrap"
    >
      {{ content || 'No content' }}
    </div>
  </div>
</template>

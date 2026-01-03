import { ref, watch } from 'vue'

interface HistoryState {
  widgets: any[]
  timestamp: number
}

const MAX_HISTORY_SIZE = 50

export function useEditorHistory(widgetsRef: Ref<any[]>) {
  const history = ref<HistoryState[]>([])
  const historyIndex = ref(-1)
  const isUndoRedoAction = ref(false)

  // Initialize with current state
  function initHistory() {
    history.value = [{
      widgets: JSON.parse(JSON.stringify(widgetsRef.value)),
      timestamp: Date.now(),
    }]
    historyIndex.value = 0
  }

  // Save current state to history
  function saveState() {
    if (isUndoRedoAction.value) {
      isUndoRedoAction.value = false
      return
    }

    // Remove any future states if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // Add new state
    history.value.push({
      widgets: JSON.parse(JSON.stringify(widgetsRef.value)),
      timestamp: Date.now(),
    })

    // Limit history size
    if (history.value.length > MAX_HISTORY_SIZE) {
      history.value.shift()
    }

    historyIndex.value = history.value.length - 1
  }

  // Undo to previous state
  function undo(): boolean {
    if (!canUndo.value) return false

    isUndoRedoAction.value = true
    historyIndex.value--
    widgetsRef.value = JSON.parse(JSON.stringify(history.value[historyIndex.value].widgets))
    return true
  }

  // Redo to next state
  function redo(): boolean {
    if (!canRedo.value) return false

    isUndoRedoAction.value = true
    historyIndex.value++
    widgetsRef.value = JSON.parse(JSON.stringify(history.value[historyIndex.value].widgets))
    return true
  }

  // Check if undo is available
  const canUndo = computed(() => historyIndex.value > 0)

  // Check if redo is available
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  // Keyboard shortcuts
  function handleKeyboard(event: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modifier = isMac ? event.metaKey : event.ctrlKey

    if (modifier && event.key === 'z') {
      event.preventDefault()
      if (event.shiftKey) {
        redo()
      }
      else {
        undo()
      }
    }

    if (modifier && event.key === 'y') {
      event.preventDefault()
      redo()
    }
  }

  // Setup keyboard listener
  function setupKeyboardShortcuts() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyboard)
    }
  }

  // Cleanup keyboard listener
  function cleanupKeyboardShortcuts() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyboard)
    }
  }

  return {
    history,
    historyIndex,
    canUndo,
    canRedo,
    initHistory,
    saveState,
    undo,
    redo,
    setupKeyboardShortcuts,
    cleanupKeyboardShortcuts,
  }
}

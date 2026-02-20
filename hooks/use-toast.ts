"use client"
import * as React from "react"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 3000

type ToasterToast = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  open?: boolean
}

type Action =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string }

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function addToRemoveQueue(toastId: string, dispatch: React.Dispatch<Action>) {
  if (toastTimeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: 'REMOVE_TOAST', toastId })
  }, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toastId, timeout)
}

function reducer(state: ToasterToast[], action: Action): ToasterToast[] {
  switch (action.type) {
    case 'ADD_TOAST':
      return [action.toast, ...state].slice(0, TOAST_LIMIT)
    case 'DISMISS_TOAST': {
      return state.map((t) =>
        t.id === action.toastId || action.toastId === undefined
          ? { ...t, open: false }
          : t
      )
    }
    case 'REMOVE_TOAST':
      return action.toastId === undefined ? [] : state.filter((t) => t.id !== action.toastId)
    default:
      return state
  }
}

const listeners: Array<(state: ToasterToast[]) => void> = []
let memoryState: ToasterToast[] = []

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

function toast(props: Omit<ToasterToast, 'id'>) {
  const id = genId()
  const update = (p: Partial<ToasterToast>) => dispatch({ type: 'ADD_TOAST', toast: { ...memoryState.find(t => t.id === id)!, ...p } })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })
  dispatch({ type: 'ADD_TOAST', toast: { ...props, id, open: true } })
  return { id, dismiss, update }
}

function useToast() {
  const [state, setState] = React.useState<ToasterToast[]>(memoryState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [state])

  return {
    toasts: state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast, toast }

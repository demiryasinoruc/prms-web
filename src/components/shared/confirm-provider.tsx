import { useEffect, useRef, useState } from "react"
import { registerConfirmListener, unregisterConfirmListener } from "@/lib/confirm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmState {
  open: boolean
  title: string
  description: string
}

export function ConfirmProvider() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
  })

  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  useEffect(() => {
    registerConfirmListener((options) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve
        setState({ open: true, ...options })
      })
    })
    return () => unregisterConfirmListener()
  }, [])

  const handleConfirm = () => {
    resolveRef.current?.(true)
    resolveRef.current = null
    setState((s) => ({ ...s, open: false }))
  }

  const handleCancel = () => {
    resolveRef.current?.(false)
    resolveRef.current = null
    setState((s) => ({ ...s, open: false }))
  }

  return (
    <AlertDialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) handleCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.title}</AlertDialogTitle>
          <AlertDialogDescription>{state.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

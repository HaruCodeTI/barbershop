"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface CrudDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  mode: "create" | "edit"
  onSubmit: (e: React.FormEvent) => Promise<void>
  children: React.ReactNode
  submitting: boolean
  submitLabel?: string
  cancelLabel?: string
}

export function CrudDialog({
  open,
  onOpenChange,
  title,
  description,
  mode,
  onSubmit,
  children,
  submitting,
  submitLabel,
  cancelLabel = "Cancelar",
}: CrudDialogProps) {
  const defaultSubmitLabel = mode === "create" ? "Criar" : "Atualizar"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(e)
          }}
          className="space-y-4"
        >
          {children}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="cursor-pointer"
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={submitting} className="cursor-pointer">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "create" ? "Criando..." : "Atualizando..."}
                </>
              ) : (
                submitLabel || defaultSubmitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

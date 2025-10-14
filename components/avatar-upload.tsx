"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, X } from "lucide-react"
import { uploadAvatar, deleteAvatar } from "@/lib/storage"
import { toast } from "sonner"

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  userName: string
  onUploadComplete?: (url: string) => void
  onDelete?: () => void
  size?: "sm" | "md" | "lg"
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  userName,
  onUploadComplete,
  onDelete,
  size = "md",
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)

    const result = await uploadAvatar(file, userId)

    if (result.success && result.url) {
      setAvatarUrl(result.url)
      toast.success("Avatar atualizado com sucesso!")
      onUploadComplete?.(result.url)
    } else {
      toast.error(result.error || "Erro ao fazer upload do avatar")
    }

    setUploading(false)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    const result = await deleteAvatar(userId)

    if (result.success) {
      setAvatarUrl(null)
      toast.success("Avatar removido com sucesso!")
      onDelete?.()
    } else {
      toast.error(result.error || "Erro ao remover avatar")
    }

    setDeleting(false)
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={avatarUrl || undefined} alt={userName} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        {(uploading || deleting) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || deleting}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || deleting}
        >
          <Camera className="h-4 w-4 mr-2" />
          {avatarUrl ? "Trocar foto" : "Adicionar foto"}
        </Button>

        {avatarUrl && (
          <Button type="button" variant="outline" size="sm" onClick={handleDelete} disabled={uploading || deleting}>
            <X className="h-4 w-4 mr-2" />
            Remover
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Formatos aceitos: JPEG, PNG, WebP
        <br />
        Tamanho máximo: 5MB
      </p>
    </div>
  )
}

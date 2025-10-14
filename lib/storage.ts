/**
 * Supabase Storage utilities for avatar uploads
 */

import { createClient } from "./supabase/client"

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Uploads an avatar image to Supabase Storage
 * Files are stored in: avatars/{userId}/{filename}
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  const supabase = createClient()

  try {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: "Tipo de arquivo inválido. Use JPEG, PNG ou WebP.",
      }
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "Arquivo muito grande. O tamanho máximo é 5MB.",
      }
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Delete old avatars for this user
    const { data: existingFiles } = await supabase.storage.from("avatars").list(userId)

    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles.map((f) => `${userId}/${f.name}`)
      await supabase.storage.from("avatars").remove(filesToRemove)
    }

    // Upload new avatar
    const { data, error } = await supabase.storage.from("avatars").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[uploadAvatar] Storage error:", error)
      return {
        success: false,
        error: `Erro ao fazer upload: ${error.message}`,
      }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
    }
  } catch (error) {
    console.error("[uploadAvatar] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

/**
 * Deletes an avatar image from Supabase Storage
 */
export async function deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data: files } = await supabase.storage.from("avatars").list(userId)

    if (files && files.length > 0) {
      const filesToRemove = files.map((f) => `${userId}/${f.name}`)
      const { error } = await supabase.storage.from("avatars").remove(filesToRemove)

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[deleteAvatar] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

/**
 * Gets the public URL for an avatar
 */
export function getAvatarUrl(filePath: string): string {
  const supabase = createClient()
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath)
  return publicUrl
}

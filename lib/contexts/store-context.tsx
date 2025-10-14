"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface Store {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  email: string | null
}

interface StoreContextType {
  store: Store | null
  loading: boolean
  error: string | null
  setStoreBySlug: (slug: string) => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

interface StoreProviderProps {
  children: ReactNode
  initialSlug?: string
}

export function StoreProvider({ children, initialSlug }: StoreProviderProps) {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setStoreBySlug = async (slug: string) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .single()

      if (fetchError) throw fetchError

      if (!data) {
        throw new Error(`Loja não encontrada com o slug: ${slug}`)
      }

      setStore(data as Store)

      // Save to localStorage for persistence
      localStorage.setItem("storeSlug", slug)
      localStorage.setItem("storeId", data.id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar loja"
      setError(errorMessage)
      console.error("[StoreContext] Error loading store:", err)
    } finally {
      setLoading(false)
    }
  }

  // Initialize store on mount
  useEffect(() => {
    const initializeStore = async () => {
      // Priority 1: Check URL for slug (e.g., /store/[slug])
      const pathParts = window.location.pathname.split("/")
      const storeIndex = pathParts.indexOf("store")
      const urlSlug = storeIndex !== -1 ? pathParts[storeIndex + 1] : null

      // Priority 2: Use initialSlug prop
      const slugToUse = urlSlug || initialSlug

      // Priority 3: Check localStorage
      const savedSlug = localStorage.getItem("storeSlug")

      // Priority 4: Check subdomain (optional for future)
      // const subdomain = window.location.hostname.split('.')[0]

      const finalSlug = slugToUse || savedSlug

      if (finalSlug) {
        await setStoreBySlug(finalSlug)
      } else {
        // No slug found - need to prompt user to select store
        setLoading(false)
        setError("Nenhuma loja selecionada")
      }
    }

    initializeStore()
  }, [initialSlug])

  return (
    <StoreContext.Provider value={{ store, loading, error, setStoreBySlug }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider")
  }
  return context
}

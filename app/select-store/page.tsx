"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Store, MapPin, Phone, Mail, Loader2, Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/hooks/use-store"

interface StoreOption {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  email: string | null
}

export default function SelectStorePage() {
  const router = useRouter()
  const { setStoreBySlug } = useStore()
  const [stores, setStores] = useState<StoreOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from("stores")
          .select("*")
          .order("name")

        if (fetchError) throw fetchError

        setStores(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar lojas")
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [])

  const handleSelectStore = async (slug: string) => {
    setSelecting(slug)
    setError("")

    try {
      await setStoreBySlug(slug)
      // Redirect to home page after selection
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao selecionar loja")
      setSelecting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background gradient-animated flex items-center justify-center">
        <div className="glass-intense rounded-2xl p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-white/70">Carregando lojas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background gradient-animated">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="flex justify-center mb-6">
              <div className="glass-intense rounded-full p-6 glow-primary-intense">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Selecione uma Unidade
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Escolha a unidade CortaAí mais próxima de você
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="glass-intense rounded-xl p-4 border border-red-500/30">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            </div>
          )}

          {/* Store Grid */}
          {stores.length === 0 ? (
            <div className="max-w-md mx-auto">
              <GlassCard>
                <GlassCardContent className="py-16 text-center">
                  <div className="glass-moderate rounded-full p-4 inline-flex mb-4">
                    <Store className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-white/70 text-lg">Nenhuma loja encontrada</p>
                </GlassCardContent>
              </GlassCard>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stores.map((store, index) => (
                <GlassCard
                  key={store.id}
                  className="group cursor-pointer transition-all duration-300"
                  onClick={() => handleSelectStore(store.slug)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <GlassCardHeader>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <GlassCardTitle className="text-xl md:text-2xl flex items-center gap-2">
                        <Store className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="break-words">{store.name}</span>
                      </GlassCardTitle>
                    </div>
                    <GlassCardDescription className="text-xs font-mono">
                      {store.slug}
                    </GlassCardDescription>
                  </GlassCardHeader>

                  <GlassCardContent className="space-y-3">
                    {/* Address */}
                    {store.address && (
                      <div className="flex items-start gap-3 text-white/70 p-3 glass-moderate rounded-lg">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                        <span className="text-sm leading-relaxed">{store.address}</span>
                      </div>
                    )}

                    {/* Phone */}
                    {store.phone && (
                      <div className="flex items-center gap-3 text-white/70 p-3 glass-moderate rounded-lg">
                        <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm">{store.phone}</span>
                      </div>
                    )}

                    {/* Email */}
                    {store.email && (
                      <div className="flex items-center gap-3 text-white/70 p-3 glass-moderate rounded-lg">
                        <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm truncate">{store.email}</span>
                      </div>
                    )}

                    {/* Select Button */}
                    <Button
                      className="w-full mt-4 bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 text-base py-6 rounded-xl font-semibold"
                      disabled={selecting === store.slug}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectStore(store.slug)
                      }}
                    >
                      {selecting === store.slug ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Selecionando...
                        </>
                      ) : (
                        "Selecionar Esta Unidade"
                      )}
                    </Button>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

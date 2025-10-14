"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Store, MapPin, Phone, Mail, Loader2 } from "lucide-react"
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando lojas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
                <Store className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Selecione uma Loja</h1>
            <p className="text-muted-foreground">
              Escolha a unidade GoBarber que deseja acessar
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {stores.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma loja encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <Card
                  key={store.id}
                  className="hover:border-primary transition-colors cursor-pointer"
                  onClick={() => handleSelectStore(store.slug)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {store.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      slug: {store.slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {store.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{store.address}</span>
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                    {store.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{store.email}</span>
                      </div>
                    )}
                    <Button
                      className="w-full mt-4"
                      disabled={selecting === store.slug}
                    >
                      {selecting === store.slug ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Selecionando...
                        </>
                      ) : (
                        "Selecionar Loja"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

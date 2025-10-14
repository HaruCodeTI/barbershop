"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/hooks/use-store"
import { toast } from "sonner"
import { getStoreSettings, updateStoreInfo } from "@/lib/store-settings"
import type { StoreSettings } from "@/types/manager"

export default function StoreSettingsPage() {
  const { store, setStoreBySlug } = useStore()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<StoreSettings>>({
    name: "",
    address: "",
    phone: "",
    email: "",
  })

  useEffect(() => {
    loadSettings()
  }, [store])

  const loadSettings = async () => {
    if (!store) return
    setLoading(true)

    const result = await getStoreSettings(store.id)
    if (result.success && result.data) {
      setFormData({
        name: result.data.name,
        address: result.data.address || "",
        phone: result.data.phone || "",
        email: result.data.email || "",
      })
    } else {
      toast.error(result.error || "Erro ao carregar configurações")
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return
    setSubmitting(true)

    const result = await updateStoreInfo(store.id, formData)
    if (result.success) {
      toast.success("Configurações atualizadas com sucesso!")
      // Reload store context
      if (store.slug) {
        await setStoreBySlug(store.slug)
      }
    } else {
      toast.error(result.error || "Erro ao atualizar configurações")
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/manager/dashboard" className="cursor-pointer">
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Configurações da Loja</h1>
                <p className="text-sm text-muted-foreground">Gerencie as informações básicas da sua loja</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
              <CardDescription>Atualize os dados de contato e localização</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Loja</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nome da sua barbearia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@loja.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loadSettings()}
                    disabled={submitting}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="cursor-pointer">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

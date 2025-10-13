"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Plus, Edit, Trash2, Star, Loader2, Power } from "lucide-react"
import {
  getBarbers,
  createBarber,
  updateBarber,
  deleteBarber,
  toggleBarberStatus,
  type Barber,
} from "@/lib/manager"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// TODO: Get from auth
const STORE_ID = "hobnkfghduuspsdvhkla"

export default function ManageBarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: "",
  })

  useEffect(() => {
    loadBarbers()
  }, [])

  const loadBarbers = async () => {
    setLoading(true)
    const result = await getBarbers(STORE_ID)

    if (result.success && result.barbers) {
      setBarbers(result.barbers)
    } else {
      toast.error(result.error || "Erro ao carregar barbeiros")
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    if (editingBarber) {
      // Update existing barber
      const result = await updateBarber(editingBarber.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        specialties: formData.specialties.split(",").map((s) => s.trim()),
      })

      if (result.success) {
        toast.success("Barbeiro atualizado com sucesso!")
        loadBarbers()
      } else {
        toast.error(result.error || "Erro ao atualizar barbeiro")
      }
    } else {
      // Create new barber
      const result = await createBarber(STORE_ID, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        specialties: formData.specialties.split(",").map((s) => s.trim()),
      })

      if (result.success) {
        toast.success("Barbeiro criado com sucesso!")
        loadBarbers()
      } else {
        toast.error(result.error || "Erro ao criar barbeiro")
      }
    }

    setSubmitting(false)
    setIsDialogOpen(false)
    setEditingBarber(null)
    setFormData({ name: "", email: "", phone: "", specialties: "" })
  }

  const handleEdit = (barber: Barber) => {
    setEditingBarber(barber)
    setFormData({
      name: barber.name,
      email: barber.email,
      phone: barber.phone || "",
      specialties: barber.specialties.join(", "),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deleteBarber(id)

    if (result.success) {
      toast.success("Barbeiro excluído com sucesso!")
      loadBarbers()
    } else {
      toast.error(result.error || "Erro ao excluir barbeiro")
    }
    setDeletingId(null)
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    const result = await toggleBarberStatus(id, !currentStatus)

    if (result.success) {
      toast.success(`Barbeiro ${!currentStatus ? "ativado" : "desativado"} com sucesso!`)
      loadBarbers()
    } else {
      toast.error(result.error || "Erro ao alterar status do barbeiro")
    }
    setTogglingId(null)
  }

  const handleAddNew = () => {
    setEditingBarber(null)
    setFormData({ name: "", email: "", phone: "", specialties: "" })
    setIsDialogOpen(true)
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
                <h1 className="text-xl font-bold text-foreground">Gerenciar Barbeiros</h1>
                <p className="text-sm text-muted-foreground">Adicionar, editar ou remover barbeiros</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Barbeiro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBarber ? "Editar Barbeiro" : "Adicionar Novo Barbeiro"}</DialogTitle>
                  <DialogDescription>
                    {editingBarber ? "Atualizar informações do barbeiro" : "Digite os detalhes do novo barbeiro"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      placeholder="João Silva"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="joao.silva@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (Opcional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
                    <Input
                      id="specialties"
                      placeholder="Degradê, Corte Clássico, Barba"
                      value={formData.specialties}
                      onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 cursor-pointer" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingBarber ? "Atualizando..." : "Criando..."}
                        </>
                      ) : (
                        <>{editingBarber ? "Atualizar" : "Adicionar"} Barbeiro</>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent cursor-pointer"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : barbers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum barbeiro cadastrado</p>
            <Button onClick={handleAddNew} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Barbeiro
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {barbers.map((barber) => (
            <Card key={barber.id} className={!barber.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={barber.avatar_url || "/placeholder.svg"} alt={barber.name} />
                      <AvatarFallback>
                        {barber.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{barber.name}</CardTitle>
                        {!barber.is_active && (
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500 text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{barber.rating}</span>
                        <span>({barber.total_reviews})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Especialidades</p>
                    <div className="flex flex-wrap gap-1">
                      {barber.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent cursor-pointer"
                        onClick={() => handleEdit(barber)}
                        disabled={deletingId === barber.id || togglingId === barber.id}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => handleDelete(barber.id)}
                        disabled={deletingId === barber.id || togglingId === barber.id}
                      >
                        {deletingId === barber.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </>
                        )}
                      </Button>
                    </div>
                    <Button
                      variant={barber.is_active ? "outline" : "default"}
                      size="sm"
                      className="w-full cursor-pointer"
                      onClick={() => handleToggle(barber.id, barber.is_active)}
                      disabled={deletingId === barber.id || togglingId === barber.id}
                    >
                      {togglingId === barber.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Power className="h-3 w-3 mr-1" />
                          {barber.is_active ? "Desativar" : "Ativar"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

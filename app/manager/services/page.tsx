"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Edit, Trash2, Clock, DollarSign, Loader2, Power } from "lucide-react"
import {
  getServices,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  type Service,
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

export default function ManageServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "",
    price: "",
    category: "haircut",
  })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    setLoading(true)
    const result = await getServices(STORE_ID)

    if (result.success && result.services) {
      setServices(result.services)
    } else {
      toast.error(result.error || "Erro ao carregar serviços")
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    if (editingService) {
      // Update existing service
      const result = await updateService(editingService.id, {
        name: formData.name,
        description: formData.description,
        duration: Number.parseInt(formData.duration),
        price: Number.parseInt(formData.price),
        category: formData.category,
      })

      if (result.success) {
        toast.success("Serviço atualizado com sucesso!")
        loadServices()
      } else {
        toast.error(result.error || "Erro ao atualizar serviço")
      }
    } else {
      // Create new service
      const result = await createService(STORE_ID, {
        name: formData.name,
        description: formData.description,
        duration: Number.parseInt(formData.duration),
        price: Number.parseInt(formData.price),
        category: formData.category,
      })

      if (result.success) {
        toast.success("Serviço criado com sucesso!")
        loadServices()
      } else {
        toast.error(result.error || "Erro ao criar serviço")
      }
    }

    setSubmitting(false)
    setIsDialogOpen(false)
    setEditingService(null)
    setFormData({ name: "", description: "", duration: "", price: "", category: "haircut" })
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration.toString(),
      price: service.price.toString(),
      category: service.category,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deleteService(id)

    if (result.success) {
      toast.success("Serviço excluído com sucesso!")
      loadServices()
    } else {
      toast.error(result.error || "Erro ao excluir serviço")
    }
    setDeletingId(null)
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    const result = await toggleServiceStatus(id, !currentStatus)

    if (result.success) {
      toast.success(`Serviço ${!currentStatus ? "ativado" : "desativado"} com sucesso!`)
      loadServices()
    } else {
      toast.error(result.error || "Erro ao alterar status do serviço")
    }
    setTogglingId(null)
  }

  const handleAddNew = () => {
    setEditingService(null)
    setFormData({ name: "", description: "", duration: "", price: "", category: "haircut" })
    setIsDialogOpen(true)
  }

  const categoryColors = {
    haircut: "bg-primary/10 text-primary",
    beard: "bg-secondary/10 text-secondary",
    combo: "bg-accent/10 text-accent",
    styling: "bg-destructive/10 text-destructive",
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
                <h1 className="text-xl font-bold text-foreground">Gerenciar Serviços</h1>
                <p className="text-sm text-muted-foreground">Adicionar, editar ou remover serviços</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingService ? "Editar Serviço" : "Adicionar Novo Serviço"}</DialogTitle>
                  <DialogDescription>
                    {editingService ? "Atualizar informações do serviço" : "Digite os detalhes do novo serviço"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Serviço</Label>
                    <Input
                      id="name"
                      placeholder="Corte Clássico"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Corte tradicional com tesoura e máquina"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duração (minutos)</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="30"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="35"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as Service["category"] })}
                    >
                      <option value="haircut">Corte</option>
                      <option value="beard">Barba</option>
                      <option value="combo">Combo</option>
                      <option value="styling">Finalização</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 cursor-pointer" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingService ? "Atualizando..." : "Criando..."}
                        </>
                      ) : (
                        <>{editingService ? "Atualizar" : "Adicionar"} Serviço</>
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
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado</p>
            <Button onClick={handleAddNew} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Serviço
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
            <Card key={service.id} className={!service.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {!service.is_active && (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">{service.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className={categoryColors[service.category]}>
                    {service.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{service.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <DollarSign className="h-4 w-4" />
                      <span>{service.price}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent cursor-pointer"
                        onClick={() => handleEdit(service)}
                        disabled={deletingId === service.id || togglingId === service.id}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id || togglingId === service.id}
                      >
                        {deletingId === service.id ? (
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
                      variant={service.is_active ? "outline" : "default"}
                      size="sm"
                      className="w-full cursor-pointer"
                      onClick={() => handleToggle(service.id, service.is_active)}
                      disabled={deletingId === service.id || togglingId === service.id}
                    >
                      {togglingId === service.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Power className="h-3 w-3 mr-1" />
                          {service.is_active ? "Desativar" : "Ativar"}
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

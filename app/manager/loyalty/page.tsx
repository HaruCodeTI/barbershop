"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Award, Gift, Users, TrendingUp, Edit, Loader2, Power } from "lucide-react"
import {
  getLoyaltyProgram,
  upsertLoyaltyProgram,
  toggleLoyaltyProgram,
  getLoyaltyStats,
  type LoyaltyProgram,
} from "@/lib/loyalty"
import Link from "next/link"
import { toast } from "sonner"
import { useStore } from "@/lib/hooks/use-store"

export default function LoyaltyPage() {
  const { store, loading: storeLoading } = useStore()
  const [program, setProgram] = useState<LoyaltyProgram | null>(null)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalPointsIssued: 0,
    totalPointsRedeemed: 0,
    averagePointsPerCustomer: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    points_per_real: 10,
    points_expiry_days: 365,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadProgram(), loadStats()])
    setLoading(false)
  }

  const loadProgram = async () => {
    if (!store) return
    const result = await getLoyaltyProgram(store.id)
    if (result.success && result.program) {
      setProgram(result.program)
      setFormData({
        name: result.program.name,
        description: result.program.description || "",
        points_per_real: result.program.points_per_real,
        points_expiry_days: result.program.points_expiry_days || 365,
      })
    } else if (!result.success) {
      toast.error(result.error || "Erro ao carregar programa")
    }
  }

  const loadStats = async () => {
    if (!store) return
    const result = await getLoyaltyStats(store.id)
    if (result.success && result.stats) {
      setStats(result.stats)
    } else {
      toast.error(result.error || "Erro ao carregar estatísticas")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) {
      toast.error("Loja não selecionada")
      return
    }
    setSubmitting(true)

    const result = await upsertLoyaltyProgram(store.id, {
      name: formData.name,
      description: formData.description || undefined,
      points_per_real: formData.points_per_real,
      points_expiry_days: formData.points_expiry_days || undefined,
    })

    if (result.success) {
      toast.success(program ? "Programa atualizado com sucesso!" : "Programa criado com sucesso!")
      loadProgram()
    } else {
      toast.error(result.error || "Erro ao salvar programa")
    }

    setSubmitting(false)
    setIsDialogOpen(false)
  }

  const handleToggleProgram = async () => {
    if (!program) return
    setToggling(true)

    const result = await toggleLoyaltyProgram(program.id, !program.is_active)
    if (result.success) {
      toast.success(`Programa ${!program.is_active ? "ativado" : "desativado"} com sucesso!`)
      loadProgram()
    } else {
      toast.error(result.error || "Erro ao alterar status")
    }

    setToggling(false)
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
                <h1 className="text-xl font-bold text-foreground">Programa de Fidelidade</h1>
                <p className="text-sm text-muted-foreground">Gerencie o programa de pontos e recompensas</p>
              </div>
            </div>
            {program && (
              <Button
                variant={program.is_active ? "outline" : "default"}
                onClick={handleToggleProgram}
                disabled={toggling}
                className="cursor-pointer"
              >
                {toggling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    {program.is_active ? "Desativar Programa" : "Ativar Programa"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid gap-6 mb-8 md:grid-cols-4">
              <Card className="transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString("pt-BR")}</div>
                  <p className="text-xs text-muted-foreground">Participantes do programa</p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeCustomers.toLocaleString("pt-BR")}</div>
                  <p className="text-xs text-muted-foreground">Últimos 90 dias</p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pontos Emitidos</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalPointsIssued.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">Total de pontos ganhos</p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pontos Resgatados</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.totalPointsRedeemed.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">Total de resgates</p>
                </CardContent>
              </Card>
            </div>

            {/* Program Configuration */}
            {program ? (
              <Card className="mb-8 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Configuração do Programa</CardTitle>
                      <CardDescription>Defina como os clientes ganham pontos</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Programa de Fidelidade</DialogTitle>
                          <DialogDescription>
                            Atualize as configurações do seu programa de pontos
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome do Programa</Label>
                            <Input
                              id="name"
                              placeholder="Programa de Fidelidade VIP"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Descrição (Opcional)</Label>
                            <Textarea
                              id="description"
                              placeholder="Descrição do programa"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={3}
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="points_per_real">Pontos por R$ 1,00</Label>
                              <Input
                                id="points_per_real"
                                type="number"
                                min="1"
                                max="1000"
                                placeholder="10"
                                value={formData.points_per_real}
                                onChange={(e) =>
                                  setFormData({ ...formData, points_per_real: Number(e.target.value) })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="points_expiry_days">Validade dos Pontos (dias)</Label>
                              <Input
                                id="points_expiry_days"
                                type="number"
                                min="0"
                                placeholder="365"
                                value={formData.points_expiry_days}
                                onChange={(e) =>
                                  setFormData({ ...formData, points_expiry_days: Number(e.target.value) })
                                }
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              className="flex-1 cursor-pointer"
                              disabled={submitting}
                            >
                              {submitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                "Salvar Alterações"
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
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-lg">{program.name}</p>
                        {program.description && (
                          <p className="text-sm text-muted-foreground">{program.description}</p>
                        )}
                      </div>
                      <Badge variant={program.is_active ? "default" : "secondary"}>
                        {program.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <Gift className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{program.points_per_real} pontos por R$ 1,00</p>
                        <p className="text-sm text-muted-foreground">Taxa de conversão de pontos</p>
                      </div>
                      {program.points_expiry_days && (
                        <div className="text-right">
                          <p className="font-semibold text-lg">{program.points_expiry_days} dias</p>
                          <p className="text-sm text-muted-foreground">Validade dos pontos</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Programa de Fidelidade</CardTitle>
                  <CardDescription>Crie um programa de pontos para seus clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Você ainda não tem um programa de fidelidade configurado
                    </p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="cursor-pointer">
                          <Gift className="h-4 w-4 mr-2" />
                          Criar Programa
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Programa de Fidelidade</DialogTitle>
                          <DialogDescription>
                            Configure como seus clientes ganharão pontos
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome do Programa</Label>
                            <Input
                              id="name"
                              placeholder="Programa de Fidelidade VIP"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Descrição (Opcional)</Label>
                            <Textarea
                              id="description"
                              placeholder="Descrição do programa"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={3}
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="points_per_real">Pontos por R$ 1,00</Label>
                              <Input
                                id="points_per_real"
                                type="number"
                                min="1"
                                max="1000"
                                placeholder="10"
                                value={formData.points_per_real}
                                onChange={(e) =>
                                  setFormData({ ...formData, points_per_real: Number(e.target.value) })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="points_expiry_days">Validade dos Pontos (dias)</Label>
                              <Input
                                id="points_expiry_days"
                                type="number"
                                min="0"
                                placeholder="365"
                                value={formData.points_expiry_days}
                                onChange={(e) =>
                                  setFormData({ ...formData, points_expiry_days: Number(e.target.value) })
                                }
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              className="flex-1 cursor-pointer"
                              disabled={submitting}
                            >
                              {submitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Criando...
                                </>
                              ) : (
                                "Criar Programa"
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
                </CardContent>
              </Card>
            )}

            {/* Information Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Como Funciona o Programa de Fidelidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold">Ganhe Pontos Automaticamente</p>
                      <p className="text-sm text-muted-foreground">
                        Sempre que um cliente finalizar um agendamento, ele ganha pontos automaticamente baseado no valor gasto
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-semibold">Sistema de Tiers</p>
                      <p className="text-sm text-muted-foreground">
                        Os clientes são categorizados em tiers (Bronze, Prata, Ouro, Diamante) baseado nos pontos acumulados
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-semibold">Resgate de Pontos</p>
                      <p className="text-sm text-muted-foreground">
                        Clientes podem usar seus pontos para obter descontos em futuros agendamentos
                      </p>
                    </div>
                  </div>
                  {program?.points_expiry_days && (
                    <div className="flex gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                        📅
                      </div>
                      <div>
                        <p className="font-semibold">Validade dos Pontos</p>
                        <p className="text-sm text-muted-foreground">
                          Os pontos expiram após {program.points_expiry_days} dias sem uso
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}

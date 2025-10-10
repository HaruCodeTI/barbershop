"use client"

import { useState } from "react"
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
import { Plus, Award, Gift, Users, TrendingUp, Edit, Trash2 } from "lucide-react"
import {
  mockLoyaltyProgram,
  mockLoyaltyRewards,
  mockCustomerLoyalty,
  type LoyaltyReward,
  type CustomerLoyalty,
} from "@/lib/mock-data"
import Link from "next/link"

export default function LoyaltyPage() {
  const [rewards, setRewards] = useState<LoyaltyReward[]>(mockLoyaltyRewards)
  const [customers] = useState<CustomerLoyalty[]>(mockCustomerLoyalty)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateReward = (formData: FormData) => {
    const newReward: LoyaltyReward = {
      id: `reward-${Date.now()}`,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      pointsCost: Number(formData.get("pointsCost")),
      discountType: formData.get("discountType") as "percentage" | "fixed",
      discountValue: Number(formData.get("discountValue")),
      active: true,
      storeId: "store-1",
    }
    setRewards([...rewards, newReward])
    setIsDialogOpen(false)
  }

  const handleToggleActive = (rewardId: string) => {
    setRewards(rewards.map((r) => (r.id === rewardId ? { ...r, active: !r.active } : r)))
  }

  const handleDelete = (rewardId: string) => {
    setRewards(rewards.filter((r) => r.id !== rewardId))
  }

  const totalPoints = customers.reduce((sum, c) => sum + c.points, 0)
  const totalCustomers = customers.length
  const avgPointsPerCustomer = totalCustomers > 0 ? totalPoints / totalCustomers : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Programa de Fidelidade</h1>
            </div>
            <Link href="/">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoints.toLocaleString("pt-BR")}</div>
              <p className="text-xs text-muted-foreground">Pontos em circulação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Participantes do programa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média de Pontos</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPointsPerCustomer.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Por cliente</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuração do Programa</CardTitle>
            <CardDescription>Defina como os clientes ganham pontos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{mockLoyaltyProgram.name}</p>
                  <p className="text-sm text-muted-foreground">{mockLoyaltyProgram.description}</p>
                </div>
                <Badge variant={mockLoyaltyProgram.active ? "default" : "secondary"}>
                  {mockLoyaltyProgram.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Gift className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold text-lg">{mockLoyaltyProgram.pointsPerReal} pontos por R$ 1,00</p>
                  <p className="text-sm text-muted-foreground">Taxa de conversão de pontos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Recompensas Disponíveis</h2>
            <p className="text-muted-foreground">Gerencie as recompensas que os clientes podem resgatar</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Recompensa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Recompensa</DialogTitle>
                <DialogDescription>Defina uma recompensa que os clientes podem resgatar com pontos</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleCreateReward(new FormData(e.currentTarget))
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Recompensa</Label>
                  <Input id="name" name="name" placeholder="Desconto de R$ 10" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" placeholder="Descrição da recompensa" required />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pointsCost">Custo em Pontos</Label>
                    <Input id="pointsCost" name="pointsCost" type="number" placeholder="100" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Tipo de Desconto</Label>
                    <select
                      id="discountType"
                      name="discountType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="fixed">Valor Fixo</option>
                      <option value="percentage">Porcentagem</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">Valor do Desconto</Label>
                  <Input id="discountValue" name="discountValue" type="number" placeholder="10" required />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Recompensa</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => (
            <Card key={reward.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                    <CardDescription>{reward.description}</CardDescription>
                  </div>
                  <Badge variant={reward.active ? "default" : "secondary"}>{reward.active ? "Ativo" : "Inativo"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg">{reward.pointsCost} pontos</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Desconto</p>
                      <p className="font-semibold text-success">
                        {reward.discountType === "percentage"
                          ? `${reward.discountValue}%`
                          : `R$ ${reward.discountValue}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch checked={reward.active} onCheckedChange={() => handleToggleActive(reward.id)} />
                      <Label className="text-sm">Ativo</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(reward.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clientes com Mais Pontos</CardTitle>
            <CardDescription>Ranking dos clientes mais fiéis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customers
                .sort((a, b) => b.points - a.points)
                .map((customer, index) => (
                  <div key={customer.customerId} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{customer.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.appointmentsCount} agendamentos • R$ {customer.totalSpent.toFixed(2)} gastos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{customer.points}</p>
                      <p className="text-sm text-muted-foreground">pontos</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

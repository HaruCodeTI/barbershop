"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Award, Gift, TrendingUp, Calendar, ArrowLeft } from "lucide-react"
import { mockLoyaltyProgram, mockLoyaltyRewards, mockCustomerLoyalty } from "@/lib/mock-data"
import Link from "next/link"

export default function CustomerLoyaltyPage() {
  // Mock current customer
  const customerLoyalty = mockCustomerLoyalty[0]
  const nextReward = mockLoyaltyRewards.find((r) => r.pointsCost > customerLoyalty.points)
  const pointsToNextReward = nextReward ? nextReward.pointsCost - customerLoyalty.points : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold text-foreground">Minha Fidelidade</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Seus Pontos</CardTitle>
            <CardDescription>Acumule pontos e troque por descontos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-5xl font-bold text-primary">{customerLoyalty.points}</p>
                <p className="text-muted-foreground">pontos disponíveis</p>
              </div>
              <Award className="h-16 w-16 text-primary opacity-50" />
            </div>

            {nextReward && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Próxima recompensa</span>
                  <span className="font-medium">
                    {pointsToNextReward} pontos restantes para {nextReward.name}
                  </span>
                </div>
                <Progress value={(customerLoyalty.points / nextReward.pointsCost) * 100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">R$ {customerLoyalty.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Em todos os agendamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerLoyalty.appointmentsCount}</div>
              <p className="text-xs text-muted-foreground">Visitas realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockLoyaltyProgram.pointsPerReal}x</div>
              <p className="text-xs text-muted-foreground">Pontos por real gasto</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Recompensas Disponíveis</h2>
          <p className="text-muted-foreground">Troque seus pontos por descontos exclusivos</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockLoyaltyRewards
            .filter((r) => r.active)
            .map((reward) => {
              const canRedeem = customerLoyalty.points >= reward.pointsCost
              return (
                <Card key={reward.id} className={canRedeem ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                        <CardDescription>{reward.description}</CardDescription>
                      </div>
                      {canRedeem && <Badge variant="default">Disponível</Badge>}
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
                          <p className="font-semibold text-success text-lg">
                            {reward.discountType === "percentage"
                              ? `${reward.discountValue}%`
                              : `R$ ${reward.discountValue}`}
                          </p>
                          <p className="text-xs text-muted-foreground">de desconto</p>
                        </div>
                      </div>

                      <Button className="w-full" disabled={!canRedeem}>
                        {canRedeem ? "Resgatar Agora" : `Faltam ${reward.pointsCost - customerLoyalty.points} pontos`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold">Ganhe Pontos</p>
                  <p className="text-sm text-muted-foreground">
                    Acumule {mockLoyaltyProgram.pointsPerReal} pontos para cada R$ 1,00 gasto em serviços
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold">Escolha sua Recompensa</p>
                  <p className="text-sm text-muted-foreground">
                    Navegue pelas recompensas disponíveis e escolha a que mais combina com você
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold">Resgate e Economize</p>
                  <p className="text-sm text-muted-foreground">
                    Use seus pontos para obter descontos no seu próximo agendamento
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

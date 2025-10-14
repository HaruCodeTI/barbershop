"use client"

import { Suspense, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Award, Gift, TrendingUp, Calendar, ArrowLeft, Loader2, AlertCircle, Crown } from "lucide-react"
import Link from "next/link"
import { getCustomerStats, type CustomerStats } from "@/lib/customer"
import { getCustomerLoyalty, getLoyaltyProgram, type CustomerLoyalty } from "@/lib/loyalty"
import { CustomerRecommendations } from "@/components/customer-recommendations"
import { useStore } from "@/lib/hooks/use-store"

function LoyaltyContent() {
  const { store, loading: storeLoading } = useStore()
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loyalty, setLoyalty] = useState<CustomerLoyalty | null>(null)
  const [pointsPerReal, setPointsPerReal] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  // TODO: Get customerId from auth context or localStorage
  const customerId = typeof window !== "undefined" ? localStorage.getItem("customerId") : null

  useEffect(() => {
    async function fetchData() {
      if (!customerId) {
        setError("Cliente não identificado. Por favor, faça login.")
        setLoading(false)
        return
      }

      if (!store) {
        setLoading(false)
        return
      }

      try {
        // Load customer stats and loyalty data in parallel
        const [statsResult, loyaltyResult, programResult] = await Promise.all([
          getCustomerStats(customerId),
          getCustomerLoyalty(customerId, store.id),
          getLoyaltyProgram(store.id),
        ])

        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats)
        } else {
          setError(statsResult.error || "Erro ao buscar estatísticas")
        }

        if (loyaltyResult.success && loyaltyResult.loyalty) {
          setLoyalty(loyaltyResult.loyalty)
        }

        if (programResult.success && programResult.program) {
          setPointsPerReal(programResult.program.points_per_real)
        }
      } catch (err) {
        setError("Erro ao carregar dados de fidelidade")
      }

      setLoading(false)
    }

    fetchData()
  }, [customerId, store])

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Loja Não Selecionada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Por favor, selecione uma loja primeiro.</p>
            <Link href="/select-store">
              <Button className="w-full">Selecionar Loja</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!customerId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Cliente Não Identificado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Você precisa estar logado para ver seu programa de fidelidade.</p>
            <Link href="/customer/services">
              <Button className="w-full">Fazer um Agendamento</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando programa de fidelidade...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button className="w-full cursor-pointer" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determine tier color
  const getTierColor = (tier: string | null) => {
    if (!tier) return "text-muted-foreground"
    switch (tier) {
      case "Diamante":
        return "text-cyan-500"
      case "Ouro":
        return "text-yellow-500"
      case "Prata":
        return "text-gray-400"
      case "Bronze":
        return "text-orange-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="cursor-pointer">
                <Button variant="ghost" size="icon" className="cursor-pointer">
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
        {/* Points Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Seus Pontos</CardTitle>
                <CardDescription>Acumule pontos e troque por descontos</CardDescription>
              </div>
              {loyalty?.tier && (
                <Badge variant="outline" className={`${getTierColor(loyalty.tier)} border-current text-lg px-3 py-1`}>
                  <Crown className="h-4 w-4 mr-1" />
                  {loyalty.tier}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-5xl font-bold text-primary">{loyalty?.total_points || 0}</p>
                <p className="text-muted-foreground">pontos disponíveis</p>
              </div>
              <Award className="h-16 w-16 text-primary opacity-50" />
            </div>

            {loyalty && loyalty.lifetime_points > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total acumulado na vida</span>
                  <span className="font-semibold text-lg">{loyalty.lifetime_points.toLocaleString("pt-BR")} pontos</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {stats.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Em todos os agendamentos</p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.appointmentsCount}</div>
              <p className="text-xs text-muted-foreground">Visitas realizadas</p>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pointsPerReal}x</div>
              <p className="text-xs text-muted-foreground">Pontos por real gasto</p>
            </CardContent>
          </Card>
        </div>

        {/* Favorite Barbers & Services */}
        {(stats.favoriteBarbers.length > 0 || stats.favoriteServices.length > 0) && (
          <div className="grid gap-6 mb-8 md:grid-cols-2">
            {stats.favoriteBarbers.length > 0 && (
              <Card className="transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Seus Barbeiros Favoritos</CardTitle>
                  <CardDescription>Baseado no seu histórico</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.favoriteBarbers.map((barber, index) => (
                      <div key={barber.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{barber.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{barber.count} visitas</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {stats.favoriteServices.length > 0 && (
              <Card className="transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Seus Serviços Favoritos</CardTitle>
                  <CardDescription>Serviços que você mais usa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.favoriteServices.map((service, index) => (
                      <div key={service.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{service.count}x</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Recommendations */}
        <div className="mb-8">
          <CustomerRecommendations customerId={customerId} variant="compact" />
        </div>

        {/* Transaction History */}
        {loyalty && loyalty.transactions.length > 0 && (
          <Card className="mb-8 transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle>Histórico de Pontos</CardTitle>
              <CardDescription>Suas últimas transações de fidelidade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loyalty.transactions.slice(0, 10).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          transaction.transaction_type === "earn"
                            ? "bg-green-500/20 text-green-600"
                            : transaction.transaction_type === "redeem"
                              ? "bg-orange-500/20 text-orange-600"
                              : "bg-gray-500/20 text-gray-600"
                        }`}
                      >
                        {transaction.transaction_type === "earn" ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : transaction.transaction_type === "redeem" ? (
                          <Gift className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {transaction.description ||
                            (transaction.transaction_type === "earn" ? "Pontos Ganhos" : "Pontos Resgatados")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          transaction.transaction_type === "earn"
                            ? "text-green-600"
                            : transaction.transaction_type === "redeem"
                              ? "text-orange-600"
                              : "text-gray-600"
                        }`}
                      >
                        {transaction.transaction_type === "earn" ? "+" : "-"}
                        {transaction.points}
                      </p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="transition-all hover:shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
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
                    Acumule {pointsPerReal} pontos para cada R$ 1,00 gasto em serviços
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold">Suba de Nível</p>
                  <p className="text-sm text-muted-foreground">
                    Acumule pontos e avance pelos tiers: Bronze (0+), Prata (200+), Ouro (500+), Diamante (1000+)
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
                    Use seus pontos para obter descontos em futuros agendamentos
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

export default function CustomerLoyaltyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      }
    >
      <LoyaltyContent />
    </Suspense>
  )
}

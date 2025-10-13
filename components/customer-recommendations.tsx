"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles, User, Clock, TrendingUp, Loader2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getCustomerRecommendations, type Recommendation } from "@/lib/customer"

interface CustomerRecommendationsProps {
  customerId: string
  variant?: "full" | "compact"
  showTitle?: boolean
  onBarberSelect?: (barberId: string) => void
  onServiceSelect?: (serviceId: string) => void
}

export function CustomerRecommendations({
  customerId,
  variant = "full",
  showTitle = true,
  onBarberSelect,
  onServiceSelect,
}: CustomerRecommendationsProps) {
  const [loading, setLoading] = useState(true)
  const [barbers, setBarbers] = useState<Recommendation[]>([])
  const [services, setServices] = useState<Recommendation[]>([])
  const [hasHistory, setHasHistory] = useState(true)

  useEffect(() => {
    async function fetchRecommendations() {
      const result = await getCustomerRecommendations(customerId)

      if (result.success && result.recommendations) {
        setBarbers(result.recommendations.barbers)
        setServices(result.recommendations.services)
        // Check if user has history based on score (< 70 means no history, using popular items)
        setHasHistory(result.recommendations.barbers.some((b) => b.score > 70))
      }

      setLoading(false)
    }

    fetchRecommendations()
  }, [customerId])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando recomendações...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (barbers.length === 0 && services.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Ainda não temos recomendações</h3>
          <p className="text-muted-foreground">Faça seu primeiro agendamento para receber sugestões personalizadas!</p>
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    return "text-amber-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-600 border-green-500/30"
    if (score >= 60) return "bg-blue-500/10 text-blue-600 border-blue-500/30"
    return "bg-amber-500/10 text-amber-600 border-amber-500/30"
  }

  if (variant === "compact") {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Recomendado para Você</CardTitle>
            </div>
            <CardDescription>
              {hasHistory ? "Baseado no seu histórico" : "Serviços e barbeiros populares"}
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {barbers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-foreground">Barbeiros</h4>
              <div className="space-y-2">
                {barbers.slice(0, 2).map((barber) => (
                  <div
                    key={barber.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onBarberSelect?.(barber.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={barber.avatar_url || undefined} alt={barber.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{barber.name}</p>
                        <p className="text-xs text-muted-foreground">{barber.reason}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-foreground">Serviços</h4>
              <div className="space-y-2">
                {services.slice(0, 2).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onServiceSelect?.(service.id)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-primary">R$ {service.price?.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{service.duration} min</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href="/customer/services">
            <Button className="w-full" variant="outline">
              Ver Todos os Serviços
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Full variant
  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Recomendado para Você</h2>
            <p className="text-muted-foreground">
              {hasHistory ? "Sugestões baseadas no seu histórico" : "Barbeiros e serviços populares"}
            </p>
          </div>
        </div>
      )}

      {/* Barbers Section */}
      {barbers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Barbeiros Recomendados</CardTitle>
            <CardDescription>Profissionais que combinam com suas preferências</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {barbers.map((barber) => (
                <Card key={barber.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Avatar className="h-20 w-20 mx-auto">
                        <AvatarImage src={barber.avatar_url || undefined} alt={barber.name} />
                        <AvatarFallback className="text-2xl">
                          <User className="h-10 w-10" />
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <h3 className="font-semibold text-lg">{barber.name}</h3>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <Badge variant="outline" className={getScoreBadge(barber.score)}>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {barber.score}% compatível
                          </Badge>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p className="flex items-center justify-center gap-1">
                          {hasHistory && barber.usageCount > 0 ? (
                            <>
                              <User className="h-3 w-3" />
                              {barber.reason}
                            </>
                          ) : (
                            barber.reason
                          )}
                        </p>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => onBarberSelect?.(barber.id)}
                        variant={barber.score >= 80 ? "default" : "outline"}
                      >
                        Agendar com {barber.name.split(" ")[0]}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Section */}
      {services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Serviços Recomendados</CardTitle>
            <CardDescription>Serviços que você já conhece e confia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{service.duration} minutos</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">R$ {service.price?.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getScoreBadge(service.score)}>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {service.score}% compatível
                        </Badge>
                        {hasHistory && service.usageCount > 0 && (
                          <span className="text-xs text-muted-foreground">{service.reason}</span>
                        )}
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => onServiceSelect?.(service.id)}
                        variant={service.score >= 80 ? "default" : "outline"}
                      >
                        Agendar Este Serviço
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

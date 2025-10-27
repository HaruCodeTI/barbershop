"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { GlassButton } from "@/components/ui/glass-button"
import { Badge } from "@/components/ui/badge"
import { GlassBadge } from "@/components/ui/glass-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles, User, Clock, TrendingUp, Loader2, ChevronRight, Star } from "lucide-react"
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
      <GlassCard className="animate-scale-in" variant="moderate">
        <GlassCardContent className="pt-12 pb-12">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <Loader2 className="h-10 w-10 text-primary animate-spin glow-primary" />
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-white/70">Carregando recomendações personalizadas...</p>
          </div>
        </GlassCardContent>
      </GlassCard>
    )
  }

  if (barbers.length === 0 && services.length === 0) {
    return (
      <GlassCard className="animate-scale-in glass-border-glow" variant="moderate">
        <GlassCardContent className="pt-12 pb-12 text-center space-y-4">
          <div className="relative inline-block">
            <div className="h-16 w-16 rounded-full glass-moderate flex items-center justify-center mx-auto border-2 border-primary/30">
              <Sparkles className="h-10 w-10 text-primary glow-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Ainda não temos recomendações</h3>
            <p className="text-white/70">Faça seu primeiro agendamento para receber sugestões personalizadas!</p>
          </div>
        </GlassCardContent>
      </GlassCard>
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
      <GlassCard className="animate-scale-in" variant="moderate">
        {showTitle && (
          <GlassCardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary glow-primary animate-pulse" />
              <GlassCardTitle>Recomendado para Você</GlassCardTitle>
            </div>
            <GlassCardDescription className="text-white/60">
              {hasHistory ? "Baseado no seu histórico" : "Serviços e barbeiros populares"}
            </GlassCardDescription>
          </GlassCardHeader>
        )}
        <GlassCardContent className="space-y-4">
          {barbers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-white flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Barbeiros
              </h4>
              <div className="space-y-2">
                {barbers.slice(0, 2).map((barber, index) => (
                  <div
                    key={barber.id}
                    className="flex items-center justify-between p-3 rounded-lg glass-subtle hover:glass-moderate border border-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                    onClick={() => onBarberSelect?.(barber.id)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                        <AvatarImage src={barber.avatar_url || undefined} alt={barber.name} />
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-white">{barber.name}</p>
                        <p className="text-xs text-white/60">{barber.reason}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Serviços
              </h4>
              <div className="space-y-2">
                {services.slice(0, 2).map((service, index) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 rounded-lg glass-subtle hover:glass-moderate border border-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                    onClick={() => onServiceSelect?.(service.id)}
                    style={{ animationDelay: `${(barbers.length + index) * 0.05}s` }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-white">{service.name}</p>
                      <p className="text-xs text-white/60">{service.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-primary">{service.price?.toFixed(2)}</p>
                      <p className="text-xs text-white/60">{service.duration} min</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href="/customer/services">
            <GlassButton className="w-full group" variant="glass-intense">
              <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
              Ver Todos os Serviços
            </GlassButton>
          </Link>
        </GlassCardContent>
      </GlassCard>
    )
  }

  // Full variant
  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center gap-3 animate-scale-in">
          <div className="relative">
            <Sparkles className="h-8 w-8 text-primary glow-primary animate-pulse" />
            <Star className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Recomendado para Você</h2>
            <p className="text-white/70">
              {hasHistory ? "Sugestões baseadas no seu histórico" : "Barbeiros e serviços populares"}
            </p>
          </div>
        </div>
      )}

      {/* Barbers Section */}
      {barbers.length > 0 && (
        <GlassCard className="animate-scale-in" variant="moderate" style={{ animationDelay: '0.1s' }}>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary glow-primary" />
              Barbeiros Recomendados
            </GlassCardTitle>
            <GlassCardDescription className="text-white/60">
              Profissionais que combinam com suas preferências
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {barbers.map((barber, index) => (
                <GlassCard
                  key={barber.id}
                  className="glass-hover-lift group animate-scale-in"
                  variant="subtle"
                  style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                >
                  <GlassCardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Avatar className="h-20 w-20 mx-auto ring-4 ring-primary/20 group-hover:ring-primary/50 transition-all">
                        <AvatarImage src={barber.avatar_url || undefined} alt={barber.name} />
                        <AvatarFallback className="text-2xl bg-primary/10">
                          <User className="h-10 w-10 text-primary" />
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <h3 className="font-semibold text-lg text-white">{barber.name}</h3>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <GlassBadge
                            variant={barber.score >= 80 ? "success" : barber.score >= 60 ? "primary" : "warning"}
                            className="animate-pulse"
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {barber.score}% compatível
                          </GlassBadge>
                        </div>
                      </div>

                      <div className="text-sm text-white/70">
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

                      <GlassButton
                        className="w-full group/btn"
                        onClick={() => onBarberSelect?.(barber.id)}
                        variant={barber.score >= 80 ? "primary" : "glass-intense"}
                      >
                        <User className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                        Agendar com {barber.name.split(" ")[0]}
                      </GlassButton>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Services Section */}
      {services.length > 0 && (
        <GlassCard className="animate-scale-in" variant="moderate" style={{ animationDelay: '0.2s' }}>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary glow-primary" />
              Serviços Recomendados
            </GlassCardTitle>
            <GlassCardDescription className="text-white/60">
              Serviços que você já conhece e confia
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {services.map((service, index) => (
                <GlassCard
                  key={service.id}
                  className="glass-hover-lift group animate-scale-in"
                  variant="subtle"
                  style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                >
                  <GlassCardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-white">{service.name}</h3>
                          <div className="flex items-center gap-2 mt-2 text-sm text-white/70">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{service.duration} minutos</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary glow-primary">
                            R$ {service.price?.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <GlassBadge
                          variant={service.score >= 80 ? "success" : service.score >= 60 ? "primary" : "warning"}
                          className="animate-pulse"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {service.score}% compatível
                        </GlassBadge>
                        {hasHistory && service.usageCount > 0 && (
                          <span className="text-xs text-white/60">{service.reason}</span>
                        )}
                      </div>

                      <GlassButton
                        className="w-full group/btn"
                        onClick={() => onServiceSelect?.(service.id)}
                        variant={service.score >= 80 ? "primary" : "glass-intense"}
                      >
                        <Sparkles className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
                        Agendar Este Serviço
                      </GlassButton>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Clock, MapPin, Phone, Loader2, Sparkles, Users, Scissors, Award, Navigation, Calendar } from "lucide-react"
import { getPublicStores, getPublicServices, getPublicBarbers } from "@/lib/public-data"
import type { PublicStore, PublicService, PublicBarber } from "@/lib/public-data"
import { CustomerHeader } from "@/components/customer-header"
import { CustomerLogin } from "@/components/customer-login"
import { CustomerRecommendations } from "@/components/customer-recommendations"
import { useAuth } from "@/lib/contexts/auth-context"
import type { Customer } from "@/lib/auth"
import { useEffect, useState } from "react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export default function HomePage() {
  const [stores, setStores] = useState<PublicStore[]>([])
  const [services, setServices] = useState<PublicService[]>([])
  const [barbers, setBarbers] = useState<PublicBarber[]>([])
  const [loading, setLoading] = useState(true)
  const { user, userType } = useAuth()

  useEffect(() => {
    async function fetchData() {
      const [storesResult, servicesResult, barbersResult] = await Promise.all([
        getPublicStores(),
        getPublicServices(undefined, 3),
        getPublicBarbers(),
      ])

      if (storesResult.success) setStores(storesResult.stores)
      if (servicesResult.success) setServices(servicesResult.services)
      if (barbersResult.success) setBarbers(barbersResult.barbers)

      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Enhanced Glassmorphism */}
      <header className="glass-subtle border-b border-primary/20 sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo with Glow Effect */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <Link href="/" className="block group relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                <img
                  src="/9.svg"
                  alt="GoBarber"
                  className="relative block md:hidden h-auto w-auto max-h-12 transition-all duration-300 group-hover:scale-110"
                />
                <img
                  src="/8.svg"
                  alt="GoBarber"
                  className="relative hidden md:block h-auto w-auto max-h-16 md:max-h-20 lg:max-h-24 transition-all duration-300 group-hover:scale-105"
                />
              </Link>
            </div>

            {/* Navigation - Hidden on mobile, shown on desktop */}
            <nav className="hidden lg:flex items-center gap-1 glass-moderate rounded-full px-2 py-1">
              <Link href="#servicos">
                <Button variant="ghost" size="sm" className="rounded-full hover:glass-intense transition-all duration-300 hover:scale-105">
                  <Scissors className="h-4 w-4 mr-2 text-primary" />
                  Serviços
                </Button>
              </Link>
              <Link href="#barbeiros">
                <Button variant="ghost" size="sm" className="rounded-full hover:glass-intense transition-all duration-300 hover:scale-105">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Barbeiros
                </Button>
              </Link>
              <Link href="#localizacao">
                <Button variant="ghost" size="sm" className="rounded-full hover:glass-intense transition-all duration-300 hover:scale-105">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  Localização
                </Button>
              </Link>
            </nav>

            <CustomerHeader />
          </div>
        </div>
      </header>

      {/* Hero Section with Animated Gradient */}
      <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center py-12 md:py-20 overflow-hidden">
        {/* Animated Gradient Background */}
        <div
          aria-hidden
          className="absolute inset-0 gradient-animated"
        />

        {/* Decorative Elements */}
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Content Container with Glass Effect */}
        <div className="relative container mx-auto px-4 text-center z-10">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white text-balance leading-tight">
              Experiência Premium em{' '}
              <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent animate-gradient">
                Barbearia
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto text-pretty leading-relaxed px-4">
              Agende seu horário com nossos barbeiros especialistas e experimente os melhores serviços de barbearia da cidade
            </p>

            {/* CTA Container with Glass Card */}
            <div className="glass-intense rounded-2xl p-6 md:p-8 max-w-md mx-auto glass-border-glow mt-8 md:mt-12">
              <Link href="/customer/services" className="block">
                <Button size="lg" className="w-full text-base md:text-lg px-6 md:px-8 py-4 md:py-6 bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 rounded-xl font-bold glow-primary">
                  Agende Seu Horário
                </Button>
              </Link>

              <div className="mt-6 flex items-center justify-center gap-6 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Disponível agora</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>5 min para confirmar</span>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-4 md:gap-8 mt-8 flex-wrap text-white/80 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 border-2 border-background" />
                  ))}
                </div>
                <span>+500 clientes satisfeitos</span>
              </div>
              <div className="flex items-center gap-1">
                {'★★★★★'.split('').map((star, i) => (
                  <span key={i} className="text-yellow-400 text-lg">{star}</span>
                ))}
                <span className="ml-1">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Recommendations (only for logged users) */}
      {user && userType === "customer" && (
        <section className="py-16 md:py-24 bg-gradient-to-b from-card to-background relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-20">
            <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="glass-moderate rounded-2xl p-6 md:p-8">
              <CustomerRecommendations customerId={(user as Customer).id} variant="full" />
            </div>
          </div>
        </section>
      )}

      {/* Featured Services */}
      <section id="servicos" className="py-16 md:py-24 bg-background relative overflow-hidden scroll-mt-20">
        {/* Background Decoration */}
        <div aria-hidden className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 glass-moderate rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-white">Serviços Premium</span>
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Nossos Serviços
            </h3>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Experiência completa de cuidados masculinos com profissionais especializados
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="glass-intense rounded-full p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          ) : services.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-3 mb-12" id="services-grid">
                {services.map((service, index) => (
                  <GlassCard
                    key={service.id}
                    className="group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <GlassCardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <GlassCardTitle className="text-xl md:text-2xl mb-2">
                            {service.name}
                          </GlassCardTitle>
                          <GlassCardDescription className="text-sm md:text-base">
                            {service.description}
                          </GlassCardDescription>
                        </div>
                        <div className="glass-moderate rounded-lg p-2 group-hover:glow-primary transition-all duration-300">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-white/70">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{service.duration} min</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-white/50 mb-1">A partir de</span>
                          <span className="text-2xl md:text-3xl font-bold text-primary">
                            R$ {Number(service.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                ))}
              </div>
              <div className="text-center">
                <Link href="/customer/services">
                  <Button
                    variant="outline"
                    size="lg"
                    className="glass-moderate border-primary/30 text-white hover:glass-intense hover:border-primary hover:scale-105 transition-all duration-300 px-8 py-6 text-base rounded-xl"
                  >
                    Ver Todos os Serviços
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="glass-moderate rounded-2xl p-8 max-w-md mx-auto">
                <p className="text-white/70">Nenhum serviço disponível no momento</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Our Barbers */}
      <section id="barbeiros" className="py-16 md:py-24 bg-gradient-to-b from-background to-card relative overflow-hidden scroll-mt-20">
        {/* Background Decoration */}
        <div aria-hidden className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 glass-moderate rounded-full px-4 py-2 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-white">Time Especializado</span>
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Conheça Nossos Barbeiros
            </h3>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Profissionais qualificados e apaixonados pela arte da barbearia
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="glass-intense rounded-full p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          ) : barbers.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {barbers.slice(0, 3).map((barber, index) => (
                <GlassCard
                  key={barber.id}
                  className="group text-center"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <GlassCardHeader className="pb-4">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                      <div className="relative">
                        <img
                          src={barber.avatar_url || "/placeholder.svg"}
                          alt={barber.name}
                          className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white/10 group-hover:border-primary/30 transition-all duration-300 group-hover:scale-105"
                        />
                        <div className="absolute bottom-2 right-2 glass-intense rounded-full p-2 border border-primary/30">
                          <Scissors className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </div>
                    <GlassCardTitle className="text-2xl md:text-3xl mb-2">
                      {barber.name}
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      <span className="glass-moderate px-3 py-1.5 text-primary text-xs font-medium rounded-full border border-primary/20">
                        <Award className="inline h-3 w-3 mr-1" />
                        Profissional
                      </span>
                      <span className="glass-moderate px-3 py-1.5 text-white/70 text-xs font-medium rounded-full">
                        Especialista
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">
                      Anos de experiência em cortes modernos e tradicionais
                    </p>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="glass-moderate rounded-2xl p-8 max-w-md mx-auto">
                <p className="text-white/70">Nenhum barbeiro disponível no momento</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Locations */}
      <section id="localizacao" className="py-16 md:py-24 bg-background relative overflow-hidden scroll-mt-20">
        {/* Background Decoration */}
        <div aria-hidden className="absolute inset-0 opacity-30">
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 glass-moderate rounded-full px-4 py-2 mb-4">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-white">Localização</span>
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Nossas Unidades
            </h3>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Encontre a unidade mais próxima de você
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="glass-intense rounded-full p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          ) : stores.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
              {stores.map((store, index) => (
                <GlassCard
                  key={store.id}
                  className="group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <GlassCardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <GlassCardTitle className="text-2xl md:text-3xl mb-2">
                          {store.name}
                        </GlassCardTitle>
                        <GlassCardDescription className="text-sm">
                          Unidade {store.name}
                        </GlassCardDescription>
                      </div>
                      <div className="glass-moderate rounded-full p-3 group-hover:glow-primary transition-all duration-300">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-4">
                    {store.address && (
                      <div className="flex items-start gap-3 text-white/70 p-3 glass-moderate rounded-lg">
                        <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                        <span className="text-sm leading-relaxed">{store.address}</span>
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center gap-3 text-white/70 p-3 glass-moderate rounded-lg">
                        <Phone className="h-5 w-5 flex-shrink-0 text-primary" />
                        <span className="text-sm">{store.phone}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Link href={`/customer/services?store=${store.slug}`} className="block">
                        <Button className="w-full bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 text-base py-6 rounded-xl font-semibold">
                          Agendar Nesta Unidade
                        </Button>
                      </Link>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="glass-moderate rounded-2xl p-8 max-w-md mx-auto">
                <p className="text-white/70">Nenhuma unidade disponível no momento</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer Enhanced */}
      <footer className="glass-subtle border-t border-primary/20 py-12 md:py-16 relative overflow-hidden">
        {/* Background Decorations */}
        <div aria-hidden className="absolute inset-0 opacity-20">
          <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
            {/* Brand & Description */}
            <div className="text-center md:text-left space-y-4">
              <div className="inline-block glass-moderate p-3 rounded-xl">
                <Scissors className="h-8 w-8 text-primary glow-primary" />
              </div>
              <div>
                <h4 className="text-white font-bold text-2xl mb-2">CortaAí</h4>
                <p className="text-white/70 text-sm leading-relaxed">
                  Experiência premium em barbearia. Profissionais qualificados e atendimento de excelência.
                </p>
              </div>
              {/* Quality Badge */}
              <div className="inline-flex items-center gap-2 glass-moderate px-4 py-2 rounded-full">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-xs text-white/80 font-semibold">Qualidade Garantida</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide flex items-center justify-center md:justify-start gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                Links Rápidos
              </h5>
              <div className="flex flex-col gap-3">
                <Link
                  href="/customer/services"
                  className="text-white/70 hover:text-primary text-sm transition-all duration-300 hover:translate-x-1 inline-flex items-center gap-2 group"
                >
                  <Scissors className="h-3 w-3 text-primary group-hover:rotate-12 transition-transform" />
                  Serviços
                </Link>
                <Link
                  href="/customer/appointments"
                  className="text-white/70 hover:text-primary text-sm transition-all duration-300 hover:translate-x-1 inline-flex items-center gap-2 group"
                >
                  <Calendar className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                  Agendamentos
                </Link>
                <Link
                  href="/customer/loyalty"
                  className="text-white/70 hover:text-primary text-sm transition-all duration-300 hover:translate-x-1 inline-flex items-center gap-2 group"
                >
                  <Award className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                  Fidelidade
                </Link>
                <Link
                  href="/login"
                  className="text-white/70 hover:text-primary text-sm transition-all duration-300 hover:translate-x-1 inline-flex items-center gap-2 group"
                >
                  <Users className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                  Área Staff
                </Link>
              </div>
            </div>

            {/* Horários */}
            <div className="text-center md:text-left">
              <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide flex items-center justify-center md:justify-start gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Horário
              </h5>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center glass-subtle p-3 rounded-lg">
                  <span className="text-white/70">Seg - Sex</span>
                  <span className="text-white font-semibold">09:00 - 20:00</span>
                </div>
                <div className="flex justify-between items-center glass-subtle p-3 rounded-lg">
                  <span className="text-white/70">Sábado</span>
                  <span className="text-white font-semibold">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center glass-subtle p-3 rounded-lg">
                  <span className="text-white/70">Domingo</span>
                  <span className="text-red-400 font-semibold">Fechado</span>
                </div>
              </div>
            </div>

            {/* Contact & Social */}
            <div className="text-center md:text-left">
              <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide flex items-center justify-center md:justify-start gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Contato
              </h5>
              <div className="space-y-3">
                <a
                  href="mailto:contato@cortaai.com"
                  className="flex items-center gap-3 text-white/70 hover:text-primary text-sm transition-colors duration-300 glass-subtle p-3 rounded-lg group hover:glass-moderate"
                >
                  <div className="glass-moderate p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span>contato@cortaai.com</span>
                </a>
                <a
                  href="tel:+5511999999999"
                  className="flex items-center gap-3 text-white/70 hover:text-primary text-sm transition-colors duration-300 glass-subtle p-3 rounded-lg group hover:glass-moderate"
                >
                  <div className="glass-moderate p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <span>(11) 9999-9999</span>
                </a>

                {/* Social Media */}
                <div className="flex items-center gap-2 justify-center md:justify-start pt-2">
                  <a
                    href="#"
                    className="glass-moderate hover:glass-intense p-3 rounded-lg transition-all duration-300 hover:scale-110 group"
                    aria-label="Instagram"
                  >
                    <svg className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="glass-moderate hover:glass-intense p-3 rounded-lg transition-all duration-300 hover:scale-110 group"
                    aria-label="Facebook"
                  >
                    <svg className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="glass-moderate hover:glass-intense p-3 rounded-lg transition-all duration-300 hover:scale-110 group"
                    aria-label="WhatsApp"
                  >
                    <svg className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright & Trust Badges */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-white/50 text-sm text-center md:text-left">
                &copy; 2025 CortaAí. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 glass-subtle px-4 py-2 rounded-full">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs text-white/70">Desenvolvido com Claude Code</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

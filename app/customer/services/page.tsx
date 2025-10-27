"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassBadge } from "@/components/ui/glass-badge"
import { GlassInput } from "@/components/ui/glass-input"
import { Scissors, Clock, ArrowLeft, Ticket, User, Star, TrendingUp, Edit, Sparkles } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/contexts/auth-context"
import type { Customer as AuthCustomer } from "@/lib/auth"

interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  category: string
}

interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number
  min_purchase: number
  is_active: boolean
  valid_from: string
  valid_until: string
  max_uses: number | null
  current_uses: number
}

interface Customer {
  id: string
  name: string
  phone: string
  loyalty_points: number
}

export default function ServiceSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userType, signOut } = useAuth()
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState("")
  const [showCustomerLogin, setShowCustomerLogin] = useState(true)
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerData, setCustomerData] = useState<Customer | null>(null)
  const [phoneError, setPhoneError] = useState("")

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [favoriteServices, setFavoriteServices] = useState<string[]>([])

  // Edit mode state
  const isEditMode = searchParams.get("editMode") === "true"
  const appointmentId = searchParams.get("appointmentId")

  // Check if user is logged in from AuthContext
  const isCustomerLoggedIn = user && userType === "customer"

  useEffect(() => {
    async function fetchServices() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })

      if (!error && data) {
        setServices(data)
      }
      setLoading(false)
    }

    fetchServices()
  }, [])

  // Check if customer is already logged in from AuthContext
  useEffect(() => {
    async function checkExistingCustomer() {
      // If logged in via AuthContext, use that data
      if (isCustomerLoggedIn) {
        const customer = user as AuthCustomer
        setCustomerData({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          loyalty_points: customer.loyalty_points,
        })
        setShowCustomerLogin(false)

        // Fetch customer's favorite services (most booked)
        const supabase = createClient()
        const { data: appointments } = await supabase
          .from("appointments")
          .select("appointment_services(service_id)")
          .eq("customer_id", customer.id)
          .eq("status", "completed")
          .limit(10)

        if (appointments) {
          const serviceIds = appointments.flatMap((apt: any) => apt.appointment_services.map((as: any) => as.service_id))
          const uniqueServices = [...new Set(serviceIds)]
          setFavoriteServices(uniqueServices.slice(0, 3))
          // Only auto-select services if NOT in edit mode
          if (!isEditMode) {
            setSelectedServices(uniqueServices.slice(0, 2))
          }
        }
      }
    }

    checkExistingCustomer()
  }, [isCustomerLoggedIn, user, isEditMode])

  // Load appointment data in edit mode
  useEffect(() => {
    if (isEditMode) {
      const serviceIds = searchParams.get("services")
      if (serviceIds) {
        setSelectedServices(serviceIds.split(","))
      }
    }
  }, [isEditMode, searchParams])

  const handleCustomerLogin = async () => {
    setPhoneError("")
    const cleanPhone = customerPhone.replace(/\D/g, "")

    if (cleanPhone.length < 10) {
      setPhoneError("Digite um telefone válido")
      return
    }

    const supabase = createClient()
    const { data: customer, error } = await supabase.from("customers").select("*").eq("phone", customerPhone).single()

    if (error || !customer) {
      setPhoneError("Cliente não encontrado. Continue como novo cliente.")
      return
    }

    setCustomerData(customer)
    setShowCustomerLogin(false)

    // Fetch customer's favorite services (most booked)
    const { data: appointments } = await supabase
      .from("appointments")
      .select("appointment_services(service_id)")
      .eq("customer_id", customer.id)
      .eq("status", "completed")
      .limit(10)

    if (appointments) {
      const serviceIds = appointments.flatMap((apt: any) => apt.appointment_services.map((as: any) => as.service_id))
      const uniqueServices = [...new Set(serviceIds)]
      setFavoriteServices(uniqueServices.slice(0, 3))
      setSelectedServices(uniqueServices.slice(0, 2))
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const selectedServiceObjects = services.filter((s) => selectedServices.includes(s.id))
  const totalDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duration, 0)
  const subtotal = selectedServiceObjects.reduce((sum, s) => sum + Number(s.price), 0)

  let discount = 0
  if (appliedCoupon) {
    if (subtotal >= appliedCoupon.min_purchase) {
      if (appliedCoupon.discount_type === "percentage") {
        discount = (subtotal * Number(appliedCoupon.discount_value)) / 100
      } else {
        discount = Number(appliedCoupon.discount_value)
      }
    }
  }
  const totalPrice = subtotal - discount

  const handleApplyCoupon = async () => {
    setCouponError("")
    const supabase = createClient()

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single()

    if (error || !coupon) {
      setCouponError("Cupom não encontrado ou inválido")
      return
    }

    // Check validity dates
    const now = new Date()
    const validFrom = new Date(coupon.valid_from)
    const validUntil = new Date(coupon.valid_until)

    if (now < validFrom || now > validUntil) {
      setCouponError("Cupom expirado ou ainda não válido")
      return
    }

    if (subtotal < coupon.min_purchase) {
      setCouponError(`Compra mínima de R$ ${coupon.min_purchase.toFixed(2)} necessária`)
      return
    }

    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      setCouponError("Cupom esgotado")
      return
    }

    setAppliedCoupon(coupon)
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
  }

  const handleContinue = () => {
    if (selectedServices.length > 0) {
      const params = new URLSearchParams({
        services: selectedServices.join(","),
        ...(appliedCoupon && { coupon: appliedCoupon.code }),
        ...(customerData && { customerId: customerData.id }),
        ...(isEditMode && appointmentId && { editMode: "true", appointmentId }),
        ...(isEditMode && {
          barberId: searchParams.get("barberId") || "",
          storeId: searchParams.get("storeId") || "",
        }),
      })
      router.push(`/customer/datetime?${params}`)
    }
  }

  const categories = [
    { id: "Corte", label: "Cortes", color: "bg-primary/20 text-primary border-primary/30" },
    { id: "Barba", label: "Barba", color: "bg-accent/20 text-accent border-accent/30" },
    { id: "Combo", label: "Combos", color: "bg-success/20 text-success border-success/30" },
    { id: "Tratamento", label: "Tratamento", color: "bg-warning/20 text-warning border-warning/30" },
  ]

  const recommendedServices = services.filter((s) => favoriteServices.includes(s.id))

  if (loading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="glass-intense rounded-2xl p-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Scissors className="relative h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          </div>
          <p className="text-white/70">Carregando serviços...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-subtle border-b border-primary/20 sticky top-0 z-10 transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="flex-shrink-0 glass-moderate hover:glass-intense rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="glass-moderate rounded-full p-2 glow-primary">
                <Scissors className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
              </div>
              <h1 className="text-lg md:text-xl font-bold text-white truncate">Selecionar Serviços</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isEditMode && (
          <GlassCard className="mb-8 border-blue-500/30">
            <GlassCardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full glass-moderate border border-blue-500/30">
                  <Edit className="h-6 w-6 text-blue-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Editando Agendamento</h3>
                  <p className="text-sm text-white/70">
                    Você pode alterar os serviços, data e hora do seu agendamento
                  </p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        {showCustomerLogin && !isEditMode && !isCustomerLoggedIn && (
          <GlassCard className="mb-8 glass-border-glow">
            <GlassCardHeader>
              <div className="flex items-center gap-3">
                <div className="glass-moderate rounded-full p-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <GlassCardTitle className="text-2xl">Já é nosso cliente?</GlassCardTitle>
                  <GlassCardDescription className="mt-1">
                    Identifique-se para receber recomendações personalizadas e usar seus pontos de fidelidade
                  </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <GlassInput
                    placeholder="Digite seu telefone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomerLogin()}
                  />
                  {phoneError && (
                    <p className="text-sm text-red-400 mt-2 ml-1">{phoneError}</p>
                  )}
                </div>
                <Button
                  onClick={handleCustomerLogin}
                  className="whitespace-nowrap bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 h-12"
                >
                  Identificar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCustomerLogin(false)}
                  className="whitespace-nowrap glass-moderate border-white/20 text-white hover:glass-intense hover:scale-105 transition-all duration-300 h-12"
                >
                  Continuar como novo cliente
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        {customerData && (
          <GlassCard className="mb-8 glow-primary glass-border-glow">
            <GlassCardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="glass-moderate rounded-full p-3">
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <GlassCardTitle className="flex items-center gap-2 text-2xl">
                      Bem-vindo de volta, {customerData.name.split(" ")[0]}!
                      <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 animate-pulse" />
                    </GlassCardTitle>
                    <GlassCardDescription className="mt-1">
                      Você tem {customerData.loyalty_points} pontos de fidelidade
                    </GlassCardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="glass-subtle hover:glass-moderate transition-all duration-300"
                  onClick={async () => {
                    // Fazer logout completo
                    await signOut()
                    // Limpar estado local
                    setCustomerData(null)
                    setShowCustomerLogin(true)
                    setSelectedServices([])
                    setFavoriteServices([])
                  }}
                >
                  Trocar cliente
                </Button>
              </div>
            </GlassCardHeader>
            {recommendedServices.length > 0 && (
              <GlassCardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      <p className="text-sm font-semibold text-white">Seus serviços favoritos:</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recommendedServices.map((service) => (
                        <GlassBadge
                          key={service.id}
                          variant="success"
                        >
                          <Star className="h-3 w-3 fill-current" />
                          {service.name}
                        </GlassBadge>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            )}
          </GlassCard>
        )}

        <div className="mb-8 text-center md:text-left">
          <h2 className="mb-3 text-3xl md:text-4xl font-bold text-white">Escolha Seus Serviços</h2>
          <p className="text-white/70 text-base md:text-lg">Selecione um ou mais serviços para seu agendamento</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 justify-center md:justify-start">
          {categories.map((cat) => {
            const count = services.filter((s) => s.category === cat.id).length
            return (
              <GlassBadge key={cat.id} variant={cat.id === "Corte" ? "primary" : "default"} className="text-sm px-4 py-2">
                {cat.label} ({count})
              </GlassBadge>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 w-full">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {services.map((service, index) => {
                const isSelected = selectedServices.includes(service.id)
                const isFavorite = favoriteServices.includes(service.id)
                return (
                  <GlassCard
                    key={service.id}
                    className={`cursor-pointer group relative ${
                      isSelected
                        ? "border-primary ring-2 ring-primary glow-primary"
                        : "glass-hover-lift"
                    }`}
                    onClick={() => toggleService(service.id)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {isFavorite && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="glass-moderate rounded-full p-1.5">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 animate-pulse" />
                        </div>
                      </div>
                    )}
                    <GlassCardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <GlassCardTitle className="text-xl">{service.name}</GlassCardTitle>
                        {isSelected && (
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <GlassCardDescription className="mt-2">{service.description}</GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-white/70">
                          <div className="glass-moderate rounded-full p-2">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{service.duration} min</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-white/50 mb-1">Valor</span>
                          <span className="text-2xl font-bold text-primary">
                            R$ {Number(service.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-1 w-full">
            <div className="lg:sticky lg:top-24">
              <GlassCard className="glass-border-glow w-full">
              <GlassCardHeader>
                <GlassCardTitle className="text-2xl">Resumo do Agendamento</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                {selectedServices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="glass-moderate rounded-full p-4 inline-flex mb-3">
                      <Scissors className="h-8 w-8 text-white/40" />
                    </div>
                    <p className="text-sm text-white/60">Nenhum serviço selecionado</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {selectedServiceObjects.map((service) => (
                        <div key={service.id} className="flex justify-between text-sm glass-moderate p-3 rounded-lg">
                          <span className="text-white font-medium">{service.name}</span>
                          <span className="text-primary font-bold">R$ {Number(service.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-6 space-y-3">
                      <Label htmlFor="coupon" className="text-sm font-semibold text-white flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-primary" />
                        Cupom de Desconto
                      </Label>
                      {!appliedCoupon ? (
                        <div className="flex gap-2">
                          <GlassInput
                            id="coupon"
                            placeholder="Digite o código"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={handleApplyCoupon}
                            disabled={!couponCode}
                            className="glass-moderate border-white/20 text-white hover:glass-intense hover:scale-105 transition-all duration-300"
                          >
                            Aplicar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 glass-moderate border border-green-500/30 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-green-400 animate-pulse" />
                            <span className="font-mono font-bold text-sm text-green-400">{appliedCoupon.code}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCoupon}
                            className="text-white/70 hover:text-white"
                          >
                            Remover
                          </Button>
                        </div>
                      )}
                      {couponError && (
                        <p className="text-sm text-red-400 ml-1">{couponError}</p>
                      )}
                    </div>

                    <div className="border-t border-white/10 pt-6 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Duração Total</span>
                        <span className="font-semibold text-white">{totalDuration} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Subtotal</span>
                        <span className="font-semibold text-white">R$ {subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">Desconto</span>
                          <span className="font-semibold text-green-400">- R$ {discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t border-white/10">
                        <span className="font-bold text-white text-base">Preço Total</span>
                        <span className="font-bold text-primary text-2xl">R$ {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full h-14 text-base bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-xl font-bold"
                      onClick={handleContinue}
                    >
                      {isEditMode ? (
                        <>
                          <Edit className="h-5 w-5 mr-2" />
                          Atualizar Agendamento
                        </>
                      ) : (
                        "Continuar para Data e Hora"
                      )}
                    </Button>
                  </>
                )}
              </GlassCardContent>
            </GlassCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

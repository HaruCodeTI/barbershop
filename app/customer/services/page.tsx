"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Scissors, Clock, ArrowLeft, Ticket, User, Star, TrendingUp, Edit } from "lucide-react"
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando serviços...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Scissors className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">Selecionar Serviços</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isEditMode && (
          <Card className="mb-8 border-blue-500/50 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Editando Agendamento</h3>
                  <p className="text-sm text-muted-foreground">
                    Você pode alterar os serviços, data e hora do seu agendamento
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showCustomerLogin && !isEditMode && !isCustomerLoggedIn && (
          <Card className="mb-8 border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Já é nosso cliente?</CardTitle>
              </div>
              <CardDescription>
                Identifique-se para receber recomendações personalizadas e usar seus pontos de fidelidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Digite seu telefone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomerLogin()}
                  />
                  {phoneError && <p className="text-sm text-destructive mt-1">{phoneError}</p>}
                </div>
                <Button onClick={handleCustomerLogin} className="whitespace-nowrap">
                  Identificar
                </Button>
                <Button variant="outline" onClick={() => setShowCustomerLogin(false)} className="whitespace-nowrap">
                  Continuar como novo cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {customerData && (
          <Card className="mb-8 bg-primary/5 border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Bem-vindo de volta, {customerData.name.split(" ")[0]}!
                    <Star className="h-5 w-5 text-warning fill-warning" />
                  </CardTitle>
                  <CardDescription>Você tem {customerData.loyalty_points} pontos de fidelidade</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
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
            </CardHeader>
            {recommendedServices.length > 0 && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <p className="text-sm font-medium">Seus serviços favoritos:</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recommendedServices.map((service) => (
                        <Badge
                          key={service.id}
                          variant="outline"
                          className="bg-success/10 text-success border-success/30"
                        >
                          {service.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-foreground">Escolha Seus Serviços</h2>
          <p className="text-muted-foreground">Selecione um ou mais serviços para seu agendamento</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = services.filter((s) => s.category === cat.id).length
            return (
              <Badge key={cat.id} variant="outline" className={cat.color}>
                {cat.label} ({count})
              </Badge>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => {
                const isSelected = selectedServices.includes(service.id)
                const isFavorite = favoriteServices.includes(service.id)
                return (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all relative ${
                      isSelected ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    {isFavorite && (
                      <div className="absolute top-2 right-2">
                        <Star className="h-5 w-5 text-warning fill-warning" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-success">
                          <span>R$ {Number(service.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumo do Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum serviço selecionado</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {selectedServiceObjects.map((service) => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span className="text-foreground">{service.name}</span>
                          <span className="text-success font-medium">R$ {Number(service.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <Label htmlFor="coupon" className="text-sm font-medium">
                        Cupom de Desconto
                      </Label>
                      {!appliedCoupon ? (
                        <div className="flex gap-2">
                          <Input
                            id="coupon"
                            placeholder="Digite o código"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          />
                          <Button variant="outline" onClick={handleApplyCoupon} disabled={!couponCode}>
                            Aplicar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-md">
                          <div className="flex items-center gap-2">
                            <Ticket className="h-4 w-4 text-success" />
                            <span className="font-mono font-semibold text-sm">{appliedCoupon.code}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                            Remover
                          </Button>
                        </div>
                      )}
                      {couponError && <p className="text-sm text-destructive">{couponError}</p>}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duração Total</span>
                        <span className="font-medium">{totalDuration} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-success">Desconto</span>
                          <span className="font-medium text-success">- R$ {discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Preço Total</span>
                        <span className="font-bold text-success text-lg">R$ {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button className="w-full" size="lg" onClick={handleContinue}>
                      {isEditMode ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Atualizar Agendamento
                        </>
                      ) : (
                        "Continuar para Data e Hora"
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin, Phone, Loader2 } from "lucide-react"
import { getPublicStores, getPublicServices, getPublicBarbers } from "@/lib/public-data"
import type { PublicStore, PublicService, PublicBarber } from "@/lib/public-data"
import { CustomerHeader } from "@/components/customer-header"
import { CustomerLogin } from "@/components/customer-login"
import { CustomerRecommendations } from "@/components/customer-recommendations"
import { useAuth } from "@/lib/contexts/auth-context"
import type { Customer } from "@/lib/auth"
import { useEffect, useState } from "react"

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
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <Link href="/" className="block">
                  <img
                    src="/9.svg"
                    alt="GoBarber"
                    className="block md:hidden h-auto w-auto max-h-14"
                  />

                  <img
                    src="/8.svg"
                    alt="GoBarber"
                    className="hidden md:block h-auto w-auto max-h-20 md:max-h-24 lg:max-h-28"
                  />
              </Link>
            </div>
            <CustomerHeader />
          </div>
        </div>
      </header>

      {/* Hero Section with background image */}
      <section className="relative py-20">
        {/* Background image (replace `/main.jpg` in the `public/` folder to change this) */}
        {/*
          - Place an image at `public/main.jpg` (or update the URL below).
          - Uses `bg-cover` so the image will cover the hero area responsively.
        */}
        <div
          aria-hidden
          className="absolute inset-0 bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url('/main.jpg')` }}
        />

        {/* Overlay for better text contrast */}
        <div aria-hidden className="absolute inset-0 bg-black/40" />

        <div className="relative container mx-auto px-4 text-center">
          <h2 className="mb-6 text-5xl font-bold text-white text-balance">Experiência Premium em Barbearia</h2>
          <p className="mb-8 text-xl text-white/90 max-w-2xl mx-auto text-pretty">
            Agende seu horário com nossos barbeiros especialistas e experimente os melhores serviços de barbearia da
            cidade
          </p>
          <Link href="/customer/services">
            <Button size="lg" className="text-lg px-8 py-6">
              Agende Seu Horário
            </Button>
          </Link>
        </div>
      </section>

      {/* Customer Section - Login or Recommendations */}
      {!user || userType !== "customer" ? (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <CustomerLogin />
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <CustomerRecommendations customerId={(user as Customer).id} variant="full" />
          </div>
        </section>
      )}

      {/* Featured Services */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h3 className="mb-8 text-3xl font-bold text-center text-foreground">Nossos Serviços</h3>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : services.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardHeader>
                      <CardTitle>{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration} min</span>
                        </div>
                        <span className="text-2xl font-bold text-primary">R$ {Number(service.price).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center">
                <Link href="/customer/services">
                  <Button variant="outline" size="lg">
                    Ver Todos os Serviços
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhum serviço disponível no momento</p>
          )}
        </div>
      </section>

      {/* Our Barbers */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h3 className="mb-8 text-3xl font-bold text-center text-foreground">Conheça Nossos Barbeiros</h3>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : barbers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {barbers.slice(0, 3).map((barber) => (
                <Card key={barber.id}>
                  <CardHeader className="text-center">
                    <img
                      src={barber.avatar_url || "/placeholder.svg"}
                      alt={barber.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <CardTitle>{barber.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                        Profissional
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhum barbeiro disponível no momento</p>
          )}
        </div>
      </section>

      {/* Locations */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h3 className="mb-8 text-3xl font-bold text-center text-foreground">Nossas Unidades</h3>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : stores.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {stores.map((store) => (
                <Card key={store.id}>
                  <CardHeader>
                    <CardTitle>{store.name}</CardTitle>
                    <CardDescription>Unidade {store.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {store.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>{store.address}</span>
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-5 w-5 flex-shrink-0" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Link href={`/customer/services?store=${store.slug}`}>
                        <Button className="w-full">Agendar Nesta Unidade</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhuma unidade disponível no momento</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 CortaAí. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

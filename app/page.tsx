"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Scissors, Clock, MapPin, Phone, Star } from "lucide-react"
import { mockStores, mockServices, mockBarbers } from "@/lib/mock-data"
import { CustomerHeader } from "@/components/customer-header"
import { CustomerLogin } from "@/components/customer-login"
import { CustomerRecommendations } from "@/components/customer-recommendations"
import { useEffect, useState } from "react"

export default function HomePage() {
  const featuredStore = mockStores[0]
  const featuredServices = mockServices.slice(0, 3)
  const [customerId, setCustomerId] = useState<string | null>(null)

  useEffect(() => {
    setCustomerId(localStorage.getItem("customerId"))
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
                    src="/logo-min.svg"
                    alt="GoBarber"
                    className="block md:hidden h-auto w-auto max-h-14"
                  />

                  <img
                    src="/logo.svg"
                    alt="GoBarber"
                    className="hidden md:block h-auto w-auto max-h-20 md:max-h-24 lg:max-h-28"
                  />
              </Link>
            </div>
            <CustomerHeader customerId={customerId} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-card to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-5xl font-bold text-foreground text-balance">Experiência Premium em Barbearia</h2>
          <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
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
      {!customerId ? (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <CustomerLogin onSuccess={() => setCustomerId(localStorage.getItem("customerId"))} />
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <CustomerRecommendations customerId={customerId} variant="full" />
          </div>
        </section>
      )}

      {/* Featured Services */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h3 className="mb-8 text-3xl font-bold text-center text-foreground">Nossos Serviços</h3>
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {featuredServices.map((service) => (
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
                    <span className="text-2xl font-bold text-primary">R$ {service.price}</span>
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
        </div>
      </section>

      {/* Our Barbers */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h3 className="mb-8 text-3xl font-bold text-center text-foreground">Conheça Nossos Barbeiros</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {mockBarbers.map((barber) => (
              <Card key={barber.id}>
                <CardHeader className="text-center">
                  <img
                    src={barber.avatar || "/placeholder.svg"}
                    alt={barber.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4"
                  />
                  <CardTitle>{barber.name}</CardTitle>
                  <div className="flex items-center justify-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold">{barber.rating}</span>
                    <span className="text-muted-foreground text-sm">({barber.totalReviews})</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {barber.specialties.map((specialty) => (
                      <span key={specialty} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h3 className="mb-8 text-3xl font-bold text-center text-foreground">Nossas Unidades</h3>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {mockStores.map((store) => (
              <Card key={store.id}>
                <CardHeader>
                  <CardTitle>{store.name}</CardTitle>
                  <CardDescription>{store.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-5 w-5 flex-shrink-0" />
                    <span>{store.phone}</span>
                  </div>
                  <div className="pt-2">
                    <Link href={`/customer/services?store=${store.slug}`}>
                      <Button className="w-full">Agendar Nesta Unidade</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 GoBarber. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

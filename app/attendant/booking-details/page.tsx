"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, Scissors, CheckCircle2, XCircle } from "lucide-react"
import { mockAppointments, mockServices, mockBarbers } from "@/lib/mock-data"
import Link from "next/link"

function BookingDetailsContent() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("id")

  // In a real app, fetch appointment by ID
  const appointment = mockAppointments[0]
  const services = mockServices.filter((s) => appointment.serviceIds.includes(s.id))
  const barber = mockBarbers.find((b) => b.id === appointment.barberId)

  const statusColors = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500",
    confirmed: "bg-primary/10 text-primary border-primary",
    completed: "bg-green-500/10 text-green-500 border-green-500",
    cancelled: "bg-destructive/10 text-destructive border-destructive",
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/attendant/availability">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Booking Details</h1>
              <p className="text-sm text-muted-foreground">Appointment #{appointment.id}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Scissors className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{appointment.customerName}</h2>
                    <p className="text-sm text-muted-foreground">Booking Reference: {appointment.id}</p>
                  </div>
                </div>
                <Badge variant="outline" className={statusColors[appointment.status]}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Name</p>
                    <p className="text-sm text-muted-foreground">{appointment.customerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Phone</p>
                    <p className="text-sm text-muted-foreground">{appointment.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">customer@example.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Barber</p>
                    <p className="text-sm text-muted-foreground">{barber?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.time} ({appointment.duration} minutes)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.duration} minutes</p>
                    </div>
                    <p className="font-semibold text-primary">${service.price}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t">
                  <p className="font-bold text-foreground">Total</p>
                  <p className="font-bold text-primary text-lg">${appointment.price}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {appointment.status === "pending" && (
            <div className="flex gap-4">
              <Button className="flex-1" size="lg">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Booking
              </Button>
              <Button variant="destructive" className="flex-1" size="lg">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Booking
              </Button>
            </div>
          )}

          {appointment.status === "confirmed" && (
            <div className="flex gap-4">
              <Button className="flex-1" size="lg">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" size="lg">
                Reschedule
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function BookingDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingDetailsContent />
    </Suspense>
  )
}

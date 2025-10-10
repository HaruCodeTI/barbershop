"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, DollarSign, ChevronLeft, ChevronRight, Phone } from "lucide-react"
import { mockAppointments, mockServices } from "@/lib/mock-data"
import Link from "next/link"

export default function BarberDailySummaryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Filter appointments for selected barber and date
  const barberId = "1" // In real app, get from auth
  const todayAppointments = mockAppointments.filter(
    (apt) => apt.barberId === barberId && new Date(apt.date).toDateString() === selectedDate.toDateString(),
  )

  const totalRevenue = todayAppointments.reduce((sum, apt) => sum + apt.price, 0)
  const totalDuration = todayAppointments.reduce((sum, apt) => sum + apt.duration, 0)
  const completedCount = todayAppointments.filter((apt) => apt.status === "completed").length

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Daily Summary</h1>
                <p className="text-sm text-muted-foreground">Marcus Johnson</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/barber/week-overview">
                <Button variant="outline" className="bg-transparent">
                  Week View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Date Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="bg-transparent">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                </h2>
                <p className="text-muted-foreground">
                  {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={() => changeDate(1)} className="bg-transparent">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{todayAppointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{completedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{(totalDuration / 60).toFixed(1)}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">${totalRevenue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>Your schedule for {selectedDate.toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appointment) => {
                    const services = mockServices.filter((s) => appointment.serviceIds.includes(s.id))
                    return (
                      <div
                        key={appointment.id}
                        className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-primary" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{appointment.customerName}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Phone className="h-3 w-3" />
                                {appointment.customerPhone}
                              </div>
                            </div>
                            <Badge variant="outline" className={statusColors[appointment.status]}>
                              {appointment.status}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.time} ({appointment.duration} min)
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />${appointment.price}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {services.map((service) => (
                              <Badge key={service.id} variant="secondary">
                                {service.name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {appointment.status === "confirmed" && <Button size="sm">Mark Complete</Button>}
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function BarberWeekOverviewPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    return new Date(today.setDate(diff))
  })

  const barberId = "1" // In real app, get from auth

  const getWeekDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      days.push(date)
    }
    return days
  }

  const weekDays = getWeekDays()

  const changeWeek = (weeks: number) => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + weeks * 7)
    setCurrentWeekStart(newDate)
  }

  const getAppointmentsForDay = (date: Date) => {
    return mockAppointments.filter(
      (apt) => apt.barberId === barberId && new Date(apt.date).toDateString() === date.toDateString(),
    )
  }

  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${minute}`
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/barber/daily-summary">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Week Overview</h1>
                <p className="text-sm text-muted-foreground">Marcus Johnson</p>
              </div>
            </div>
            <Link href="/barber/time-blocking">
              <Button variant="outline" className="bg-transparent">
                Manage Availability
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Week Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => changeWeek(-1)} className="bg-transparent">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">
                  {weekDays[0].toLocaleDateString("en-US", { month: "long", day: "numeric" })} -{" "}
                  {weekDays[6].toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </h2>
              </div>
              <Button variant="outline" size="icon" onClick={() => changeWeek(1)} className="bg-transparent">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Week Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {weekDays.slice(0, 7).map((day) => {
            const appointments = getAppointmentsForDay(day)
            const revenue = appointments.reduce((sum, apt) => sum + apt.price, 0)
            const isToday = day.toDateString() === new Date().toDateString()

            return (
              <Card key={day.toISOString()} className={cn(isToday && "border-primary")}>
                <CardHeader className="pb-3">
                  <CardDescription className={cn(isToday && "text-primary font-semibold")}>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </CardDescription>
                  <CardTitle className="text-lg">
                    {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Appointments</span>
                      <span className="font-semibold">{appointments.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-semibold text-primary">${revenue}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Week Schedule Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Your appointments for the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header */}
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="font-semibold text-sm text-muted-foreground">Time</div>
                  {weekDays.map((day) => {
                    const isToday = day.toDateString() === new Date().toDateString()
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "font-semibold text-sm text-center",
                          isToday ? "text-primary" : "text-foreground",
                        )}
                      >
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {day.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Time Slots */}
                <div className="space-y-1">
                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-8 gap-2">
                      <div className="flex items-center text-xs font-medium text-muted-foreground">{time}</div>
                      {weekDays.map((day) => {
                        const appointments = getAppointmentsForDay(day)
                        const appointment = appointments.find((apt) => apt.time === time)

                        return (
                          <div
                            key={`${day.toISOString()}-${time}`}
                            className={cn(
                              "h-8 rounded border text-xs flex items-center justify-center",
                              appointment
                                ? "bg-primary/10 border-primary text-primary font-medium cursor-pointer hover:bg-primary/20"
                                : "bg-muted/30 border-muted",
                            )}
                          >
                            {appointment && appointment.customerName.split(" ")[0]}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ArrowLeft, Plus, CalendarIcon } from "lucide-react"
import { generateBarberAvailability, mockBarbers } from "@/lib/mock-data"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function AttendantAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ barberId: string; time: string } | null>(null)

  const availability = generateBarberAvailability(selectedDate)

  const timeSlots = availability[0]?.slots.map((s) => s.time) || []

  const handleSlotClick = (barberId: string, time: string, status: string) => {
    if (status === "available") {
      setSelectedSlot({ barberId, time })
    }
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
                <h1 className="text-xl font-bold text-foreground">Availability Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage barber schedules and bookings</p>
              </div>
            </div>
            <Link href="/attendant/create-booking">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Date Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-primary" />
                    <span className="text-sm text-muted-foreground">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-destructive" />
                    <span className="text-sm text-muted-foreground">Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-muted" />
                    <span className="text-sm text-muted-foreground">Blocked</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Availability Grid */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </CardTitle>
                <CardDescription>Click on available slots to create a booking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* Header Row */}
                    <div className="grid grid-cols-[120px_repeat(3,1fr)] gap-2 mb-2">
                      <div className="font-semibold text-sm text-muted-foreground">Time</div>
                      {mockBarbers.map((barber) => (
                        <div key={barber.id} className="font-semibold text-sm text-center text-foreground">
                          {barber.name}
                        </div>
                      ))}
                    </div>

                    {/* Time Slots Grid */}
                    <div className="space-y-2">
                      {timeSlots.map((time) => (
                        <div key={time} className="grid grid-cols-[120px_repeat(3,1fr)] gap-2">
                          <div className="flex items-center text-sm font-medium text-muted-foreground">{time}</div>
                          {availability.map((barberAvail) => {
                            const slot = barberAvail.slots.find((s) => s.time === time)
                            if (!slot) return null

                            return (
                              <button
                                key={`${barberAvail.barberId}-${time}`}
                                onClick={() => handleSlotClick(barberAvail.barberId, time, slot.status)}
                                className={cn(
                                  "h-12 rounded-md border-2 transition-all text-xs font-medium",
                                  slot.status === "available" &&
                                    "bg-primary/10 border-primary hover:bg-primary/20 cursor-pointer",
                                  slot.status === "booked" && "bg-destructive/10 border-destructive cursor-not-allowed",
                                  slot.status === "blocked" && "bg-muted border-muted cursor-not-allowed",
                                  selectedSlot?.barberId === barberAvail.barberId &&
                                    selectedSlot?.time === time &&
                                    "ring-2 ring-primary",
                                )}
                                disabled={slot.status !== "available"}
                              >
                                {slot.status === "available" && "Available"}
                                {slot.status === "booked" && "Booked"}
                                {slot.status === "blocked" && "Blocked"}
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedSlot && (
                  <div className="mt-6 p-4 bg-primary/5 border border-primary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Selected Slot</p>
                        <p className="text-sm text-muted-foreground">
                          {mockBarbers.find((b) => b.id === selectedSlot.barberId)?.name} at {selectedSlot.time}
                        </p>
                      </div>
                      <Link
                        href={`/attendant/create-booking?barber=${selectedSlot.barberId}&date=${selectedDate.toISOString()}&time=${selectedSlot.time}`}
                      >
                        <Button>Create Booking</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

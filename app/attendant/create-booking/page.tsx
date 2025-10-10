"use client"

import type React from "react"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, User, Mail, Phone, Clock, DollarSign } from "lucide-react"
import { mockServices, mockBarbers } from "@/lib/mock-data"
import Link from "next/link"

function CreateBookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const preselectedBarber = searchParams.get("barber") || ""
  const preselectedDate = searchParams.get("date") || ""
  const preselectedTime = searchParams.get("time") || ""

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    barberId: preselectedBarber,
    date: preselectedDate ? new Date(preselectedDate).toISOString().split("T")[0] : "",
    time: preselectedTime,
    serviceIds: [] as string[],
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedServices = mockServices.filter((s) => formData.serviceIds.includes(s.id))
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) newErrors.customerName = "Customer name is required"
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Invalid email format"
    }
    if (!formData.customerPhone.trim()) newErrors.customerPhone = "Phone number is required"
    if (!formData.barberId) newErrors.barberId = "Please select a barber"
    if (!formData.date) newErrors.date = "Please select a date"
    if (!formData.time) newErrors.time = "Please select a time"
    if (formData.serviceIds.length === 0) newErrors.serviceIds = "Please select at least one service"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // In a real app, this would save to database
      router.push("/attendant/booking-details?id=new-booking")
    }
  }

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
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
              <h1 className="text-xl font-bold text-foreground">Create New Booking</h1>
              <p className="text-sm text-muted-foreground">Fill in the details to create an appointment</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                  <CardDescription>Enter the customer's contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customerName"
                        placeholder="John Doe"
                        className="pl-10"
                        value={formData.customerName}
                        onChange={(e) => handleChange("customerName", e.target.value)}
                      />
                    </div>
                    {errors.customerName && <p className="text-sm text-destructive">{errors.customerName}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customerEmail"
                          type="email"
                          placeholder="john@example.com"
                          className="pl-10"
                          value={formData.customerEmail}
                          onChange={(e) => handleChange("customerEmail", e.target.value)}
                        />
                      </div>
                      {errors.customerEmail && <p className="text-sm text-destructive">{errors.customerEmail}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customerPhone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          className="pl-10"
                          value={formData.customerPhone}
                          onChange={(e) => handleChange("customerPhone", e.target.value)}
                        />
                      </div>
                      {errors.customerPhone && <p className="text-sm text-destructive">{errors.customerPhone}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Details</CardTitle>
                  <CardDescription>Select barber, date, and time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="barberId">Barber</Label>
                    <select
                      id="barberId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.barberId}
                      onChange={(e) => handleChange("barberId", e.target.value)}
                    >
                      <option value="">Select a barber</option>
                      {mockBarbers.map((barber) => (
                        <option key={barber.id} value={barber.id}>
                          {barber.name}
                        </option>
                      ))}
                    </select>
                    {errors.barberId && <p className="text-sm text-destructive">{errors.barberId}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleChange("date", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                      {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleChange("time", e.target.value)}
                      />
                      {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Services</CardTitle>
                  <CardDescription>Choose one or more services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={formData.serviceIds.includes(service.id)}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`service-${service.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {service.name}
                          </label>
                          <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.duration} min
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {service.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.serviceIds && <p className="text-sm text-destructive mt-2">{errors.serviceIds}</p>}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                  <CardDescription>Any special requests or information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter any special requests or notes..."
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.customerName && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-foreground">Customer</h4>
                      <p className="text-sm text-muted-foreground">{formData.customerName}</p>
                    </div>
                  )}

                  {formData.barberId && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-foreground">Barber</h4>
                      <p className="text-sm text-muted-foreground">
                        {mockBarbers.find((b) => b.id === formData.barberId)?.name}
                      </p>
                    </div>
                  )}

                  {formData.date && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-foreground">Date & Time</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(formData.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {formData.time && ` at ${formData.time}`}
                      </p>
                    </div>
                  )}

                  {selectedServices.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-foreground">Services</h4>
                      <div className="space-y-1">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{service.name}</span>
                            <span className="text-foreground">${service.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedServices.length > 0 && (
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{totalDuration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-primary text-lg">${totalPrice}</span>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg">
                    Create Booking
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function CreateBookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateBookingContent />
    </Suspense>
  )
}

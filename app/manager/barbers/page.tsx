"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Plus, Edit, Trash2, Star } from "lucide-react"
import { mockBarbers, type Barber } from "@/lib/mock-data"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function ManageBarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>(mockBarbers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    specialties: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingBarber) {
      // Update existing barber
      setBarbers(
        barbers.map((b) =>
          b.id === editingBarber.id
            ? {
                ...b,
                name: formData.name,
                specialties: formData.specialties.split(",").map((s) => s.trim()),
              }
            : b,
        ),
      )
    } else {
      // Add new barber
      const newBarber: Barber = {
        id: (barbers.length + 1).toString(),
        name: formData.name,
        avatar: "/placeholder.svg?height=100&width=100",
        specialties: formData.specialties.split(",").map((s) => s.trim()),
        rating: 5.0,
        totalReviews: 0,
      }
      setBarbers([...barbers, newBarber])
    }
    setIsDialogOpen(false)
    setEditingBarber(null)
    setFormData({ name: "", specialties: "" })
  }

  const handleEdit = (barber: Barber) => {
    setEditingBarber(barber)
    setFormData({
      name: barber.name,
      specialties: barber.specialties.join(", "),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setBarbers(barbers.filter((b) => b.id !== id))
  }

  const handleAddNew = () => {
    setEditingBarber(null)
    setFormData({ name: "", specialties: "" })
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/manager/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Manage Barbers</h1>
                <p className="text-sm text-muted-foreground">Add, edit, or remove barbers</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Barber
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBarber ? "Edit Barber" : "Add New Barber"}</DialogTitle>
                  <DialogDescription>
                    {editingBarber ? "Update barber information" : "Enter the details for the new barber"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                    <Input
                      id="specialties"
                      placeholder="Fades, Classic Cuts, Beard Styling"
                      value={formData.specialties}
                      onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingBarber ? "Update" : "Add"} Barber
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <Card key={barber.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={barber.avatar || "/placeholder.svg"} alt={barber.name} />
                      <AvatarFallback>
                        {barber.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{barber.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{barber.rating}</span>
                        <span>({barber.totalReviews})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-1">
                      {barber.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => handleEdit(barber)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(barber.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

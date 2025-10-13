"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Clock, Loader2 } from "lucide-react"
import { createTimeBlock, getTimeBlocks, deleteTimeBlock, type TimeBlock } from "@/lib/barber"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// TODO: Get from auth
const BARBER_ID = "d6f5e4d3-c2b1-4a09-8f7e-6d5c4b3a2910"

export default function BarberTimeBlockingPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [blockedTimes, setBlockedTimes] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [newBlock, setNewBlock] = useState({
    startTime: "",
    endTime: "",
    reason: "",
  })

  useEffect(() => {
    loadTimeBlocks()
  }, [selectedDate])

  const loadTimeBlocks = async () => {
    setLoading(true)
    const dateStr = selectedDate.toISOString().split("T")[0]
    const result = await getTimeBlocks(BARBER_ID, dateStr, dateStr)

    if (result.success && result.timeBlocks) {
      setBlockedTimes(result.timeBlocks)
    } else {
      toast.error(result.error || "Erro ao carregar bloqueios")
    }
    setLoading(false)
  }

  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${minute}`
  })

  const handleAddBlock = async () => {
    if (!newBlock.startTime || !newBlock.endTime) {
      toast.error("Selecione horário de início e fim")
      return
    }

    setCreating(true)
    const dateStr = selectedDate.toISOString().split("T")[0]
    const result = await createTimeBlock(
      BARBER_ID,
      dateStr,
      `${newBlock.startTime}:00`,
      `${newBlock.endTime}:00`,
      newBlock.reason || undefined,
    )

    if (result.success) {
      toast.success("Horário bloqueado com sucesso!")
      setNewBlock({ startTime: "", endTime: "", reason: "" })
      loadTimeBlocks()
    } else {
      toast.error(result.error || "Erro ao bloquear horário")
    }
    setCreating(false)
  }

  const handleDeleteBlock = async (id: string) => {
    setDeletingId(id)
    const result = await deleteTimeBlock(id)

    if (result.success) {
      toast.success("Bloqueio removido!")
      loadTimeBlocks()
    } else {
      toast.error(result.error || "Erro ao remover bloqueio")
    }
    setDeletingId(null)
  }

  const isTimeBlocked = (time: string) => {
    return blockedTimes.some((block) => {
      const blockStart = block.start_time.split(":").slice(0, 2).join(":")
      const blockEnd = block.end_time.split(":").slice(0, 2).join(":")
      return time >= blockStart && time < blockEnd
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/barber/week-overview" className="cursor-pointer">
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Gerenciar Disponibilidade</h1>
              <p className="text-sm text-muted-foreground">Bloqueie horários quando não estiver disponível</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar and Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Data</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bloquear Horário</CardTitle>
                <CardDescription>Adicionar novo bloqueio de horário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Horário de Início</Label>
                  <select
                    id="startTime"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                  >
                    <option value="">Selecione o início</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Horário de Fim</Label>
                  <select
                    id="endTime"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                  >
                    <option value="">Selecione o fim</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo (Opcional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="ex: Almoço, Compromisso pessoal"
                    value={newBlock.reason}
                    onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                    rows={3}
                    className="cursor-text"
                  />
                </div>

                <Button className="w-full cursor-pointer" onClick={handleAddBlock} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Bloqueando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Bloqueio
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Time Slots View */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </CardTitle>
                <CardDescription>Sua disponibilidade para este dia</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((time) => {
                      const blocked = isTimeBlocked(time)
                      return (
                        <div
                          key={time}
                          className={cn(
                            "h-12 rounded-md border-2 flex items-center justify-center text-sm font-medium transition-all",
                            blocked
                              ? "bg-destructive/10 border-destructive text-destructive"
                              : "bg-primary/10 border-primary text-primary hover:scale-105",
                          )}
                          title={blocked ? "Horário bloqueado" : "Horário disponível"}
                        >
                          {time}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horários Bloqueados</CardTitle>
                <CardDescription>
                  Gerencie seus bloqueios para {selectedDate.toLocaleDateString("pt-BR")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : blockedTimes.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum horário bloqueado para este dia</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedTimes.map((block) => (
                      <div
                        key={block.id}
                        className="flex items-start justify-between p-4 rounded-lg border hover:bg-accent/50 transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">
                              {block.start_time.split(":").slice(0, 2).join(":")} -{" "}
                              {block.end_time.split(":").slice(0, 2).join(":")}
                            </span>
                          </div>
                          {block.reason && <p className="text-sm text-muted-foreground">{block.reason}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBlock(block.id)}
                          disabled={deletingId === block.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          {deletingId === block.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
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

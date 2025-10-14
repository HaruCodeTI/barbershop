"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, Save, Clock } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/hooks/use-store"
import { toast } from "sonner"
import { getStoreHours, updateStoreHours } from "@/lib/store-settings"
import type { StoreHours } from "@/types/manager"

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
]

export default function StoreHoursPage() {
  const { store } = useStore()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hours, setHours] = useState<StoreHours[]>([])

  useEffect(() => {
    loadHours()
  }, [store])

  const loadHours = async () => {
    if (!store) return
    setLoading(true)

    const result = await getStoreHours(store.id)
    if (result.success && result.data) {
      setHours(result.data)
    } else {
      toast.error(result.error || "Erro ao carregar horários")
    }

    setLoading(false)
  }

  const handleToggle = (dayOfWeek: number, isOpen: boolean) => {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === dayOfWeek ? { ...h, is_open: isOpen } : h))
    )
  }

  const handleTimeChange = (dayOfWeek: number, field: "open_time" | "close_time", value: string) => {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return
    setSubmitting(true)

    const result = await updateStoreHours(store.id, hours)
    if (result.success) {
      toast.success("Horários atualizados com sucesso!")
      loadHours()
    } else {
      toast.error(result.error || "Erro ao atualizar horários")
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/manager/dashboard" className="cursor-pointer">
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Horário de Funcionamento</h1>
                <p className="text-sm text-muted-foreground">Configure os horários de cada dia da semana</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horários por Dia da Semana
              </CardTitle>
              <CardDescription>Defina se a loja está aberta e os horários de funcionamento</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {DAYS_OF_WEEK.map((day) => {
                  const dayHours = hours.find((h) => h.day_of_week === day.value) || {
                    day_of_week: day.value,
                    is_open: false,
                    open_time: "09:00",
                    close_time: "18:00",
                    store_id: store!.id,
                  }

                  return (
                    <div key={day.value} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold">{day.label}</Label>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`open-${day.value}`} className="text-sm cursor-pointer">
                            {dayHours.is_open ? "Aberto" : "Fechado"}
                          </Label>
                          <Switch
                            id={`open-${day.value}`}
                            checked={dayHours.is_open}
                            onCheckedChange={(checked) => handleToggle(day.value, checked)}
                            className="cursor-pointer"
                          />
                        </div>
                      </div>

                      {dayHours.is_open && (
                        <div className="grid grid-cols-2 gap-4 ml-0 sm:ml-4">
                          <div className="space-y-1">
                            <Label htmlFor={`open-time-${day.value}`} className="text-sm text-muted-foreground">
                              Abertura
                            </Label>
                            <Input
                              id={`open-time-${day.value}`}
                              type="time"
                              value={dayHours.open_time}
                              onChange={(e) => handleTimeChange(day.value, "open_time", e.target.value)}
                              required={dayHours.is_open}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`close-time-${day.value}`} className="text-sm text-muted-foreground">
                              Fechamento
                            </Label>
                            <Input
                              id={`close-time-${day.value}`}
                              type="time"
                              value={dayHours.close_time}
                              onChange={(e) => handleTimeChange(day.value, "close_time", e.target.value)}
                              required={dayHours.is_open}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loadHours()}
                    disabled={submitting}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="cursor-pointer">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Horários
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BlockedTime {
  id: string
  date: Date
  startTime: string
  endTime: string
  reason: string
}

export default function BarberTimeBlockingPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([
    {
      id: "1",
      date: new Date(),
      startTime: "12:00",
      endTime: "13:00",
      reason: "Lunch Break",
    },
  ])

  const [newBlock, setNewBlock] = useState({
    startTime: "",
    endTime: "",
    reason: "",
  })

  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${minute}`
  })

  const getBlocksForDate = (date: Date) => {
    return blockedTimes.filter((block) => block.date.toDateString() === date.toDateString())
  }

  const handleAddBlock = () => {
    if (newBlock.startTime && newBlock.endTime && selectedDate) {
      const block: BlockedTime = {
        id: Date.now().toString(),
        date: selectedDate,
        startTime: newBlock.startTime,
        endTime: newBlock.endTime,
        reason: newBlock.reason || "Blocked",
      }
      setBlockedTimes([...blockedTimes, block])
      setNewBlock({ startTime: "", endTime: "", reason: "" })
    }
  }

  const handleDeleteBlock = (id: string) => {
    setBlockedTimes(blockedTimes.filter((block) => block.id !== id))
  }

  const isTimeBlocked = (time: string) => {
    const blocks = getBlocksForDate(selectedDate)
    return blocks.some((block) => {
      return time >= block.startTime && time < block.endTime
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/barber/week-overview">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Manage Availability</h1>
              <p className="text-sm text-muted-foreground">Block time slots when you're unavailable</p>
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
                <CardTitle>Select Date</CardTitle>
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
                <CardTitle>Block Time</CardTitle>
                <CardDescription>Add a new blocked time slot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <select
                    id="startTime"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                  >
                    <option value="">Select start time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <select
                    id="endTime"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                  >
                    <option value="">Select end time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., Lunch break, Personal appointment"
                    value={newBlock.reason}
                    onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button className="w-full" onClick={handleAddBlock}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Block
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Time Slots View */}
          <div className="lg:col-span-2 space-y-6">
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
                <CardDescription>Your availability for this day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const blocked = isTimeBlocked(time)
                    return (
                      <div
                        key={time}
                        className={cn(
                          "h-12 rounded-md border-2 flex items-center justify-center text-sm font-medium transition-colors",
                          blocked
                            ? "bg-destructive/10 border-destructive text-destructive"
                            : "bg-primary/10 border-primary text-primary",
                        )}
                      >
                        {time}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blocked Time Slots</CardTitle>
                <CardDescription>Manage your blocked times for {selectedDate.toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                {getBlocksForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No blocked time slots for this day</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getBlocksForDate(selectedDate).map((block) => (
                      <div key={block.id} className="flex items-start justify-between p-4 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">
                              {block.startTime} - {block.endTime}
                            </span>
                          </div>
                          {block.reason && <p className="text-sm text-muted-foreground">{block.reason}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
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

import { Loader2 } from "lucide-react"

export default function LoadingAppointments() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando agendamentos...</p>
      </div>
    </div>
  )
}

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"

interface StatusBadgeProps {
  status: AppointmentStatus
  className?: string
}

const statusConfig: Record<
  AppointmentStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    className: string
  }
> = {
  pending: {
    label: "Pendente",
    variant: "outline",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500",
  },
  confirmed: {
    label: "Confirmado",
    variant: "default",
    className: "bg-blue-500/10 text-blue-600 border-blue-500",
  },
  completed: {
    label: "Concluído",
    variant: "secondary",
    className: "bg-green-500/10 text-green-600 border-green-500",
  },
  cancelled: {
    label: "Cancelado",
    variant: "destructive",
    className: "bg-red-500/10 text-red-600 border-red-500",
  },
  no_show: {
    label: "Não Compareceu",
    variant: "outline",
    className: "bg-gray-500/10 text-gray-600 border-gray-500",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}

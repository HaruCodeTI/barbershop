"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

interface StaffHeaderProps {
  staffName: string
  staffRole: "manager" | "barber" | "attendant"
  avatarUrl?: string | null
}

export function StaffHeader({ staffName, staffRole, avatarUrl }: StaffHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem("auth_token")
    localStorage.removeItem("storeId")
    localStorage.removeItem("storeSlug")

    // Redirect to login
    router.push("/login")
  }

  const roleLabels = {
    manager: "Gerente",
    barber: "Barbeiro",
    attendant: "Atendente",
  }

  const firstName = staffName.split(" ")[0]
  const initials = staffName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 md:gap-3 px-2 md:px-3">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={staffName} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{firstName}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[staffRole]}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{staffName}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[staffRole]}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

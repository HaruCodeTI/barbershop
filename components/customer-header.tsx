"use client"

import { Button } from "@/components/ui/button"
import { GlassButton } from "@/components/ui/glass-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Award, Calendar, LogOut, Scissors, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import type { Customer } from "@/lib/auth"

interface CustomerHeaderProps {
  customerId?: string | null
}

export function CustomerHeader({ customerId: propCustomerId }: CustomerHeaderProps = {}) {
  const router = useRouter()
  const { user, userType, signOut, loading: authLoading } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  if (authLoading) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/customer/services">
          <GlassButton size="sm" variant="primary" className="group">
            <Scissors className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
            Agendar
          </GlassButton>
        </Link>
      </div>
    )
  }

  // Not logged in or not a customer
  if (!user || userType !== "customer") {
    return (
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/login">
          <GlassButton variant="ghost" size="sm" className="text-xs md:text-sm whitespace-nowrap group">
            <User className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
            Login Staff
          </GlassButton>
        </Link>
        <Link href="/customer/services">
          <GlassButton size="sm" variant="primary" className="text-xs md:text-sm whitespace-nowrap group">
            <Scissors className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform" />
            Agendar
          </GlassButton>
        </Link>
      </div>
    )
  }

  const customer = user as Customer
  const firstName = customer.name.split(" ")[0]
  const initials = customer.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex items-center gap-2 md:gap-4">
      <Link href="/customer/services">
        <GlassButton size="sm" variant="primary" className="text-xs md:text-sm whitespace-nowrap group">
          <Scissors className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform" />
          Agendar
        </GlassButton>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <GlassButton variant="ghost" className="flex items-center gap-2 md:gap-3 px-2 md:px-3">
            <Avatar className="h-8 w-8 ring-2 ring-primary/30 hover:ring-primary/50 transition-all">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">{firstName}</p>
              <p className="text-xs text-white/60 flex items-center gap-1">
                <Award className="h-3 w-3 text-primary" />
                {customer.loyalty_points} pontos
              </p>
            </div>
          </GlassButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{customer.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" />
                {customer.loyalty_points} pontos de fidelidade
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/customer/appointments" className="cursor-pointer">
              <Calendar className="h-4 w-4 mr-2" />
              Meus Agendamentos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/customer/loyalty" className="cursor-pointer">
              <Award className="h-4 w-4 mr-2" />
              Programa de Fidelidade
            </Link>
          </DropdownMenuItem>
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

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Award, Calendar, User, LogOut, Scissors } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCustomerStats } from "@/lib/customer"

interface CustomerHeaderProps {
  customerId?: string | null
}

export function CustomerHeader({ customerId: propCustomerId }: CustomerHeaderProps = {}) {
  const router = useRouter()
  const [customer, setCustomer] = useState<{
    id: string
    name: string
    loyaltyPoints: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCustomer() {
      // Use prop if provided, otherwise fallback to localStorage
      const customerId = propCustomerId || (typeof window !== "undefined" ? localStorage.getItem("customerId") : null)
      const customerName = typeof window !== "undefined" ? localStorage.getItem("customerName") : null

      if (!customerId || !customerName) {
        setLoading(false)
        setCustomer(null)
        return
      }

      // Get loyalty points
      const result = await getCustomerStats(customerId)

      if (result.success && result.stats) {
        setCustomer({
          id: customerId,
          name: customerName,
          loyaltyPoints: result.stats.loyaltyPoints,
        })
      } else {
        setCustomer({
          id: customerId,
          name: customerName,
          loyaltyPoints: 0,
        })
      }

      setLoading(false)
    }

    loadCustomer()
  }, [propCustomerId])

  const handleLogout = () => {
    localStorage.removeItem("customerId")
    localStorage.removeItem("customerName")
    localStorage.removeItem("customerPhone")
    router.push("/")
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/customer/services">
          <Button size="sm">Agendar</Button>
        </Link>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-xs md:text-sm whitespace-nowrap">
            Login
          </Button>
        </Link>
        <Link href="/customer/services">
          <Button size="sm" className="text-xs md:text-sm whitespace-nowrap">
            Agendar
          </Button>
        </Link>
      </div>
    )
  }

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
        <Button size="sm" className="text-xs md:text-sm whitespace-nowrap">
          <Scissors className="h-4 w-4 mr-1" />
          Agendar
        </Button>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 md:gap-3 px-2 md:px-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{firstName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" />
                {customer.loyaltyPoints} pontos
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{customer.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" />
                {customer.loyaltyPoints} pontos de fidelidade
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

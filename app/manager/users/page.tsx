"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Shield, Power } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/hooks/use-store"
import { toast } from "sonner"
import { getStoreUsers, updateUserRole, toggleUserStatus } from "@/lib/permissions"
import type { StaffUser, UserRole } from "@/types/manager"

const ROLE_LABELS = {
  barber: "Barbeiro",
  attendant: "Atendente",
  manager: "Gerente",
}

const ROLE_COLORS = {
  barber: "bg-blue-500/10 text-blue-600 border-blue-500",
  attendant: "bg-green-500/10 text-green-600 border-green-500",
  manager: "bg-purple-500/10 text-purple-600 border-purple-500",
}

export default function UsersPage() {
  const { store } = useStore()
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [store])

  const loadUsers = async () => {
    if (!store) return
    setLoading(true)

    const result = await getStoreUsers(store.id)
    if (result.success && result.data) {
      setUsers(result.data)
    } else {
      toast.error(result.error || "Erro ao carregar usuários")
    }

    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId)
    const result = await updateUserRole(userId, newRole)
    if (result.success) {
      toast.success("Função atualizada com sucesso!")
      loadUsers()
    } else {
      toast.error(result.error || "Erro ao atualizar função")
    }
    setUpdatingId(null)
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setTogglingId(userId)
    const result = await toggleUserStatus(userId, !currentStatus)
    if (result.success) {
      toast.success(`Usuário ${!currentStatus ? "ativado" : "desativado"} com sucesso!`)
      loadUsers()
    } else {
      toast.error(result.error || "Erro ao alterar status")
    }
    setTogglingId(null)
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
                <h1 className="text-xl font-bold text-foreground">Gestão de Usuários</h1>
                <p className="text-sm text-muted-foreground">Gerencie funções e permissões dos colaboradores</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <Card key={user.id} className={!user.is_active ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {!user.is_active && (
                      <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Função:</span>
                      </div>
                      <Select
                        value={user.role}
                        onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                        disabled={updatingId === user.id || togglingId === user.id}
                      >
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue>
                            <Badge variant="outline" className={ROLE_COLORS[user.role]}>
                              {ROLE_LABELS[user.role]}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="barber" className="cursor-pointer">
                            {ROLE_LABELS.barber}
                          </SelectItem>
                          <SelectItem value="attendant" className="cursor-pointer">
                            {ROLE_LABELS.attendant}
                          </SelectItem>
                          <SelectItem value="manager" className="cursor-pointer">
                            {ROLE_LABELS.manager}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant={user.is_active ? "outline" : "default"}
                      size="sm"
                      className="w-full cursor-pointer"
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                      disabled={updatingId === user.id || togglingId === user.id}
                    >
                      {togglingId === user.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Power className="h-3 w-3 mr-1" />
                          {user.is_active ? "Desativar" : "Ativar"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

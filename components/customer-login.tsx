"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Loader2, CheckCircle2, UserPlus } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useStore } from "@/lib/contexts/store-context"

interface CustomerLoginProps {
  onSuccess?: () => void
  compact?: boolean
}

export function CustomerLogin({ onSuccess, compact = false }: CustomerLoginProps) {
  const router = useRouter()
  const { customerSignIn } = useAuth()
  const { store, loading: storeLoading } = useStore()
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const formatPhone = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, "")

    // Limita a 11 dígitos (DDD + número)
    if (numbers.length > 11) {
      return phone
    }

    // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Remove formatação para enviar
    const phoneNumbers = phone.replace(/\D/g, "")

    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      setError("Telefone inválido. Digite um número com 10 ou 11 dígitos.")
      setLoading(false)
      return
    }

    if (!store) {
      setError("Loja não selecionada. Por favor, selecione uma loja primeiro.")
      setLoading(false)
      return
    }

    try {
      // Usar o novo sistema de autenticação
      const result = await customerSignIn(phoneNumbers, store.id)

      if (!result.success) {
        setError(result.error || "Erro ao fazer login")
        setLoading(false)
        return
      }

      setSuccess(true)

      // Aguarda um momento e redireciona
      setTimeout(() => {
        if (result.isNewCustomer) {
          // Novo customer: vai para completar perfil
          router.push("/customer/complete-profile")
        } else {
          // Customer existente: vai para agendamentos
          router.push("/customer/appointments")
        }

        // Chama callback de sucesso se fornecido
        if (onSuccess) {
          onSuccess()
        }
      }, 1000)
    } catch (err) {
      setError("Erro inesperado. Tente novamente.")
      setLoading(false)
    }
  }

  if (storeLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
      </div>
    )
  }

  if (!store) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">Por favor, selecione uma loja primeiro</p>
          <Button onClick={() => router.push("/select-store")}>Selecionar Loja</Button>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="phone-compact">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone-compact"
              type="tel"
              placeholder="(11) 99999-9999"
              className="pl-10"
              value={phone}
              onChange={handlePhoneChange}
              disabled={loading || success || storeLoading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Login realizado com sucesso!
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading || success || storeLoading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Entrando...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Conectado
            </>
          ) : (
            "Entrar / Cadastrar"
          )}
        </Button>
      </form>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Acesse sua Conta</CardTitle>
        <CardDescription>
          Digite seu telefone para entrar ou criar uma conta rapidamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                className="pl-10"
                value={phone}
                onChange={handlePhoneChange}
                disabled={loading || success || storeLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 rounded-md">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">Login realizado! Redirecionando...</p>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || success || storeLoading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Conectado
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Entrar / Cadastrar
              </>
            )}
          </Button>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              📱 <strong>Novo por aqui?</strong> Não se preocupe!
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Ao digitar seu telefone, você será automaticamente cadastrado se for sua primeira vez. É rápido
              e fácil!
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

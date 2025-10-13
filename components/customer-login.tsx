"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Loader2, CheckCircle2 } from "lucide-react"
import { findCustomerByPhone } from "@/lib/customer"

const STORE_ID = "00000000-0000-0000-0000-000000000001" // TODO: Get from environment or context

interface CustomerLoginProps {
  onSuccess?: (customerId: string, customerName: string) => void
  compact?: boolean
}

export function CustomerLogin({ onSuccess, compact = false }: CustomerLoginProps) {
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

    // Remove formatação para buscar no banco
    const phoneNumbers = phone.replace(/\D/g, "")

    if (phoneNumbers.length < 10) {
      setError("Telefone inválido. Digite um número válido.")
      setLoading(false)
      return
    }

    try {
      const result = await findCustomerByPhone(phoneNumbers, STORE_ID)

      if (!result.success) {
        setError(result.error || "Erro ao buscar cliente")
        setLoading(false)
        return
      }

      if (!result.customer) {
        setError("Cliente não encontrado. Por favor, faça seu cadastro durante o agendamento.")
        setLoading(false)
        return
      }

      // Armazena o cliente no localStorage
      localStorage.setItem("customerId", result.customer.id)
      localStorage.setItem("customerName", result.customer.name)
      localStorage.setItem("customerPhone", result.customer.phone)

      setSuccess(true)

      // Chama callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess(result.customer.id, result.customer.name)
      } else {
        // Recarrega a página para atualizar o header
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (err) {
      setError("Erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
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
              disabled={loading || success}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Identificado com sucesso!
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading || success}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Conectado
            </>
          ) : (
            "Acessar Minha Conta"
          )}
        </Button>
      </form>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Já é Cliente?</CardTitle>
        <CardDescription>Digite seu telefone para acessar suas informações e agendamentos</CardDescription>
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
                disabled={loading || success}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 rounded-md">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">Identificado com sucesso! Redirecionando...</p>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading || success}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Conectado
              </>
            ) : (
              "Acessar Minha Conta"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

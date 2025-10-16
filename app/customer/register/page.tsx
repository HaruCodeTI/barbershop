"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, User, Phone, ArrowRight } from "lucide-react"
import { useStore } from "@/lib/hooks/use-store"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function CustomerRegisterPage() {
  const router = useRouter()
  const { store, loading: storeLoading } = useStore()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [loading, setLoading] = useState(false)

  const formatPhone = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, "")

    // Limita a 11 dígitos (DDD + número)
    if (numbers.length > 11) {
      return formData.phone
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
    setFormData({ ...formData, phone: formatted })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    if (!formData.phone.trim()) {
      toast.error("Telefone é obrigatório")
      return
    }

    const cleanPhone = formData.phone.replace(/\D/g, "")
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast.error("Telefone inválido. Digite um número com 10 ou 11 dígitos.")
      return
    }

    if (!store) {
      toast.error("Selecione uma loja para continuar")
      return
    }

    setLoading(true)

    try {
      // Criar cliente diretamente (sem auth)
      const supabase = createClient()
      
      // Verificar se já existe cliente com mesmo telefone
      const { data: existingByPhone } = await supabase
        .from("customers")
        .select("id, name")
        .eq("phone", cleanPhone)
        .eq("store_id", store.id)
        .single()

      if (existingByPhone) {
        toast.error(`Já existe um cliente cadastrado com este telefone.`)
        setLoading(false)
        return
      }

      // Verificar se já existe cliente com mesmo email (se fornecido)
      if (formData.email) {
        const { data: existingByEmail } = await supabase
          .from("customers")
          .select("id, name")
          .eq("email", formData.email)
          .eq("store_id", store.id)
          .single()

        if (existingByEmail) {
          toast.error(`Já existe um cliente cadastrado com este email: ${existingByEmail.name}`)
          setLoading(false)
          return
        }
      }

      const { error: customerError } = await supabase
        .from("customers")
        .insert({
          store_id: store.id,
          name: formData.name,
          email: formData.email || null,
          phone: cleanPhone,
          loyalty_points: 0,
        })

      if (customerError) {
        console.error("Error creating customer:", customerError)
        toast.error("Erro ao criar perfil de cliente")
        setLoading(false)
        return
      }

      toast.success("Cliente cadastrado com sucesso!")
      router.push("/customer/login")
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Erro ao criar conta")
    }

    setLoading(false)
  }

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Criar conta</CardTitle>
          <CardDescription>
            Preencha os dados para criar sua conta
            {store && (
              <span className="block mt-2 text-primary font-medium">
                Loja: {store.name}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 98765-4321"
                  className="pl-10"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            <Button type="submit" className="w-full cursor-pointer" disabled={loading || !store}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <Link href="/customer/login" className="text-primary font-semibold hover:underline">
              Fazer login
            </Link>
          </div>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            Ao criar uma conta, você concorda com nossos{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

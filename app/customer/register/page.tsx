"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, User, Phone, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useStore } from "@/lib/hooks/use-store"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function CustomerRegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const { store, loading: storeLoading } = useStore()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (!store) {
      toast.error("Selecione uma loja para continuar")
      return
    }

    setLoading(true)

    try {
      // 1. Create auth user
      const authResult = await signUp(formData.email, formData.password, {
        name: formData.name,
        phone: formData.phone,
      })

      if (!authResult.success) {
        toast.error(authResult.error || "Erro ao criar conta")
        setLoading(false)
        return
      }

      // 2. Create customer profile
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Erro ao obter informações do usuário")
        setLoading(false)
        return
      }

      const { error: customerError } = await supabase
        .from("customers")
        .insert({
          auth_user_id: user.id, // Link to auth user
          store_id: store.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          loyalty_points: 0,
        })

      if (customerError) {
        console.error("Error creating customer:", customerError)
        toast.error("Erro ao criar perfil de cliente")
        setLoading(false)
        return
      }

      toast.success("Conta criada com sucesso! Verifique seu email.")
      router.push("/customer/appointments")
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
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
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

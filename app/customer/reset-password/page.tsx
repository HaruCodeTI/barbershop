"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { updatePassword } = useAuth()

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setLoading(true)

    const result = await updatePassword(formData.password)

    if (result.success) {
      setSuccess(true)
      toast.success("Senha atualizada com sucesso!")
      setTimeout(() => {
        router.push("/customer/login")
      }, 2000)
    } else {
      toast.error(result.error || "Erro ao atualizar senha")
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Senha atualizada!</CardTitle>
            <CardDescription>
              Sua senha foi alterada com sucesso.
              <br />
              Redirecionando para o login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Nova senha</CardTitle>
          <CardDescription>Digite sua nova senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
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
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
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

            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar senha"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/customer/login" className="text-primary hover:underline">
              Cancelar e voltar para login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await resetPassword(email)

    if (result.success) {
      setEmailSent(true)
      toast.success("Email de recuperação enviado!")
    } else {
      toast.error(result.error || "Erro ao enviar email")
    }

    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Email enviado!</CardTitle>
            <CardDescription>
              Enviamos um link de recuperação para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p className="mb-2">📧 Verifique sua caixa de entrada e spam.</p>
              <p>O link de recuperação expira em 1 hora.</p>
            </div>

            <Link href="/customer/login">
              <Button variant="outline" className="w-full cursor-pointer">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para login
              </Button>
            </Link>

            <button
              onClick={() => setEmailSent(false)}
              className="w-full text-sm text-primary hover:underline"
            >
              Enviar novamente
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Recuperar senha</CardTitle>
          <CardDescription>
            Digite seu email e enviaremos um link para redefinir sua senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>
          </form>

          <div className="mt-6">
            <Link href="/customer/login">
              <Button variant="ghost" className="w-full cursor-pointer">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Ticket, Percent, DollarSign, Calendar, Users, Edit, Trash2 } from "lucide-react"
import { mockCoupons, type Coupon } from "@/lib/mock-data"
import Link from "next/link"

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  const handleCreateCoupon = (formData: FormData) => {
    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: formData.get("code") as string,
      description: formData.get("description") as string,
      discountType: formData.get("discountType") as "percentage" | "fixed",
      discountValue: Number(formData.get("discountValue")),
      minPurchase: Number(formData.get("minPurchase")),
      maxDiscount: formData.get("maxDiscount") ? Number(formData.get("maxDiscount")) : undefined,
      validFrom: formData.get("validFrom") as string,
      validUntil: formData.get("validUntil") as string,
      usageLimit: Number(formData.get("usageLimit")),
      usedCount: 0,
      active: true,
      storeId: "store-1",
    }
    setCoupons([...coupons, newCoupon])
    setIsDialogOpen(false)
  }

  const handleToggleActive = (couponId: string) => {
    setCoupons(coupons.map((c) => (c.id === couponId ? { ...c, active: !c.active } : c)))
  }

  const handleDelete = (couponId: string) => {
    setCoupons(coupons.filter((c) => c.id !== couponId))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gerenciar Cupons</h1>
            </div>
            <Link href="/">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Cupons de Desconto</h2>
            <p className="text-muted-foreground">Crie e gerencie campanhas de cupons</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Cupom</DialogTitle>
                <DialogDescription>Preencha os detalhes do cupom de desconto</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleCreateCoupon(new FormData(e.currentTarget))
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código do Cupom</Label>
                    <Input id="code" name="code" placeholder="BEMVINDO20" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Tipo de Desconto</Label>
                    <Select name="discountType" defaultValue="percentage" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem</SelectItem>
                        <SelectItem value="fixed">Valor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" placeholder="Descrição do cupom" required />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">Valor do Desconto</Label>
                    <Input id="discountValue" name="discountValue" type="number" placeholder="20" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minPurchase">Compra Mínima (R$)</Label>
                    <Input id="minPurchase" name="minPurchase" type="number" placeholder="50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Desconto Máximo (R$)</Label>
                    <Input id="maxDiscount" name="maxDiscount" type="number" placeholder="30" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Válido De</Label>
                    <Input id="validFrom" name="validFrom" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Válido Até</Label>
                    <Input id="validUntil" name="validUntil" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">Limite de Uso</Label>
                    <Input id="usageLimit" name="usageLimit" type="number" placeholder="100" required />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Cupom</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {coupons.map((coupon) => {
            const isExpired = new Date(coupon.validUntil) < new Date()
            const usagePercent = (coupon.usedCount / coupon.usageLimit) * 100

            return (
              <Card key={coupon.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl font-mono">{coupon.code}</CardTitle>
                        <Badge variant={coupon.active && !isExpired ? "default" : "secondary"}>
                          {isExpired ? "Expirado" : coupon.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <CardDescription>{coupon.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 mb-4">
                    <div className="flex items-center gap-2">
                      {coupon.discountType === "percentage" ? (
                        <Percent className="h-4 w-4 text-primary" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-primary" />
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Desconto</p>
                        <p className="font-semibold">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : `R$ ${coupon.discountValue}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Compra Mínima</p>
                        <p className="font-semibold">R$ {coupon.minPurchase.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Validade</p>
                        <p className="font-semibold text-sm">
                          {new Date(coupon.validUntil).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Uso</p>
                        <p className="font-semibold">
                          {coupon.usedCount} / {coupon.usageLimit}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de uso</span>
                      <span className="font-medium">{usagePercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${usagePercent}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={coupon.active} onCheckedChange={() => handleToggleActive(coupon.id)} />
                      <Label className="text-sm">Cupom ativo</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
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
import { Plus, Ticket, Percent, DollarSign, Calendar, Users, Edit, Trash2, Loader2, ArrowLeft } from "lucide-react"
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  type Coupon,
} from "@/lib/coupons"
import Link from "next/link"
import { toast } from "sonner"

// TODO: Get from auth
const STORE_ID = "hobnkfghduuspsdvhkla"

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minPurchase: "",
    maxDiscount: "",
    validFrom: "",
    validUntil: "",
    usageLimit: "",
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    setLoading(true)
    const result = await getCoupons(STORE_ID)

    if (result.success && result.coupons) {
      setCoupons(result.coupons)
    } else {
      toast.error(result.error || "Erro ao carregar cupons")
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minPurchase: "",
      maxDiscount: "",
      validFrom: "",
      validUntil: "",
      usageLimit: "",
    })
    setEditingCoupon(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    if (editingCoupon) {
      // Update existing coupon
      const result = await updateCoupon(editingCoupon.id, {
        code: formData.code,
        description: formData.description,
        discount_type: formData.discountType,
        discount_value: Number.parseFloat(formData.discountValue),
        min_purchase: Number.parseFloat(formData.minPurchase),
        max_discount: formData.maxDiscount ? Number.parseFloat(formData.maxDiscount) : undefined,
        valid_from: formData.validFrom,
        valid_until: formData.validUntil,
        usage_limit: Number.parseInt(formData.usageLimit),
      })

      if (result.success) {
        toast.success("Cupom atualizado com sucesso!")
        loadCoupons()
        setIsDialogOpen(false)
        resetForm()
      } else {
        toast.error(result.error || "Erro ao atualizar cupom")
      }
    } else {
      // Create new coupon
      const result = await createCoupon(STORE_ID, {
        code: formData.code,
        description: formData.description,
        discount_type: formData.discountType,
        discount_value: Number.parseFloat(formData.discountValue),
        min_purchase: Number.parseFloat(formData.minPurchase),
        max_discount: formData.maxDiscount ? Number.parseFloat(formData.maxDiscount) : undefined,
        valid_from: formData.validFrom,
        valid_until: formData.validUntil,
        usage_limit: Number.parseInt(formData.usageLimit),
      })

      if (result.success) {
        toast.success("Cupom criado com sucesso!")
        loadCoupons()
        setIsDialogOpen(false)
        resetForm()
      } else {
        toast.error(result.error || "Erro ao criar cupom")
      }
    }

    setSubmitting(false)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value.toString(),
      minPurchase: coupon.min_purchase.toString(),
      maxDiscount: coupon.max_discount?.toString() || "",
      validFrom: coupon.valid_from,
      validUntil: coupon.valid_until,
      usageLimit: coupon.usage_limit.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (couponId: string, currentStatus: boolean) => {
    setTogglingId(couponId)
    const result = await toggleCouponStatus(couponId, !currentStatus)

    if (result.success) {
      toast.success(`Cupom ${!currentStatus ? "ativado" : "desativado"} com sucesso!`)
      loadCoupons()
    } else {
      toast.error(result.error || "Erro ao alterar status do cupom")
    }
    setTogglingId(null)
  }

  const handleDelete = async (couponId: string) => {
    setDeletingId(couponId)
    const result = await deleteCoupon(couponId)

    if (result.success) {
      toast.success("Cupom excluído com sucesso!")
      loadCoupons()
    } else {
      toast.error(result.error || "Erro ao excluir cupom")
    }
    setDeletingId(null)
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
              <div className="flex items-center gap-3">
                <Ticket className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Gerenciar Cupons</h1>
                  <p className="text-sm text-muted-foreground">Criar e gerenciar cupons de desconto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Cupons de Desconto</h2>
            <p className="text-muted-foreground">
              {coupons.length} {coupons.length === 1 ? "cupom cadastrado" : "cupons cadastrados"}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}</DialogTitle>
                <DialogDescription>
                  {editingCoupon
                    ? "Atualize as informações do cupom"
                    : "Preencha os detalhes do cupom de desconto"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código do Cupom</Label>
                    <Input
                      id="code"
                      placeholder="BEMVINDO20"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Tipo de Desconto</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value: "percentage" | "fixed") =>
                        setFormData({ ...formData, discountType: value })
                      }
                      required
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage" className="cursor-pointer">
                          Porcentagem
                        </SelectItem>
                        <SelectItem value="fixed" className="cursor-pointer">
                          Valor Fixo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição do cupom"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">Valor do Desconto</Label>
                    <Input
                      id="discountValue"
                      type="number"
                      step="0.01"
                      placeholder="20"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minPurchase">Compra Mínima (R$)</Label>
                    <Input
                      id="minPurchase"
                      type="number"
                      step="0.01"
                      placeholder="50"
                      value={formData.minPurchase}
                      onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Desconto Máximo (R$)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      step="0.01"
                      placeholder="30"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Válido De</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Válido Até</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">Limite de Uso</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      placeholder="100"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="cursor-pointer">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingCoupon ? "Atualizando..." : "Criando..."}
                      </>
                    ) : (
                      <>{editingCoupon ? "Atualizar" : "Criar"} Cupom</>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">Nenhum cupom cadastrado</p>
            <Button onClick={handleAddNew} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Cupom
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => {
              const isExpired = new Date(coupon.valid_until) < new Date()
              const usagePercent = (coupon.used_count / coupon.usage_limit) * 100

              return (
                <Card key={coupon.id} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl font-mono">{coupon.code}</CardTitle>
                        <Badge
                          variant={coupon.is_active && !isExpired ? "default" : "secondary"}
                          className={!coupon.is_active || isExpired ? "bg-gray-500/10 text-gray-500" : ""}
                        >
                          {isExpired ? "Expirado" : coupon.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <CardDescription>{coupon.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(coupon)}
                        disabled={deletingId === coupon.id || togglingId === coupon.id}
                        className="cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon.id)}
                        disabled={deletingId === coupon.id || togglingId === coupon.id}
                        className="cursor-pointer"
                      >
                        {deletingId === coupon.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 mb-4">
                    <div className="flex items-center gap-2">
                      {coupon.discount_type === "percentage" ? (
                        <Percent className="h-4 w-4 text-primary" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-primary" />
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Desconto</p>
                        <p className="font-semibold">
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}%`
                            : `R$ ${coupon.discount_value}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Compra Mínima</p>
                        <p className="font-semibold">R$ {coupon.min_purchase.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Validade</p>
                        <p className="font-semibold text-sm">
                          {new Date(coupon.valid_until).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Uso</p>
                        <p className="font-semibold">
                          {coupon.used_count} / {coupon.usage_limit}
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
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={() => handleToggleActive(coupon.id, coupon.is_active)}
                        disabled={togglingId === coupon.id || deletingId === coupon.id}
                        className="cursor-pointer"
                      />
                      <Label className="text-sm cursor-pointer">
                        {togglingId === coupon.id ? "Processando..." : "Cupom ativo"}
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

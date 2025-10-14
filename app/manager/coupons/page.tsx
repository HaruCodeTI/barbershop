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
import { useStore } from "@/lib/hooks/use-store"

export default function CouponsPage() {
  const { store, loading: storeLoading } = useStore()
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
    validFrom: "",
    validUntil: "",
    maxUses: "",
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    if (!store) return
    setLoading(true)
    const result = await getCoupons(store.id)

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
      validFrom: "",
      validUntil: "",
      maxUses: "",
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
        valid_from: formData.validFrom,
        valid_until: formData.validUntil,
        max_uses: Number.parseInt(formData.maxUses),
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
      if (!store) return
      const result = await createCoupon(store.id, {
        code: formData.code,
        description: formData.description,
        discount_type: formData.discountType,
        discount_value: Number.parseFloat(formData.discountValue),
        min_purchase: Number.parseFloat(formData.minPurchase),
        valid_from: formData.validFrom,
        valid_until: formData.validUntil,
        max_uses: Number.parseInt(formData.maxUses),
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
      validFrom: coupon.valid_from,
      validUntil: coupon.valid_until,
      maxUses: coupon.max_uses.toString(),
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Link href="/manager/dashboard" className="cursor-pointer flex-shrink-0">
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <Ticket className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-foreground truncate">Gerenciar Cupons</h1>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Criar e gerenciar cupons de desconto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg md:text-2xl font-bold text-foreground truncate">Cupons de Desconto</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {coupons.length} {coupons.length === 1 ? "cupom cadastrado" : "cupons cadastrados"}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="cursor-pointer w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base md:text-lg">{editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}</DialogTitle>
                <DialogDescription className="text-xs md:text-sm">
                  {editingCoupon
                    ? "Atualize as informações do cupom"
                    : "Preencha os detalhes do cupom de desconto"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
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

                <div className="grid gap-4 md:grid-cols-2">
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
                    <Label htmlFor="maxUses">Limite de Uso</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      placeholder="100"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                    className="cursor-pointer flex-1 sm:flex-initial"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="cursor-pointer flex-1 sm:flex-initial">
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
              const usagePercent = (coupon.current_uses / coupon.max_uses) * 100

              return (
                <Card key={coupon.id} className="transition-all hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-base md:text-xl font-mono truncate">{coupon.code}</CardTitle>
                        <Badge
                          variant={coupon.is_active && !isExpired ? "default" : "secondary"}
                          className={!coupon.is_active || isExpired ? "bg-gray-500/10 text-gray-500" : ""}
                        >
                          {isExpired ? "Expirado" : coupon.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs md:text-sm">{coupon.description}</CardDescription>
                    </div>
                    <div className="flex gap-1 md:gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(coupon)}
                        disabled={deletingId === coupon.id || togglingId === coupon.id}
                        className="cursor-pointer h-8 w-8 md:h-10 md:w-10"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon.id)}
                        disabled={deletingId === coupon.id || togglingId === coupon.id}
                        className="cursor-pointer h-8 w-8 md:h-10 md:w-10"
                      >
                        {deletingId === coupon.id ? (
                          <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <div className="flex items-center gap-2">
                      {coupon.discount_type === "percentage" ? (
                        <Percent className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground">Desconto</p>
                        <p className="font-semibold text-sm md:text-base truncate">
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}%`
                            : `R$ ${coupon.discount_value}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground">Compra Mín.</p>
                        <p className="font-semibold text-sm md:text-base truncate">R$ {coupon.min_purchase.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground">Validade</p>
                        <p className="font-semibold text-xs md:text-sm truncate">
                          {new Date(coupon.valid_until).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-muted-foreground">Uso</p>
                        <p className="font-semibold text-sm md:text-base truncate">
                          {coupon.current_uses} / {coupon.max_uses}
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

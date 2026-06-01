import { useEffect, useRef, useState } from "react"
import { Loader2, Package } from "lucide-react"
import { toast } from "sonner"
import { BarcodeScanner } from "@/components/shared/barcode-scanner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useReturnRentalItems } from "./hooks"
import {
  ReturnCondition,
  ReturnConditionLabels,
  ProductType,
  type RentalDetail,
  type RentalItem,
} from "./api"

interface RentalReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rental: RentalDetail | null
}

interface ItemFormState {
  rentalItemId: string
  selected: boolean
  returnCondition: ReturnCondition
  returnNotes: string
  damageFee: string
  lifespanAtReturn: string
}

function initialItemState(item: RentalItem): ItemFormState {
  return {
    rentalItemId: item.id,
    selected: true,
    returnCondition: ReturnCondition.Good,
    returnNotes: "",
    damageFee: "0",
    lifespanAtReturn: "",
  }
}

export function RentalReturnDialog({
  open,
  onOpenChange,
  rental,
}: RentalReturnDialogProps) {
  const returnMutation = useReturnRentalItems()
  const [items, setItems] = useState<ItemFormState[]>([])
  const [flashItemId, setFlashItemId] = useState<string | null>(null)
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // İade edilmemiş kalemleri her dialog açılışında yeniden hesapla.
  const unreturnedItems = rental?.items.filter((i) => !i.isReturned) ?? []

  useEffect(() => {
    if (!open || !rental) return
    setItems(rental.items.filter((i) => !i.isReturned).map(initialItemState))
    setFlashItemId(null)
  }, [open, rental])

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    }
  }, [])

  const flashItem = (rentalItemId: string) => {
    setFlashItemId(rentalItemId)
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    flashTimeoutRef.current = setTimeout(() => setFlashItemId(null), 1500)
  }

  const handleScan = (raw: string) => {
    if (!rental) return
    const code = raw.trim().toLowerCase()
    if (!code) return

    // 1) İade edilmemiş kalemlerde eşleşme ara
    const unreturnedIdx = unreturnedItems.findIndex(
      (i) => i.inventorySerialNumber?.trim().toLowerCase() === code,
    )

    if (unreturnedIdx >= 0) {
      const target = unreturnedItems[unreturnedIdx]
      const state = items[unreturnedIdx]
      if (state?.selected) {
        flashItem(target.id)
        toast.info(`${target.productName} zaten seçili.`)
      } else {
        updateItem(unreturnedIdx, { selected: true })
        flashItem(target.id)
        toast.success(`✓ ${target.productName} işaretlendi.`)
      }
      return
    }

    // 2) Zaten iade edilmiş kalem mi?
    const alreadyReturned = rental.items.find(
      (i) => i.isReturned && i.inventorySerialNumber?.trim().toLowerCase() === code,
    )
    if (alreadyReturned) {
      toast.info(`${alreadyReturned.productName} zaten iade edilmiş.`)
      return
    }

    // 3) Hiç eşleşmedi
    toast.warning(`Bu kiralamada "${raw}" seri numarasıyla kalem yok.`)
  }

  const updateItem = (idx: number, patch: Partial<ItemFormState>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const setAllSelected = (selected: boolean) => {
    setItems((prev) => prev.map((it) => ({ ...it, selected })))
  }

  const selectedCount = items.filter((i) => i.selected).length
  const isSubmitting = returnMutation.isPending

  const handleSubmit = async () => {
    if (!rental) return

    const selected = items.filter((i) => i.selected)
    if (selected.length === 0) {
      toast.warning("İade için en az bir kalem seçiniz.")
      return
    }

    // Validation: hasarlı/kayıp seçildi ama bedel 0 ise uyar (kabul ediyoruz, sadece uyarı).
    const condRequiresFee = selected.some(
      (i) =>
        (i.returnCondition === ReturnCondition.Damaged ||
          i.returnCondition === ReturnCondition.Lost) &&
        (Number(i.damageFee) || 0) === 0,
    )
    if (condRequiresFee) {
      // toast.warning ile bilgilendir ama submit'e izin ver (kullanıcı hasar bedelini 0 da bırakabilir)
      toast.info("Hasar/kayıp kalemlerinden bazılarına bedel girilmedi.")
    }

    const requestItems = selected.map((i) => ({
      rentalItemId: i.rentalItemId,
      returnCondition: i.returnCondition,
      returnNotes: i.returnNotes,
      damageFee: Number(i.damageFee) || 0,
      lifespanAtReturn: i.lifespanAtReturn ? Number(i.lifespanAtReturn) : null,
    }))

    try {
      await returnMutation.mutateAsync({ id: rental.id, items: requestItems })
      onOpenChange(false)
    } catch {
      // axios interceptor zaten toast gösteriyor
    }
  }

  if (!rental) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İade</DialogTitle>
            <DialogDescription>Kiralama bilgisi yüklenmedi.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kalem İade — {rental.rentalNumber}</DialogTitle>
          <DialogDescription>
            İade alınan kalemleri seçin ve durumlarını belirleyin. Hasarlı veya
            kayıp kalemler için bedel girebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        {unreturnedItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Tüm kalemler iade edilmiş.
          </div>
        ) : (
          <div className="space-y-4">
            <BarcodeScanner
              onScan={handleScan}
              placeholder="Seri no okutun veya yazıp Enter'a basın"
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-between border rounded-md p-3 bg-muted/30">
              <div className="text-sm">
                <span className="font-medium">{selectedCount}</span>
                <span className="text-muted-foreground"> / {items.length} kalem seçili</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAllSelected(true)}
                >
                  Tümünü Seç
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAllSelected(false)}
                >
                  Tümünü Kaldır
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {unreturnedItems.map((item, idx) => {
                const state = items[idx]
                if (!state) return null
                return (
                  <ReturnItemCard
                    key={item.id}
                    item={item}
                    state={state}
                    onChange={(patch) => updateItem(idx, patch)}
                    flashing={flashItemId === item.id}
                  />
                )
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || selectedCount === 0}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedCount === items.length ? "Tümünü İade Et" : `${selectedCount} Kalemi İade Et`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ReturnItemCardProps {
  item: RentalItem
  state: ItemFormState
  onChange: (patch: Partial<ItemFormState>) => void
  flashing?: boolean
}

function ReturnItemCard({ item, state, onChange, flashing }: ReturnItemCardProps) {
  const isTracked = item.productType === ProductType.Tracked
  const hasLifespan = isTracked && item.totalLifespan !== null && item.totalLifespan > 0
  const showDamageFee =
    state.returnCondition === ReturnCondition.Damaged ||
    state.returnCondition === ReturnCondition.Lost

  return (
    <div
      className={`rounded-md border p-3 transition-all duration-300 ${
        state.selected ? "bg-card" : "bg-muted/30 opacity-70"
      } ${flashing ? "ring-2 ring-emerald-500 ring-offset-1" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-1"
          checked={state.selected}
          onCheckedChange={(v) => onChange({ selected: v === true })}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm truncate">{item.productName}</span>
                {item.productVariantSku && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {item.productVariantSku}
                  </Badge>
                )}
                {isTracked && item.inventorySerialNumber && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    SN: {item.inventorySerialNumber}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Miktar: {item.quantity}
                {hasLifespan && item.lifespanUnitTypeName && (
                  <>
                    {" · Çıkış ömür: "}
                    <span className="font-medium">
                      {item.currentLifespan ?? "-"} {item.lifespanUnitTypeName}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {state.selected && (
            <div className="mt-3 space-y-3 pt-3 border-t">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">İade Durumu</Label>
                  <Select
                    value={String(state.returnCondition)}
                    onValueChange={(v) =>
                      onChange({ returnCondition: Number(v) as ReturnCondition })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ReturnConditionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {showDamageFee && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {state.returnCondition === ReturnCondition.Lost
                        ? "Kayıp Bedeli (TL)"
                        : "Hasar Bedeli (TL)"}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={state.damageFee}
                      onChange={(e) => onChange({ damageFee: e.target.value })}
                      className="h-9"
                    />
                  </div>
                )}
              </div>

              {hasLifespan && (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    İade Ömür Değeri ({item.lifespanUnitTypeName})
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`Örn: ${item.currentLifespan ?? 0}`}
                    value={state.lifespanAtReturn}
                    onChange={(e) => onChange({ lifespanAtReturn: e.target.value })}
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">
                    Boş bırakılırsa envanter ömür değeri değişmez.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Notlar</Label>
                <Textarea
                  rows={2}
                  placeholder="Örn: Sol panel çiziği, kullanım izi vb."
                  value={state.returnNotes}
                  onChange={(e) => onChange({ returnNotes: e.target.value })}
                  maxLength={1000}
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useBulkGenerateProductVariants } from "@/features/product-variants/hooks"
import type { CategoryAttributeForEdit } from "@/features/category-attributes/api"

interface ProductVariantBulkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  variantAttributes: CategoryAttributeForEdit[]
}

export function ProductVariantBulkDialog({
  open,
  onOpenChange,
  productId,
  variantAttributes,
}: ProductVariantBulkDialogProps) {
  const bulkMutation = useBulkGenerateProductVariants()
  const [skuPrefix, setSkuPrefix] = useState("")
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>(
    variantAttributes.map((a) => a.id)
  )

  const toggleAttribute = (id: string) => {
    setSelectedAttributeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Kombinasyon sayısı hesapla
  const combinationCount = useMemo(() => {
    const selectedAttrs = variantAttributes.filter((a) =>
      selectedAttributeIds.includes(a.id)
    )
    if (selectedAttrs.length === 0) return 0

    return selectedAttrs.reduce((total, attr) => {
      if (!attr.selectOptions) return total
      try {
        const options = JSON.parse(attr.selectOptions) as string[]
        return total * options.length
      } catch {
        return total
      }
    }, 1)
  }, [variantAttributes, selectedAttributeIds])

  const handleSubmit = async () => {
    if (!skuPrefix.trim()) return

    try {
      await bulkMutation.mutateAsync({
        productId,
        skuPrefix: skuPrefix.trim(),
        attributeIds: selectedAttributeIds.length === variantAttributes.length
          ? null
          : selectedAttributeIds,
      })
      onOpenChange(false)
      setSkuPrefix("")
    } catch {
      // Error handled in mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Otomatik Varyant Oluştur</DialogTitle>
          <DialogDescription>
            Seçilen özelliklerin tüm kombinasyonları otomatik olarak oluşturulacaktır.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skuPrefix">SKU Ön Eki</Label>
            <Input
              id="skuPrefix"
              value={skuPrefix}
              onChange={(e) => setSkuPrefix(e.target.value)}
              placeholder="Örn: URUN-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Kullanılacak Özellikler</Label>
            <div className="space-y-2 rounded-md border p-3">
              {variantAttributes.map((attr) => {
                const optionCount = attr.selectOptions
                  ? (() => {
                      try {
                        return (JSON.parse(attr.selectOptions) as string[]).length
                      } catch {
                        return 0
                      }
                    })()
                  : 0

                return (
                  <div key={attr.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`attr-${attr.id}`}
                      checked={selectedAttributeIds.includes(attr.id)}
                      onCheckedChange={() => toggleAttribute(attr.id)}
                    />
                    <label
                      htmlFor={`attr-${attr.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {attr.displayName}
                      <span className="text-muted-foreground ml-1">
                        ({optionCount} seçenek)
                      </span>
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          {combinationCount > 0 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <strong>{combinationCount}</strong> varyant oluşturulacak.
              Mevcut varyantlarla aynı kombinasyonlar atlanacaktır.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              bulkMutation.isPending ||
              !skuPrefix.trim() ||
              selectedAttributeIds.length === 0
            }
          >
            {bulkMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

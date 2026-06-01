import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Projector,
  Wrench,
  Speaker,
  UtensilsCrossed,
  Video,
  Printer,
  Heart,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  useSectorTemplates,
  useSectorTemplateDetail,
  useApplyTemplate,
  useSkipOnboarding,
} from "./hooks"
import type { ProductSuggestionDetail, SectorTemplateSummary } from "./api"

const ICONS: Record<string, LucideIcon> = {
  Projector,
  Wrench,
  Speaker,
  UtensilsCrossed,
  Video,
  Printer,
  Heart,
}

interface OnboardingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2 | 3

export function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>(1)
  const [sectorKey, setSectorKey] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  const { data: sectors, isLoading: sectorsLoading } = useSectorTemplates()
  const { data: detail, isLoading: detailLoading } = useSectorTemplateDetail(sectorKey)
  const applyMutation = useApplyTemplate()
  const skipMutation = useSkipOnboarding()

  // Dialog kapanırken state'i sıfırla
  useEffect(() => {
    if (!open) {
      setStep(1)
      setSectorKey(null)
      setSelectedCategories(new Set())
      setSelectedServices(new Set())
      setSelectedProducts(new Set())
    }
  }, [open])

  // Detay geldiğinde varsayılan seçimleri uygula: kategoriler+hizmetler ALL, ürünler NONE
  useEffect(() => {
    if (!detail) return
    setSelectedCategories(new Set(detail.categories.map((c) => c.name)))
    setSelectedServices(new Set(detail.extraServices.map((s) => s.name)))
    setSelectedProducts(new Set())
  }, [detail])

  const isBusy = applyMutation.isPending || skipMutation.isPending

  const handleSkip = async () => {
    try {
      await skipMutation.mutateAsync()
      toast.success("Onboarding tamamlandı. Şablonu sonra Settings'ten uygulayabilirsiniz.")
      onOpenChange(false)
    } catch {
      // interceptor toasts
    }
  }

  const handleApply = async () => {
    if (!sectorKey || !detail) return
    try {
      const result = await applyMutation.mutateAsync({
        sectorKey,
        categoryNames: [...selectedCategories],
        extraServiceNames: [...selectedServices],
        productSuggestions: [...selectedProducts].map((s) => {
          const [category, brand, model] = s.split("|")
          return { category, brand, model }
        }),
      })
      const total =
        result.categoriesAdded +
        result.attributesAdded +
        result.extraServicesAdded +
        result.productsAdded
      const skipped =
        result.categoriesSkipped +
        result.attributesSkipped +
        result.extraServicesSkipped +
        result.productsSkipped
      toast.success(
        `Şablon uygulandı: ${total} yeni içerik eklendi${skipped ? ` (${skipped} zaten mevcuttu, atlandı)` : ""}.`,
      )
      onOpenChange(false)
    } catch {
      // interceptor toasts
    }
  }

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }
  const toggleService = (name: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }
  const toggleProduct = (p: ProductSuggestionDetail) => {
    const key = `${p.category}|${p.brand}|${p.model}`
    setSelectedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // Apply sırasında kapatmaya izin verme
        if (isBusy) return
        onOpenChange(o)
      }}
    >
      <DialogContent
        className="max-w-3xl max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => isBusy && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Hızlı Başlangıç
          </DialogTitle>
          <DialogDescription>
            Sektörünüze uygun hazır içerikleri tek tıkla ekleyin. Bu adımları daha sonra
            "Ayarlar → Sektör Şablonu" üzerinden tekrar açabilirsiniz.
          </DialogDescription>
          <StepIndicator currentStep={step} />
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 1 && (
            <SectorListStep
              sectors={sectors}
              isLoading={sectorsLoading}
              selectedKey={sectorKey}
              onSelect={setSectorKey}
            />
          )}
          {step === 2 && detail && (
            <ContentPickerStep
              detail={detail}
              isLoading={detailLoading}
              selectedCategories={selectedCategories}
              selectedServices={selectedServices}
              selectedProducts={selectedProducts}
              onToggleCategory={toggleCategory}
              onToggleService={toggleService}
              onToggleProduct={toggleProduct}
              onSetAllProducts={(checked) => {
                if (!detail) return
                if (checked) {
                  setSelectedProducts(
                    new Set(detail.productSuggestions.map((p) => `${p.category}|${p.brand}|${p.model}`)),
                  )
                } else {
                  setSelectedProducts(new Set())
                }
              }}
            />
          )}
          {step === 3 && detail && (
            <ApplySummaryStep
              detail={detail}
              categoryCount={selectedCategories.size}
              serviceCount={selectedServices.size}
              productCount={selectedProducts.size}
              attrCount={detail.categories
                .filter((c) => selectedCategories.has(c.name))
                .reduce((sum, c) => sum + c.attributes.length, 0)}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t">
          {step === 1 ? (
            <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isBusy}>
              {skipMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Şimdi atla, sonra eklerim
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              disabled={isBusy}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri
            </Button>
          )}

          <div className="flex gap-2">
            {step < 3 && (
              <Button
                onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
                disabled={(step === 1 && !sectorKey) || (step === 2 && !detail) || isBusy}
              >
                Devam
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleApply} disabled={isBusy}>
                {applyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-2 h-4 w-4" />
                Uygula
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const labels = ["Sektör", "İçerik", "Özet"]
  return (
    <div className="flex items-center gap-2 pt-2">
      {labels.map((label, idx) => {
        const step = (idx + 1) as Step
        const active = step === currentStep
        const done = step < currentStep
        return (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : done
                    ? "bg-primary/20 border-primary/40"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3 w-3" /> : step}
            </span>
            <span className={active ? "font-medium" : "text-muted-foreground"}>{label}</span>
            {idx < labels.length - 1 && <span className="text-muted-foreground mx-1">→</span>}
          </div>
        )
      })}
    </div>
  )
}

function SectorListStep({
  sectors,
  isLoading,
  selectedKey,
  onSelect,
}: {
  sectors: SectorTemplateSummary[] | undefined
  isLoading: boolean
  selectedKey: string | null
  onSelect: (key: string) => void
}) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!sectors || sectors.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Şablon bulunamadı.</p>
    )
  }
  return (
    <ScrollArea className="h-[55vh] pr-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {sectors.map((s) => {
          const Icon = ICONS[s.icon] ?? Sparkles
          const active = selectedKey === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(s.key)}
              className={`text-left rounded-md border p-4 transition-colors hover:bg-muted/50 ${
                active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{s.displayName}</div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                    <Badge variant="secondary" className="font-normal">
                      {s.categoryCount} kategori
                    </Badge>
                    <Badge variant="secondary" className="font-normal">
                      {s.productSuggestionCount} ürün
                    </Badge>
                    <Badge variant="secondary" className="font-normal">
                      {s.extraServiceCount} hizmet
                    </Badge>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

interface ContentPickerStepProps {
  detail: import("./api").SectorTemplateDetail
  isLoading: boolean
  selectedCategories: Set<string>
  selectedServices: Set<string>
  selectedProducts: Set<string>
  onToggleCategory: (name: string) => void
  onToggleService: (name: string) => void
  onToggleProduct: (p: ProductSuggestionDetail) => void
  onSetAllProducts: (checked: boolean) => void
}

function ContentPickerStep({
  detail,
  isLoading,
  selectedCategories,
  selectedServices,
  selectedProducts,
  onToggleCategory,
  onToggleService,
  onToggleProduct,
  onSetAllProducts,
}: ContentPickerStepProps) {
  const productsByBrand = useMemo(() => {
    const map = new Map<string, ProductSuggestionDetail[]>()
    for (const p of detail.productSuggestions) {
      const list = map.get(p.brand) ?? []
      list.push(p)
      map.set(p.brand, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "tr"))
  }, [detail])

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalProducts = detail.productSuggestions.length
  const allProductsSelected = totalProducts > 0 && selectedProducts.size === totalProducts

  return (
    <ScrollArea className="h-[55vh] pr-3">
      <p className="text-xs text-muted-foreground mb-3 bg-muted/30 border rounded px-2 py-2">
        Listede olmayan kategori, marka veya modeli daha sonra <strong>Kategoriler</strong> ve{" "}
        <strong>Ürünler</strong> sayfalarından ekleyebilirsiniz. Aynı isimle önceden eklenenler
        atlanır.
      </p>

      <Accordion type="multiple" defaultValue={["categories", "services", "products"]} className="space-y-2">
        <AccordionItem value="categories" className="border rounded">
          <AccordionTrigger className="px-3 py-2 hover:no-underline">
            <span className="text-sm font-medium">
              Kategoriler ve Öznitelikler ({selectedCategories.size} / {detail.categories.length})
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 space-y-2">
            {detail.categories.map((c) => (
              <label key={c.name} className="flex items-start gap-2 cursor-pointer rounded p-2 hover:bg-muted/40">
                <Checkbox
                  checked={selectedCategories.has(c.name)}
                  onCheckedChange={() => onToggleCategory(c.name)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.name}</div>
                  {c.attributes.length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {c.attributes.length} öznitelik:{" "}
                      {c.attributes.map((a) => a.displayName).join(", ")}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </AccordionContent>
        </AccordionItem>

        {detail.extraServices.length > 0 && (
          <AccordionItem value="services" className="border rounded">
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <span className="text-sm font-medium">
                Ek Hizmetler ({selectedServices.size} / {detail.extraServices.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-1">
              {detail.extraServices.map((s) => (
                <label key={s.name} className="flex items-start gap-2 cursor-pointer rounded p-2 hover:bg-muted/40">
                  <Checkbox
                    checked={selectedServices.has(s.name)}
                    onCheckedChange={() => onToggleService(s.name)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  </div>
                </label>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {detail.productSuggestions.length > 0 && (
          <AccordionItem value="products" className="border rounded">
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <span className="text-sm font-medium">
                Önerilen Ürünler ({selectedProducts.size} / {totalProducts})
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onSetAllProducts(!allProductsSelected)}
                >
                  {allProductsSelected ? "Tüm Ürünleri Kaldır" : "Tüm Ürünleri Seç"}
                </Button>
                <span className="text-muted-foreground">
                  Sadece sizde olan modelleri seçin; gerisini sonra ekleyebilirsiniz.
                </span>
              </div>
              {productsByBrand.map(([brand, products]) => (
                <div key={brand} className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    {brand}
                  </div>
                  {products.map((p) => {
                    const key = `${p.category}|${p.brand}|${p.model}`
                    return (
                      <label
                        key={key}
                        className="flex items-start gap-2 cursor-pointer rounded p-2 hover:bg-muted/40 border"
                      >
                        <Checkbox
                          checked={selectedProducts.has(key)}
                          onCheckedChange={() => onToggleProduct(p)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{p.name}</div>
                          {p.attributes && Object.keys(p.attributes).length > 0 && (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {Object.entries(p.attributes)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ")}
                            </div>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </ScrollArea>
  )
}

function ApplySummaryStep({
  detail,
  categoryCount,
  attrCount,
  serviceCount,
  productCount,
}: {
  detail: import("./api").SectorTemplateDetail
  categoryCount: number
  attrCount: number
  serviceCount: number
  productCount: number
}) {
  return (
    <div className="space-y-4 p-1">
      <div className="rounded-md border bg-muted/20 p-4">
        <div className="text-sm font-medium mb-2">{detail.displayName} — Şu içerik eklenecek:</div>
        <ul className="space-y-1 text-sm">
          <li>
            <span className="font-medium">{categoryCount}</span> kategori
            {attrCount > 0 && (
              <span className="text-muted-foreground"> + {attrCount} öznitelik</span>
            )}
          </li>
          <li>
            <span className="font-medium">{serviceCount}</span> ek hizmet
          </li>
          <li>
            <span className="font-medium">{productCount}</span> ürün
          </li>
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">
        Aynı isimle önceden eklenmiş içerikler atlanacak — mevcut veriniz değişmeyecektir.
        Fiyatlar şablona dahil değildir; ürün ve hizmet fiyatlarını uygulama sonrasında
        kendiniz belirlemelisiniz.
      </p>
    </div>
  )
}

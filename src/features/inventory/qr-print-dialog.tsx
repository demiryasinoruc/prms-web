import { useEffect, useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { Printer, X, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QrLabel, type QrLabelData } from "./qr-label"

interface QrPrintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: QrLabelData[]
  title?: string
}

type Mode = "a4" | "roll"
type A4Preset = "preset-21" | "preset-14" | "preset-8" | "custom"

interface A4Config {
  preset: A4Preset
  cols: number
  rows: number
}

interface RollConfig {
  widthMm: number
  heightMm: number
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const A4_MARGIN_MM = 8

const A4_PRESETS: Record<Exclude<A4Preset, "custom">, { cols: number; rows: number; label: string }> = {
  "preset-21": { cols: 3, rows: 7, label: "Küçük — 3×7 = 21 etiket / sayfa (Avery uyumlu)" },
  "preset-14": { cols: 2, rows: 7, label: "Orta — 2×7 = 14 etiket / sayfa" },
  "preset-8": { cols: 2, rows: 4, label: "Büyük — 2×4 = 8 etiket / sayfa" },
}

function computeLabelSize(cols: number, rows: number) {
  return {
    widthMm: (A4_WIDTH_MM - 2 * A4_MARGIN_MM) / Math.max(cols, 1),
    heightMm: (A4_HEIGHT_MM - 2 * A4_MARGIN_MM) / Math.max(rows, 1),
  }
}

export function QrPrintDialog({
  open,
  onOpenChange,
  items,
  title = "QR Etiketleri",
}: QrPrintDialogProps) {
  const [mode, setMode] = useState<Mode>("a4")
  const [a4, setA4] = useState<A4Config>({ preset: "preset-21", cols: 3, rows: 7 })
  const [roll, setRoll] = useState<RollConfig>({ widthMm: 62, heightMm: 29 })
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ESC ile kapat + body scroll lock
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onOpenChange])

  const labelSizeMm = useMemo(() => {
    if (mode === "a4") return computeLabelSize(a4.cols, a4.rows)
    return { widthMm: roll.widthMm, heightMm: roll.heightMm }
  }, [mode, a4, roll])

  const pageCount = useMemo(() => {
    if (mode === "roll") return items.length
    const perPage = a4.cols * a4.rows
    return Math.max(1, Math.ceil(items.length / perPage))
  }, [mode, a4, items.length])

  // QR boyutu etiket alanına göre (küçük kenar × 0.5, max 100px)
  const qrPx = Math.min(100, Math.max(40, Math.round(labelSizeMm.widthMm * 2)))

  const printCss = useMemo(() => generatePrintCss(mode, a4, roll), [mode, a4, roll])

  const handlePresetChange = (value: A4Preset) => {
    if (value === "custom") {
      setA4({ preset: "custom", cols: a4.cols, rows: a4.rows })
    } else {
      const p = A4_PRESETS[value]
      setA4({ preset: value, cols: p.cols, rows: p.rows })
    }
  }

  if (!open) return null

  return createPortal(
    <>
      <style>{printCss}</style>
      <div className="qr-print-overlay fixed inset-0 z-50 overflow-auto bg-background">
        <div className="qr-print-controls sticky top-0 z-10 border-b bg-background">
          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">
                {items.length} etiket · {pageCount} sayfa ·{" "}
                {labelSizeMm.widthMm.toFixed(0)}×{labelSizeMm.heightMm.toFixed(0)}mm
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSettingsOpen((v) => !v)}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Ayarlar
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Yazdır
              </Button>
              <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
                <X className="mr-2 h-4 w-4" />
                Kapat
              </Button>
            </div>
          </div>

          {settingsOpen && (
            <div className="border-t bg-muted/30 p-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={mode === "a4" ? "default" : "outline"}
                  onClick={() => setMode("a4")}
                >
                  A4 Etiket Sayfası
                </Button>
                <Button
                  size="sm"
                  variant={mode === "roll" ? "default" : "outline"}
                  onClick={() => setMode("roll")}
                >
                  Rulo Yazıcı (Brother/Zebra/DYMO)
                </Button>
              </div>

              {mode === "a4" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Düzen</Label>
                    <Select value={a4.preset} onValueChange={(v) => handlePresetChange(v as A4Preset)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(A4_PRESETS) as Array<keyof typeof A4_PRESETS>).map((key) => (
                          <SelectItem key={key} value={key}>
                            {A4_PRESETS[key].label}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Özel (kendi satır/sütun)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {a4.preset === "custom" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Sütun (yatay)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={a4.cols}
                          onChange={(e) =>
                            setA4((c) => ({ ...c, cols: Math.max(1, Number(e.target.value) || 1) }))
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Satır (dikey)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={a4.rows}
                          onChange={(e) =>
                            setA4((c) => ({ ...c, rows: Math.max(1, Number(e.target.value) || 1) }))
                          }
                          className="h-9"
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Etiket Genişliği (mm)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={200}
                      step="0.1"
                      value={roll.widthMm}
                      onChange={(e) =>
                        setRoll((r) => ({ ...r, widthMm: Math.max(10, Number(e.target.value) || 10) }))
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Etiket Yüksekliği (mm)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={200}
                      step="0.1"
                      value={roll.heightMm}
                      onChange={(e) =>
                        setRoll((r) => ({ ...r, heightMm: Math.max(10, Number(e.target.value) || 10) }))
                      }
                      className="h-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    Yaygın boyutlar: Brother DK-22210 (29×90mm), DK-11209 (29×62mm), DYMO 30252 (28×89mm)
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Yazıcı diyaloğunda <strong>"Sayfaya sığdır" / "Ölçeklendirme: %100"</strong>{" "}
                ayarını kontrol edin. Aksi takdirde etiketler kayar.
              </p>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Yazdırılacak etiket yok.
          </div>
        ) : (
          <div className="qr-print-grid p-4">
            {items.map((item) => (
              <QrLabel key={item.id} item={item} qrSizePx={qrPx} />
            ))}
          </div>
        )}
      </div>
    </>,
    document.body,
  )
}

function generatePrintCss(mode: Mode, a4: A4Config, roll: RollConfig): string {
  // Onscreen layout — kullanıcı çıktıyı görsün diye min kare grid (print'te override edilir)
  const baseCss = `
    .qr-print-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.5rem;
    }
  `

  if (mode === "a4") {
    const { widthMm, heightMm } = computeLabelSize(a4.cols, a4.rows)
    return `
      ${baseCss}
      @media print {
        @page { size: A4; margin: ${A4_MARGIN_MM}mm; }
        body > *:not(.qr-print-overlay) { display: none !important; }
        .qr-print-overlay {
          position: static !important;
          inset: auto !important;
          background: white !important;
          overflow: visible !important;
        }
        .qr-print-overlay .qr-print-controls { display: none !important; }
        .qr-print-overlay .qr-print-grid {
          display: grid !important;
          grid-template-columns: repeat(${a4.cols}, ${widthMm}mm) !important;
          grid-auto-rows: ${heightMm}mm !important;
          gap: 0 !important;
          padding: 0 !important;
          width: ${a4.cols * widthMm}mm !important;
        }
        .qr-print-overlay .qr-print-grid > * {
          width: ${widthMm}mm !important;
          height: ${heightMm}mm !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin: 0 !important;
          border: 1px dashed #aaa !important;
        }
      }
    `
  }

  // roll mode: tek etiket / sayfa, sayfa boyutu = etiket
  return `
    ${baseCss}
    @media print {
      @page { size: ${roll.widthMm}mm ${roll.heightMm}mm; margin: 2mm; }
      body > *:not(.qr-print-overlay) { display: none !important; }
      .qr-print-overlay {
        position: static !important;
        inset: auto !important;
        background: white !important;
        overflow: visible !important;
      }
      .qr-print-overlay .qr-print-controls { display: none !important; }
      .qr-print-overlay .qr-print-grid {
        display: block !important;
        padding: 0 !important;
      }
      .qr-print-overlay .qr-print-grid > * {
        width: ${roll.widthMm - 4}mm !important;
        height: ${roll.heightMm - 4}mm !important;
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 !important;
        border: none !important;
      }
      .qr-print-overlay .qr-print-grid > *:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
    }
  `
}

import { useEffect, useRef, useState } from "react"
import { Camera, CameraOff, ScanLine } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BarcodeScannerProps {
  /**
   * Bir barkod/QR okunduğunda veya manuel input Enter ile gönderildiğinde çağrılır.
   * Çağıran trim/normalize yapmalıdır.
   */
  onScan: (value: string) => void
  /** Manuel input placeholder'ı */
  placeholder?: string
  /** Component disable edilirse hem kamera hem input devre dışı */
  disabled?: boolean
  /** Otomatik fokus (USB reader senaryosu için varsayılan true) */
  autoFocus?: boolean
}

// Aynı barkodun art arda okunması yaygın (kamera 1-2 saniyede aynı koda 5-10 kez decode eder).
// Bu pencere içinde aynı değer tekrar gelirse yok sayılır.
const DEDUP_WINDOW_MS = 1500

const SCANNER_DIV_ID = "barcode-scanner-region"

export function BarcodeScanner({
  onScan,
  placeholder = "Barkod / Seri No",
  disabled = false,
  autoFocus = true,
}: BarcodeScannerProps) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [manualValue, setManualValue] = useState("")
  const [cameraStarting, setCameraStarting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScanRef = useRef<{ value: string; ts: number } | null>(null)
  // onScan referansını güncel tutmak için ref — kamera callback'i stale closure yapmasın.
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  const emit = (raw: string) => {
    const value = raw.trim()
    if (!value) return

    const now = Date.now()
    const last = lastScanRef.current
    if (last && last.value === value && now - last.ts < DEDUP_WINDOW_MS) {
      return // dedup
    }
    lastScanRef.current = { value, ts: now }
    onScanRef.current(value)
  }

  const startCamera = async () => {
    if (cameraStarting || scannerRef.current) return
    setCameraStarting(true)
    try {
      const scanner = new Html5Qrcode(SCANNER_DIV_ID)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.7777,
        },
        (decoded) => emit(decoded),
        () => { /* her frame çağrılır — error noise olur, yok sayıyoruz */ },
      )
    } catch (err) {
      scannerRef.current = null
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Kamera açılamadı: ${msg}`)
      setCameraOpen(false)
    } finally {
      setCameraStarting(false)
    }
  }

  const stopCamera = async () => {
    const scanner = scannerRef.current
    if (!scanner) return
    scannerRef.current = null
    try {
      await scanner.stop()
      await scanner.clear()
    } catch {
      // stop sırasında "already stopped" benzeri hataları yutuyoruz
    }
  }

  // cameraOpen değiştiğinde başlat/durdur
  useEffect(() => {
    if (cameraOpen) {
      startCamera()
    } else {
      stopCamera()
    }
    // unmount cleanup
    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen])

  // disabled olduğunda kamerayı kapat
  useEffect(() => {
    if (disabled && cameraOpen) setCameraOpen(false)
  }, [disabled, cameraOpen])

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (manualValue.trim()) {
        emit(manualValue)
        setManualValue("")
      }
    }
  }

  return (
    <div className="space-y-2 rounded-md border p-3 bg-muted/20">
      <div className="flex items-center gap-2">
        <ScanLine className="h-4 w-4 text-muted-foreground" />
        <Label className="text-xs font-medium">Barkod Okutma</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2 text-xs"
          onClick={() => setCameraOpen((v) => !v)}
          disabled={disabled || cameraStarting}
        >
          {cameraOpen ? (
            <>
              <CameraOff className="mr-1.5 h-3.5 w-3.5" />
              Kamerayı Kapat
            </>
          ) : (
            <>
              <Camera className="mr-1.5 h-3.5 w-3.5" />
              Kamera Aç
            </>
          )}
        </Button>
      </div>

      {/* Kamera preview alanı — kapalıyken div mount edilmez ki Html5Qrcode hata almasın */}
      {cameraOpen && (
        <div className="overflow-hidden rounded border bg-black">
          <div id={SCANNER_DIV_ID} className="w-full" />
        </div>
      )}

      <Input
        ref={inputRef}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={manualValue}
        onChange={(e) => setManualValue(e.target.value)}
        onKeyDown={handleManualKeyDown}
        disabled={disabled}
        className="h-9 font-mono"
      />
      <p className="text-xs text-muted-foreground">
        USB okuyucu kullanıyorsanız bu kutu odaklı kalsın; kamera için "Kamera Aç" butonuna basın.
      </p>
    </div>
  )
}

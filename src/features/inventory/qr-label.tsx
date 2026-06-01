import { QRCodeSVG } from "qrcode.react"

export interface QrLabelData {
  id: string
  serialNumber: string | null | undefined
  productName: string
  productCode?: string | null
  variantSku?: string | null
}

interface QrLabelProps {
  item: QrLabelData
  /** QR boyutu (px). Print'te etiket boyutuna göre QrPrintDialog ayarlar. Default 80. */
  qrSizePx?: number
}

/**
 * Tek bir envanter için QR etiket: QR + ürün adı + seri no/ürün kodu.
 * QR içeriği iade dialog'undaki BarcodeScanner ile eşleşmesi için
 * inventorySerialNumber'a denk gelmeli — fallback olarak productCode.
 */
export function QrLabel({ item, qrSizePx = 80 }: QrLabelProps) {
  const qrValue = (item.serialNumber || item.productCode || "").trim()
  const hasContent = qrValue.length > 0

  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-md border border-dashed p-2 break-inside-avoid">
      <div className="shrink-0 bg-white">
        {hasContent ? (
          <QRCodeSVG value={qrValue} size={qrSizePx} level="M" />
        ) : (
          <div
            style={{ width: qrSizePx, height: qrSizePx }}
            className="flex items-center justify-center text-xs text-muted-foreground border border-dashed"
          >
            Kod yok
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="font-medium text-xs leading-tight line-clamp-2">
          {item.productName}
        </div>
        {item.variantSku && (
          <div className="mt-0.5 text-[10px] text-muted-foreground font-mono truncate">
            {item.variantSku}
          </div>
        )}
        {hasContent && (
          <div className="mt-0.5 text-[10px] font-mono break-all leading-tight">{qrValue}</div>
        )}
      </div>
    </div>
  )
}

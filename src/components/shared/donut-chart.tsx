import { useId } from "react"

export interface DonutSegment {
  value: number
  /** CSS renk değeri — örn. "oklch(var(--primary))" veya "#f59e0b" */
  color: string
  label: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  /** Çap (px) */
  size?: number
  /** Halka kalınlığı (px) */
  thickness?: number
  /** Ortada gösterilecek büyük değer (verilmezse toplam) */
  centerValue?: number | string
  /** Ortada küçük etiket */
  centerLabel?: string
}

/**
 * Bağımlılıksız, saf-SVG donut grafiği. Anlık sayılardan oluşan
 * kompozisyonları (örn. bakım durum dağılımı) tek bakışta gösterir.
 * Tüm segmentler 0 ise nötr (muted) bir halka çizer.
 */
export function DonutChart({
  segments,
  size = 132,
  thickness = 14,
  centerValue,
  centerLabel,
}: DonutChartProps) {
  const id = useId()
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  // Segmentleri dasharray ile ardışık olarak yerleştir
  let offsetAcc = 0
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s, i) => {
      const fraction = s.value / total
      const dash = fraction * circumference
      const arc = {
        key: `${id}-${i}`,
        color: s.color,
        dasharray: `${dash} ${circumference - dash}`,
        dashoffset: -offsetAcc,
      }
      offsetAcc += dash
      return arc
    })

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
      className="tabular-nums"
    >
      {/* Taban halka */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="oklch(var(--muted))"
        strokeWidth={thickness}
      />
      {/* Segmentler — saat 12'den başlat */}
      <g transform={`rotate(-90 ${center} ${center})`}>
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={thickness}
            strokeDasharray={arc.dasharray}
            strokeDashoffset={arc.dashoffset}
            strokeLinecap="butt"
          />
        ))}
      </g>
      {/* Orta etiket */}
      <text
        x={center}
        y={center - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground"
        style={{ fontSize: size * 0.26, fontWeight: 700 }}
      >
        {centerValue ?? total}
      </text>
      {centerLabel && (
        <text
          x={center}
          y={center + size * 0.16}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          style={{ fontSize: size * 0.1 }}
        >
          {centerLabel}
        </text>
      )}
    </svg>
  )
}

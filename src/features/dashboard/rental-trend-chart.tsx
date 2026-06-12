import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { RentalTrendPoint } from "./api"

interface RentalTrendChartProps {
  data: RentalTrendPoint[]
}

interface TooltipPayload {
  active?: boolean
  payload?: { payload: RentalTrendPoint }[]
}

function ChartTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="font-medium text-popover-foreground">
        {format(parseISO(point.date), "d MMMM yyyy", { locale: tr })}
      </div>
      <div className="text-muted-foreground tabular-nums">
        {point.count} kiralama
      </div>
    </div>
  )
}

export function RentalTrendChart({ data }: RentalTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="rentalTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="oklch(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="oklch(var(--border))"
        />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => format(parseISO(value), "d MMM", { locale: tr })}
          tick={{ fontSize: 11, fill: "oklch(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          allowDecimals={false}
          width={32}
          tick={{ fontSize: 11, fill: "oklch(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "oklch(var(--primary))", strokeOpacity: 0.3 }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="oklch(var(--primary))"
          strokeWidth={2}
          fill="url(#rentalTrendFill)"
          dot={false}
          activeDot={{ r: 4, fill: "oklch(var(--primary))" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

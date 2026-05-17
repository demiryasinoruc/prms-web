import { Download, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useInvoices } from "./hooks"
import { InvoiceStatusBadge } from "./invoice-status-badge"
import { toast } from "sonner"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

function shortId(id: string): string {
  if (id.length <= 8) return id.toUpperCase()
  return id.slice(0, 8).toUpperCase()
}

export function InvoicesTab() {
  const { data: invoices, isLoading } = useInvoices()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fatura Geçmişi</CardTitle>
        <CardDescription>
          Tahsil edilen ve bekleyen tüm faturalarınız.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Henüz fatura kaydı bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Fatura No</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="w-[100px] text-right">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs uppercase tabular-nums text-muted-foreground">
                      {shortId(invoice.id)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">{formatDate(invoice.issueDate)}</div>
                        {invoice.paidDate && (
                          <div className="text-xs text-muted-foreground">
                            Ödendi: {formatDate(invoice.paidDate)}
                          </div>
                        )}
                        {invoice.failureReason && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            {invoice.failureReason}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => toast.info("PDF indirme Faz 2A.5 sonrası eklenecek.")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

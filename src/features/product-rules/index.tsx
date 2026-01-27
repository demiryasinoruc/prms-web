import { useState } from "react"
import { MoreHorizontal, Plus, Pencil, Trash2, Link2, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ProductRuleType,
  ProductRuleTypeLabels,
  ProductRuleBehavior,
  ProductRuleBehaviorLabels,
} from "./api"
import { useProductRules, useDeleteProductRule } from "./hooks"
import { useProductSelect } from "@/features/products/hooks"
import { ProductRuleDialog } from "./product-rule-dialog"

export default function ProductRulesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sourceProductFilter, setSourceProductFilter] = useState<string>("all")

  const { data: products } = useProductSelect()
  const { data: rules, isLoading } = useProductRules({
    sourceProductId: sourceProductFilter !== "all" ? sourceProductFilter : undefined,
  })
  const deleteRule = useDeleteProductRule()

  const handleEdit = (id: string) => {
    setEditingId(id)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingId(null)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingId(null)
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteRule.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  const getBehaviorVariant = (behavior: ProductRuleBehavior) => {
    switch (behavior) {
      case ProductRuleBehavior.Required:
        return "destructive"
      case ProductRuleBehavior.Suggested:
        return "default"
      case ProductRuleBehavior.Automatic:
        return "secondary"
      default:
        return "outline"
    }
  }

  const getTypeIcon = (type: ProductRuleType) => {
    switch (type) {
      case ProductRuleType.Direct:
        return <Link2 className="h-4 w-4" />
      case ProductRuleType.FromGroup:
        return <span className="text-xs">📁</span>
      case ProductRuleType.Ratio:
        return <span className="text-xs">⚖️</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ürün Kuralları</h1>
          <p className="text-muted-foreground">
            Ürün bağımlılık kurallarını yönetin
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kural
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kurallar</CardTitle>
          <CardDescription>
            Bir ürün kiralandığında hangi ürünlerin de eklenmesi gerektiğini tanımlayan kurallar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtreler */}
          <div className="flex items-center gap-4 mb-4">
            <Select
              value={sourceProductFilter}
              onValueChange={setSourceProductFilter}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Kaynak Ürün" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Ürünler</SelectItem>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !rules || rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Link2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Henüz ürün kuralı tanımlanmamış</p>
              <Button variant="outline" className="mt-4" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                İlk Kuralı Oluştur
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kaynak Ürün</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Hedef</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Davranış</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead>VEYA Grubu</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {rule.sourceProductName}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      {rule.type === ProductRuleType.FromGroup ? (
                        <span className="text-muted-foreground">
                          📁 {rule.targetCategoryName}
                        </span>
                      ) : (
                        rule.targetProductName
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(rule.type)}
                        <span className="text-sm text-muted-foreground">
                          {ProductRuleTypeLabels[rule.type]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBehaviorVariant(rule.behavior)}>
                        {ProductRuleBehaviorLabels[rule.behavior]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {rule.quantity}
                    </TableCell>
                    <TableCell>
                      {rule.ruleGroupId ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {rule.ruleGroupId.slice(0, 8)}...
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => navigator.clipboard.writeText(rule.ruleGroupId!)}
                            title="Grup ID'yi kopyala"
                          >
                            <span className="text-xs">📋</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(rule.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(rule.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProductRuleDialog
        key={editingId ?? "new"}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editId={editingId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kuralı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kuralı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

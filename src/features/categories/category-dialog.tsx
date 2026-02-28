import { useForm } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateCategory, useUpdateCategory, useCategoryForEdit, useCategorySelectParent } from "./hooks"
import type { Category } from "./api"

const categorySchema = z.object({
  name: z.string().min(1, "Kategori adı zorunlu"),
  parentId: z.string().nullable().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
}

const defaultValues: CategoryFormData = {
  name: "",
  parentId: null,
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: CategoryDialogProps) {
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const { data: categoryData } = useCategoryForEdit(category?.id || "")
  const { data: parentCategories } = useCategorySelectParent()
  const editCategory = category ? categoryData : null

  const formValues: CategoryFormData = (open && editCategory) ? {
    name: editCategory.name,
    parentId: editCategory.parentCategoryId || null,
  } : (open && category) ? {
    name: category.name,
    parentId: category.parentCategoryId || null,
  } : defaultValues

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: formResolver<CategoryFormData>(categorySchema),
    defaultValues,
    values: open ? formValues : defaultValues,
  })

  const parentId = watch("parentId")

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (category) {
        await updateCategory.mutateAsync({
          id: category.id,
          data: {
            name: data.name,
            parentId: data.parentId || null,
          },
        })
      } else {
        await createCategory.mutateAsync({
          name: data.name,
          parentId: data.parentId || null,
        })
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createCategory.isPending || updateCategory.isPending

  // Filter out current category from parent options (can't be its own parent)
  const availableParents = parentCategories?.filter(
    (p) => !category || p.id !== category.id
  ) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? "Kategori Düzenle" : "Yeni Kategori"}
          </DialogTitle>
          <DialogDescription>
            Kategori bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Kategori Adı *</Label>
            <Input
              placeholder="Kategori adı"
              {...register("name")}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Üst Kategori</Label>
            <Select
              key={`parentId-${parentId}`}
              value={parentId || "none"}
              onValueChange={(value) => setValue("parentId", value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Üst kategori seçin (isteğe bağlı)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Üst kategori yok</SelectItem>
                {availableParents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {category ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

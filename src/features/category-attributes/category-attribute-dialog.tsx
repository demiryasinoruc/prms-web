import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateCategoryAttribute,
  useUpdateCategoryAttribute,
  useCategoryAttributeForEdit,
} from "./hooks"
import {
  AttributeDataType,
  AttributeDataTypeLabels,
  type CategoryAttribute,
} from "./api"
import { useCategorySelect } from "@/features/categories/hooks"

const schema = z.object({
  categoryId: z.string().min(1, "Kategori seçiniz"),
  name: z.string().min(1, "Özellik adı gerekli"),
  displayName: z.string().min(1, "Görünen ad gerekli"),
  dataType: z.nativeEnum(AttributeDataType),
  isRequired: z.boolean(),
  displayOrder: z.number().min(0),
  defaultValue: z.string().nullable().optional(),
  placeholder: z.string().nullable().optional(),
  helpText: z.string().nullable().optional(),
  selectOptions: z.string().nullable().optional(),
  showInList: z.boolean(),
  showInFilter: z.boolean(),
  isSearchable: z.boolean(),
  inheritToChildren: z.boolean(),
  isVariantAttribute: z.boolean(),
  isActive: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface CategoryAttributeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute?: CategoryAttribute | null
}

const defaultValues: FormData = {
  categoryId: "",
  name: "",
  displayName: "",
  dataType: AttributeDataType.String,
  isRequired: false,
  displayOrder: 0,
  defaultValue: null,
  placeholder: null,
  helpText: null,
  selectOptions: null,
  showInList: false,
  showInFilter: false,
  isSearchable: false,
  inheritToChildren: true,
  isVariantAttribute: false,
  isActive: true,
}

export function CategoryAttributeDialog({
  open,
  onOpenChange,
  attribute,
}: CategoryAttributeDialogProps) {
  const isEditMode = !!attribute
  const { data: categories } = useCategorySelect()
  const { data: editData, isLoading: isLoadingEdit } =
    useCategoryAttributeForEdit(attribute?.id || null)
  const createMutation = useCreateCategoryAttribute()
  const updateMutation = useUpdateCategoryAttribute()

  const [selectOptionsArray, setSelectOptionsArray] = useState<string[]>([])
  const [newOption, setNewOption] = useState("")

  const formValues =
    open && isEditMode && editData
      ? {
          categoryId: editData.categoryId?.toLowerCase(),
          name: editData.name,
          displayName: editData.displayName,
          dataType: editData.dataType,
          isRequired: editData.isRequired,
          displayOrder: editData.displayOrder,
          defaultValue: editData.defaultValue || null,
          placeholder: editData.placeholder || null,
          helpText: editData.helpText || null,
          selectOptions: editData.selectOptions || null,
          showInList: editData.showInList,
          showInFilter: editData.showInFilter,
          isSearchable: editData.isSearchable,
          inheritToChildren: editData.inheritToChildren,
          isVariantAttribute: editData.isVariantAttribute,
          isActive: editData.isActive,
        }
      : defaultValues

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: open ? formValues : defaultValues,
  })

  const watchedDataType = watch("dataType")

  // Parse selectOptions when edit data is loaded
  useEffect(() => {
    if (editData?.selectOptions) {
      try {
        const parsed = JSON.parse(editData.selectOptions)
        if (Array.isArray(parsed)) {
          setSelectOptionsArray(parsed)
        }
      } catch {
        setSelectOptionsArray([])
      }
    } else {
      setSelectOptionsArray([])
    }
  }, [editData])

  const handleAddOption = () => {
    if (newOption.trim()) {
      const updated = [...selectOptionsArray, newOption.trim()]
      setSelectOptionsArray(updated)
      setValue("selectOptions", JSON.stringify(updated))
      setNewOption("")
    }
  }

  const handleRemoveOption = (index: number) => {
    const updated = selectOptionsArray.filter((_, i) => i !== index)
    setSelectOptionsArray(updated)
    setValue("selectOptions", updated.length > 0 ? JSON.stringify(updated) : null)
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode && attribute) {
        await updateMutation.mutateAsync({
          id: attribute.id,
          data: {
            name: data.name,
            displayName: data.displayName,
            dataType: data.dataType,
            isRequired: data.isRequired,
            displayOrder: data.displayOrder,
            defaultValue: data.defaultValue,
            placeholder: data.placeholder,
            helpText: data.helpText,
            selectOptions: data.selectOptions,
            validationRules: null,
            showInList: data.showInList,
            showInFilter: data.showInFilter,
            isSearchable: data.isSearchable,
            inheritToChildren: data.inheritToChildren,
            isVariantAttribute: data.isVariantAttribute,
            isActive: data.isActive,
          },
        })
      } else {
        await createMutation.mutateAsync({
          categoryId: data.categoryId,
          name: data.name,
          displayName: data.displayName,
          dataType: data.dataType,
          isRequired: data.isRequired,
          displayOrder: data.displayOrder,
          defaultValue: data.defaultValue,
          placeholder: data.placeholder,
          helpText: data.helpText,
          selectOptions: data.selectOptions,
          validationRules: null,
          showInList: data.showInList,
          showInFilter: data.showInFilter,
          isSearchable: data.isSearchable,
          inheritToChildren: data.inheritToChildren,
          isVariantAttribute: data.isVariantAttribute,
        })
      }
      onOpenChange(false)
    } catch {
      // Error handled in mutation
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Özellik Düzenle" : "Yeni Özellik Ekle"}
          </DialogTitle>
          <DialogDescription>
            Kategori özellik bilgilerini doldurun.
          </DialogDescription>
        </DialogHeader>

        {isEditMode && isLoadingEdit ? (
          <div className="py-8 text-center text-muted-foreground">
            Yükleniyor...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Kategori */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">Kategori</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    key={`category-${field.value}`}
                    value={field.value || "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? "" : value)
                    }
                    disabled={isEditMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="none" value="none" disabled>
                        Kategori seçiniz
                      </SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-sm text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Özellik Adı ve Görünen Ad */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Özellik Adı (Kod)</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="ornek_ozellik"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Görünen Ad</Label>
                <Input
                  id="displayName"
                  {...register("displayName")}
                  placeholder="Örnek Özellik"
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">
                    {errors.displayName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Veri Tipi ve Sıralama */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataType">Veri Tipi</Label>
                <Controller
                  control={control}
                  name="dataType"
                  render={({ field }) => (
                    <Select
                      key={`datatype-${field.value}`}
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Veri tipi seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AttributeDataTypeLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Sıralama</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  {...register("displayOrder", { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Select/MultiSelect için Seçenekler */}
            {(watchedDataType === AttributeDataType.Select ||
              watchedDataType === AttributeDataType.MultiSelect) && (
              <div className="space-y-2">
                <Label>Seçenekler</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Yeni seçenek ekle"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddOption()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddOption}>
                    Ekle
                  </Button>
                </div>
                {selectOptionsArray.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectOptionsArray.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-muted px-2 py-1 rounded"
                      >
                        <span className="text-sm">{option}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Placeholder ve Yardım Metni */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  {...register("placeholder")}
                  placeholder="Örnek: Değer giriniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultValue">Varsayılan Değer</Label>
                <Input id="defaultValue" {...register("defaultValue")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="helpText">Yardım Metni</Label>
              <Textarea
                id="helpText"
                {...register("helpText")}
                placeholder="Kullanıcıya gösterilecek yardım metni"
              />
            </div>

            {/* Switch'ler */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="isRequired">Zorunlu</Label>
                  <p className="text-sm text-muted-foreground">
                    Bu alan zorunlu mu?
                  </p>
                </div>
                <Controller
                  control={control}
                  name="isRequired"
                  render={({ field }) => (
                    <Switch
                      id="isRequired"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="inheritToChildren">Miras</Label>
                  <p className="text-sm text-muted-foreground">
                    Alt kategorilere geçsin mi?
                  </p>
                </div>
                <Controller
                  control={control}
                  name="inheritToChildren"
                  render={({ field }) => (
                    <Switch
                      id="inheritToChildren"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            {/* Varyant Özelliği (sadece Select tipinde) */}
            {watchedDataType === AttributeDataType.Select && (
              <div className="flex items-center justify-between rounded-lg border p-3 border-primary/30 bg-primary/5">
                <div>
                  <Label htmlFor="isVariantAttribute">Varyant Özelliği</Label>
                  <p className="text-sm text-muted-foreground">
                    Ürün varyantları oluşturmak için kullanılsın mı?
                  </p>
                </div>
                <Controller
                  control={control}
                  name="isVariantAttribute"
                  render={({ field }) => (
                    <Switch
                      id="isVariantAttribute"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="showInList">Listede Göster</Label>
                </div>
                <Controller
                  control={control}
                  name="showInList"
                  render={({ field }) => (
                    <Switch
                      id="showInList"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="showInFilter">Filtrede Göster</Label>
                </div>
                <Controller
                  control={control}
                  name="showInFilter"
                  render={({ field }) => (
                    <Switch
                      id="showInFilter"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="isSearchable">Aranabilir</Label>
                </div>
                <Controller
                  control={control}
                  name="isSearchable"
                  render={({ field }) => (
                    <Switch
                      id="isSearchable"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            {/* Durum (sadece edit modda) */}
            {isEditMode && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="isActive">Durum</Label>
                  <p className="text-sm text-muted-foreground">
                    Özellik aktif mi?
                  </p>
                </div>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

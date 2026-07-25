import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SwitchField } from "@/components/shared/switch-field"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
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
import { CategoryFilterSelect } from "@/components/shared/category-filter-select"

const schema = z.object({
  categoryId: z.string().min(1, "Kategori seçiniz"),
  name: z.string().min(1, "Özellik adı zorunludur").max(200, "Özellik adı en fazla 200 karakter olabilir"),
  displayName: z.string().min(1, "Görünen ad zorunludur").max(200, "Görünen ad en fazla 200 karakter olabilir"),
  dataType: z.nativeEnum(AttributeDataType),
  isRequired: z.boolean(),
  displayOrder: z.number().min(0, "Görüntüleme sırası 0 veya daha büyük olmalıdır"),
  defaultValue: z.string().max(500, "Varsayılan değer en fazla 500 karakter olabilir").nullable().optional(),
  placeholder: z.string().max(500, "Yer tutucu en fazla 500 karakter olabilir").nullable().optional(),
  helpText: z.string().max(500, "Yardım metni en fazla 500 karakter olabilir").nullable().optional(),
  selectOptions: z.string().max(2000, "Seçenek listesi en fazla 2000 karakter olabilir").nullable().optional(),
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
  const { data: editData, isLoading: isLoadingEdit } =
    useCategoryAttributeForEdit(attribute?.id || null)
  const createMutation = useCreateCategoryAttribute()
  const updateMutation = useUpdateCategoryAttribute()

  const [selectOptionsArray, setSelectOptionsArray] = useState<string[]>([])
  const [newOption, setNewOption] = useState("")

  const formValues =
    open && isEditMode && editData
      ? {
          categoryId: editData.categoryId,
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
    resolver: formResolver<FormData>(schema),
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
            {/* Bilgilendirme: alanlar ne işe yarar */}
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Info className="h-3.5 w-3.5" /> Bu alanlar ne işe yarar?
              </div>
              <p>
                <strong>Özellik Adı (Kod):</strong> Sistemin kullandığı benzersiz, boşluksuz kod
                (ör. <code>renk</code>). Sonradan değiştirilemez.
              </p>
              <p>
                <strong>Görünen Ad:</strong> Formlarda kullanıcıya gösterilen etiket (ör. "Renk").
              </p>
              <p>
                <strong>Veri Tipi:</strong> Değerin türü — metin, sayı, tarih, Evet/Hayır veya seçim
                listesi. "Seçim / Çoklu Seçim" seçilirse aşağıda <strong>Seçenekler</strong> listesi çıkar.
              </p>
              <p>
                <strong>Varyant Özelliği:</strong> Bu özellikten ürün varyantları (ör. Beden: S/M/L)
                üretilsin mi? Yalnızca "Seçim" tipinde kullanılabilir.
              </p>
              <p>
                <strong>Seçenekler:</strong> Yalnızca "Seçim / Çoklu Seçim" tipinde görünür;
                kullanıcıya sunulacak hazır değerleri (ör. Kırmızı, Mavi) buradan eklersiniz.
              </p>
              <p>
                <strong>Placeholder:</strong> Alan boşken içinde gösterilen ipucu metni.{" "}
                <strong>Varsayılan Değer:</strong> Yeni üründe otomatik dolu gelecek değer.{" "}
                <strong>Yardım Metni:</strong> Alanın altında görünen açıklama.
              </p>
              <p>
                <strong>Miras:</strong> Bu özellik alt kategorilere de otomatik uygulansın.
              </p>
              <p>
                <strong>Listede / Filtrede Göster · Aranabilir:</strong> Özelliğin ürün listesinde
                kolon olarak, filtre panelinde ölçüt olarak ve aramada dikkate alınıp alınmayacağı.
              </p>
              <p>
                <strong>Zorunlu:</strong> Ürün eklenirken bu alanın doldurulması zorunlu olsun.
              </p>
            </div>

            {/* Kategori */}
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <CategoryFilterSelect
                  value={field.value || null}
                  onChange={(v) => field.onChange(v || "")}
                  label="Kategori"
                  required
                  error={errors.categoryId?.message}
                  disabled={isEditMode}
                />
              )}
            />

            {/* Özellik Adı ve Görünen Ad */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Özellik Adı (Kod)"
                {...register("name")}
                placeholder="ornek_ozellik"
                error={errors.name?.message}
              />

              <FormField
                label="Görünen Ad"
                {...register("displayName")}
                placeholder="Örnek Özellik"
                error={errors.displayName?.message}
              />
            </div>

            {/* Veri Tipi ve Sıralama */}
            <div className="grid grid-cols-2 gap-4">
              <FormSelectField
                label="Veri Tipi"
                name="dataType"
                control={control}
                valueType="number"
                options={Object.entries(AttributeDataTypeLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                placeholder="Veri tipi seçiniz"
              />

              <FormField
                label="Sıralama"
                type="number"
                {...register("displayOrder", { valueAsNumber: true })}
              />
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
              <FormField
                label="Placeholder"
                {...register("placeholder")}
                placeholder="Örnek: Değer giriniz"
              />

              <FormField
                label="Varsayılan Değer"
                {...register("defaultValue")}
              />
            </div>

            <FormField
              label="Yardım Metni"
              {...register("helpText")}
              placeholder="Kullanıcıya gösterilecek yardım metni"
              multiline
            />

            {/* Switch'ler */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name="isRequired"
                render={({ field }) => (
                  <SwitchField
                    label="Zorunlu"
                    description="Bu alan zorunlu mu?"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="inheritToChildren"
                render={({ field }) => (
                  <SwitchField
                    label="Miras"
                    description="Alt kategorilere geçsin mi?"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Varyant Özelliği (sadece Select tipinde) */}
            {watchedDataType === AttributeDataType.Select && (
              <Controller
                control={control}
                name="isVariantAttribute"
                render={({ field }) => (
                  <SwitchField
                    label="Varyant Özelliği"
                    description="Ürün varyantları oluşturmak için kullanılsın mı?"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-primary/30 bg-primary/5"
                  />
                )}
              />
            )}

            <div className="grid grid-cols-3 gap-4">
              <Controller
                control={control}
                name="showInList"
                render={({ field }) => (
                  <SwitchField
                    label="Listede Göster"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="showInFilter"
                render={({ field }) => (
                  <SwitchField
                    label="Filtrede Göster"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="isSearchable"
                render={({ field }) => (
                  <SwitchField
                    label="Aranabilir"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Durum (sadece edit modda) */}
            {isEditMode && (
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <SwitchField
                    label="Durum"
                    description="Özellik aktif mi?"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
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

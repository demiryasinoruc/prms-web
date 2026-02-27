import { useEffect, useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Link } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useCreateRole, useUpdateRole, useRoleForEdit, useRoleForCreate } from "./hooks"
import type { Role, RoleModule } from "./api"

const roleSchema = z.object({
  name: z.string().min(1, "Rol adı zorunlu"),
})

type RoleFormData = z.infer<typeof roleSchema>

interface RoleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
}

export function RoleSheet({ open, onOpenChange, role }: RoleSheetProps) {
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()

  const { data: editData, isLoading: isEditLoading } = useRoleForEdit(role?.id || "")
  const { data: createData, isLoading: isCreateLoading } = useRoleForCreate()

  const [permissions, setPermissions] = useState<Record<number, boolean>>({})

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
    },
  })

  // Get modules based on mode
  const modules: RoleModule[] = role ? (editData?.modules || []) : (createData || [])
  const isLoading = role ? isEditLoading : isCreateLoading

  // Create permission lookup map for showing names in toast
  const permissionMap = useMemo(() => {
    const map: Record<number, string> = {}
    modules.forEach((module) => {
      module.permissions.forEach((perm) => {
        map[perm.id] = perm.name
      })
    })
    return map
  }, [modules])

  // Create reverse lookup: which permissions depend on each permission
  // If permission A has relatedPermissions [B], then B is required by A
  // So when B is unchecked, A should also be unchecked
  const dependentPermissionsMap = useMemo(() => {
    const map: Record<number, number[]> = {}
    modules.forEach((module) => {
      module.permissions.forEach((perm) => {
        perm.relatedPermissions.forEach((requiredId) => {
          if (!map[requiredId]) {
            map[requiredId] = []
          }
          map[requiredId].push(perm.id)
        })
      })
    })
    return map
  }, [modules])

  useEffect(() => {
    if (!open) {
      reset({ name: "" })
      setPermissions({})
      return
    }

    if (role && editData) {
      reset({ name: editData.name })
      // Set permissions from edit data
      const permMap: Record<number, boolean> = {}
      editData.modules.forEach((module) => {
        module.permissions.forEach((perm) => {
          permMap[perm.id] = perm.isGranted
        })
      })
      setPermissions(permMap)
    } else if (!role && createData) {
      reset({ name: "" })
      // Set default permissions from create data
      const permMap: Record<number, boolean> = {}
      createData.forEach((module) => {
        module.permissions.forEach((perm) => {
          permMap[perm.id] = perm.isGranted
        })
      })
      setPermissions(permMap)
    }
  }, [open, role, editData, createData, reset])

  const handlePermissionChange = (permissionId: number, checked: boolean, relatedPermissions: number[]) => {
    setPermissions((prev) => {
      const updated = { ...prev, [permissionId]: checked }

      if (checked && relatedPermissions.length > 0) {
        // If enabling, also enable required permissions
        const autoEnabled: string[] = []
        relatedPermissions.forEach((relId) => {
          if (!prev[relId]) {
            updated[relId] = true
            autoEnabled.push(permissionMap[relId] || `#${relId}`)
          }
        })
        if (autoEnabled.length > 0) {
          toast.info(`Bağımlı izinler otomatik etkinleştirildi: ${autoEnabled.join(", ")}`)
        }
      } else if (!checked) {
        // If disabling, also disable permissions that depend on this one
        const dependentIds = dependentPermissionsMap[permissionId] || []
        const autoDisabled: string[] = []
        dependentIds.forEach((depId) => {
          if (prev[depId]) {
            updated[depId] = false
            autoDisabled.push(permissionMap[depId] || `#${depId}`)
          }
        })
        if (autoDisabled.length > 0) {
          toast.info(`Bağımlı izinler otomatik kaldırıldı: ${autoDisabled.join(", ")}`)
        }
      }

      return updated
    })
  }

  const handleModuleSelectAll = (module: RoleModule, checked: boolean) => {
    setPermissions((prev) => {
      const updated = { ...prev }
      module.permissions.forEach((perm) => {
        updated[perm.id] = checked
      })
      return updated
    })
  }

  const isModuleAllSelected = (module: RoleModule) => {
    return module.permissions.every((perm) => permissions[perm.id])
  }

  const getSelectedCount = (module: RoleModule) => {
    return module.permissions.filter((perm) => permissions[perm.id]).length
  }

  const getTotalPermissionCount = () => {
    return modules.reduce((acc, module) => acc + module.permissions.length, 0)
  }

  const getTotalSelectedCount = () => {
    return modules.reduce((acc, module) => acc + getSelectedCount(module), 0)
  }

  const handleSelectAll = (checked: boolean) => {
    setPermissions((prev) => {
      const updated = { ...prev }
      modules.forEach((module) => {
        module.permissions.forEach((perm) => {
          updated[perm.id] = checked
        })
      })
      return updated
    })
  }

  const isAllSelected = () => {
    return getTotalSelectedCount() === getTotalPermissionCount() && getTotalPermissionCount() > 0
  }

  const onSubmit = async (data: RoleFormData) => {
    try {
      const permissionList = Object.entries(permissions).map(([id, isGranted]) => ({
        id: parseInt(id),
        isGranted,
      }))

      if (role) {
        await updateRole.mutateAsync({
          id: role.id,
          data: {
            role: { name: data.name },
            permissions: permissionList,
          },
        })
      } else {
        await createRole.mutateAsync({
          role: { name: data.name },
          permissions: permissionList,
        })
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createRole.isPending || updateRole.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{role ? "Rol Düzenle" : "Yeni Rol"}</SheetTitle>
          <SheetDescription>
            Rol bilgilerini ve izinlerini yönetin
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label>Rol Adı *</Label>
              <Input
                placeholder="Rol adı"
                {...register("name")}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>İzinler</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {getTotalSelectedCount()}/{getTotalPermissionCount()} seçili
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(!isAllSelected())}
                  >
                    {isAllSelected() ? "Tümünü Kaldır" : "Tümünü Seç"}
                  </Button>
                </div>
              </div>
              <Accordion type="multiple" className="w-full">
                {modules.map((module) => (
                  <AccordionItem key={module.id} value={`module-${module.id}`} className="border-b-0">
                    <div className="flex items-center gap-3 border-b">
                      <Checkbox
                        checked={isModuleAllSelected(module)}
                        onCheckedChange={(checked) => {
                          handleModuleSelectAll(module, checked === true)
                        }}
                      />
                      <AccordionTrigger className="hover:no-underline flex-1 border-b-0">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{module.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({getSelectedCount(module)}/{module.permissions.length})
                          </span>
                        </div>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent>
                      <div className="space-y-3 pl-8 pt-2">
                        {module.permissions.map((permission) => (
                          <div key={permission.id} className="flex items-start gap-3">
                            <Checkbox
                              id={`perm-${permission.id}`}
                              checked={permissions[permission.id] || false}
                              onCheckedChange={(checked) => {
                                handlePermissionChange(
                                  permission.id,
                                  checked === true,
                                  permission.relatedPermissions
                                )
                              }}
                            />
                            <div className="grid gap-1">
                              <label
                                htmlFor={`perm-${permission.id}`}
                                className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                              >
                                {permission.name}
                                {permission.relatedPermissions.length > 0 && (
                                  <Link className="h-3 w-3 text-muted-foreground" aria-label="Bu izin başka izinleri gerektirir" />
                                )}
                              </label>
                              {permission.description && (
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {role ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

import { useEffect, useRef, useState } from "react"
import { FileText, Image as ImageIcon, Download, Trash2, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { attachmentApi, type AttachmentEntityType, type Attachment } from "./api"
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from "./hooks"

interface AttachmentSectionProps {
  entityType: AttachmentEntityType
  entityId: string
  title?: string
  description?: string
  notice?: string
}

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

export function AttachmentSection({
  entityType,
  entityId,
  title = "Ekler",
  description = "Dosya ve fotoğraflar (jpg, png, webp, pdf — max 10 MB)",
  notice,
}: AttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [descriptionInput, setDescriptionInput] = useState("")
  const [preview, setPreview] = useState<{ attachment: Attachment; url: string } | null>(null)

  const { data: attachments = [], isLoading } = useAttachments(entityType, entityId)
  const uploadMutation = useUploadAttachment()
  const deleteMutation = useDeleteAttachment(entityType, entityId)

  // Lightbox kapandığında object URL'ü temizle (memory leak engelle).
  useEffect(() => {
    if (!preview) return
    const url = preview.url
    return () => URL.revokeObjectURL(url)
  }, [preview])

  const handlePick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error("Desteklenmeyen dosya tipi. İzinli: jpg, png, webp, pdf.")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("Dosya 10 MB'tan büyük olamaz.")
      return
    }

    try {
      await uploadMutation.mutateAsync({
        file,
        entityType,
        entityId,
        description: descriptionInput.trim() || undefined,
      })
      setDescriptionInput("")
    } catch {
      // axios interceptor toast'u zaten gösteriyor (limit/MIME/size hataları dahil).
    }
  }

  const handleDownload = async (att: Attachment) => {
    try {
      const blob = await attachmentApi.download(att.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = att.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      // interceptor already toasts
    }
  }

  const handlePreview = async (att: Attachment) => {
    try {
      const blob = await attachmentApi.download(att.id)
      const url = URL.createObjectURL(blob)
      setPreview({ attachment: att, url })
    } catch {
      // interceptor toasts
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {title}
              <Badge variant="secondary" className="font-normal">
                {attachments.length}
              </Badge>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {notice && (
          <p className="text-xs text-muted-foreground bg-muted/40 border rounded px-2 py-1.5">
            {notice}
          </p>
        )}

        <div className="space-y-2">
          <Input
            placeholder="Açıklama (opsiyonel) — örn. 'Teslim öncesi sol panel hasarı'"
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            maxLength={500}
            disabled={uploadMutation.isPending}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePick}
            disabled={uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Dosya Seç
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-2">Yükleniyor...</p>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Henüz ek yok.</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((att) => (
              <AttachmentRow
                key={att.id}
                attachment={att}
                onDownload={() => handleDownload(att)}
                onPreview={() => handlePreview(att)}
                onDelete={() => deleteMutation.mutate(att.id)}
                deleting={deleteMutation.isPending && deleteMutation.variables === att.id}
              />
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null) }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{preview?.attachment.fileName}</DialogTitle>
            <DialogDescription className="sr-only">Dosya önizleme</DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="flex justify-center">
              <img
                src={preview.url}
                alt={preview.attachment.fileName}
                className="max-h-[75vh] max-w-full object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

interface AttachmentRowProps {
  attachment: Attachment
  onDownload: () => void
  onPreview: () => void
  onDelete: () => void
  deleting: boolean
}

function AttachmentRow({ attachment, onDownload, onPreview, onDelete, deleting }: AttachmentRowProps) {
  const isImage = attachment.contentType.startsWith("image/")
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [thumbError, setThumbError] = useState(false)

  // Görsel ekler için server-side thumbnail (~30KB JPEG) çek; full blob (10MB)
  // download'ı sadece lightbox tıklamasında yapıyoruz. Row unmount olunca temizle.
  useEffect(() => {
    if (!isImage) return
    let cancelled = false
    let createdUrl: string | null = null

    attachmentApi
      .thumbnail(attachment.id)
      .then((blob) => {
        if (cancelled) return
        createdUrl = URL.createObjectURL(blob)
        setThumbUrl(createdUrl)
      })
      .catch(() => {
        // 404 (eski upload veya thumbnail üretilememiş) → icon fallback
        if (!cancelled) setThumbError(true)
      })

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [isImage, attachment.id])

  return (
    <div className="flex items-center gap-3 border rounded-md p-2 hover:bg-muted/40 transition-colors">
      <button
        type="button"
        onClick={isImage ? onPreview : onDownload}
        className="h-12 w-12 rounded bg-muted overflow-hidden flex items-center justify-center shrink-0 hover:opacity-80"
        title={isImage ? "Önizle" : "İndir"}
      >
        {isImage && thumbUrl && !thumbError ? (
          <img
            src={thumbUrl}
            alt={attachment.fileName}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : isImage && !thumbError ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : isImage ? (
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        ) : (
          <FileText className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" title={attachment.fileName}>
          {attachment.fileName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(attachment.fileSize)} · {formatDate(attachment.createdDate)}
        </p>
        {attachment.description && (
          <p className="text-xs text-muted-foreground italic truncate" title={attachment.description}>
            {attachment.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onDownload}
          title="İndir"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={deleting}
          title="Sil"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

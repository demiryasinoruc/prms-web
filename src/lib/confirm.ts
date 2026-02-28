type ConfirmOptions = {
  title: string
  description: string
}

type ConfirmListener = (options: ConfirmOptions) => Promise<boolean>

let _listener: ConfirmListener | null = null

export function registerConfirmListener(listener: ConfirmListener) {
  _listener = listener
}

export function unregisterConfirmListener() {
  _listener = null
}

export async function confirmDelete(entityName: string | null): Promise<boolean> {
  if (!_listener) return true
  const name = entityName || "Kaydı"
  return _listener({
    title: `${name} silmek istediğinize emin misiniz?`,
    description: "Bu işlem geri alınamaz. Kayıt kalıcı olarak silinecektir.",
  })
}

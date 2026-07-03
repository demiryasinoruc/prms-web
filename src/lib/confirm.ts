type ConfirmOptions = {
  title: string
  description: string
  actionLabel?: string
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
  const name = entityName || "Kaydı"
  const title = `${name} silmek istediğinize emin misiniz?`
  // Provider henüz mount olmadıysa ONAYSIZ silmeye düşme (fail-closed):
  // tarayıcının yerleşik onayına geri düşülür.
  if (!_listener) return window.confirm(title)
  return _listener({
    title,
    description: "Bu işlem geri alınamaz. Kayıt kalıcı olarak silinecektir.",
  })
}

export async function confirm(options: ConfirmOptions): Promise<boolean> {
  if (!_listener) return window.confirm(options.title)
  return _listener(options)
}

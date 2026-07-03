/**
 * Bir hatanın "yeni deploy sonrası eski chunk bulunamadı" hatası olup olmadığını anlar.
 * Bu durumda tek doğru çözüm sayfayı yenilemektir (yeni index.html yeni hash'leri getirir).
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return (
    error.name === "ChunkLoadError" ||
    /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk .* failed/i.test(
      error.message
    )
  )
}

/**
 * Chunk hatasında otomatik tek seferlik yenileme: sonsuz reload döngüsünü
 * sessionStorage bayrağıyla engeller. Yenileme yapıldıysa true döner.
 */
export function tryAutoReloadForChunkError(error: unknown): boolean {
  if (!isChunkLoadError(error)) return false
  const key = "chunk-reload-attempted"
  if (sessionStorage.getItem(key)) return false
  sessionStorage.setItem(key, "1")
  window.location.reload()
  return true
}

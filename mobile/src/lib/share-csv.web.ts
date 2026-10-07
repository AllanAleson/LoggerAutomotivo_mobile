import { csvFileName, withBom } from '@/lib/csv'

// Na web, o arquivo é baixado diretamente pelo navegador.
export async function shareCsv(pieceId: string, csv: string) {
  const blob = new Blob([withBom(csv)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = csvFileName(pieceId)
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

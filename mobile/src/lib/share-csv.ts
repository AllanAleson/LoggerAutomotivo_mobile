import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Share } from 'react-native'

import { csvFileName, withBom } from '@/lib/csv'

// Salva o CSV no cache do app e abre a folha de compartilhamento do sistema
// (salvar em Arquivos/Drive, enviar por e-mail, WhatsApp...).
export async function shareCsv(pieceId: string, csv: string) {
  const file = new File(Paths.cache, csvFileName(pieceId))
  file.create({ overwrite: true })
  file.write(withBom(csv))
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: `Log da peça ${pieceId}`,
    })
    return
  }
  await Share.share({ title: csvFileName(pieceId), message: csv })
}

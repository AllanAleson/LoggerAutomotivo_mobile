export function csvFileName(pieceId: string) {
  return `${pieceId.replace(/[^\w.-]+/g, '_')}-eventos.csv`
}

// O backend envia o CSV com BOM para o Excel reconhecer UTF-8, mas Response.text()
// remove o BOM ao decodificar; ele é recolocado antes de salvar o arquivo.
export function withBom(csv: string) {
  return csv.startsWith('﻿') ? csv : `﻿${csv}`
}

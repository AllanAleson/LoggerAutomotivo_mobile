// Funções puras (sem dependências nativas) para descobrir e validar o endereço da API.
export const API_PORT = 3333

const SCHEME = /^[a-z][a-z\d+.-]*:\/\//i
const HTTP_URL = /^(https?):\/\/([^/\s:?#[\]]+|\[[\da-f:.]+\])(?::(\d{1,5}))?(\/[^\s?#]*)?$/i
const TUNNEL_HOST = /\.(exp\.direct|ngrok\.io|ngrok\.app|ngrok-free\.app)$/i

// Aceita "192.168.0.10:3333", "http://host:3333/" ou um prefixo de proxy reverso;
// devolve null quando o valor não é uma URL HTTP(S) utilizável.
export function normalizeApiUrl(input: string) {
  let value = input.trim()
  if (!value) return null
  if (!SCHEME.test(value)) value = `http://${value}`
  const match = HTTP_URL.exec(value)
  if (!match) return null
  const [, scheme, host, port, path = ''] = match
  if (port && (Number(port) < 1 || Number(port) > 65535)) return null
  return `${scheme.toLowerCase()}://${host}${port ? `:${port}` : ''}${path.replace(/\/+$/, '')}`
}

export function hostFromHostUri(hostUri?: string | null) {
  if (!hostUri) return null
  const authority = hostUri.replace(SCHEME, '').split('/')[0]
  if (authority.startsWith('[')) return authority.slice(0, authority.indexOf(']') + 1) || null
  return authority.split(':')[0] || null
}

function isLoopback(host: string) {
  return host === 'localhost' || host === '[::1]' || host.startsWith('127.')
}

export interface DefaultApiUrlContext {
  envUrl?: string | null
  hostUri?: string | null
  platform: string
  isDevice?: boolean | null
  webHostname?: string | null
}

// Em desenvolvimento, o Expo informa o IP do computador que serve o bundle
// (hostUri). O backend roda nesse mesmo computador, na porta 3333.
export function resolveDefaultApiUrl({ envUrl, hostUri, platform, isDevice, webHostname }: DefaultApiUrlContext) {
  const configured = envUrl ? normalizeApiUrl(envUrl) : null
  if (configured) return configured
  if (platform === 'web') return `http://${webHostname || 'localhost'}:${API_PORT}`

  // O emulador Android acessa o localhost do computador por 10.0.2.2.
  const androidEmulator = platform === 'android' && isDevice === false
  const host = hostFromHostUri(hostUri)
  if (host && !TUNNEL_HOST.test(host)) {
    if (isLoopback(host) && androidEmulator) return `http://10.0.2.2:${API_PORT}`
    return `http://${host}:${API_PORT}`
  }
  return androidEmulator ? `http://10.0.2.2:${API_PORT}` : `http://localhost:${API_PORT}`
}

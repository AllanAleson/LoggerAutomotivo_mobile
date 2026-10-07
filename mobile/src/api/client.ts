const DEFAULT_TIMEOUT_MS = 12_000

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(message: string, kind: ApiErrorKind, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

export interface RequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

export function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado.'
}

function abortError() {
  const error = new Error('Requisição cancelada.')
  error.name = 'AbortError'
  return error
}

// Um fetch para um IP inacessível pode ficar pendente por mais de um minuto no
// Android; o timeout transforma isso em uma mensagem acionável para o técnico.
async function request<T>(baseUrl: string, path: string, options: RequestOptions, read: (response: Response) => Promise<T>) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
  const forwardAbort = () => controller.abort()
  if (options.signal?.aborted) controller.abort()
  options.signal?.addEventListener('abort', forwardAbort)
  try {
    const response = await fetch(joinUrl(baseUrl, path), { signal: controller.signal })
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null
      throw new ApiError(body?.error ?? `Erro HTTP ${response.status}`, 'http', response.status)
    }
    try {
      return await read(response)
    } catch (error) {
      if (controller.signal.aborted) throw error
      throw new ApiError('A API retornou uma resposta inválida.', 'invalid')
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (timedOut) throw new ApiError(`A API não respondeu em ${Math.round(timeoutMs / 1000)} s (${baseUrl}).`, 'timeout')
    if (options.signal?.aborted) throw abortError()
    throw new ApiError(`Não foi possível conectar à API em ${baseUrl}. Verifique se o backend está em execução e se o aparelho está na mesma rede.`, 'network')
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', forwardAbort)
  }
}

export function requestJson<T>(baseUrl: string, path: string, options: RequestOptions = {}) {
  return request(baseUrl, path, options, response => response.json() as Promise<T>)
}

export function requestText(baseUrl: string, path: string, options: RequestOptions = {}) {
  return request(baseUrl, path, options, response => response.text())
}

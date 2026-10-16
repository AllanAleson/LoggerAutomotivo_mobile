import AsyncStorage from '@react-native-async-storage/async-storage'
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library'

import RootLayout from '@/app/_layout'
import NotFoundScreen from '@/app/+not-found'
import TabsLayout from '@/app/(tabs)/_layout'
import AlertsScreen from '@/app/(tabs)/alerts'
import DevicesScreen from '@/app/(tabs)/devices'
import DashboardScreen from '@/app/(tabs)/index'
import SearchScreen from '@/app/(tabs)/search'
import SettingsScreen from '@/app/(tabs)/settings'
import PartScreen from '@/app/parts/[pieceId]'

import { installFetchMock, timeline, warningEvent } from '../test-utils/fixtures'

jest.setTimeout(30_000)

// As rotas reais do app, registradas explicitamente (o carregamento por
// diretório do renderRouter não resolve os módulos no Windows).
const ROUTES = {
  _layout: RootLayout,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': DashboardScreen,
  '(tabs)/search': SearchScreen,
  '(tabs)/devices': DevicesScreen,
  '(tabs)/alerts': AlertsScreen,
  '(tabs)/settings': SettingsScreen,
  'parts/[pieceId]': PartScreen,
  '+not-found': NotFoundScreen,
}

const renderApp = (initialUrl: string) => renderRouter(ROUTES, { initialUrl })

let fetchMock: ReturnType<typeof installFetchMock>

beforeEach(async () => {
  await AsyncStorage.clear()
  fetchMock = installFetchMock()
})

const requestedUrls = () => fetchMock.mock.calls.map(([url]) => String(url))

describe('App mobile Logger Auto', () => {
  it('mostra métricas e ocorrências recentes no dashboard', async () => {
    await renderApp('/')
    expect(await screen.findByText('Loggers online')).toBeTruthy()
    expect(screen.getByText('Falhas em 24h')).toBeTruthy()
    expect(screen.getAllByText('RESPONSE_TIMEOUT').length).toBeGreaterThan(0)
    expect(requestedUrls()).toContain('http://localhost:3333/api/dashboard')
  })

  it('pesquisa a peça e abre o dispositivo', async () => {
    // renderRouter anexa getPathname() à Promise devolvida pelo render assíncrono.
    const app = renderApp('/search')
    await app
    const input = await screen.findByLabelText('ID da peça, série ou Logger')
    await fireEvent.changeText(input, 'sn-2026-18429')
    await fireEvent(input, 'submitEditing')
    expect(await screen.findByText('1 resultado encontrado')).toBeTruthy()
    expect(requestedUrls()).toContain('http://localhost:3333/api/parts?search=sn-2026-18429')

    await fireEvent.press(screen.getByLabelText('Abrir dispositivo PT-00018429'))
    expect(await screen.findByText('Estado operacional')).toBeTruthy()
    expect(app.getPathname()).toBe('/parts/PT-00018429')
    expect(screen.getByText('VEICULO-DEMO-01')).toBeTruthy()
  })

  it('mostra estado vazio quando a pesquisa não encontra nada', async () => {
    await renderApp('/search')
    const input = await screen.findByLabelText('ID da peça, série ou Logger')
    await fireEvent.changeText(input, 'INEXISTENTE')
    await fireEvent(input, 'submitEditing')
    expect(await screen.findByText('Nenhum registro encontrado')).toBeTruthy()
  })

  it('lista eventos na aba Log e aplica o filtro de severidade', async () => {
    await renderApp('/parts/PT-00018429?tab=log')
    expect(await screen.findByText('Consulta de eventos')).toBeTruthy()
    expect(await screen.findByText('3 registros')).toBeTruthy()
    expect(screen.getByText('LOCK')).toBeTruthy()
    expect(requestedUrls().some(url => url.includes('/api/parts/PT-00018429/events?startDate='))).toBe(true)

    await fireEvent.press(screen.getByRole('button', { name: 'ERROR' }))
    expect(await screen.findByText('1 registro')).toBeTruthy()
    expect(requestedUrls().some(url => url.includes('level=ERROR'))).toBe(true)
  })

  it('abre o diagnóstico da ocorrência escolhida em Alertas', async () => {
    await renderApp('/alerts')
    expect(await screen.findByText('Todos (2)')).toBeTruthy()
    await fireEvent.press(screen.getByLabelText(/^WARNING ANALOG_WARNING/))

    expect(await screen.findByText('Exibindo a ocorrência selecionada.')).toBeTruthy()
    expect(await screen.findByText('FALHA DETECTADA')).toBeTruthy()
    expect(screen.getByText('11.4V')).toBeTruthy()
    expect(requestedUrls()).toContain(`http://localhost:3333/api/events/${warningEvent.id}`)
  })

  it('mostra a falha mais relevante na aba Diagnóstico', async () => {
    await renderApp('/parts/PT-00018429?tab=diagnosis')
    expect(await screen.findByText('FALHA DETECTADA')).toBeTruthy()
    expect(screen.getByText('Comando LOCK detectado')).toBeTruthy()
    expect(requestedUrls()).toContain('http://localhost:3333/api/parts/PT-00018429/diagnosis')
  })

  it('salva um novo endereço da API e passa a usá-lo', async () => {
    await renderApp('/settings')
    const input = await screen.findByLabelText('URL da API')
    await fireEvent.changeText(input, '192.168.0.50:3333')
    await fireEvent(input, 'submitEditing')

    expect(await screen.findByText('Endereço salvo: http://192.168.0.50:3333')).toBeTruthy()
    expect(await AsyncStorage.getItem('logger-auto:api-url')).toBe('http://192.168.0.50:3333')
    await waitFor(() => expect(requestedUrls().some(url => url.startsWith('http://192.168.0.50:3333/api/'))).toBe(true))
  })

  it('rejeita endereço inválido nas configurações', async () => {
    await renderApp('/settings')
    const input = await screen.findByLabelText('URL da API')
    await fireEvent.changeText(input, 'ftp://servidor')
    await fireEvent(input, 'submitEditing')
    expect(await screen.findByText('Informe uma URL válida, por exemplo http://192.168.0.10:3333')).toBeTruthy()
    expect(await AsyncStorage.getItem('logger-auto:api-url')).toBeNull()
  })

  it('mostra o gráfico de verificações da frota com o pico de oscilação', async () => {
    await renderApp('/')
    expect(await screen.findByText('Verificações da frota nas últimas 24 horas')).toBeTruthy()
    expect(screen.getByText('1 pico de oscilação detectado')).toBeTruthy()
    expect(screen.getByText('Pico de oscilação')).toBeTruthy()
    expect(screen.getByText('17 registros')).toBeTruthy()
    expect(requestedUrls().some(url => url.includes('/api/events/timeline?hours=24'))).toBe(true)
  })

  it('filtra o log pelo intervalo do pico escolhido no gráfico', async () => {
    await renderApp('/parts/PT-00018429?tab=log')
    expect(await screen.findByText('Gráfico de verificações')).toBeTruthy()
    expect(requestedUrls().some(url => url.includes('/api/events/timeline?') && url.includes('pieceId=PT-00018429'))).toBe(true)
    await fireEvent.press(screen.getByRole('button', { name: 'Ver eventos deste intervalo' }))
    const peak = timeline.buckets[2]
    await waitFor(() => expect(requestedUrls().some(url => url.includes('/api/parts/PT-00018429/events?')
      && url.includes(`startDate=${encodeURIComponent(peak.start)}`) && url.includes(`endDate=${encodeURIComponent(peak.end)}`))).toBe(true))
    expect(screen.getByRole('button', { name: 'Personalizado', selected: true })).toBeTruthy()
  })

  it('explica quando a API está inacessível', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'))
    await renderApp('/')
    expect(await screen.findByText('Não foi possível carregar')).toBeTruthy()
    expect(screen.getByText(/Não foi possível conectar à API em http:\/\/localhost:3333/)).toBeTruthy()
  })
})

import Constants from 'expo-constants'
import { useState } from 'react'
import { Keyboard, StyleSheet, TextInput, View } from 'react-native'

import { errorMessage, requestJson } from '@/api/client'
import { useApiConfig } from '@/api/config'
import type { HealthResponse } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Button } from '@/components/button'
import { Card, CardHeader } from '@/components/card'
import { CircleCheck, CircleX, Clock3, Database, RotateCcw, Server, ShieldAlert, Signal, type LucideIcon } from '@/components/icons'
import { PageIntro, ScreenScroll } from '@/components/screen'
import { colors, fonts, radius, REFRESH_MS } from '@/constants/theme'
import { useApi } from '@/hooks/use-api'
import { normalizeApiUrl } from '@/lib/api-url'

function SettingItem({ icon: Icon, title, value, text }: { icon: LucideIcon; title: string; value: string; text: string }) {
  return (
    <View style={styles.setting}>
      <View style={styles.settingIcon}><Icon size={18} color={colors.blueText} /></View>
      <View style={styles.settingText}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="subheading">{value}</AppText>
        <AppText variant="caption">{text}</AppText>
      </View>
    </View>
  )
}

export default function SettingsScreen() {
  const { baseUrl, defaultUrl, isCustom, saveBaseUrl, resetBaseUrl } = useApiConfig()
  const [draft, setDraft] = useState(baseUrl)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const { data: health } = useApi<HealthResponse>('/api/health', { refreshMs: 30_000 })
  const [syncedUrl, setSyncedUrl] = useState(baseUrl)

  // Endereço trocado (salvo ou restaurado): o campo passa a mostrar o novo valor.
  if (syncedUrl !== baseUrl) {
    setSyncedUrl(baseUrl)
    setDraft(baseUrl)
  }

  const save = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      const saved = await saveBaseUrl(draft)
      setDraft(saved)
      setFeedback({ ok: true, text: `Endereço salvo: ${saved}` })
      Keyboard.dismiss()
    } catch (error) {
      setFeedback({ ok: false, text: errorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  // Testa o endereço digitado antes mesmo de salvá-lo.
  const test = async () => {
    const url = normalizeApiUrl(draft)
    if (!url) {
      setFeedback({ ok: false, text: 'Informe uma URL válida, por exemplo http://192.168.0.10:3333' })
      return
    }
    setTesting(true)
    setFeedback(null)
    const started = Date.now()
    try {
      const result = await requestJson<HealthResponse>(url, '/api/health', { timeoutMs: 8_000 })
      const database = result.database === 'postgresql' ? 'PostgreSQL' : 'PGlite (embutido)'
      setFeedback({ ok: true, text: `Conectado a ${url} em ${Date.now() - started} ms · banco ${database}.` })
    } catch (error) {
      setFeedback({ ok: false, text: errorMessage(error) })
    } finally {
      setTesting(false)
    }
  }

  const reset = async () => {
    await resetBaseUrl()
    setFeedback({ ok: true, text: `Endereço padrão restaurado: ${defaultUrl}` })
  }

  const threshold = health?.offlineThresholdMinutes

  return (
    <ScreenScroll>
      <PageIntro eyebrow="Parâmetros do MVP" text="Conexão com o backend e referências operacionais da demonstração." />

      <Card>
        <CardHeader title="Servidor da API" subtitle="Endereço do backend Logger Automotivo (porta 3333)." right={<Server size={20} color="#788493" />} />
        <View style={styles.body}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={save}
            placeholder="http://192.168.0.10:3333"
            placeholderTextColor={colors.subtle}
            accessibilityLabel="URL da API"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            style={styles.input}
          />
          <AppText variant="caption">
            Em um celular físico, use o IP do computador que executa o backend, na mesma rede Wi-Fi. No emulador Android, use http://10.0.2.2:3333.
          </AppText>
          <View style={styles.actions}>
            <Button title="Testar conexão" variant="secondary" loading={testing} onPress={test} style={styles.flex} />
            <Button title="Salvar" loading={saving} disabled={!draft.trim()} onPress={save} style={styles.flex} />
          </View>
          {feedback ? (
            <View style={[styles.feedback, feedback.ok ? styles.feedbackOk : styles.feedbackError]} accessibilityLiveRegion="polite">
              {feedback.ok ? <CircleCheck size={16} color={colors.green} /> : <CircleX size={16} color={colors.red} />}
              <AppText variant="caption" color={feedback.ok ? '#126846' : '#a42e39'} style={styles.flex}>{feedback.text}</AppText>
            </View>
          ) : null}
          <View style={styles.defaultRow}>
            <AppText variant="caption" style={styles.flex}>
              {isCustom ? `Endereço personalizado. Padrão detectado: ${defaultUrl}` : `Usando o endereço detectado automaticamente.`}
            </AppText>
            {isCustom ? <Button title="Restaurar" icon={RotateCcw} variant="ghost" onPress={reset} /> : null}
          </View>
        </View>
      </Card>

      <Card>
        <CardHeader title="Referências operacionais" subtitle="Comportamento atual do Logger e da API." />
        <View style={styles.body}>
          <SettingItem icon={Clock3} title="Heartbeat" value="A cada 30 segundos" text="Enviado pelo firmware ESP32; eventos válidos também atualizam a última comunicação." />
          <SettingItem
            icon={Signal}
            title="Limite offline"
            value={threshold ? `${threshold} minutos` : '10 minutos (padrão)'}
            text="Configurável por OFFLINE_THRESHOLD_MINUTES no backend."
          />
          <SettingItem icon={Database} title="Retenção de logs" value="Sem expiração no MVP" text="Política de retenção será definida na etapa de produção." />
          <SettingItem icon={ShieldAlert} title="Autenticação de dispositivo" value="Preparada para evolução" text="A API possui um ponto único de ingestão; chaves por Logger serão adicionadas futuramente." />
        </View>
      </Card>

      <AppText variant="caption" style={styles.about}>
        Logger Auto {Constants.expoConfig?.version ?? ''} · atualização automática a cada {REFRESH_MS / 1000} s
      </AppText>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d6dce3',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  actions: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  feedback: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: radius.md, borderWidth: 1, padding: 10 },
  feedbackOk: { backgroundColor: '#eaf8f1', borderColor: '#bfe8d5' },
  feedbackError: { backgroundColor: '#fcedef', borderColor: '#eec4c8' },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setting: { flexDirection: 'row', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: '#ebf3fc', alignItems: 'center', justifyContent: 'center' },
  settingText: { flex: 1, gap: 3 },
  about: { textAlign: 'center', color: colors.subtle },
})

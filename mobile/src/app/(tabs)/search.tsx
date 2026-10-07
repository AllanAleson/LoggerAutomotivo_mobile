import { useState } from 'react'
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native'

import type { ListResponse, Part } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Button } from '@/components/button'
import { Info, Search } from '@/components/icons'
import { PartResultCard } from '@/components/part-result-card'
import { PageIntro, ScreenScroll } from '@/components/screen'
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/state-view'
import { colors, fonts, radius, REFRESH_MS, shadow } from '@/constants/theme'
import { useApi } from '@/hooks/use-api'
import { toQueryString } from '@/lib/event-query'
import { plural } from '@/lib/format'

const EXAMPLES = ['PT-00018429', 'SN-2026-18429', 'LOGGER-001']

export default function SearchScreen() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const { data, error, loading, refreshing, refresh } = useApi<ListResponse<Part>>(
    query ? `/api/parts${toQueryString({ search: query })}` : null,
    { refreshMs: REFRESH_MS },
  )

  const submit = (value: string) => {
    const term = value.trim()
    if (!term) return
    setInput(term)
    setQuery(term)
    Keyboard.dismiss()
  }

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={query ? refresh : undefined}>
      <PageIntro eyebrow="Localização rápida" text="Busque pelo ID da peça, número de série ou Logger associado." />
      <View style={styles.hero}>
        <View style={styles.inputRow}>
          <Search size={20} color="#748093" />
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => submit(input)}
            placeholder="Digite o ID da peça"
            placeholderTextColor={colors.subtle}
            accessibilityLabel="ID da peça, série ou Logger"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            style={styles.input}
          />
        </View>
        <Button title="Pesquisar" icon={Search} disabled={!input.trim()} onPress={() => submit(input)} />
        <View style={styles.hints}>
          <Info size={14} color={colors.onDarkMuted} />
          <AppText variant="caption" color={colors.onDarkMuted}>Exemplos:</AppText>
          {EXAMPLES.map(example => (
            <Pressable key={example} accessibilityRole="button" accessibilityLabel={`Pesquisar ${example}`} hitSlop={6} onPress={() => submit(example)}>
              <AppText style={styles.hint}>{example}</AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {query ? (
        loading ? <LoadingState label="Pesquisando..." />
          : !data ? <ErrorState message={error ?? ''} onRetry={refresh} />
            : !data.items.length ? <EmptyState message={`Nenhuma peça, série ou Logger corresponde a "${query}".`} />
              : (
                <>
                  {error ? <InlineError message={error} /> : null}
                  <AppText variant="label">{plural(data.count, 'resultado encontrado', 'resultados encontrados')}</AppText>
                  {data.items.map(part => <PartResultCard key={part.id} part={part} />)}
                </>
              )
      ) : null}
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy2, borderRadius: radius.lg, padding: 16, gap: 12, ...shadow },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  input: { flex: 1, minHeight: 50, fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  hints: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 6 },
  hint: { color: colors.onDark, fontFamily: fonts.semibold, fontSize: 13, textDecorationLine: 'underline' },
})

import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg'

import type { Timeline, TimelineBucket } from '@/api/types'
import { AppText } from '@/components/app-text'
import { Button } from '@/components/button'
import { Card } from '@/components/card'
import { Activity, ChevronRight, SlidersHorizontal, TriangleAlert } from '@/components/icons'
import { colors, fonts, radius } from '@/constants/theme'
import { plural } from '@/lib/format'
import { SEVERITY_SERIES, bucketLabel, failures, largestPeak, niceMax, rangeLabel, tickLabel } from '@/lib/timeline'

const HEIGHT = 200
const MARGIN = { top: 26, right: 8, bottom: 24, left: 28 }
const GAP = 2

// Coluna com cantos de 4px só no topo; a base fica reta sobre a linha zero.
function columnPath(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height)
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`
}

interface Props {
  timeline: Timeline
  title: string
  loading?: boolean
  // Aba Log: o intervalo tocado vira o período personalizado.
  onApplyRange?: (bucket: TimelineBucket) => void
  // Dashboard: o sinal leva ao log da peça.
  onOpenPiece?: (pieceId: string) => void
}

export function OscillationChart({ timeline, title, loading = false, onApplyRange, onOpenPiece }: Props) {
  const [width, setWidth] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [windowKey, setWindowKey] = useState(`${timeline.start}|${timeline.bucketMinutes}`)

  // Outro período: a seleção volta para o maior pico.
  const currentKey = `${timeline.start}|${timeline.bucketMinutes}`
  if (currentKey !== windowKey) {
    setWindowKey(currentKey)
    setSelected(null)
  }

  const { buckets, peaks, stats, bucketMinutes } = timeline
  const peakIndex = largestPeak(buckets, peaks)
  const active = selected !== null && selected < buckets.length ? selected : peakIndex
  const activeBucket = active !== null ? buckets[active] : null

  const plotWidth = Math.max(80, width - MARGIN.left - MARGIN.right)
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const baseline = MARGIN.top + plotHeight
  const slot = plotWidth / Math.max(1, buckets.length)
  const barWidth = Math.max(2, Math.min(24, slot - GAP))
  const yMax = niceMax(Math.max(stats.max, stats.threshold))
  const y = (value: number) => baseline - (value / yMax) * plotHeight
  const multiDay = new Date(timeline.end).getTime() - new Date(timeline.start).getTime() > 26 * 3600_000
  const tickEvery = Math.max(1, Math.ceil(buckets.length / Math.max(2, Math.floor(plotWidth / (multiDay ? 72 : 52)))))
  const slotX = (index: number) => MARGIN.left + index * slot
  const showThreshold = stats.max > 0 && stats.threshold > 0 && stats.threshold <= yMax

  return (
    <Card style={loading ? styles.loading : undefined}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText variant="heading">{title}</AppText>
          <AppText variant="caption">
            Eventos a cada {bucketLabel(bucketMinutes)}. Pico de oscilação = intervalo acima de média + 2 desvios ({stats.threshold.toFixed(1)} eventos).
          </AppText>
        </View>
      </View>

      <View style={[styles.summary, peaks.length ? styles.summaryPeak : null]}>
        {peaks.length ? <TriangleAlert size={15} color="#a42e39" /> : <Activity size={15} color={colors.green} />}
        <AppText style={styles.summaryText}>
          {peaks.length ? plural(peaks.length, 'pico de oscilação detectado', 'picos de oscilação detectados') : 'Sem picos no período'}
        </AppText>
      </View>

      <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {SEVERITY_SERIES.map(series => (
          <View key={series.level} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: series.color }]} />
            <AppText variant="caption">{series.label}</AppText>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={styles.thresholdKey} />
          <AppText variant="caption">Limite de pico</AppText>
        </View>
      </View>

      <View
        style={styles.plot}
        onLayout={event => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={`${title}: ${plural(stats.total, 'evento', 'eventos')}, ${plural(peaks.length, 'pico', 'picos')}. A lista de picos abaixo do gráfico detalha cada um.`}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {[0, yMax / 2, yMax].map(tick => (
              <G key={tick}>
                <Line x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={y(tick)} y2={y(tick)} stroke={colors.lineSoft} strokeWidth={1} />
                <SvgText x={MARGIN.left - 6} y={y(tick) + 3.5} fontSize={10} fontFamily={fonts.medium} fill="#7d8796" textAnchor="end">{tick}</SvgText>
              </G>
            ))}

            {buckets.map((bucket, index) => bucket.peak
              ? <Rect key={`band-${bucket.start}`} x={slotX(index)} y={MARGIN.top} width={slot} height={plotHeight} fill="#c43b45" fillOpacity={0.08} />
              : null)}
            {active !== null ? <Rect x={slotX(active)} y={MARGIN.top} width={slot} height={plotHeight} fill={colors.blue} fillOpacity={0.1} /> : null}

            {buckets.map((bucket, index) => {
              const x = slotX(index) + (slot - barWidth) / 2
              // Empilha de baixo para cima; cada segmento acima deixa 2px de respiro.
              const stack = SEVERITY_SERIES
                .filter(series => bucket.levels[series.level] > 0)
                .reduce<{ color: string; level: string; top: number; height: number }[]>((acc, series) => {
                  const below = acc.length ? acc[acc.length - 1].top : baseline
                  const height = Math.max(2, (bucket.levels[series.level] / yMax) * plotHeight)
                  return [...acc, { color: series.color, level: series.level, top: below - height, height }]
                }, [])
              const cursor = stack.length ? stack[stack.length - 1].top : baseline
              const marks = stack.map((segment, position) => {
                const drawn = Math.max(1, segment.height - (position > 0 ? GAP : 0))
                return position === stack.length - 1
                  ? <Path key={segment.level} d={columnPath(x, segment.top, barWidth, drawn, 4)} fill={segment.color} />
                  : <Rect key={segment.level} x={x} y={segment.top} width={barWidth} height={drawn} fill={segment.color} />
              })
              return (
                <G key={bucket.start}>
                  {marks}
                  {bucket.peak ? <Path d={`M${x + barWidth / 2 - 5},${cursor - 10}h10l-5,7z`} fill={colors.text} /> : null}
                  {index === peakIndex ? (
                    <SvgText
                      x={Math.min(Math.max(x + barWidth / 2, MARGIN.left + 26), MARGIN.left + plotWidth - 26)}
                      y={Math.max(cursor - 15, 11)}
                      fontSize={10.5} fontFamily={fonts.bold} fill={colors.text} textAnchor="middle">
                      {`Pico · ${bucket.total}`}
                    </SvgText>
                  ) : null}
                </G>
              )
            })}

            {showThreshold ? (
              <G>
                <Line x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={y(stats.threshold)} y2={y(stats.threshold)} stroke="#8a94a3" strokeWidth={1.5} strokeDasharray="5 4" />
                <SvgText x={MARGIN.left + plotWidth} y={y(stats.threshold) - 4} fontSize={9.5} fontFamily={fonts.medium} fill="#7d8796" textAnchor="end">limite</SvgText>
              </G>
            ) : null}

            <Line x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={baseline} y2={baseline} stroke="#cfd5dd" strokeWidth={1} />
            {buckets.map((bucket, index) => index % tickEvery === 0 ? (
              <SvgText key={`tick-${bucket.start}`} x={slotX(index) + slot / 2} y={baseline + 15} fontSize={9.5} fontFamily={fonts.medium} fill="#7d8796" textAnchor="middle">
                {tickLabel(bucket.start, bucketMinutes, multiDay)}
              </SvgText>
            ) : null)}

            {/* Toque em qualquer ponto da coluna (área maior que a barra) seleciona o intervalo. */}
            {buckets.map((bucket, index) => (
              <Rect key={`hit-${bucket.start}`} x={slotX(index)} y={MARGIN.top - 20} width={slot} height={plotHeight + 20} fill="transparent" onPress={() => setSelected(index)} />
            ))}
          </Svg>
        ) : <View style={{ height: HEIGHT }} />}
        {stats.total === 0 ? (
          <View style={styles.empty} pointerEvents="none">
            <AppText variant="caption">Nenhum evento no período selecionado.</AppText>
          </View>
        ) : null}
      </View>

      {activeBucket && activeBucket.total > 0 ? (
        <View style={styles.details}>
          <AppText variant="eyebrow">{activeBucket.peak ? 'Pico de oscilação' : 'Intervalo selecionado'}</AppText>
          <AppText variant="mono" style={styles.detailsTitle}>{rangeLabel(activeBucket)}</AppText>
          <View style={styles.detailsGrid}>
            <Metric label="Total" value={String(activeBucket.total)} />
            <Metric label="Falhas" value={String(failures(activeBucket))} />
            <Metric label="Média" value={stats.mean.toFixed(1)} />
            <Metric label="× média" value={stats.mean > 0 ? `${(activeBucket.total / stats.mean).toFixed(1)}×` : '—'} />
          </View>
          <View style={styles.levelRow}>
            {SEVERITY_SERIES.filter(series => activeBucket.levels[series.level] > 0).map(series => (
              <View key={series.level} style={styles.legendItem}>
                <View style={[styles.lineKey, { backgroundColor: series.color }]} />
                <AppText variant="captionStrong" color={colors.text}>{activeBucket.levels[series.level]}</AppText>
                <AppText variant="caption">{series.label}</AppText>
              </View>
            ))}
          </View>
          <AppText variant="label">Sinais com mais registros</AppText>
          {activeBucket.signals.map(signal => {
            const pieceId = signal.pieceId
            const content = (
              <>
                <AppText variant="mono" style={styles.signalName}>{signal.signal}</AppText>
                {onOpenPiece && pieceId ? <AppText style={styles.signalPiece}>{pieceId}</AppText> : null}
                <AppText variant="captionStrong" color={colors.text} style={styles.signalCount}>{plural(signal.count, 'registro', 'registros')}</AppText>
                {onOpenPiece && pieceId ? <ChevronRight size={16} color={colors.blue} /> : null}
              </>
            )
            return onOpenPiece && pieceId ? (
              <Pressable
                key={`${pieceId}|${signal.signal}`}
                accessibilityRole="button"
                accessibilityLabel={`Sinal ${signal.signal}, peça ${pieceId}, ${signal.count} registros. Abrir log da peça`}
                onPress={() => onOpenPiece(pieceId)}
                style={({ pressed }) => [styles.signal, pressed && styles.pressed]}>
                {content}
              </Pressable>
            ) : <View key={`${pieceId}|${signal.signal}`} style={styles.signal}>{content}</View>
          })}
          {onApplyRange ? (
            <Button title="Ver eventos deste intervalo" icon={SlidersHorizontal} variant="secondary" onPress={() => onApplyRange(activeBucket)} />
          ) : null}
        </View>
      ) : null}

      {peaks.length ? (
        <View style={styles.peaks}>
          <AppText variant="label">Picos detectados</AppText>
          {peaks.map(index => {
            const bucket = buckets[index]
            return (
              <Pressable
                key={bucket.start}
                accessibilityRole="button"
                accessibilityState={{ selected: index === active }}
                accessibilityLabel={`Pico ${rangeLabel(bucket)}: ${plural(bucket.total, 'evento', 'eventos')}, ${plural(failures(bucket), 'falha', 'falhas')}, sinal principal ${bucket.signals[0]?.signal ?? 'não informado'}`}
                onPress={() => setSelected(index)}
                style={({ pressed }) => [styles.peak, index === active && styles.peakSelected, pressed && styles.pressed]}>
                <TriangleAlert size={15} color="#a42e39" />
                <View style={styles.flex}>
                  <AppText variant="mono" style={styles.peakRange}>{rangeLabel(bucket)}</AppText>
                  <AppText variant="caption">{plural(bucket.total, 'evento', 'eventos')} · {plural(failures(bucket), 'falha', 'falhas')}</AppText>
                </View>
                <AppText variant="mono" style={styles.peakSignal}>{bucket.signals[0]?.signal ?? '—'}</AppText>
              </Pressable>
            )
          })}
        </View>
      ) : null}
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  loading: { opacity: 0.55 },
  flex: { flex: 1 },
  head: { flexDirection: 'row', padding: 16, paddingBottom: 10, gap: 12 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginHorizontal: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: '#eaf8f1',
    borderColor: '#bfe8d5',
  },
  summaryPeak: { backgroundColor: '#fcedef', borderColor: '#eec4c8' },
  summaryText: { fontFamily: fonts.bold, fontSize: 12, color: colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, paddingHorizontal: 16, paddingTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  lineKey: { width: 12, height: 3, borderRadius: 2 },
  thresholdKey: { width: 16, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: '#8a94a3' },
  plot: { paddingHorizontal: 8, paddingTop: 4 },
  empty: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  details: { marginHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 },
  detailsTitle: { fontSize: 16, lineHeight: 21, fontFamily: fonts.monoBold },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, marginTop: 4 },
  metric: { width: '25%', gap: 2 },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, marginBottom: 4 },
  signal: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9 },
  signalName: { fontFamily: fonts.monoBold },
  signalPiece: { fontFamily: fonts.bold, fontSize: 12, color: colors.blue },
  signalCount: { marginLeft: 'auto' },
  pressed: { opacity: 0.75 },
  peaks: { marginHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 },
  peak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.surface,
  },
  peakSelected: { borderColor: colors.blue, borderLeftWidth: 3 },
  peakRange: { fontFamily: fonts.monoBold, fontSize: 12 },
  peakSignal: { fontSize: 12, color: colors.muted },
})

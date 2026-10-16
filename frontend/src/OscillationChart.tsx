import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, ChevronRight, SlidersHorizontal } from 'lucide-react'
import type { Timeline, TimelineBucket } from './api'
import { SEVERITY_SERIES, bucketLabel, failures, largestPeak, niceMax, rangeLabel, tickLabel } from './timeline'

const HEIGHT = 230
const MARGIN = { top: 28, right: 14, bottom: 30, left: 36 }
const GAP = 2

// Coluna com cantos de 4px só no topo; a base fica reta sobre a linha zero.
function columnPath(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height)
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

interface Props {
  timeline: Timeline
  title: string
  loading?: boolean
  // Aba Log: aplica o intervalo da coluna como período personalizado.
  onApplyRange?: (bucket: TimelineBucket) => void
  // Dashboard: cada sinal leva ao log da peça.
  showPieceLinks?: boolean
}

export function OscillationChart({ timeline, title, loading = false, onApplyRange, showPieceLinks = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)
  const [hovered, setHovered] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [windowKey, setWindowKey] = useState(`${timeline.start}|${timeline.bucketMinutes}`)

  useEffect(() => {
    const element = wrapRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Outro período: a seleção volta para o maior pico.
  const currentKey = `${timeline.start}|${timeline.bucketMinutes}`
  if (currentKey !== windowKey) { setWindowKey(currentKey); setSelected(null); setHovered(null) }

  const { buckets, peaks, stats, bucketMinutes } = timeline
  const peakIndex = largestPeak(buckets, peaks)
  const active = selected !== null && selected < buckets.length ? selected : peakIndex
  const activeBucket = active !== null ? buckets[active] : null

  const plotWidth = Math.max(120, width - MARGIN.left - MARGIN.right)
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const baseline = MARGIN.top + plotHeight
  const slot = plotWidth / Math.max(1, buckets.length)
  const barWidth = Math.max(2, Math.min(24, slot - GAP))
  const yMax = niceMax(Math.max(stats.max, stats.threshold))
  const y = (value: number) => baseline - (value / yMax) * plotHeight
  const multiDay = new Date(timeline.end).getTime() - new Date(timeline.start).getTime() > 26 * 3600_000
  const tickEvery = Math.max(1, Math.ceil(buckets.length / Math.max(2, Math.floor(plotWidth / 78))))
  const slotX = (index: number) => MARGIN.left + index * slot
  const showThreshold = stats.max > 0 && stats.threshold > 0 && stats.threshold <= yMax

  const select = (index: number) => setSelected(index)
  const onKey = (index: number) => (event: KeyboardEvent<SVGRectElement>) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(index) }
  }

  const tooltipBucket = hovered !== null ? buckets[hovered] : null
  const tooltipLeft = hovered !== null ? Math.min(Math.max(slotX(hovered) + slot / 2, 90), width - 90) : 0

  return (
    <div className={loading ? 'panel chart-panel chart-loading' : 'panel chart-panel'}>
      <div className="panel-head chart-head">
        <div>
          <h2>{title}</h2>
          <p>Eventos a cada {bucketLabel(bucketMinutes)}. Pico de oscilação = intervalo acima de média + 2 desvios ({stats.threshold.toFixed(1)} eventos).</p>
        </div>
        <span className={peaks.length ? 'chart-summary chart-summary-peak' : 'chart-summary'}>
          {peaks.length ? <AlertTriangle /> : <Activity />}
          {peaks.length ? plural(peaks.length, 'pico de oscilação', 'picos de oscilação') : 'Sem picos no período'}
        </span>
      </div>

      <div className="chart-legend" aria-hidden="true">
        {SEVERITY_SERIES.map(series => <span key={series.level}><i style={{ background: series.color }} />{series.label}</span>)}
        <span><i className="legend-threshold" />Limite de pico</span>
        <span><i className="legend-peak">▲</i>Pico</span>
      </div>

      <div className="chart-wrap" ref={wrapRef}>
        {/* Tamanho inline: o CSS global dimensiona todo <svg> como ícone de 18px. */}
        <svg width={width} height={HEIGHT} style={{ width, height: HEIGHT }} role="group" aria-label={`${title}: ${plural(stats.total, 'evento', 'eventos')}, ${plural(peaks.length, 'pico', 'picos')}`}>
          {[0, yMax / 2, yMax].map(tick => (
            <g key={tick}>
              <line x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={y(tick)} y2={y(tick)} className="chart-grid" />
              <text x={MARGIN.left - 8} y={y(tick)} className="chart-axis" textAnchor="end" dominantBaseline="middle">{tick}</text>
            </g>
          ))}

          {buckets.map((bucket, index) => bucket.peak
            ? <rect key={`band-${bucket.start}`} x={slotX(index)} y={MARGIN.top} width={slot} height={plotHeight} className="chart-band-peak" />
            : null)}
          {active !== null ? <rect x={slotX(active)} y={MARGIN.top} width={slot} height={plotHeight} className="chart-band-active" /> : null}

          {buckets.map((bucket, index) => {
            const x = slotX(index) + (slot - barWidth) / 2
            const segments = SEVERITY_SERIES.filter(series => bucket.levels[series.level] > 0)
            let cursor = baseline
            return (
              <g key={bucket.start}>
                {segments.map((series, position) => {
                  const height = Math.max(2, (bucket.levels[series.level] / yMax) * plotHeight)
                  const top = cursor - height
                  cursor = top
                  const drawn = Math.max(1, height - (position > 0 ? GAP : 0))
                  return position === segments.length - 1
                    ? <path key={series.level} d={columnPath(x, top, barWidth, drawn, 4)} fill={series.color} />
                    : <rect key={series.level} x={x} y={top} width={barWidth} height={drawn} fill={series.color} />
                })}
                {bucket.peak ? <path d={`M${x + barWidth / 2 - 5},${cursor - 10}h10l-5,7z`} className="chart-peak-marker" /> : null}
                {index === peakIndex ? (
                  <text x={Math.min(Math.max(x + barWidth / 2, MARGIN.left + 30), MARGIN.left + plotWidth - 30)} y={Math.max(cursor - 16, 12)} textAnchor="middle" className="chart-peak-label">
                    Pico · {bucket.total}
                  </text>
                ) : null}
              </g>
            )
          })}

          {showThreshold ? (
            <g>
              <line x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={y(stats.threshold)} y2={y(stats.threshold)} className="chart-threshold" />
              <text x={MARGIN.left + plotWidth} y={y(stats.threshold) - 5} textAnchor="end" className="chart-axis">limite</text>
            </g>
          ) : null}

          <line x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={baseline} y2={baseline} className="chart-baseline" />
          {buckets.map((bucket, index) => index % tickEvery === 0 ? (
            <text key={`tick-${bucket.start}`} x={slotX(index) + slot / 2} y={baseline + 18} textAnchor="middle" className="chart-axis">
              {tickLabel(bucket.start, bucketMinutes, multiDay)}
            </text>
          ) : null)}

          {buckets.map((bucket, index) => (
            <rect
              key={`hit-${bucket.start}`}
              x={slotX(index)} y={MARGIN.top - 20} width={slot} height={plotHeight + 20}
              className="chart-hit" tabIndex={0} role="button"
              aria-label={`${rangeLabel(bucket)}: ${plural(bucket.total, 'evento', 'eventos')}, ${plural(failures(bucket), 'falha', 'falhas')}${bucket.peak ? ', pico de oscilação' : ''}`}
              onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)} onBlur={() => setHovered(null)}
              onClick={() => select(index)} onKeyDown={onKey(index)}
            />
          ))}
        </svg>

        {tooltipBucket ? (
          <div className="chart-tooltip" style={{ left: tooltipLeft }} role="status">
            <span>{rangeLabel(tooltipBucket)}{tooltipBucket.peak ? ' · pico' : ''}</span>
            <b>{plural(tooltipBucket.total, 'evento', 'eventos')}</b>
            {SEVERITY_SERIES.filter(series => tooltipBucket.levels[series.level] > 0).map(series => (
              <div key={series.level}><i style={{ background: series.color }} /><strong>{tooltipBucket.levels[series.level]}</strong>{series.label}</div>
            ))}
            {tooltipBucket.signals[0] ? <small>Sinal principal: {tooltipBucket.signals[0].signal} ({tooltipBucket.signals[0].count})</small> : null}
          </div>
        ) : null}
        {stats.total === 0 ? <div className="chart-empty">Nenhum evento no período selecionado.</div> : null}
      </div>

      {activeBucket && activeBucket.total > 0 ? (
        <div className="chart-details">
          <div className="chart-details-head">
            <div>
              <span className="eyebrow">{activeBucket.peak ? 'Pico de oscilação' : 'Intervalo selecionado'}</span>
              <h3>{rangeLabel(activeBucket)}</h3>
            </div>
            {onApplyRange ? <button className="button" onClick={() => onApplyRange(activeBucket)}><SlidersHorizontal />Ver eventos deste intervalo</button> : null}
          </div>
          <div className="chart-details-grid">
            <div className="fact"><span>Total</span><strong>{activeBucket.total}</strong></div>
            <div className="fact"><span>Falhas</span><strong>{failures(activeBucket)}</strong></div>
            <div className="fact"><span>Média do período</span><strong>{stats.mean.toFixed(1)}</strong></div>
            <div className="fact"><span>Acima da média</span><strong>{stats.mean > 0 ? `${(activeBucket.total / stats.mean).toFixed(1)}×` : '—'}</strong></div>
          </div>
          <div className="chart-signals">
            <span>Sinais com mais registros</span>
            {activeBucket.signals.map(signal => (
              <div key={`${signal.pieceId}|${signal.signal}`}>
                <b>{signal.signal}</b>
                {showPieceLinks && signal.pieceId ? <Link to={`/parts/${signal.pieceId}?tab=log`}>{signal.pieceId} <ChevronRight /></Link> : null}
                <strong>{plural(signal.count, 'registro', 'registros')}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {peaks.length ? (
        <div className="peak-list">
          <span>Picos detectados</span>
          {peaks.map(index => (
            <button key={buckets[index].start} className={index === active ? 'selected' : ''} onClick={() => select(index)}>
              <AlertTriangle />
              <b>{rangeLabel(buckets[index])}</b>
              <span>{plural(buckets[index].total, 'evento', 'eventos')} · {plural(failures(buckets[index]), 'falha', 'falhas')}</span>
              <small>{buckets[index].signals[0]?.signal ?? '—'}</small>
            </button>
          ))}
        </div>
      ) : null}

      <details className="chart-table">
        <summary>Tabela de dados do gráfico</summary>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Intervalo</th><th>Total</th>{SEVERITY_SERIES.map(series => <th key={series.level}>{series.label}</th>)}<th>Pico</th></tr></thead>
            <tbody>
              {buckets.filter(bucket => bucket.total > 0).map(bucket => (
                <tr key={bucket.start}>
                  <td className="nowrap">{rangeLabel(bucket)}</td>
                  <td><b>{bucket.total}</b></td>
                  {SEVERITY_SERIES.map(series => <td key={series.level}>{bucket.levels[series.level]}</td>)}
                  <td>{bucket.peak ? 'Sim' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

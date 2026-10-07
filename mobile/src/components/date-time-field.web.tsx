import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/app-text'
import type { DateTimeFieldProps } from '@/components/date-time-field'
import { colors, radius } from '@/constants/theme'

const pad = (value: number) => String(value).padStart(2, '0')

// Formato aceito por <input type="datetime-local"> (horário local, sem fuso).
function toInputValue(date?: Date | null) {
  if (!date) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Na web o seletor nativo do navegador substitui o @react-native-community/datetimepicker.
export function DateTimeField({ label, value, onChange, minimumDate, maximumDate }: DateTimeFieldProps) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="label">{label}</AppText>
      <input
        type="datetime-local"
        aria-label={label}
        value={toInputValue(value)}
        min={toInputValue(minimumDate) || undefined}
        max={toInputValue(maximumDate) || undefined}
        onChange={event => onChange(event.target.value ? new Date(event.target.value) : null)}
        style={{
          height: 44,
          border: `1px solid #d6dce3`,
          borderRadius: radius.md,
          padding: '0 10px',
          fontSize: 13,
          color: colors.text,
          backgroundColor: colors.surface,
          fontFamily: 'inherit',
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
})

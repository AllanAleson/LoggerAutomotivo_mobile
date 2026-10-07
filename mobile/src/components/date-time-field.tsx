import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native'

import { AppText } from '@/components/app-text'
import { Button } from '@/components/button'
import { Calendar, X } from '@/components/icons'
import { colors, fonts, radius } from '@/constants/theme'
import { formatDateTimeShort } from '@/lib/format'

export interface DateTimeFieldProps {
  label: string
  value: Date | null
  onChange: (value: Date | null) => void
  minimumDate?: Date
  maximumDate?: Date
}

export function clampDate(date: Date, minimumDate?: Date, maximumDate?: Date) {
  if (minimumDate && date < minimumDate) return new Date(minimumDate)
  if (maximumDate && date > maximumDate) return new Date(maximumDate)
  return date
}

export function DateTimeField({ label, value, onChange, minimumDate, maximumDate }: DateTimeFieldProps) {
  const [iosDraft, setIosDraft] = useState<Date | null>(null)

  const open = () => {
    const initial = value ?? clampDate(new Date(), minimumDate, maximumDate)
    if (Platform.OS !== 'android') {
      setIosDraft(initial)
      return
    }
    // No Android a data e a hora são escolhidas em dois diálogos nativos seguidos.
    DateTimePickerAndroid.open({
      value: initial,
      mode: 'date',
      minimumDate,
      maximumDate,
      onValueChange: (_event, date) => {
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          onValueChange: (_timeEvent, time) => {
            const combined = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes())
            onChange(clampDate(combined, minimumDate, maximumDate))
          },
        })
      },
    })
  }

  const confirmIos = () => {
    if (iosDraft) onChange(clampDate(iosDraft, minimumDate, maximumDate))
    setIosDraft(null)
  }

  return (
    <View style={styles.wrapper}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.field}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? formatDateTimeShort(value) : 'não definido'}. Alterar`}
          onPress={open}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
          <Calendar size={16} color={colors.blue} />
          <AppText numberOfLines={1} style={[styles.value, !value && styles.placeholder]}>
            {value ? formatDateTimeShort(value) : 'Selecionar'}
          </AppText>
        </Pressable>
        {value ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Limpar ${label}`} hitSlop={8} onPress={() => onChange(null)} style={styles.clear}>
            <X size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {Platform.OS === 'ios' ? (
        <Modal visible={iosDraft !== null} transparent animationType="fade" onRequestClose={() => setIosDraft(null)}>
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <AppText variant="heading">{label}</AppText>
              {iosDraft ? (
                <DateTimePicker
                  value={iosDraft}
                  mode="datetime"
                  display="inline"
                  locale="pt-BR"
                  themeVariant="light"
                  accentColor={colors.blue}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  onValueChange={(_event, date) => setIosDraft(date)}
                />
              ) : null}
              <View style={styles.actions}>
                <Button title="Cancelar" variant="secondary" onPress={() => setIosDraft(null)} style={styles.flex} />
                <Button title="Confirmar" onPress={confirmIos} style={styles.flex} />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  field: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d6dce3',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  trigger: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, minHeight: 44 },
  pressed: { opacity: 0.7 },
  value: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  placeholder: { color: colors.subtle },
  clear: { paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(8,14,22,0.55)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
})

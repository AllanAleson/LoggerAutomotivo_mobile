import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/app-text'
import { Button } from '@/components/button'
import { CircleX, LayoutDashboard } from '@/components/icons'
import { colors } from '@/constants/theme'

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <CircleX size={32} color={colors.subtle} />
      <AppText variant="heading">Página não encontrada</AppText>
      <AppText variant="caption">O endereço aberto não corresponde a nenhuma tela do app.</AppText>
      <Button title="Voltar ao dashboard" icon={LayoutDashboard} onPress={() => router.replace('/')} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, backgroundColor: colors.background },
})

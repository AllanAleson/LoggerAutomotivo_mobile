# Logger Auto Mobile

App React Native (Expo SDK 57 + Expo Router) do Logger IoT Automotivo. Leva para Android e iOS todas as funções do dashboard web e consome a mesma API REST do `backend/`.

```text
ESP32 / simulador -> REST API (Express) -> PostgreSQL/PGlite -> app mobile (Android/iOS) e dashboard web
```

## Funcionalidades

| Tela | O que faz |
|---|---|
| Dashboard | Loggers online/offline, falhas críticas e falhas em 24 h; ocorrências recentes com atalho para o diagnóstico |
| Pesquisar | Busca por ID da peça, número de série ou Logger; abre o dispositivo |
| Dispositivos | Loggers com status, peça associada, última comunicação, firmware, tensão e eventos pendentes |
| Alertas | Ocorrências por prioridade, com filtro por severidade; cada alerta abre o diagnóstico daquela ocorrência |
| Ajustes | Endereço da API (com teste de conexão) e referências operacionais (heartbeat, limite offline) |
| Peça › Visão geral | Telemetria do Logger, última falha (esperado × recebido) e últimos eventos |
| Peça › Log | Filtros por período (inclusive personalizado), severidade e evento; rolagem infinita; exportação CSV pela folha de compartilhamento |
| Peça › Diagnóstico | Falha mais relevante ou a ocorrência escolhida: esperado × recebido, possível causa e evidências |
| Peça › Histórico | Falhas entre os 100 eventos mais recentes |

Os dados se atualizam a cada 15 s enquanto a tela está visível (como no dashboard web) e também ao puxar a lista para baixo. A atualização pausa com o app em segundo plano e é retomada ao voltar.

## Como executar

Pré-requisitos: Node.js 22+ e, no celular, o app **Expo Go** (Play Store/App Store) ou um emulador Android/simulador iOS.

1. Suba o backend (na pasta `Logger/LoggerAutomotivo`):

   ```powershell
   npm.cmd install
   npm.cmd run db:seed
   npm.cmd run dev -w backend
   ```

2. Em outro terminal, inicie o app (na pasta `Logger/LoggerAutomotivo/mobile`):

   ```powershell
   npm.cmd install
   npm.cmd start
   ```

3. Leia o QR code com o Expo Go (Android) ou com a câmera (iOS). Para o emulador Android, pressione `a` no terminal do Expo.

Celular e computador precisam estar na mesma rede Wi-Fi. Na primeira execução, permita o Node.js nas redes privadas do Firewall do Windows (portas 8081 do Expo e 3333 da API).

## Endereço da API

O app descobre o backend sozinho: em desenvolvimento, usa o IP do computador que serve o bundle do Expo na porta 3333 (por exemplo `http://192.168.0.10:3333`). No emulador Android com o bundle servido por `localhost`, usa `http://10.0.2.2:3333`.

Para mudar o endereço:

- **No app:** aba **Ajustes** › Servidor da API › **Testar conexão** › **Salvar**. O valor fica salvo no aparelho e pode ser restaurado ao padrão.
- **Na inicialização:** copie `.env.example` para `.env` e defina `EXPO_PUBLIC_API_URL=http://SEU-IP:3333`.

Se o Expo anunciar um IP errado (por exemplo `192.168.56.x`, da placa virtual do VirtualBox), force o IP do Wi-Fi antes de iniciar:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.0.10"
npm.cmd start
```

Com o túnel do Expo (`--tunnel`) a porta 3333 não é exposta; configure o endereço da API manualmente.

## Validação

```powershell
npm.cmd run typecheck   # TypeScript
npm.cmd run lint        # ESLint (eslint-config-expo)
npm.cmd test            # Jest: funções puras e telas com a API simulada
npm.cmd run doctor      # expo-doctor
```

## Estrutura

```text
src/
  app/                 rotas (Expo Router): abas, peça e página não encontrada
    (tabs)/            Dashboard, Pesquisar, Dispositivos, Alertas, Ajustes
    parts/[pieceId].tsx  detalhe da peça (?tab=overview|log|diagnosis|history&eventId=...)
  api/                 tipos do contrato REST, cliente HTTP com timeout e endereço configurável
  features/part/       abas da tela da peça
  components/          componentes visuais (badges, cards, estados, filtros...)
  hooks/               useApi (busca + polling), app em primeiro plano, debounce
  lib/                 funções puras: URL da API, filtros de eventos, formatação, CSV, rotas
__tests__/             testes Jest
test-utils/            dados e API simulados para os testes
```

## Builds de produção

O projeto usa Continuous Native Generation: as pastas `android/` e `ios/` são geradas por `npx expo prebuild` ou pelo EAS (`npx eas-cli@latest build`). Para builds locais, `npx expo run:android` exige Android Studio/SDK.

Como a API do MVP usa HTTP, o `app.json` libera tráfego sem TLS (`usesCleartextTraffic` no Android e `NSAllowsArbitraryLoads` no iOS). Em produção, publique a API com HTTPS e remova essas exceções.

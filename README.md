<<<<<<< HEAD
# app-mimiLulu-diario
App de controle de gastos diários/semanais para Mimi &amp; Lulu
=======
# Mimi & Lulu - Diário de Gastos

App para o casal acompanhar os gastos diários e semanais em tempo real.

## Funcionalidades

- Adicionar gastos com item e valor
- Visão do dia (gastos de hoje com total e limite)
- Visão da semana (domingo a sábado com total e limite)
- Sincronização em tempo real entre os dois celulares
- Notificação quando o outro adiciona um gasto
- Lembrete noturno (20h) para registrar os gastos
- Limites diário e semanal configuráveis

## Tecnologias

- React Native (Expo)
- Firebase Firestore (banco de dados em tempo real)
- Expo Notifications (notificações)

## Configuração do Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projeto (ex: `mimilulu-gastos`)
3. Vá em **Firestore Database** > **Criar banco de dados** > modo produção
4. Vá em **Configurações do projeto** > **Geral** > **Seus apps** > **Web**
5. Copie as credenciais (`apiKey`, `authDomain`, `projectId`, etc.)
6. Cole no arquivo `src/config/firebase.js`
7. No Firestore, crie as coleções:
   - `gastos` (documentos automáticos ao adicionar)
   - `limites` com documento `geral` contendo:
     ```json
     {
       "diario": 100,
       "semanal": 500
     }
     ```

## Regras do Firestore (segurança)

No console do Firebase, em Firestore > Regras, cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> **Importante:** Como o app é privado para o casal, essas regras liberam geral. Para produção futura, adicione autenticação.

## Como rodar

```bash
npm install
npx expo start
```

Escaneie o QR Code com o app Expo Go no celular.

## Google Drive Backup

Para fazer backup da pasta do projeto no Google Drive:

### Opção 1: Google Drive para Desktop
1. Baixe e instale o Google Drive para Windows
2. Faça login com a conta Google
3. Crie uma pasta "app-mimiLulu-diario" dentro do Google Drive
4. Copie os arquivos do projeto para lá manualmente ou use um atalho

### Opção 2: rclone (terminal)
```bash
# Instalar rclone
sudo apt install rclone

# Configurar Google Drive
rclone config

# Sincronizar
rclone sync /caminho/do/projeto meudrive:app-mimiLulu-diario
```

### Opção 3: Git + GitHub (já configurado)
O repositório já está no GitHub. Para enviar:

```bash
git add .
git commit -m "mensagem"
git push origin main
```

## Estrutura

```
app-mimiLulu-diario/
├── App.js                 # Entry point e navegação
├── src/
│   ├── config/
│   │   └── firebase.js    # Configuração do Firebase
│   ├── screens/
│   │   ├── LoginScreen.js # Seleção de usuário (Lucas/Milena)
│   │   ├── HomeScreen.js  # Resumo do dia com gastos
│   │   ├── AddExpenseScreen.js  # Formulário de novo gasto
│   │   ├── WeekScreen.js  # Visão da semana completa
│   │   └── SettingsScreen.js  # Configurar limites
│   └── services/
│       ├── expenseService.js   # CRUD e subscriptions Firestore
│       └── notifications.js    # Notificações push/locais
└── assets/
```
>>>>>>> 5a2dcb7 (Initial commit: app de gastos Mimi & Lulu)

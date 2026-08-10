# Agente de Impressão AgapeFood

Programa que roda no computador conectado às impressoras térmicas do seu estabelecimento e
imprime automaticamente as comandas assim que um pedido chega no AgapeFood — mesmo que o
navegador esteja fechado, desde que este agente esteja em execução.

## Como funciona

```
Pedido criado no AgapeFood (painel, cardápio digital, garçom...)
        ↓
Backend cria os PrintJobs (um por setor/impressora)
        ↓
Backend avisa este agente em tempo real via Socket.IO
        ↓
Este agente imprime de verdade na impressora térmica (USB ou rede)
        ↓
Agente avisa o backend: impresso com sucesso, ou falhou (com retentativa automática)
```

## 1. Pré-requisitos

- Node.js 18 ou superior instalado no computador que fica ligado às impressoras.
- As impressoras cadastradas em **Impressoras** no painel AgapeFood (menu lateral), com o
  tipo de conexão e identificador corretos (veja passo 4).

## 2. Instalação

```bash
cd agente-impressao
npm install
```

### Se você for usar impressora USB

Impressoras USB são impressas através do driver de impressão instalado no Windows (a mesma
impressora que aparece em "Impressoras e Scanners" do Windows). Para isso, instale também:

```bash
npm install printer
```

Esse pacote compila um módulo nativo — no Windows normalmente funciona direto; se der erro de
compilação, instale as "Build Tools for Visual Studio" (C++) e tente de novo.

Impressoras de rede (`REDE`, endereço IP:porta) **não precisam** desse pacote.

## 3. Configuração

Copie `.env.example` para `.env` e preencha:

```
BACKEND_URL=https://SEU-BACKEND.up.railway.app/api
AGAPEFOOD_EMAIL=seu-email@exemplo.com
AGAPEFOOD_SENHA=sua-senha
```

Use um usuário do AgapeFood que tenha acesso à empresa correta (o agente só imprime os pedidos
dessa empresa).

## 4. Cadastrar as impressoras no painel

No AgapeFood, vá em **Impressoras** → **+ Impressora** e cadastre cada impressora física:

- **Rede (a mais fácil de configurar)**: tipo de conexão "Rede / TCP-IP", endereço `IP:porta`
  (a porta padrão de impressoras térmicas de rede costuma ser `9100`). Exemplo: `192.168.0.50:9100`.
- **USB**: tipo de conexão "USB", identificador = o **nome exato** da impressora tal como
  aparece em "Impressoras e Scanners" do Windows (ex: `POS-80 Printer` ou `EPSON TM-T20X`).

O **setor** define quais itens do pedido vão para essa impressora (Cozinha, Bar, Confeitaria,
Garçom, Delivery, etc.) — configure o setor de cada produto do cardápio na tela de Cardápio,
campo "Setor de produção".

## 5. Rodando o agente

```bash
npm start
```

Deixe essa janela aberta (ou rode como serviço/em segundo plano — veja "Limitações" abaixo).
Você verá no terminal cada job de impressão chegando e o resultado.

## 6. Testando sem uma impressora física

Para conferir que a formatação das comandas está correta (cabeçalho, itens, separadores) sem
precisar de hardware:

```bash
npm run testar-formatacao
```

Isso gera os bytes ESC/POS reais (os mesmos que seriam mandados pra uma impressora de verdade)
em arquivos `.escpos` dentro de `saida-teste/`, e mostra uma prévia legível no terminal.

## 7. Testando com uma impressora física

1. Cadastre a impressora em **Impressoras** no painel.
2. Clique em **"🖨️ Testar impressão"** naquele cartão.
3. Com o agente rodando (`npm start`), a página de teste deve sair na impressora em poucos
   segundos, e o card na Central de Impressão deve virar 🟢 Online.

## 8. Retentativa automática

Se uma impressão falhar (impressora desligada, sem papel, offline), o agente tenta de novo
automaticamente 3 vezes (aguardando 2s, 5s e 10s entre tentativas) antes de marcar o job como
`FAILED`. Cada tentativa fica registrada nos Logs de Auditoria da Central de Impressão. Uma
impressão já confirmada como `PRINTED` nunca é reenviada automaticamente — reimpressão manual
fica disponível pelo botão "Reimprimir".

## 9. Tolerância a quedas de conexão

- Se a internet cair, o backend continua guardando os pedidos e a fila de impressão
  normalmente (nada se perde).
- Quando o agente reconectar, ele automaticamente busca e imprime qualquer job que ficou
  pendente enquanto estava offline.

## Limitações desta versão (fase 1)

Esta é a versão "serviço leve" do agente — roda como um programa de linha de comando comum.
Ainda **não** incluído (fica para uma fase seguinte, depois de validar com impressora real):

- Ícone na bandeja do Windows / interface gráfica.
- Início automático com o Windows.
- Instalador `.exe` para distribuição.
- Notificações nativas do Windows.
- Suporte a Bluetooth (o cadastro já aceita, mas a impressão em si ainda não).

Até lá, para manter o agente sempre rodando, você pode usar o Agendador de Tarefas do Windows
para iniciar `npm start` (ou `node index.js`) no login do usuário, ou deixar a janela do
terminal aberta minimizada no computador que fica junto às impressoras.

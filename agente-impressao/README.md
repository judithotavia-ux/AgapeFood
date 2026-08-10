# Agente de Impressão AgapeFood

Programa que roda no computador conectado às impressoras térmicas do seu estabelecimento e
imprime automaticamente as comandas assim que um pedido chega no AgapeFood — mesmo que o
navegador esteja fechado, desde que este agente esteja em execução.

Existem duas formas de rodar o agente:

- **App de bandeja (recomendado)** — instalador `.exe`, ícone na bandeja do Windows,
  notificações nativas, início automático com o Windows. É o que a maioria dos
  estabelecimentos deve usar.
- **Linha de comando** — um script Node.js simples, útil para rodar em servidor/headless ou
  para desenvolvimento.

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

## 1. Cadastrar as impressoras no painel (obrigatório nos dois modos)

No AgapeFood, vá em **Impressoras** → **+ Impressora** e cadastre cada impressora física:

- **Rede (a mais fácil de configurar)**: tipo de conexão "Rede / TCP-IP", endereço `IP:porta`
  (a porta padrão de impressoras térmicas de rede costuma ser `9100`). Exemplo: `192.168.0.50:9100`.
- **USB**: tipo de conexão "USB", identificador = o **nome exato** da impressora tal como
  aparece em "Impressoras e Scanners" do Windows (ex: `POS-80 Printer` ou `EPSON TM-T20X`).

O **setor** define quais itens do pedido vão para essa impressora (Cozinha, Bar, Confeitaria,
Garçom, Delivery, etc.) — configure o setor de cada produto do cardápio na tela de Cardápio,
campo "Setor de produção".

---

## 2. App de bandeja (recomendado)

### Instalar

1. Baixe/copie `release/AgapeFood Agente de Impressão Setup 1.0.0.exe` (gerado pelo passo de
   build abaixo) para o computador que fica junto às impressoras.
2. Rode o instalador e siga os passos (permite escolher a pasta de instalação).
3. Abra o "AgapeFood Agente de Impressão" pelo menu Iniciar — ele abre minimizado na bandeja
   do Windows (ícone dourado perto do relógio).

### Configurar

Clique no ícone da bandeja → **Configurações** e preencha:

- **URL do backend**: ex. `https://seu-backend.up.railway.app/api`
- **E-mail** e **senha**: de um usuário AgapeFood com acesso à empresa correta.
- Marque **"Iniciar automaticamente com o Windows"** se quiser que o agente já suba junto com
  o computador.

Ao salvar, o agente conecta na hora — o status muda para 🟢 **Conectado**.

### Usar

- **Testar impressão**: aba Impressoras → botão em cada impressora.
- **Fila**: aba Fila mostra os últimos jobs, com opção de reimprimir/tentar de novo.
- **Pausar/Retomar impressão**: pelo menu da bandeja ou pelo botão na aba Status — útil se
  precisar trocar o papel sem que os pedidos se percam (eles ficam na fila e imprimem quando
  você retomar).
- **Notificações**: o Windows mostra um aviso nativo a cada novo pedido de impressão e a cada
  falha de impressão.
- Fechar a janela (X) só minimiza para a bandeja — o agente continua rodando e imprimindo.
  Para encerrar de verdade, use **Sair** no menu da bandeja.

### Gerar o instalador você mesma (se alterar o código)

```bash
cd agente-impressao
npm install
npm run dist
```

O instalador sai em `agente-impressao/release/AgapeFood Agente de Impressão Setup 1.0.0.exe`.

> **Sobre o aviso do Windows SmartScreen**: como o instalador ainda não tem um certificado de
> assinatura de código pago, o Windows pode mostrar um aviso "Editor desconhecido" na primeira
> execução. Isso é normal para apps novos sem certificado — clique em "Mais informações" →
> "Executar assim mesmo". Se quiser remover esse aviso permanentemente (recomendado antes de
> distribuir para clientes), é necessário comprar um certificado de assinatura de código
> (Code Signing Certificate, ~R$500–2000/ano) de uma autoridade certificadora — isso só você
> pode contratar.

> **Ícone**: o ícone atual (`assets/icon.png` / `assets/icon.ico`) é um placeholder genérico.
> Para usar a marca real do seu estabelecimento, substitua esses dois arquivos pelo logo da
> empresa (ou gere as versões correspondentes) antes de rodar `npm run dist`.

---

## 3. Linha de comando (alternativa/headless)

### Instalação

```bash
cd agente-impressao
npm install
```

Se for usar impressora **USB**, instale também o driver nativo:

```bash
npm install printer
```

(Esse pacote compila um módulo nativo — no Windows normalmente funciona direto; se der erro,
instale as "Build Tools for Visual Studio" C++ e tente de novo. Impressoras de **rede** não
precisam desse pacote.)

### Configuração

Copie `.env.example` para `.env` e preencha:

```
BACKEND_URL=https://SEU-BACKEND.up.railway.app/api
AGAPEFOOD_EMAIL=seu-email@exemplo.com
AGAPEFOOD_SENHA=sua-senha
```

### Rodando

```bash
npm start
```

Deixe essa janela aberta (ou use o Agendador de Tarefas do Windows para rodar em segundo
plano). Você verá no terminal cada job de impressão chegando e o resultado.

---

## 4. Testando sem uma impressora física

Para conferir que a formatação das comandas está correta (cabeçalho, itens, separadores) sem
precisar de hardware:

```bash
npm run testar-formatacao
```

Isso gera os bytes ESC/POS reais (os mesmos que seriam mandados pra uma impressora de verdade)
em arquivos `.escpos` dentro de `saida-teste/`, e mostra uma prévia legível no terminal.

## 5. Retentativa automática

Se uma impressão falhar (impressora desligada, sem papel, offline), o agente tenta de novo
automaticamente 3 vezes (aguardando 2s, 5s e 10s entre tentativas) antes de marcar o job como
`FAILED`. Cada tentativa fica registrada nos Logs de Auditoria da Central de Impressão. Uma
impressão já confirmada como `PRINTED` nunca é reenviada automaticamente — reimpressão manual
fica disponível pelo botão "Reimprimir".

## 6. Tolerância a quedas de conexão

- Se a internet cair, o backend continua guardando os pedidos e a fila de impressão
  normalmente (nada se perde).
- Quando o agente reconectar (CLI ou app de bandeja), ele automaticamente busca e imprime
  qualquer job que ficou pendente enquanto estava offline.

## Limitações atuais

- **Bluetooth**: o cadastro de impressora já aceita, mas a impressão em si ainda não foi
  implementada para esse tipo de conexão.
- **Multi-filial**: o sistema ainda não tem o conceito de filiais dentro de uma empresa — cada
  empresa tem um único conjunto de impressoras.
- **Alteração de pedido já enviado à cozinha**: como ainda não existe uma funcionalidade de
  editar itens de um pedido já criado, a "comanda de alteração" (avisando o que foi
  adicionado/removido) ainda não é gerada — só cancelamento e reimpressão.

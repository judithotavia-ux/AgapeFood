// Valida a formatacao ESC/POS SEM precisar de uma impressora fisica conectada.
// Usa a interface de arquivo do node-thermal-printer (quando o "interface" nao bate com
// tcp://... nem printer:..., a biblioteca grava os bytes crus num arquivo local).
const fs = require('fs');
const path = require('path');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const { renderizarComanda } = require('./renderizador');

const SAIDA_DIR = path.join(__dirname, 'saida-teste');
if (!fs.existsSync(SAIDA_DIR)) fs.mkdirSync(SAIDA_DIR);

const EXEMPLOS = {
  'comanda-cozinha': {
    cabecalho: 'ÁGAPE FOOD', subcabecalho: 'SERVINDO COM EXCELÊNCIA',
    linhas: [
      { tipo: 'titulo', texto: 'PEDIDO #000125' },
      { tipo: 'texto', texto: 'DATA: 10/08/2026' },
      { tipo: 'texto', texto: 'HORA: 07:45' },
      { tipo: 'texto', texto: 'ORIGEM: WHATSAPP' },
      { tipo: 'separador' },
      { tipo: 'item', texto: '2x X-BURGER' },
      { tipo: 'detalhe', texto: '   SEM CEBOLA' },
      { tipo: 'item', texto: '1x BATATA FRITA G' },
      { tipo: 'separador' },
      { tipo: 'texto', texto: 'OBSERVAÇÃO:' },
      { tipo: 'texto', texto: '"Enviar bastante molho."' },
      { tipo: 'separador' },
      { tipo: 'texto', texto: 'TIPO: DELIVERY' }
    ]
  },
  'comanda-garcom': {
    cabecalho: 'ÁGAPE FOOD', subcabecalho: null,
    linhas: [
      { tipo: 'titulo', texto: 'PEDIDO #000125' },
      { tipo: 'texto', texto: 'MESA: 08' },
      { tipo: 'texto', texto: 'GARÇOM: JOÃO' },
      { tipo: 'separador' },
      { tipo: 'item', texto: '2x X-BURGER' },
      { tipo: 'item', texto: '1x BATATA FRITA G' },
      { tipo: 'item', texto: '1x REFRIGERANTE COLA' },
      { tipo: 'separador' },
      { tipo: 'texto', texto: 'OBSERVAÇÃO:' },
      { tipo: 'texto', texto: 'Sem cebola.' }
    ]
  },
  'cancelamento': {
    cabecalho: 'PEDIDO CANCELADO', subcabecalho: null,
    linhas: [
      { tipo: 'titulo', texto: 'PEDIDO #000125' },
      { tipo: 'texto', texto: 'HORÁRIO: 08:12' },
      { tipo: 'separador' },
      { tipo: 'texto', texto: 'MOTIVO:' },
      { tipo: 'texto', texto: 'Cliente cancelou.' }
    ]
  },
  teste: {
    cabecalho: 'ÁGAPE FOOD', subcabecalho: 'SERVINDO COM EXCELÊNCIA',
    linhas: [
      { tipo: 'titulo', texto: 'TESTE DE IMPRESSÃO' },
      { tipo: 'separador' },
      { tipo: 'texto', texto: 'IMPRESSORA: Impressora da Cozinha' },
      { tipo: 'texto', texto: 'SETOR: COZINHA' },
      { tipo: 'texto', texto: `DATA: ${new Date().toLocaleDateString('pt-BR')}` },
      { tipo: 'texto', texto: `HORA: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` },
      { tipo: 'texto', texto: 'STATUS: OK' }
    ]
  }
};

async function main() {
  console.log('Gerando comandas ESC/POS de exemplo (sem impressora física - grava em arquivo)...\n');

  for (const [nome, payload] of Object.entries(EXEMPLOS)) {
    const arquivoSaida = path.join(SAIDA_DIR, `${nome}.escpos`);
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: arquivoSaida,
      width: 48,
      characterSet: CharacterSet.PC860_PORTUGUESE
    });

    renderizarComanda(printer, payload, 1);
    await printer.execute();

    const bytes = fs.readFileSync(arquivoSaida);
    console.log(`✓ ${nome}: ${bytes.length} bytes gravados em ${arquivoSaida}`);

    const textoLegivel = printer
      .getText()
      .split('\n')
      .map((l) => '    ' + l)
      .join('\n');
    console.log(textoLegivel);
    console.log('');
  }

  console.log(`Tudo certo. Os arquivos .escpos em "${SAIDA_DIR}" contêm os bytes EXATOS que seriam enviados a uma impressora térmica real.`);
  console.log('Para confirmar numa impressora de verdade, cadastre-a em Impressoras (painel AgapeFood) e clique em "Testar impressão".');
}

main().catch((e) => { console.error('Erro:', e); process.exit(1); });

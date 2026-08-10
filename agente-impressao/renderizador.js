// Traduz o payload estruturado (gerado pelo backend em impressao.service.js) em comandos ESC/POS reais,
// usando a API do node-thermal-printer. O MESMO formato de payload é usado por toda comanda (cozinha,
// garcom, delivery, cancelamento, teste) - só muda o conteudo das linhas.
function renderizarComanda(printer, payload, copias = 1) {
  for (let i = 0; i < Math.max(1, copias); i++) {
    printer.clear();

    if (payload.cabecalho) {
      printer.alignCenter();
      printer.bold(true);
      printer.setTextDoubleHeight();
      printer.println(payload.cabecalho);
      printer.setTextNormal();
      printer.bold(false);
    }
    if (payload.subcabecalho) {
      printer.alignCenter();
      printer.println(payload.subcabecalho);
    }
    printer.alignLeft();
    printer.drawLine();

    for (const linha of payload.linhas || []) {
      switch (linha.tipo) {
        case 'titulo':
          printer.alignCenter();
          printer.bold(true);
          printer.println(linha.texto);
          printer.bold(false);
          printer.alignLeft();
          break;
        case 'separador':
          printer.drawLine();
          break;
        case 'item':
          printer.bold(true);
          printer.println(linha.texto);
          printer.bold(false);
          break;
        case 'detalhe':
          printer.println(linha.texto);
          break;
        case 'texto':
        default:
          printer.println(linha.texto);
          break;
      }
    }

    printer.drawLine();
    printer.cut();
  }
}

module.exports = { renderizarComanda };

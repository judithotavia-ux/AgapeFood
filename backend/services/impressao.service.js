const prisma = require('../prisma/client');
const { emitirParaEmpresa } = require('../realtime/socket');

function linha(tipo, texto) {
  return { tipo, texto };
}

function formatarItens(itens) {
  const linhas = [];
  for (const item of itens) {
    linhas.push(linha('item', `${item.quantidade}x ${item.nomeProduto}`));
    if (item.adicionaisJson) {
      try {
        const adicionais = JSON.parse(item.adicionaisJson);
        adicionais.forEach((a) => linhas.push(linha('detalhe', `   + ${a.nome}`)));
      } catch (e) { /* payload antigo/invalido, ignora */ }
    }
    if (item.observacoes) linhas.push(linha('detalhe', `   ${item.observacoes}`));
  }
  return linhas;
}

function numeroFormatado(pedido) {
  return String(pedido.numero).padStart(6, '0');
}

// Comanda de producao (cozinha/bar/confeitaria/etc) - NUNCA inclui valores financeiros
function montarComandaProducao(pedido, itensDoSetor) {
  const dataHora = new Date(pedido.criadoEm);
  const linhas = [
    linha('titulo', `PEDIDO #${numeroFormatado(pedido)}`),
    linha('texto', `DATA: ${dataHora.toLocaleDateString('pt-BR')}`),
    linha('texto', `HORA: ${dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`),
    linha('texto', `ORIGEM: ${pedido.origemPedido || 'PAINEL'}`),
    linha('separador')
  ];
  linhas.push(...formatarItens(itensDoSetor));
  if (pedido.observacoes) {
    linhas.push(linha('separador'));
    linhas.push(linha('texto', 'OBSERVAÇÃO:'));
    linhas.push(linha('texto', `"${pedido.observacoes}"`));
  }
  linhas.push(linha('separador'));
  linhas.push(linha('texto', `TIPO: ${pedido.tipo}`));
  if (pedido.mesa) linhas.push(linha('texto', `MESA: ${pedido.mesa.numero}`));
  return { cabecalho: 'ÁGAPE FOOD', subcabecalho: 'SERVINDO COM EXCELÊNCIA', linhas };
}

function montarComandaGarcom(pedido, itens) {
  const linhas = [
    linha('titulo', `PEDIDO #${numeroFormatado(pedido)}`),
    linha('texto', pedido.mesa ? `MESA: ${pedido.mesa.numero}` : 'BALCÃO'),
    linha('texto', `GARÇOM: ${pedido.garcomNome || 'Não informado'}`),
    linha('separador')
  ];
  linhas.push(...formatarItens(itens));
  linhas.push(linha('separador'));
  linhas.push(linha('texto', `CONSUMO: R$ ${Number(pedido.valorTotal).toFixed(2)}`));
  if (Number(pedido.gorjetaValor) > 0) {
    const percentualTexto = pedido.gorjetaPercentual ? ` ${Number(pedido.gorjetaPercentual)}%` : '';
    linhas.push(linha('texto', `GORJETA${percentualTexto}: R$ ${Number(pedido.gorjetaValor).toFixed(2)}`));
  }
  linhas.push(linha('texto', `TOTAL: R$ ${(Number(pedido.valorTotal) + Number(pedido.gorjetaValor)).toFixed(2)}`));
  if (pedido.observacoes) {
    linhas.push(linha('separador'));
    linhas.push(linha('texto', 'OBSERVAÇÃO:'));
    linhas.push(linha('texto', pedido.observacoes));
  }
  return { cabecalho: 'ÁGAPE FOOD', subcabecalho: null, linhas };
}

function montarComandaDelivery(pedido, itens) {
  const linhas = [
    linha('titulo', `PEDIDO #${numeroFormatado(pedido)}`),
    linha('texto', `CLIENTE: ${pedido.clienteNome || 'Não informado'}`),
    linha('texto', `TELEFONE: ${pedido.clienteTelefone || '-'}`),
    linha('separador'),
    linha('texto', 'ENDEREÇO:'),
    linha('texto', pedido.clienteEndereco || '-'),
    linha('separador')
  ];
  linhas.push(...formatarItens(itens));
  linhas.push(linha('separador'));
  linhas.push(linha('texto', `FORMA DE PAGAMENTO: ${pedido.formaPagamento || 'Não informado'}`));
  linhas.push(linha('texto', `TAXA DE ENTREGA: R$ ${Number(pedido.taxaEntrega).toFixed(2)}`));
  if (Number(pedido.gorjetaValor) > 0) {
    const percentualTexto = pedido.gorjetaPercentual ? ` ${Number(pedido.gorjetaPercentual)}%` : '';
    linhas.push(linha('texto', `GORJETA${percentualTexto}: R$ ${Number(pedido.gorjetaValor).toFixed(2)}`));
    linhas.push(linha('texto', `TOTAL: R$ ${(Number(pedido.valorTotal) + Number(pedido.gorjetaValor)).toFixed(2)}`));
  } else {
    linhas.push(linha('texto', `TOTAL: R$ ${Number(pedido.valorTotal).toFixed(2)}`));
  }
  if (pedido.observacoes) {
    linhas.push(linha('separador'));
    linhas.push(linha('texto', 'OBSERVAÇÃO:'));
    linhas.push(linha('texto', pedido.observacoes));
  }
  return { cabecalho: 'ÁGAPE FOOD', subcabecalho: null, linhas };
}

function montarCancelamento(pedido, motivo) {
  return {
    cabecalho: 'PEDIDO CANCELADO',
    subcabecalho: null,
    linhas: [
      linha('titulo', `PEDIDO #${numeroFormatado(pedido)}`),
      linha('texto', `HORÁRIO: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`),
      linha('separador'),
      linha('texto', 'MOTIVO:'),
      linha('texto', motivo || 'Pedido cancelado.')
    ]
  };
}

function montarTeste(impressora) {
  const agora = new Date();
  return {
    cabecalho: 'ÁGAPE FOOD',
    subcabecalho: 'SERVINDO COM EXCELÊNCIA',
    linhas: [
      linha('titulo', 'TESTE DE IMPRESSÃO'),
      linha('separador'),
      linha('texto', `IMPRESSORA: ${impressora.nome}`),
      linha('texto', `SETOR: ${impressora.setor}`),
      linha('texto', `DATA: ${agora.toLocaleDateString('pt-BR')}`),
      linha('texto', `HORA: ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`),
      linha('texto', 'STATUS: OK')
    ]
  };
}

// O proxy MySQL do Railway nao garante read-your-own-writes entre conexoes diferentes do pool
// de conexoes do Prisma. Criar varios printJob/printLog em chamadas separadas (cada uma podendo
// pegar uma conexao diferente) pode falhar com violacao de FK mesmo com as linhas ja commitadas,
// ou pior, ficar invisivel pra leituras seguintes por um tempo. Por isso TODOS os jobs de um mesmo
// pedido sao criados numa UNICA transacao interativa (uma unica conexao do inicio ao fim).
async function criarJobsEmLote(especificacoes) {
  if (!especificacoes.length) return [];

  const jobs = await prisma.$transaction(async (tx) => {
    const criados = [];
    for (const spec of especificacoes) {
      const novoJob = await tx.printJob.create({
        data: {
          empresaId: spec.empresaId,
          printerId: spec.printerId,
          pedidoId: spec.pedidoId || null,
          setor: spec.setor,
          tipoDocumento: spec.tipoDocumento,
          prioridade: spec.prioridade || 'NORMAL',
          payload: JSON.stringify(spec.conteudo)
        },
        include: { printer: true }
      });
      await tx.printLog.create({ data: { printJobId: novoJob.id, acao: 'CRIADO' } });
      criados.push(novoJob);
    }
    return criados;
  }, { timeout: 15000 });

  jobs.forEach((job) => emitirParaEmpresa(job.empresaId, 'impressao:novo-job', job));
  return jobs;
}

async function criarJobTeste(impressora) {
  const conteudo = montarTeste(impressora);
  const [job] = await criarJobsEmLote([{
    empresaId: impressora.empresaId, printerId: impressora.id, setor: impressora.setor, tipoDocumento: 'TESTE', prioridade: 'NORMAL', conteudo
  }]);
  return job;
}

// pedido precisa vir com itens + mesa incluidos (ver include em pedido.controller.js)
async function criarJobsParaPedido(pedido) {
  const empresaId = pedido.empresaId;
  const impressorasAtivas = await prisma.printer.findMany({ where: { empresaId, ativa: true } });
  if (!impressorasAtivas.length) return [];

  const especificacoes = [];
  const prioridade = pedido.tipo === 'MESA' ? 'ALTA' : 'NORMAL';

  const setoresPresentes = [...new Set(pedido.itens.map((i) => i.setorProducao))];
  for (const setor of setoresPresentes) {
    const impressorasDoSetor = impressorasAtivas.filter((p) => p.setor === setor);
    if (!impressorasDoSetor.length) continue;
    const itensDoSetor = pedido.itens.filter((i) => i.setorProducao === setor);
    const conteudo = montarComandaProducao(pedido, itensDoSetor);
    for (const impressora of impressorasDoSetor) {
      especificacoes.push({ empresaId, printerId: impressora.id, pedidoId: pedido.id, setor, tipoDocumento: 'COMANDA_COZINHA', prioridade, conteudo });
    }
  }

  if (pedido.tipo === 'MESA') {
    const impressorasGarcom = impressorasAtivas.filter((p) => p.setor === 'GARCOM');
    if (impressorasGarcom.length) {
      const conteudo = montarComandaGarcom(pedido, pedido.itens);
      for (const impressora of impressorasGarcom) {
        especificacoes.push({ empresaId, printerId: impressora.id, pedidoId: pedido.id, setor: 'GARCOM', tipoDocumento: 'COMANDA_GARCOM', prioridade, conteudo });
      }
    }
  }

  if (pedido.tipo === 'DELIVERY') {
    const impressorasDelivery = impressorasAtivas.filter((p) => p.setor === 'DELIVERY');
    if (impressorasDelivery.length) {
      const conteudo = montarComandaDelivery(pedido, pedido.itens);
      for (const impressora of impressorasDelivery) {
        especificacoes.push({ empresaId, printerId: impressora.id, pedidoId: pedido.id, setor: 'DELIVERY', tipoDocumento: 'COMANDA_DELIVERY', prioridade, conteudo });
      }
    }
  }

  return criarJobsEmLote(especificacoes);
}

async function criarJobCancelamento(pedido, motivo) {
  const empresaId = pedido.empresaId;
  const jobsAnteriores = await prisma.printJob.findMany({ where: { pedidoId: pedido.id, status: 'PRINTED' } });
  if (!jobsAnteriores.length) return [];

  const printerIds = [...new Set(jobsAnteriores.map((j) => j.printerId))];
  const conteudo = montarCancelamento(pedido, motivo);
  const especificacoes = [];
  for (const printerId of printerIds) {
    const jobOriginal = jobsAnteriores.find((j) => j.printerId === printerId);
    especificacoes.push({
      empresaId, printerId, pedidoId: pedido.id, setor: jobOriginal.setor, tipoDocumento: 'CANCELAMENTO', prioridade: 'URGENTE', conteudo
    });
  }
  return criarJobsEmLote(especificacoes);
}

module.exports = {
  criarJobsParaPedido, criarJobCancelamento, criarJobTeste,
  montarComandaProducao, montarComandaGarcom, montarComandaDelivery, montarCancelamento, montarTeste
};

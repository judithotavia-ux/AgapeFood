const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../prisma/client');
const produtoController = require('../controllers/produto.controller');
const estoqueDashboardController = require('../controllers/estoqueDashboard.controller');
const pedidoController = require('../controllers/pedido.controller');
const clienteController = require('../controllers/cliente.controller');
const financeiroDashboardController = require('../controllers/financeiroDashboard.controller');
const cupomController = require('../controllers/cupom.controller');
const campanhaController = require('../controllers/campanha.controller');

class ErroAgapeIA extends Error {
  constructor(status, erro) {
    super(erro);
    this.status = status;
    this.erro = erro;
  }
}

function clienteAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function chamarControlador(handler, reqParcial) {
  let status = 200;
  let corpo = null;
  const res = {
    status(s) { status = s; return this; },
    json(dados) { corpo = dados; return this; },
    send(dados) { corpo = dados; return this; }
  };
  await handler({ query: {}, params: {}, body: {}, ...reqParcial }, res);
  return { status, corpo };
}

const FERRAMENTAS = [
  {
    name: 'consultar_produtos',
    description: 'Busca produtos do cardápio da empresa. Use para checar preço, disponibilidade, categoria ou descrição antes de responder ou montar um pedido.',
    input_schema: {
      type: 'object',
      properties: {
        busca: { type: 'string', description: 'Texto para buscar no nome do produto (opcional).' },
        categoriaId: { type: 'string', description: 'ID da categoria para filtrar (opcional).' },
        apenasDisponiveis: { type: 'boolean', description: 'Se true, retorna só produtos disponíveis no momento.' }
      }
    }
  },
  {
    name: 'consultar_estoque',
    description: 'Retorna o resumo do estoque: produtos com estoque baixo, lotes vencidos ou próximos do vencimento, valor total em estoque.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'consultar_pedidos',
    description: 'Lista pedidos recentes da empresa, com filtro opcional por status ou tipo.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['RECEBIDO', 'PREPARANDO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO'] },
        tipo: { type: 'string', enum: ['DELIVERY', 'RETIRADA', 'BALCAO', 'MESA'] },
        limite: { type: 'number', description: 'Quantidade máxima de pedidos a retornar (padrão 20).' }
      }
    }
  },
  {
    name: 'consultar_clientes',
    description: 'Lista clientes da empresa com estatísticas de total gasto e último pedido. Pode segmentar por ativos, inativos, VIP ou aniversariantes do mês, e buscar por nome/telefone/email.',
    input_schema: {
      type: 'object',
      properties: {
        segmento: { type: 'string', enum: ['ATIVOS', 'INATIVOS', 'VIP', 'ANIVERSARIANTES'] },
        busca: { type: 'string', description: 'Texto para buscar no nome, telefone ou email do cliente.' }
      }
    }
  },
  {
    name: 'consultar_financeiro',
    description: 'Retorna o resumo financeiro do mês: entradas, saídas, lucro, contas a pagar/receber, saúde financeira.',
    input_schema: {
      type: 'object',
      properties: { mes: { type: 'string', description: 'Mês no formato YYYY-MM. Se omitido, usa o mês atual.' } }
    }
  },
  {
    name: 'criar_promocao',
    description: 'Cria um cupom de desconto (promoção) para os clientes usarem em pedidos.',
    input_schema: {
      type: 'object',
      properties: {
        codigo: { type: 'string', description: 'Código do cupom, ex: BEMVINDO10.' },
        tipoDesconto: { type: 'string', enum: ['PERCENTUAL', 'FIXO'] },
        valor: { type: 'number', description: 'Valor do desconto (percentual de 0-100, ou valor fixo em R$).' },
        usoMaximo: { type: 'number', description: 'Número máximo de usos (opcional).' },
        validoAte: { type: 'string', description: 'Data de validade em ISO (opcional).' }
      },
      required: ['codigo', 'tipoDesconto', 'valor']
    }
  },
  {
    name: 'criar_campanha',
    description: 'Cria uma campanha de marketing para um canal específico (WhatsApp, Instagram, etc), opcionalmente vinculada a um cupom.',
    input_schema: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        canal: { type: 'string', enum: ['WHATSAPP', 'EMAIL', 'SMS', 'INSTAGRAM', 'FACEBOOK', 'PUSH', 'OUTRO'] },
        segmento: { type: 'string', description: 'Público-alvo da campanha, em texto livre.' },
        texto: { type: 'string', description: 'Texto da campanha (opcional).' },
        cupomId: { type: 'string', description: 'ID de um cupom já existente para vincular (opcional).' },
        custo: { type: 'number', description: 'Custo estimado da campanha em R$ (opcional).' }
      },
      required: ['nome', 'canal', 'segmento']
    }
  },
  {
    name: 'criar_relatorio',
    description: 'Reúne dados reais (financeiro, pedidos e/ou estoque) para você compor um relatório em texto para o usuário. Chame antes de escrever o relatório final.',
    input_schema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: ['FINANCEIRO', 'ESTOQUE', 'PEDIDOS', 'GERAL'], description: 'Qual dado reunir. GERAL reúne os três.' },
        mes: { type: 'string', description: 'Mês de referência YYYY-MM (usado no relatório financeiro).' }
      },
      required: ['tipo']
    }
  },
  {
    name: 'criar_tarefa',
    description: 'Cria uma tarefa administrativa pendente para a equipe — por exemplo algo que você detectou ou que o usuário pediu para não esquecer.',
    input_schema: {
      type: 'object',
      properties: { titulo: { type: 'string' }, descricao: { type: 'string' } },
      required: ['titulo']
    }
  },
  {
    name: 'criar_pedido',
    description: 'Cria um pedido real no sistema (dispara impressão na cozinha e aparece na Central de Pedidos). Use consultar_produtos antes para pegar os IDs corretos dos produtos.',
    input_schema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: ['DELIVERY', 'RETIRADA', 'BALCAO', 'MESA'] },
        itens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              produtoId: { type: 'string' },
              quantidade: { type: 'number' },
              observacoes: { type: 'string' }
            },
            required: ['produtoId', 'quantidade']
          }
        },
        clienteNome: { type: 'string' },
        clienteTelefone: { type: 'string' },
        clienteEndereco: { type: 'string', description: 'Obrigatório se tipo=DELIVERY.' },
        formaPagamento: { type: 'string', enum: ['PIX', 'CARTAO', 'DINHEIRO', 'VALE_ALIMENTACAO', 'BOLETO'] },
        mesaId: { type: 'string', description: 'Obrigatório se tipo=MESA.' },
        observacoes: { type: 'string' },
        cupomCodigo: { type: 'string' }
      },
      required: ['tipo', 'itens']
    }
  }
];

async function executarFerramenta(nome, input, ctx) {
  const { empresaId, usuario } = ctx;

  switch (nome) {
    case 'consultar_produtos': {
      const { corpo } = await chamarControlador(produtoController.listar, {
        usuario, query: { categoriaId: input.categoriaId, busca: input.busca }
      });
      let produtos = corpo || [];
      if (input.apenasDisponiveis) produtos = produtos.filter((p) => p.disponivel);
      return {
        resultado: produtos.map((p) => ({
          id: p.id, nome: p.nome, preco: Number(p.preco),
          precoPromocional: p.precoPromocional ? Number(p.precoPromocional) : null,
          disponivel: p.disponivel, categoria: p.categoria?.nome, descricao: p.descricao
        }))
      };
    }
    case 'consultar_estoque': {
      const { corpo } = await chamarControlador(estoqueDashboardController.resumo, { usuario });
      return { resultado: corpo };
    }
    case 'consultar_pedidos': {
      const { corpo } = await chamarControlador(pedidoController.listar, {
        usuario, query: { status: input.status, tipo: input.tipo }
      });
      const limite = input.limite && input.limite > 0 ? input.limite : 20;
      return {
        resultado: (corpo || []).slice(0, limite).map((p) => ({
          id: p.id, numero: p.numero, tipo: p.tipo, status: p.status, valorTotal: Number(p.valorTotal),
          clienteNome: p.clienteNome, criadoEm: p.criadoEm,
          itens: (p.itens || []).map((i) => ({ nome: i.nomeProduto, quantidade: i.quantidade }))
        }))
      };
    }
    case 'consultar_clientes': {
      const { corpo } = await chamarControlador(clienteController.listar, { usuario, query: { segmento: input.segmento } });
      let clientes = corpo || [];
      if (input.busca) {
        const termo = input.busca.toLowerCase();
        clientes = clientes.filter((c) =>
          (c.nome || '').toLowerCase().includes(termo) ||
          (c.telefone || '').includes(termo) ||
          (c.email || '').toLowerCase().includes(termo));
      }
      return {
        resultado: clientes.slice(0, 30).map((c) => ({
          id: c.id, nome: c.nome, telefone: c.telefone, totalPedidos: c.totalPedidos,
          totalGasto: c.totalGasto, ultimoPedidoEm: c.ultimoPedidoEm, saldoCashback: Number(c.saldoCashback)
        }))
      };
    }
    case 'consultar_financeiro': {
      const { corpo } = await chamarControlador(financeiroDashboardController.resumo, { usuario, query: { mes: input.mes } });
      return { resultado: corpo };
    }
    case 'criar_promocao': {
      const { status, corpo } = await chamarControlador(cupomController.criar, { usuario, body: input });
      if (status >= 400) return { resultado: { erro: corpo?.erro || 'Não foi possível criar a promoção.' } };
      return { resultado: corpo, acao: { tipo: 'PROMOCAO_CRIADA', referenciaId: corpo.id, detalhe: `Cupom ${corpo.codigo}` } };
    }
    case 'criar_campanha': {
      const { status, corpo } = await chamarControlador(campanhaController.criar, { usuario, body: input });
      if (status >= 400) return { resultado: { erro: corpo?.erro || 'Não foi possível criar a campanha.' } };
      return { resultado: corpo, acao: { tipo: 'CAMPANHA_CRIADA', referenciaId: corpo.id, detalhe: `Campanha ${corpo.nome} (${corpo.canal})` } };
    }
    case 'criar_relatorio': {
      const dados = {};
      if (input.tipo === 'FINANCEIRO' || input.tipo === 'GERAL') {
        const r = await chamarControlador(financeiroDashboardController.resumo, { usuario, query: { mes: input.mes } });
        dados.financeiro = r.corpo;
      }
      if (input.tipo === 'ESTOQUE' || input.tipo === 'GERAL') {
        const r = await chamarControlador(estoqueDashboardController.resumo, { usuario });
        dados.estoque = r.corpo;
      }
      if (input.tipo === 'PEDIDOS' || input.tipo === 'GERAL') {
        const r = await chamarControlador(pedidoController.listar, { usuario, query: {} });
        dados.pedidos = (r.corpo || []).slice(0, 50);
      }
      return { resultado: dados, acao: { tipo: 'RELATORIO_GERADO' } };
    }
    case 'criar_tarefa': {
      const tarefa = await prisma.tarefaIA.create({
        data: { empresaId, titulo: input.titulo, descricao: input.descricao || null }
      });
      return { resultado: tarefa, acao: { tipo: 'TAREFA_CRIADA', referenciaId: tarefa.id, detalhe: tarefa.titulo } };
    }
    case 'criar_pedido': {
      try {
        const pedido = await pedidoController.criarPedidoCore(empresaId, usuario.nome, input);
        return {
          resultado: { id: pedido.id, numero: pedido.numero, valorTotal: Number(pedido.valorTotal), status: pedido.status },
          acao: { tipo: 'PEDIDO_CRIADO', referenciaId: pedido.id, detalhe: `Pedido #${pedido.numero}`, clienteId: pedido.clienteId || null }
        };
      } catch (erro) {
        if (erro instanceof pedidoController.ErroPedido) return { resultado: { erro: erro.erro } };
        throw erro;
      }
    }
    default:
      return { resultado: { erro: `Ferramenta desconhecida: ${nome}` } };
  }
}

async function processarMensagem({ empresaId, usuario, conversaId, texto }) {
  const client = clienteAnthropic();
  if (!client) {
    throw new ErroAgapeIA(503, 'A Ágape IA ainda não foi configurada nesta conta. Fale com o suporte AgapeFood.');
  }

  const anteriores = await prisma.mensagemIA.findMany({
    where: { conversaId, papel: { in: ['USUARIO', 'ASSISTENTE'] } },
    orderBy: { criadoEm: 'asc' },
    take: 40
  });

  await prisma.mensagemIA.create({ data: { conversaId, papel: 'USUARIO', conteudo: texto } });

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId }, select: { nome: true } });

  const systemPrompt = `Você é a Ágape IA, a assistente inteligente do painel administrativo do AgapeFood para o estabelecimento "${empresa?.nome || 'o restaurante'}".
Fale em português do Brasil, de forma direta e prestativa, sem exagero. Você tem acesso a ferramentas reais que consultam e alteram dados de verdade do sistema — use-as sempre que precisar de dados atuais em vez de supor. Antes de criar promoções, campanhas, pedidos ou tarefas, confirme que entendeu o pedido corretamente; se faltar uma informação obrigatória, pergunte antes de agir, nunca invente dados. Ao montar um relatório, chame a ferramenta criar_relatorio para reunir os dados reais antes de escrever o texto final.`;

  const messages = [
    ...anteriores.map((m) => ({ role: m.papel === 'USUARIO' ? 'user' : 'assistant', content: m.conteudo })),
    { role: 'user', content: texto }
  ];

  const acoesRealizadas = [];
  const ferramentasUsadas = new Set();
  let relatorioSolicitado = false;
  let ultimoTextoAssistente = '';

  try {
    for (let iteracao = 0; iteracao < 8; iteracao++) {
      const resposta = await client.messages.create({
        model: 'claude-opus-5',
        max_tokens: 2048,
        thinking: { type: 'adaptive' },
        system: systemPrompt,
        tools: FERRAMENTAS,
        messages
      });

      const blocoTexto = resposta.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      if (blocoTexto) ultimoTextoAssistente = blocoTexto;

      messages.push({ role: 'assistant', content: resposta.content });

      if (resposta.stop_reason !== 'tool_use') break;

      const blocosFerramenta = resposta.content.filter((b) => b.type === 'tool_use');
      const resultadosFerramenta = [];

      for (const bloco of blocosFerramenta) {
        ferramentasUsadas.add(bloco.name);
        if (bloco.name === 'criar_relatorio') relatorioSolicitado = true;

        const { resultado, acao } = await executarFerramenta(bloco.name, bloco.input || {}, { empresaId, usuario });
        if (acao) acoesRealizadas.push(acao);

        resultadosFerramenta.push({ type: 'tool_result', tool_use_id: bloco.id, content: JSON.stringify(resultado) });

        await prisma.mensagemIA.create({
          data: { conversaId, papel: 'FERRAMENTA', conteudo: JSON.stringify(resultado).slice(0, 4000), ferramentaUsada: bloco.name }
        });
      }

      messages.push({ role: 'user', content: resultadosFerramenta });
    }
  } catch (erro) {
    if (erro instanceof Anthropic.AuthenticationError) throw new ErroAgapeIA(503, 'Chave da API de IA inválida. Verifique a configuração no servidor.');
    if (erro instanceof Anthropic.RateLimitError) throw new ErroAgapeIA(429, 'Limite de uso da IA atingido. Tente novamente em instantes.');
    throw erro;
  }

  if (!ultimoTextoAssistente) {
    ultimoTextoAssistente = 'Não consegui concluir essa solicitação agora. Pode tentar reformular?';
  }

  await prisma.mensagemIA.create({ data: { conversaId, papel: 'ASSISTENTE', conteudo: ultimoTextoAssistente } });

  const registrosAcao = acoesRealizadas.map((acao) => prisma.acaoIA.create({
    data: {
      empresaId, conversaId, tipo: acao.tipo,
      referenciaId: acao.referenciaId || null,
      detalhe: acao.detalhe || null,
      clienteId: acao.clienteId || null
    }
  }));
  registrosAcao.push(prisma.acaoIA.create({ data: { empresaId, conversaId, tipo: 'PERGUNTA_RESPONDIDA' } }));
  if (relatorioSolicitado) {
    registrosAcao.push(prisma.acaoIA.create({
      data: { empresaId, conversaId, tipo: 'RELATORIO_GERADO', detalhe: ultimoTextoAssistente.slice(0, 4000) }
    }));
  }
  await prisma.$transaction(registrosAcao);

  await prisma.conversaIA.update({ where: { id: conversaId }, data: { atualizadoEm: new Date() } });

  return { texto: ultimoTextoAssistente, ferramentasUsadas: [...ferramentasUsadas], acoes: acoesRealizadas };
}

module.exports = { processarMensagem, ErroAgapeIA };

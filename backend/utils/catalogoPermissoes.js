// Catalogo global de permissoes do AgapeFood. Convencao de chave: "modulo.acao".
// Cada entrada vira uma linha na tabela `permissoes`. As atribuicoes padrao por papel
// (DEFAULTS_POR_PAPEL) definem o comportamento de SUPER_ADMIN/ADMIN/GERENTE/FUNCIONARIO/GARCOM
// antes de existir qualquer perfil personalizado por empresa.

const CATALOGO = [
  { chave: 'dashboard.visualizar', modulo: 'dashboard', acao: 'visualizar', descricao: 'Ver o painel geral da empresa' },

  { chave: 'pedidos.visualizar', modulo: 'pedidos', acao: 'visualizar', descricao: 'Ver pedidos' },
  { chave: 'pedidos.criar', modulo: 'pedidos', acao: 'criar', descricao: 'Criar novos pedidos' },
  { chave: 'pedidos.editar', modulo: 'pedidos', acao: 'editar', descricao: 'Editar pedidos existentes' },
  { chave: 'pedidos.cancelar', modulo: 'pedidos', acao: 'cancelar', descricao: 'Cancelar pedidos' },

  { chave: 'cardapio.visualizar', modulo: 'cardapio', acao: 'visualizar', descricao: 'Ver categorias e produtos do cardapio' },
  { chave: 'cardapio.gerenciar', modulo: 'cardapio', acao: 'gerenciar', descricao: 'Criar, editar e remover categorias e produtos' },

  { chave: 'salao.visualizar', modulo: 'salao', acao: 'visualizar', descricao: 'Ver mesas e o salao' },
  { chave: 'salao.gerenciar', modulo: 'salao', acao: 'gerenciar', descricao: 'Criar/editar mesas e reservas' },

  { chave: 'caixa.visualizar', modulo: 'caixa', acao: 'visualizar', descricao: 'Ver o caixa' },
  { chave: 'caixa.abrir_fechar', modulo: 'caixa', acao: 'abrir_fechar', descricao: 'Abrir e fechar caixa' },
  { chave: 'caixa.aplicar_desconto', modulo: 'caixa', acao: 'aplicar_desconto', descricao: 'Aplicar desconto em pedidos' },
  { chave: 'caixa.cancelar_pedido', modulo: 'caixa', acao: 'cancelar_pedido', descricao: 'Cancelar pedido a partir do caixa' },
  { chave: 'caixa.estornar', modulo: 'caixa', acao: 'estornar', descricao: 'Estornar pagamento' },

  { chave: 'cozinha.visualizar', modulo: 'cozinha', acao: 'visualizar', descricao: 'Ver a fila da cozinha' },
  { chave: 'cozinha.gerenciar', modulo: 'cozinha', acao: 'gerenciar', descricao: 'Atualizar status de preparo dos pedidos' },

  { chave: 'delivery.visualizar', modulo: 'delivery', acao: 'visualizar', descricao: 'Ver entregas' },
  { chave: 'delivery.gerenciar', modulo: 'delivery', acao: 'gerenciar', descricao: 'Gerenciar motoboys, zonas e status de entrega' },

  { chave: 'estoque.visualizar', modulo: 'estoque', acao: 'visualizar', descricao: 'Ver estoque e fornecedores' },
  { chave: 'estoque.gerenciar', modulo: 'estoque', acao: 'gerenciar', descricao: 'Cadastrar fornecedores, lotes e movimentacoes' },
  { chave: 'estoque.ajustar_manual', modulo: 'estoque', acao: 'ajustar_manual', descricao: 'Fazer ajuste manual de quantidade em estoque' },

  { chave: 'financeiro.visualizar', modulo: 'financeiro', acao: 'visualizar', descricao: 'Ver contas a pagar/receber e dashboard financeiro' },
  { chave: 'financeiro.gerenciar', modulo: 'financeiro', acao: 'gerenciar', descricao: 'Criar/editar contas a pagar e a receber' },
  { chave: 'financeiro.aprovar_conta', modulo: 'financeiro', acao: 'aprovar_conta', descricao: 'Aprovar/baixar contas' },

  { chave: 'marketing.visualizar', modulo: 'marketing', acao: 'visualizar', descricao: 'Ver campanhas, cupons e avaliacoes' },
  { chave: 'marketing.gerenciar', modulo: 'marketing', acao: 'gerenciar', descricao: 'Criar/editar campanhas e cupons' },

  { chave: 'impressao.visualizar', modulo: 'impressao', acao: 'visualizar', descricao: 'Ver central de impressao' },
  { chave: 'impressao.gerenciar', modulo: 'impressao', acao: 'gerenciar', descricao: 'Configurar impressoras' },

  { chave: 'equipe.visualizar', modulo: 'equipe', acao: 'visualizar', descricao: 'Ver garcons e funcionarios cadastrados' },
  { chave: 'equipe.gerenciar', modulo: 'equipe', acao: 'gerenciar', descricao: 'Cadastrar, editar e desativar garcons e funcionarios' },
  { chave: 'equipe.gerenciar_permissoes', modulo: 'equipe', acao: 'gerenciar_permissoes', descricao: 'Criar perfis personalizados e atribuir permissoes' },

  { chave: 'gorjetas.visualizar', modulo: 'gorjetas', acao: 'visualizar', descricao: 'Ver dashboard e relatorios de gorjetas' },
  { chave: 'gorjetas.gerenciar_config', modulo: 'gorjetas', acao: 'gerenciar_config', descricao: 'Configurar regras de gorjeta' },
  { chave: 'gorjetas.gerenciar_fechamento', modulo: 'gorjetas', acao: 'gerenciar_fechamento', descricao: 'Fechar periodo e marcar gorjetas como pagas' },

  { chave: 'assinatura.visualizar', modulo: 'assinatura', acao: 'visualizar', descricao: 'Ver plano e faturas da empresa' },
  { chave: 'assinatura.gerenciar', modulo: 'assinatura', acao: 'gerenciar', descricao: 'Alterar plano e forma de pagamento' },

  { chave: 'agape_ia.usar', modulo: 'agape_ia', acao: 'usar', descricao: 'Conversar com a Agape IA' },
  { chave: 'agape_ia.gerenciar_config', modulo: 'agape_ia', acao: 'gerenciar_config', descricao: 'Configurar chave de API e canais da Agape IA' },

  { chave: 'configuracoes_empresa.visualizar', modulo: 'configuracoes_empresa', acao: 'visualizar', descricao: 'Ver dados cadastrais da empresa' },
  { chave: 'configuracoes_empresa.gerenciar', modulo: 'configuracoes_empresa', acao: 'gerenciar', descricao: 'Editar dados cadastrais e configuracoes gerais da empresa' }
];

const TODAS_AS_CHAVES = CATALOGO.map((p) => p.chave);

function chavesPorModulo(prefixo) {
  return CATALOGO.filter((p) => p.modulo === prefixo).map((p) => p.chave);
}

// Perfis padrao dos papeis existentes. SUPER_ADMIN e ADMIN tem acesso total (mantendo o
// comportamento atual, onde nada os restringe). Os demais recebem um recorte compativel com o
// uso operacional de cada papel hoje.
const DEFAULTS_POR_PAPEL = {
  SUPER_ADMIN: [...TODAS_AS_CHAVES],
  ADMIN: [...TODAS_AS_CHAVES],
  GERENTE: TODAS_AS_CHAVES.filter((c) => !['assinatura.gerenciar', 'equipe.gerenciar_permissoes', 'configuracoes_empresa.gerenciar'].includes(c)),
  FUNCIONARIO: [
    'dashboard.visualizar',
    'pedidos.visualizar', 'pedidos.criar', 'pedidos.editar',
    'cardapio.visualizar',
    'salao.visualizar', 'salao.gerenciar',
    'caixa.visualizar', 'caixa.abrir_fechar',
    'cozinha.visualizar', 'cozinha.gerenciar',
    'delivery.visualizar', 'delivery.gerenciar',
    'estoque.visualizar',
    'impressao.visualizar',
    'gorjetas.visualizar',
    'agape_ia.usar'
  ],
  GARCOM: [
    'dashboard.visualizar',
    'pedidos.visualizar', 'pedidos.criar', 'pedidos.editar',
    'cardapio.visualizar',
    'salao.visualizar',
    'gorjetas.visualizar'
  ]
};

module.exports = { CATALOGO, TODAS_AS_CHAVES, DEFAULTS_POR_PAPEL, chavesPorModulo };

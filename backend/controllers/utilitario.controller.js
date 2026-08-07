function apenasDigitos(v) {
  return String(v || '').replace(/\D/g, '');
}

// Algumas APIs publicas bloqueiam requisicoes sem um User-Agent de navegador.
const CABECALHOS = { 'User-Agent': 'Mozilla/5.0 (compatible; AgapeFood/1.0)' };

async function buscarCnpj(req, res) {
  const cnpj = apenasDigitos(req.params.cnpj);
  if (cnpj.length !== 14) return res.status(400).json({ erro: 'CNPJ inválido.' });

  try {
    const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { headers: CABECALHOS });
    if (!resposta.ok) return res.status(404).json({ erro: 'CNPJ não encontrado.' });

    const dados = await resposta.json();
    res.json({
      razaoSocial: dados.razao_social || '',
      nomeFantasia: dados.nome_fantasia || '',
      cep: dados.cep || '',
      endereco: dados.logradouro || '',
      numero: dados.numero || '',
      complemento: dados.complemento || '',
      bairro: dados.bairro || '',
      cidade: dados.municipio || '',
      estado: dados.uf || '',
      telefone: dados.ddd_telefone_1 || '',
      ramoAtividade: dados.cnae_fiscal_descricao || '',
      dataFundacao: dados.data_inicio_atividade || ''
    });
  } catch (e) {
    res.status(502).json({ erro: 'Não foi possível consultar o CNPJ agora. Tente novamente ou preencha manualmente.' });
  }
}

async function buscarCep(req, res) {
  const cep = apenasDigitos(req.params.cep);
  if (cep.length !== 8) return res.status(400).json({ erro: 'CEP inválido.' });

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { headers: CABECALHOS });
    const dados = await resposta.json();
    if (dados.erro) return res.status(404).json({ erro: 'CEP não encontrado.' });

    res.json({
      cep: dados.cep || '',
      endereco: dados.logradouro || '',
      bairro: dados.bairro || '',
      cidade: dados.localidade || '',
      estado: dados.uf || ''
    });
  } catch (e) {
    res.status(502).json({ erro: 'Não foi possível consultar o CEP agora. Tente novamente ou preencha manualmente.' });
  }
}

module.exports = { buscarCnpj, buscarCep };

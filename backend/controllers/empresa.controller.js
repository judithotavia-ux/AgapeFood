const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const prisma = require('../prisma/client');
const { gerarToken } = require('./auth.controller');
const { criptografar, descriptografar } = require('../utils/criptografia');
const { registrarAuditoria } = require('../utils/auditoria');

// Logos enviados costumam vir gigantes (ja vimos um de 2MB nesse sistema pra um espaco de 32px na
// tela). Redimensiona pra um tamanho generoso o bastante pra qualquer uso (sidebar, cardapio,
// impressao) sem carregar o arquivo original inteiro. SVG fica de fora - ja e vetor, nao precisa.
// Sempre converte pra PNG e renomeia o arquivo (nao da pra gravar bytes PNG num arquivo .jpg sem
// o Content-Type que o servidor manda ficar errado).
async function otimizarImagemLogo(arquivo) {
  if (arquivo.mimetype === 'image/svg+xml') return arquivo.filename;

  const caminhoOriginal = arquivo.path;
  const novoNome = arquivo.filename.replace(path.extname(arquivo.filename), '.png');
  const novoCaminho = path.join(path.dirname(caminhoOriginal), novoNome);

  try {
    await sharp(caminhoOriginal).resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true }).png().toFile(novoCaminho);
    if (novoCaminho !== caminhoOriginal) fs.unlink(caminhoOriginal, () => {});
    return novoNome;
  } catch (erro) {
    console.error('Falha ao otimizar imagem de logo (mantendo original):', erro.message);
    return arquivo.filename;
  }
}

const CORES_HEX = /^#[0-9A-Fa-f]{6}$/;
const CAMPOS_IDENTIDADE_VISUAL = {
  id: true, nome: true, slogan: true, logoUrl: true, logoImpressaoUrl: true, logoCardapioUrl: true, logoReciboUrl: true,
  corPrimaria: true, corSecundaria: true, corDestaque: true, corTexto: true, tema: true, exibirMarcaAgapeFood: true,
  exibirLogoCardapio: true, exibirSloganCardapio: true, exibirSloganComanda: true,
  mensagemAgradecimento: true, rodapeComanda: true,
  whatsapp: true, telefone: true, emailContato: true, site: true,
  instagram: true, facebook: true, tiktok: true, youtube: true
};

function montarUrlLogo(req, nomeArquivo) {
  if (!nomeArquivo) return null;
  return `${req.protocol}://${req.get('host')}/uploads/empresas/${nomeArquivo}`;
}

function extrairNomeArquivoLogo(url) {
  if (!url) return null;
  return url.split('/uploads/empresas/')[1] || null;
}

function removerArquivoLogoAntigo(url) {
  const nome = extrairNomeArquivoLogo(url);
  if (nome) fs.unlink(path.join(__dirname, '..', 'uploads', 'empresas', nome), () => {});
}

const TIPOS_CANAL = ['MOTOBOY_PROPRIO', 'IFOOD', 'UBER_EATS', 'NOVENTA_NOVE_FOOD'];
const CATEGORIAS_PADRAO = ['Pratos Principais', 'Bebidas', 'Sobremesas'];

function apenasDigitos(v) {
  return String(v || '').replace(/\D/g, '');
}

function slugify(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'empresa';
}

async function gerarSlugUnico(base) {
  let slug = slugify(base);
  let tentativa = slug;
  let contador = 1;
  while (await prisma.empresa.findUnique({ where: { slug: tentativa } })) {
    contador += 1;
    tentativa = `${slug}-${contador}`;
  }
  return tentativa;
}

async function registrar(req, res) {
  const { empresa, endereco, contatos, responsavel, aceitaTermos } = req.body || {};

  if (!empresa?.nomeFantasia || !empresa.nomeFantasia.trim()) {
    return res.status(400).json({ erro: 'Informe o nome fantasia da empresa.' });
  }
  if (!responsavel?.nome || !responsavel.nome.trim()) return res.status(400).json({ erro: 'Informe o nome do responsável.' });
  if (!responsavel?.email || !responsavel.email.trim()) return res.status(400).json({ erro: 'Informe o e-mail do responsável.' });
  if (!responsavel?.senha || responsavel.senha.length < 6) return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
  if (responsavel.senha !== responsavel.confirmarSenha) return res.status(400).json({ erro: 'As senhas não coincidem.' });
  if (!aceitaTermos) return res.status(400).json({ erro: 'É necessário aceitar os Termos de Uso e a Política de Privacidade.' });

  const emailLimpo = String(responsavel.email).toLowerCase().trim();
  const emailExistente = await prisma.usuario.findUnique({ where: { email: emailLimpo } });
  if (emailExistente) return res.status(400).json({ erro: 'Já existe uma conta com esse e-mail.' });

  const cnpjLimpo = empresa.cnpj ? apenasDigitos(empresa.cnpj) : null;
  if (cnpjLimpo) {
    const cnpjExistente = await prisma.empresa.findUnique({ where: { cnpj: cnpjLimpo } });
    if (cnpjExistente) return res.status(400).json({ erro: 'Já existe uma empresa cadastrada com esse CNPJ.' });
  }

  const cpfLimpo = responsavel.cpf ? apenasDigitos(responsavel.cpf) : null;
  if (cpfLimpo) {
    const cpfExistente = await prisma.usuario.findUnique({ where: { cpf: cpfLimpo } });
    if (cpfExistente) return res.status(400).json({ erro: 'Já existe uma conta cadastrada com esse CPF.' });
  }

  const slug = await gerarSlugUnico(empresa.nomeFantasia);
  const senhaHash = await bcrypt.hash(responsavel.senha, 10);

  const resultado = await prisma.$transaction(async (tx) => {
    const novaEmpresa = await tx.empresa.create({
      data: {
        nome: empresa.nomeFantasia.trim(),
        slug,
        razaoSocial: empresa.razaoSocial || null,
        cnpj: cnpjLimpo,
        inscricaoEstadual: empresa.inscricaoEstadual || null,
        inscricaoMunicipal: empresa.inscricaoMunicipal || null,
        dataFundacao: empresa.dataFundacao ? new Date(empresa.dataFundacao) : null,
        tipoEmpresa: empresa.tipoEmpresa || 'OUTRO',
        regimeTributario: empresa.regimeTributario || null,
        ramoAtividade: empresa.ramoAtividade || null,
        descricao: empresa.descricao || null,

        cep: endereco?.cep || null,
        endereco: endereco?.endereco || null,
        numero: endereco?.numero || null,
        complemento: endereco?.complemento || null,
        bairro: endereco?.bairro || null,
        cidade: endereco?.cidade || null,
        estado: endereco?.estado || null,
        pais: endereco?.pais || 'Brasil',

        telefone: contatos?.telefone || null,
        whatsapp: contatos?.whatsapp || null,
        emailContato: contatos?.email || null,
        site: contatos?.site || null,
        instagram: contatos?.instagram || null,
        facebook: contatos?.facebook || null,
        tiktok: contatos?.tiktok || null,
        youtube: contatos?.youtube || null,

        termosAceitosEm: new Date()
      }
    });

    const admin = await tx.usuario.create({
      data: {
        nome: responsavel.nome.trim(),
        email: emailLimpo,
        senhaHash,
        papel: 'ADMIN',
        cpf: cpfLimpo,
        rg: responsavel.rg || null,
        dataNascimento: responsavel.dataNascimento ? new Date(responsavel.dataNascimento) : null,
        telefone: responsavel.telefone || null,
        empresaId: novaEmpresa.id
      }
    });

    await tx.categoria.createMany({
      data: CATEGORIAS_PADRAO.map((nome, i) => ({ nome, ordem: i, empresaId: novaEmpresa.id }))
    });

    await tx.canalEntregaConfig.createMany({
      data: TIPOS_CANAL.map((tipo) => ({ tipo, ativo: tipo === 'MOTOBOY_PROPRIO', empresaId: novaEmpresa.id }))
    });

    const planoInicial = await tx.plano.findFirst({ where: { ativo: true }, orderBy: { ordem: 'asc' } });
    if (planoInicial) {
      const agora = new Date();
      const fimTrial = new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000);
      await tx.assinatura.create({
        data: {
          empresaId: novaEmpresa.id,
          planoId: planoInicial.id,
          status: 'TRIAL',
          inicioTrialEm: agora,
          fimTrialEm: fimTrial,
          proximaCobrancaEm: fimTrial
        }
      });
    }

    return { novaEmpresa, admin };
  });

  const token = gerarToken(resultado.admin);

  res.status(201).json({
    token,
    usuario: {
      id: resultado.admin.id,
      nome: resultado.admin.nome,
      email: resultado.admin.email,
      papel: resultado.admin.papel,
      empresaId: resultado.novaEmpresa.id
    }
  });
}

// Igual ao "registrar" publico (signup do SaaS), mas usado pelo SUPER_ADMIN de dentro do painel
// pra cadastrar uma empresa em nome do cliente, escolhendo o plano dela na hora - em vez de cair
// sempre no primeiro plano ativo. Nao loga o super admin como o novo responsavel (ele continua
// na propria sessao); quem usa a conta criada e o responsavel da empresa.
async function cadastrarComoAdmin(req, res) {
  const { empresa, endereco, contatos, responsavel, planoId } = req.body || {};

  if (!empresa?.nomeFantasia || !empresa.nomeFantasia.trim()) {
    return res.status(400).json({ erro: 'Informe o nome fantasia da empresa.' });
  }
  if (!responsavel?.nome || !responsavel.nome.trim()) return res.status(400).json({ erro: 'Informe o nome do responsável.' });
  if (!responsavel?.email || !responsavel.email.trim()) return res.status(400).json({ erro: 'Informe o e-mail do responsável.' });
  if (!responsavel?.senha || responsavel.senha.length < 6) return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
  if (responsavel.senha !== responsavel.confirmarSenha) return res.status(400).json({ erro: 'As senhas não coincidem.' });
  if (!planoId) return res.status(400).json({ erro: 'Selecione um plano para a empresa.' });

  const plano = await prisma.plano.findFirst({ where: { id: planoId, ativo: true } });
  if (!plano) return res.status(400).json({ erro: 'Plano inválido.' });

  const emailLimpo = String(responsavel.email).toLowerCase().trim();
  const emailExistente = await prisma.usuario.findUnique({ where: { email: emailLimpo } });
  if (emailExistente) return res.status(400).json({ erro: 'Já existe uma conta com esse e-mail.' });

  const cnpjLimpo = empresa.cnpj ? apenasDigitos(empresa.cnpj) : null;
  if (cnpjLimpo) {
    const cnpjExistente = await prisma.empresa.findUnique({ where: { cnpj: cnpjLimpo } });
    if (cnpjExistente) return res.status(400).json({ erro: 'Já existe uma empresa cadastrada com esse CNPJ.' });
  }

  const cpfLimpo = responsavel.cpf ? apenasDigitos(responsavel.cpf) : null;
  if (cpfLimpo) {
    const cpfExistente = await prisma.usuario.findUnique({ where: { cpf: cpfLimpo } });
    if (cpfExistente) return res.status(400).json({ erro: 'Já existe uma conta cadastrada com esse CPF.' });
  }

  const slug = await gerarSlugUnico(empresa.nomeFantasia);
  const senhaHash = await bcrypt.hash(responsavel.senha, 10);

  const resultado = await prisma.$transaction(async (tx) => {
    const novaEmpresa = await tx.empresa.create({
      data: {
        nome: empresa.nomeFantasia.trim(),
        slug,
        razaoSocial: empresa.razaoSocial || null,
        cnpj: cnpjLimpo,
        inscricaoEstadual: empresa.inscricaoEstadual || null,
        inscricaoMunicipal: empresa.inscricaoMunicipal || null,
        dataFundacao: empresa.dataFundacao ? new Date(empresa.dataFundacao) : null,
        tipoEmpresa: empresa.tipoEmpresa || 'OUTRO',
        regimeTributario: empresa.regimeTributario || null,
        ramoAtividade: empresa.ramoAtividade || null,
        descricao: empresa.descricao || null,

        cep: endereco?.cep || null,
        endereco: endereco?.endereco || null,
        numero: endereco?.numero || null,
        complemento: endereco?.complemento || null,
        bairro: endereco?.bairro || null,
        cidade: endereco?.cidade || null,
        estado: endereco?.estado || null,
        pais: endereco?.pais || 'Brasil',

        telefone: contatos?.telefone || null,
        whatsapp: contatos?.whatsapp || null,
        emailContato: contatos?.email || null,
        site: contatos?.site || null,
        instagram: contatos?.instagram || null,
        facebook: contatos?.facebook || null,
        tiktok: contatos?.tiktok || null,
        youtube: contatos?.youtube || null,

        termosAceitosEm: new Date()
      }
    });

    const admin = await tx.usuario.create({
      data: {
        nome: responsavel.nome.trim(),
        email: emailLimpo,
        senhaHash,
        papel: 'ADMIN',
        cpf: cpfLimpo,
        rg: responsavel.rg || null,
        dataNascimento: responsavel.dataNascimento ? new Date(responsavel.dataNascimento) : null,
        telefone: responsavel.telefone || null,
        empresaId: novaEmpresa.id
      }
    });

    await tx.categoria.createMany({
      data: CATEGORIAS_PADRAO.map((nome, i) => ({ nome, ordem: i, empresaId: novaEmpresa.id }))
    });

    await tx.canalEntregaConfig.createMany({
      data: TIPOS_CANAL.map((tipo) => ({ tipo, ativo: tipo === 'MOTOBOY_PROPRIO', empresaId: novaEmpresa.id }))
    });

    const agora = new Date();
    const fimTrial = new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000);
    await tx.assinatura.create({
      data: {
        empresaId: novaEmpresa.id,
        planoId: plano.id,
        status: 'TRIAL',
        inicioTrialEm: agora,
        fimTrialEm: fimTrial,
        proximaCobrancaEm: fimTrial
      }
    });

    return { novaEmpresa, admin };
  });

  registrarAuditoria({
    empresaId: resultado.novaEmpresa.id, usuarioId: req.usuario.id, ip: req.ip,
    acao: 'super_admin.cadastrar_empresa', entidade: 'Empresa', entidadeId: resultado.novaEmpresa.id,
    valorDepois: { empresa: resultado.novaEmpresa.nome, plano: plano.nome }
  });

  res.status(201).json({
    empresa: { id: resultado.novaEmpresa.id, nome: resultado.novaEmpresa.nome },
    admin: { nome: resultado.admin.nome, email: resultado.admin.email },
    plano: { nome: plano.nome }
  });
}

// SUPER_ADMIN (dono da plataforma, sem empresaId) enxerga todas as empresas cadastradas.
async function listarTodas(req, res) {
  const empresas = await prisma.empresa.findMany({
    select: {
      id: true, nome: true, slug: true, ativo: true, criadoEm: true, tipoEmpresa: true,
      _count: { select: { usuarios: true } }
    },
    orderBy: { criadoEm: 'desc' }
  });
  res.json(empresas);
}

// Emite um token novo pro SUPER_ADMIN "entrar" numa empresa especifica - a partir daí ele usa
// o sistema exatamente como o ADMIN daquela empresa (mesmas telas, mesmos dados), sem precisar
// duplicar logica de escopo por empresa em cada controller.
async function entrarComoEmpresa(req, res) {
  const { id } = req.params;
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) return res.status(404).json({ erro: 'Empresa não encontrada.' });

  const jti = crypto.randomUUID();
  await prisma.sessaoUsuario.create({
    data: { jti, usuarioId: req.usuario.id, userAgent: req.headers['user-agent'] || null, ip: req.ip || null }
  });

  const token = gerarToken({ ...req.usuario, empresaId: empresa.id }, jti);

  registrarAuditoria({
    empresaId: empresa.id, usuarioId: req.usuario.id, ip: req.ip,
    acao: 'super_admin.entrar_como_empresa', entidade: 'Empresa', entidadeId: empresa.id,
    valorDepois: { empresa: empresa.nome }
  });

  res.json({ token, empresa: { id: empresa.id, nome: empresa.nome } });
}

async function obterMinhaEmpresa(req, res) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: req.usuario.empresaId },
    select: { id: true, nome: true, percentualCashback: true }
  });
  res.json(empresa);
}

async function atualizarCashback(req, res) {
  const { percentualCashback } = req.body || {};
  const valor = Number(percentualCashback);
  if (isNaN(valor) || valor < 0 || valor > 100) {
    return res.status(400).json({ erro: 'Informe um percentual de cashback entre 0 e 100.' });
  }
  const empresa = await prisma.empresa.update({
    where: { id: req.usuario.empresaId },
    data: { percentualCashback: valor },
    select: { id: true, nome: true, percentualCashback: true }
  });
  res.json(empresa);
}

async function obterConfigIA(req, res) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: req.usuario.empresaId },
    select: { iaChaveAnthropic: true }
  });

  if (!empresa?.iaChaveAnthropic) return res.json({ configurada: false, chaveMascarada: null });

  let chaveMascarada = null;
  try {
    const chave = descriptografar(empresa.iaChaveAnthropic);
    chaveMascarada = chave.length > 8 ? `${chave.slice(0, 6)}••••••${chave.slice(-4)}` : '••••••••';
  } catch {
    chaveMascarada = '••••••••';
  }

  res.json({ configurada: true, chaveMascarada });
}

async function atualizarConfigIA(req, res) {
  const { chaveAnthropic } = req.body || {};

  if (chaveAnthropic === '' || chaveAnthropic === null) {
    await prisma.empresa.update({ where: { id: req.usuario.empresaId }, data: { iaChaveAnthropic: null } });
    return res.json({ configurada: false, chaveMascarada: null });
  }

  if (!chaveAnthropic || !chaveAnthropic.trim().startsWith('sk-ant-')) {
    return res.status(400).json({ erro: 'Chave inválida. Uma chave da Anthropic começa com "sk-ant-".' });
  }

  let criptografada;
  try {
    criptografada = criptografar(chaveAnthropic.trim());
  } catch (erro) {
    console.error('Falha ao criptografar chave de IA (ENCRYPTION_KEY configurada?):', erro.message);
    return res.status(500).json({ erro: 'Não foi possível salvar a chave agora. Tente novamente em instantes.' });
  }
  await prisma.empresa.update({ where: { id: req.usuario.empresaId }, data: { iaChaveAnthropic: criptografada } });

  const chave = chaveAnthropic.trim();
  const chaveMascarada = chave.length > 8 ? `${chave.slice(0, 6)}••••••${chave.slice(-4)}` : '••••••••';
  res.json({ configurada: true, chaveMascarada });
}

const CAMPOS_DADOS_FISCAIS = {
  id: true, nome: true, razaoSocial: true, cnpj: true, inscricaoEstadual: true, inscricaoMunicipal: true,
  regimeTributario: true, ambienteFiscal: true,
  cep: true, endereco: true, numero: true, complemento: true, bairro: true, cidade: true, estado: true, pais: true
};

async function obterDadosFiscais(req, res) {
  const empresa = await prisma.empresa.findUnique({ where: { id: req.usuario.empresaId }, select: CAMPOS_DADOS_FISCAIS });
  res.json(empresa);
}

async function atualizarDadosFiscais(req, res) {
  const empresaId = req.usuario.empresaId;
  const existente = await prisma.empresa.findUnique({ where: { id: empresaId }, select: CAMPOS_DADOS_FISCAIS });
  if (!existente) return res.status(404).json({ erro: 'Empresa não encontrada.' });

  const {
    razaoSocial, cnpj, inscricaoEstadual, inscricaoMunicipal, regimeTributario, ambienteFiscal,
    cep, endereco, numero, complemento, bairro, cidade, estado, pais
  } = req.body || {};

  if (ambienteFiscal && !['HOMOLOGACAO', 'PRODUCAO'].includes(ambienteFiscal)) {
    return res.status(400).json({ erro: 'Ambiente fiscal inválido.' });
  }

  const cnpjLimpo = cnpj !== undefined ? (cnpj ? apenasDigitos(cnpj) : null) : existente.cnpj;
  if (cnpjLimpo && cnpjLimpo !== existente.cnpj) {
    const cnpjExistente = await prisma.empresa.findUnique({ where: { cnpj: cnpjLimpo } });
    if (cnpjExistente && cnpjExistente.id !== empresaId) return res.status(400).json({ erro: 'Já existe uma empresa cadastrada com esse CNPJ.' });
  }

  const campo = (valor, atual) => (valor !== undefined ? (valor || null) : atual);

  const data = {
    razaoSocial: campo(razaoSocial, existente.razaoSocial),
    cnpj: cnpjLimpo,
    inscricaoEstadual: campo(inscricaoEstadual, existente.inscricaoEstadual),
    inscricaoMunicipal: campo(inscricaoMunicipal, existente.inscricaoMunicipal),
    regimeTributario: campo(regimeTributario, existente.regimeTributario),
    ambienteFiscal: ambienteFiscal || existente.ambienteFiscal,
    cep: campo(cep, existente.cep),
    endereco: campo(endereco, existente.endereco),
    numero: campo(numero, existente.numero),
    complemento: campo(complemento, existente.complemento),
    bairro: campo(bairro, existente.bairro),
    cidade: campo(cidade, existente.cidade),
    estado: campo(estado, existente.estado),
    pais: pais !== undefined ? (pais || 'Brasil') : existente.pais
  };

  const atualizado = await prisma.empresa.update({ where: { id: empresaId }, data, select: CAMPOS_DADOS_FISCAIS });

  registrarAuditoria({
    empresaId, usuarioId: req.usuario.id, ip: req.ip,
    acao: 'empresa.atualizar_dados_fiscais', entidade: 'Empresa', entidadeId: empresaId,
    valorAntes: existente, valorDepois: atualizado
  });

  res.json(atualizado);
}

async function obterIdentidadeVisual(req, res) {
  const empresa = await prisma.empresa.findUnique({ where: { id: req.usuario.empresaId }, select: CAMPOS_IDENTIDADE_VISUAL });
  res.json(empresa);
}

async function atualizarIdentidadeVisual(req, res, next) {
 try {
  const empresaId = req.usuario.empresaId;
  const existente = await prisma.empresa.findUnique({ where: { id: empresaId }, select: CAMPOS_IDENTIDADE_VISUAL });
  if (!existente) return res.status(404).json({ erro: 'Empresa não encontrada.' });

  const {
    slogan, corPrimaria, corSecundaria, corDestaque, corTexto, tema, exibirMarcaAgapeFood,
    exibirLogoCardapio, exibirSloganCardapio, exibirSloganComanda, mensagemAgradecimento, rodapeComanda,
    whatsapp, telefone, emailContato, site, instagram, facebook, tiktok, youtube
  } = req.body || {};

  for (const [rotulo, valor] of [['corPrimaria', corPrimaria], ['corSecundaria', corSecundaria], ['corDestaque', corDestaque], ['corTexto', corTexto]]) {
    if (valor && !CORES_HEX.test(valor)) return res.status(400).json({ erro: `Cor "${rotulo}" inválida. Use o formato hexadecimal, ex: #D4AF37.` });
  }
  if (tema && !['CLARO', 'ESCURO', 'AUTOMATICO'].includes(tema)) return res.status(400).json({ erro: 'Tema inválido.' });

  for (const [rotulo, valor] of [
    ['whatsapp', whatsapp], ['telefone', telefone], ['emailContato', emailContato], ['site', site],
    ['instagram', instagram], ['facebook', facebook], ['tiktok', tiktok], ['youtube', youtube]
  ]) {
    if (valor && String(valor).length > 191) return res.status(400).json({ erro: `Campo "${rotulo}" excede o tamanho máximo de 191 caracteres.` });
  }

  const paraBooleano = (valor, atual) => (valor !== undefined ? (valor === 'true' || valor === true) : atual);

  const data = {
    slogan: slogan !== undefined ? (slogan || null) : existente.slogan,
    corPrimaria: corPrimaria || existente.corPrimaria,
    corSecundaria: corSecundaria !== undefined ? (corSecundaria || null) : existente.corSecundaria,
    corDestaque: corDestaque !== undefined ? (corDestaque || null) : existente.corDestaque,
    corTexto: corTexto !== undefined ? (corTexto || null) : existente.corTexto,
    tema: tema || existente.tema,
    exibirMarcaAgapeFood: paraBooleano(exibirMarcaAgapeFood, existente.exibirMarcaAgapeFood),
    exibirLogoCardapio: paraBooleano(exibirLogoCardapio, existente.exibirLogoCardapio),
    exibirSloganCardapio: paraBooleano(exibirSloganCardapio, existente.exibirSloganCardapio),
    exibirSloganComanda: paraBooleano(exibirSloganComanda, existente.exibirSloganComanda),
    mensagemAgradecimento: mensagemAgradecimento !== undefined ? (mensagemAgradecimento || null) : existente.mensagemAgradecimento,
    rodapeComanda: rodapeComanda !== undefined ? (rodapeComanda || null) : existente.rodapeComanda,
    whatsapp: whatsapp !== undefined ? (whatsapp || null) : existente.whatsapp,
    telefone: telefone !== undefined ? (telefone || null) : existente.telefone,
    emailContato: emailContato !== undefined ? (emailContato || null) : existente.emailContato,
    site: site !== undefined ? (site || null) : existente.site,
    instagram: instagram !== undefined ? (instagram || null) : existente.instagram,
    facebook: facebook !== undefined ? (facebook || null) : existente.facebook,
    tiktok: tiktok !== undefined ? (tiktok || null) : existente.tiktok,
    youtube: youtube !== undefined ? (youtube || null) : existente.youtube
  };

  const arquivos = req.files || {};
  const mapaCampos = { logo: 'logoUrl', logoImpressao: 'logoImpressaoUrl', logoCardapio: 'logoCardapioUrl', logoRecibo: 'logoReciboUrl' };
  for (const [campoArquivo, campoUrl] of Object.entries(mapaCampos)) {
    const arquivo = arquivos[campoArquivo]?.[0];
    const remover = req.body[`remover_${campoArquivo}`];
    if (arquivo) {
      removerArquivoLogoAntigo(existente[campoUrl]);
      const nomeOtimizado = await otimizarImagemLogo(arquivo);
      data[campoUrl] = montarUrlLogo(req, nomeOtimizado);
    } else if (remover === 'true' || remover === true) {
      removerArquivoLogoAntigo(existente[campoUrl]);
      data[campoUrl] = null;
    }
  }

  const atualizado = await prisma.empresa.update({ where: { id: empresaId }, data, select: CAMPOS_IDENTIDADE_VISUAL });

  registrarAuditoria({
    empresaId, usuarioId: req.usuario.id, ip: req.ip,
    acao: 'empresa.atualizar_identidade_visual', entidade: 'Empresa', entidadeId: empresaId,
    valorAntes: existente, valorDepois: atualizado
  });

  res.json(atualizado);
 } catch (erro) {
  next(erro);
 }
}

module.exports = {
  registrar, cadastrarComoAdmin, listarTodas, entrarComoEmpresa, obterMinhaEmpresa, atualizarCashback, obterConfigIA, atualizarConfigIA,
  obterIdentidadeVisual, atualizarIdentidadeVisual, obterDadosFiscais, atualizarDadosFiscais
};

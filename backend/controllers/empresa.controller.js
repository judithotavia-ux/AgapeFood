const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');
const { gerarToken } = require('./auth.controller');
const { criptografar, descriptografar } = require('../utils/criptografia');

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

module.exports = { registrar, obterMinhaEmpresa, atualizarCashback, obterConfigIA, atualizarConfigIA };

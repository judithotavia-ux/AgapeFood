// Popula (ou atualiza) o catalogo global de permissoes e os perfis padrao por papel.
// Idempotente: pode ser rodado de novo a qualquer momento (upsert em tudo).
// Uso: node prisma/seeds/permissoes.seed.js

const prisma = require('../client');
const { CATALOGO, DEFAULTS_POR_PAPEL } = require('../../utils/catalogoPermissoes');

async function rodar() {
  const idPorChave = new Map();

  for (const p of CATALOGO) {
    const registro = await prisma.permissao.upsert({
      where: { chave: p.chave },
      update: { modulo: p.modulo, acao: p.acao, descricao: p.descricao },
      create: p
    });
    idPorChave.set(p.chave, registro.id);
  }
  console.log(`Catalogo: ${idPorChave.size} permissoes.`);

  let vinculos = 0;
  for (const [papel, chaves] of Object.entries(DEFAULTS_POR_PAPEL)) {
    for (const chave of chaves) {
      const permissaoId = idPorChave.get(chave);
      if (!permissaoId) {
        console.warn(`Chave "${chave}" em DEFAULTS_POR_PAPEL nao existe no CATALOGO - pulando.`);
        continue;
      }
      await prisma.perfilPermissaoPadrao.upsert({
        where: { papel_permissaoId: { papel, permissaoId } },
        update: {},
        create: { papel, permissaoId }
      });
      vinculos++;
    }
  }
  console.log(`Perfis padrao: ${vinculos} vinculos papel->permissao.`);
}

rodar()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());

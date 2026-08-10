require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./client');

async function main() {
  const empresa = await prisma.empresa.upsert({
    where: { slug: 'agapefood-demo' },
    update: {},
    create: {
      nome: 'AgapeFood Demo',
      slug: 'agapefood-demo',
      corPrimaria: '#D4AF37'
    }
  });

  const senhaHash = await bcrypt.hash('agape123', 10);

  await prisma.usuario.upsert({
    where: { email: 'admin@agapefood.com' },
    update: {},
    create: {
      nome: 'Admin AgapeFood',
      email: 'admin@agapefood.com',
      senhaHash,
      papel: 'ADMIN',
      empresaId: empresa.id
    }
  });

  const planos = [
    { nome: 'Básico', descricao: 'Pedidos, cardápio digital, cozinha, caixa, salão e delivery.', preco: 99.0, ordem: 0 },
    { nome: 'Profissional', descricao: 'Tudo do Básico + Estoque e Financeiro.', preco: 199.0, ordem: 1 },
    { nome: 'Completo', descricao: 'Tudo do Profissional + Marketing, IA e Central de Impressão Térmica.', preco: 349.0, ordem: 2 }
  ];
  for (const plano of planos) {
    const existente = await prisma.plano.findFirst({ where: { nome: plano.nome } });
    if (!existente) await prisma.plano.create({ data: plano });
  }

  console.log('Seed concluído. Login: admin@agapefood.com / senha: agape123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

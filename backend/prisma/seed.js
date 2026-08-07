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

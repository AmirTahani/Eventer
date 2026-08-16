import { PrismaClient, RoleName, UserStatus } from '@prisma/client';

/**
 * Bootstrap the first Admin from ADMIN_TELEGRAM_ID.
 * Usage: ADMIN_TELEGRAM_ID=123 pnpm prisma:seed
 */
async function main() {
  const telegramId = process.env.ADMIN_TELEGRAM_ID;
  if (!telegramId) {
    throw new Error('ADMIN_TELEGRAM_ID env var is required to seed the admin');
  }

  const prisma = new PrismaClient();
  const telegramUserId = BigInt(telegramId);

  const user = await prisma.user.upsert({
    where: { telegramUserId },
    create: {
      telegramUserId,
      firstName: 'Admin',
      status: UserStatus.APPROVED,
      approvedAt: new Date(),
      roles: { create: [{ role: RoleName.ADMIN }] },
    },
    update: {
      status: UserStatus.APPROVED,
      approvedAt: new Date(),
    },
    include: { roles: true },
  });

  if (!user.roles.some((r) => r.role === RoleName.ADMIN)) {
    await prisma.userRole.create({
      data: { userId: user.id, role: RoleName.ADMIN },
    });
  }

  console.log(`Admin ready: userId=${user.id} telegramUserId=${telegramId}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});

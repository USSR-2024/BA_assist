import { PrismaClient } from '@prisma/client';

// Создаем глобальный объект для сохранения instance Prisma между горячими перезагрузками в development
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Инициализируем Prisma только один раз
export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Предотвращаем множественные экземпляры Prisma в режиме разработки
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
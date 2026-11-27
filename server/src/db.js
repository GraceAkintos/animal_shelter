//db connection for the whole server, every route file imports this inseatd of creating its own
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
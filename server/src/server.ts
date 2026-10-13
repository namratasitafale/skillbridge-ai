import { app } from './app.js';
import { prisma } from './db/prisma.js';

const port = Number(process.env.PORT ?? 3001);
const server = app.listen(port, () => {
  console.log(`DevFlow API listening on port ${port}.`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
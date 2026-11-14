import { createApp } from './app';
import { createPool } from './db';
import { PgTaskRepository } from './repository';

async function main(): Promise<void> {
  const repo = new PgTaskRepository(createPool());
  await repo.init();
  const port = Number(process.env['PORT'] ?? 3000);
  createApp(repo).listen(port, () => console.info(`API ouvindo na porta ${port}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

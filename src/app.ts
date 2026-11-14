import express, { type Express, type Request, type Response } from 'express';
import type { TaskRepository } from './repository';

function parseId(req: Request): number | null {
  const id = Number(req.params['id']);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function createApp(repo: TaskRepository): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/tasks', async (_req, res) => {
    res.json(await repo.list());
  });

  app.get('/tasks/:id', async (req: Request, res: Response) => {
    const id = parseId(req);
    if (id === null) return res.status(400).json({ error: 'id inválido' });
    const task = await repo.get(id);
    return task ? res.json(task) : res.status(404).json({ error: 'tarefa não encontrada' });
  });

  app.post('/tasks', async (req, res) => {
    const title: unknown = req.body?.title;
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title é obrigatório' });
    }
    return res.status(201).json(await repo.create(title.trim()));
  });

  app.put('/tasks/:id', async (req: Request, res: Response) => {
    const id = parseId(req);
    if (id === null) return res.status(400).json({ error: 'id inválido' });
    const { title, done } = req.body ?? {};
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ error: 'title inválido' });
    }
    if (done !== undefined && typeof done !== 'boolean') {
      return res.status(400).json({ error: 'done deve ser booleano' });
    }
    const task = await repo.update(id, { title: title?.trim(), done });
    return task ? res.json(task) : res.status(404).json({ error: 'tarefa não encontrada' });
  });

  app.delete('/tasks/:id', async (req: Request, res: Response) => {
    const id = parseId(req);
    if (id === null) return res.status(400).json({ error: 'id inválido' });
    return (await repo.remove(id))
      ? res.status(204).send()
      : res.status(404).json({ error: 'tarefa não encontrada' });
  });

  return app;
}

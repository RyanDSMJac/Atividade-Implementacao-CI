import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import type { Task, TaskRepository } from '../../src/repository';

/** Repositório em memória: isola a API do banco para o teste unitário. */
class InMemoryRepo implements TaskRepository {
  private tasks: Task[] = [];
  private seq = 1;

  async list() {
    return this.tasks;
  }
  async get(id: number) {
    return this.tasks.find((t) => t.id === id) ?? null;
  }
  async create(title: string) {
    const task = { id: this.seq++, title, done: false };
    this.tasks.push(task);
    return task;
  }
  async update(id: number, patch: { title?: string; done?: boolean }) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    if (patch.title !== undefined) task.title = patch.title;
    if (patch.done !== undefined) task.done = patch.done;
    return task;
  }
  async remove(id: number) {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < before;
  }
}

describe('API de tarefas (unitário)', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => {
    app = createApp(new InMemoryRepo());
  });

  it('GET /health retorna ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /tasks cria tarefa', async () => {
    const res = await request(app).post('/tasks').send({ title: '  Estudar CI ' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, title: 'Estudar CI', done: false });
  });

  it('POST /tasks rejeita título vazio', async () => {
    const res = await request(app).post('/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  it('GET /tasks/:id retorna 400 para id inválido e 404 para inexistente', async () => {
    expect((await request(app).get('/tasks/abc')).status).toBe(400);
    expect((await request(app).get('/tasks/99')).status).toBe(404);
  });

  it('PUT /tasks/:id atualiza e valida', async () => {
    await request(app).post('/tasks').send({ title: 'A' });
    const ok = await request(app).put('/tasks/1').send({ done: true });
    expect(ok.body.done).toBe(true);
    expect((await request(app).put('/tasks/1').send({ done: 'sim' })).status).toBe(400);
    expect((await request(app).put('/tasks/42').send({ done: true })).status).toBe(404);
  });

  it('DELETE /tasks/:id remove tarefa', async () => {
    await request(app).post('/tasks').send({ title: 'A' });
    expect((await request(app).delete('/tasks/1')).status).toBe(204);
    expect((await request(app).delete('/tasks/1')).status).toBe(404);
  });
});

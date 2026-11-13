import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { createPool } from '../../src/db';
import { PgTaskRepository } from '../../src/repository';

/** Teste de integração: API + repositório + PostgreSQL real (DATABASE_URL). */
describe('API de tarefas (integração com PostgreSQL)', () => {
  const pool = createPool();
  const repo = new PgTaskRepository(pool);
  const app = createApp(repo);

  beforeAll(async () => {
    await repo.init();
  });
  beforeEach(async () => {
    await pool.query('TRUNCATE tasks RESTART IDENTITY');
  });
  afterAll(async () => {
    await pool.end();
  });

  it('executa o ciclo completo CRUD persistindo no banco', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Configurar pipeline' });
    expect(created.status).toBe(201);
    const id = created.body.id as number;

    const list = await request(app).get('/tasks');
    expect(list.body).toHaveLength(1);

    const updated = await request(app).put(`/tasks/${id}`).send({ done: true });
    expect(updated.body).toMatchObject({ id, title: 'Configurar pipeline', done: true });

    const { rows } = await pool.query('SELECT done FROM tasks WHERE id = $1', [id]);
    expect(rows[0].done).toBe(true);

    expect((await request(app).delete(`/tasks/${id}`)).status).toBe(204);
    expect((await request(app).get(`/tasks/${id}`)).status).toBe(404);
  });

  it('trata entrada maliciosa como dado (sem SQL injection)', async () => {
    const evil = "x'); DROP TABLE tasks;--";
    const res = await request(app).post('/tasks').send({ title: evil });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe(evil);
    expect((await request(app).get('/tasks')).body).toHaveLength(1);
  });
});

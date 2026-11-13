import type { Pool } from 'pg';

export interface Task {
  id: number;
  title: string;
  done: boolean;
}

export interface TaskRepository {
  list(): Promise<Task[]>;
  get(id: number): Promise<Task | null>;
  create(title: string): Promise<Task>;
  update(id: number, patch: { title?: string; done?: boolean }): Promise<Task | null>;
  remove(id: number): Promise<boolean>;
}

/** Implementação com PostgreSQL (SQL parametrizado, sem concatenação de strings). */
export class PgTaskRepository implements TaskRepository {
  constructor(private readonly pool: Pool) {}

  async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE
      )`);
  }

  async list(): Promise<Task[]> {
    const { rows } = await this.pool.query<Task>('SELECT id, title, done FROM tasks ORDER BY id');
    return rows;
  }

  async get(id: number): Promise<Task | null> {
    const { rows } = await this.pool.query<Task>(
      'SELECT id, title, done FROM tasks WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  }

  async create(title: string): Promise<Task> {
    const { rows } = await this.pool.query<Task>(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, done',
      [title],
    );
    return rows[0] as Task;
  }

  async update(id: number, patch: { title?: string; done?: boolean }): Promise<Task | null> {
    const { rows } = await this.pool.query<Task>(
      `UPDATE tasks SET title = COALESCE($2, title), done = COALESCE($3, done)
       WHERE id = $1 RETURNING id, title, done`,
      [id, patch.title ?? null, patch.done ?? null],
    );
    return rows[0] ?? null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

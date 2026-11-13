# Tasks API — CI com GitHub Actions

API REST de tarefas (Express + TypeScript + PostgreSQL) criada para demonstrar um pipeline de CI.

## Endpoints

| Método | Rota       | Descrição               |
| ------ | ---------- | ----------------------- |
| GET    | /health    | Status da aplicação     |
| GET    | /tasks     | Lista tarefas           |
| GET    | /tasks/:id | Busca uma tarefa        |
| POST   | /tasks     | Cria (`{"title": "x"}`) |
| PUT    | /tasks/:id | Atualiza `title`/`done` |
| DELETE | /tasks/:id | Remove                  |

## Rodando localmente

```bash
docker run -d --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tasks -p 5432:5432 postgres:16-alpine
npm ci
npm run dev
```

## Scripts

`npm run lint` · `format:check` · `typecheck` · `build` · `test:unit` · `test:integration` (requer `DATABASE_URL`)

## Pipeline (`.github/workflows/ci.yml`)

Gatilho: Pull Request para `main`/`develop`.

`qualidade` (ESLint, Prettier, tsc) → `build` + `teste-unitario` + `teste-integracao` (PostgreSQL) em paralelo;
`seguranca` (CodeQL + npm audit) em paralelo → `imagem-docker` (só roda se todos passarem).

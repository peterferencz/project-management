import express from 'express';
import { requireAuthenticated, useUserAuthMiddleware } from './middleware/userAuth.js';
import { AppDataSource, initDB } from './database/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { envVars } from './schemas/EnvVars.js';
import { log, fatal } from './logger.js';
import { AuthRouter } from './endpoints/AuthRouter.js';
import { ProjectsRouter } from './endpoints/ProjectsRouter.js';
import { TasksRouter } from './endpoints/TasksRouter.js';

const app = express();
const PORT = envVars.PORT


app.use(express.json({limit: '100kb'}));
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);

useUserAuthMiddleware(app)

app.get('/api/health', async (req, res) => {
  res.status(200).json({message: 'ok'})
})



app.use('/api/auth', AuthRouter)
app.use('/api/project', ProjectsRouter)
app.use('/api/task', TasksRouter)



app.use(errorHandler)

async function main(){
  await initDB().catch(err => {
    fatal("Database", err)
  });

  const server = await app.listen(PORT, () => {
    log("Express", `Server running on port ${PORT}`)
  });

  const shutdown = (signal: string) => {
    log("Generic", `${signal} received, shutting down`)
    server.close(async () => {
      await AppDataSource.destroy();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref(); // force exit if connections hang
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main()

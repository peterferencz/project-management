import { DataSource } from 'typeorm';
import { UserEntity } from '../entities/UserEntity';
import { Project } from '../entities/Project';
import { Task } from '../entities/Task';
import { envVars } from '../schemas/EnvVars';
import { log } from '../logger';

const AppDataSource = new DataSource({
    type: "mysql",
    host: envVars.DB_HOST,
    port: 3306,
    username: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
    entities: [UserEntity, Project, Task],
    synchronize: true,
    logging: false,
})

async function initDB(){
  await AppDataSource.initialize()
  log("Database", "Database initialized")
}

const userRepository = AppDataSource.getRepository(UserEntity)
const projectRepository = AppDataSource.getRepository(Project)
const taskRepository = AppDataSource.getRepository(Task);


export { AppDataSource, initDB, userRepository, projectRepository, taskRepository }



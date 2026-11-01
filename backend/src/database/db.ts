import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Project } from '../entities/Project';
import { Task } from '../entities/Task';

const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Project, Task],
    synchronize: true,
    logging: false,
})

async function initDB(){
  try {
    await AppDataSource.initialize()
    console.log("Database initialized")
  } catch (error) {
    console.log(error)
  }
}

const userRepository = AppDataSource.getRepository(User)
const projectRepository = AppDataSource.getRepository(Project)
const taskRepository = AppDataSource.getRepository(Task);


export { AppDataSource, initDB, userRepository, projectRepository, taskRepository }



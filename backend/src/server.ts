import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { User } from './entities/User.js';
import { requireAuthenticated, useUserAuthMiddleware } from './userAuth.js';
import { AppDataSource, initDB, projectRepository, taskRepository, userRepository } from './database/db.js';
import { Task } from './entities/Task.js';

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

useUserAuthMiddleware(app)


const PASSWORD_HASH_SALT_ROUNDS: number = Number(requireEnvironmentVariable<number>("PASSWORD_HASH_SALT_ROUNDS"))

if(!process.env.PASSWORD_HASH_SALT_ROUNDS){
  throw new Error('InvalidConfigurationError - no PASSWORD_HASH_SALT_ROUNDS defined in .env')
}

function requireEnvironmentVariable<T>(name: string) : T {
  const variable = process.env[name]
  if(variable === undefined){
    throw new Error(`InvalidConfigurationError - no ${name} defined in .env`)
  }
  
  return variable as unknown as T;
}

const requireFieldsInBody = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter(field => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required fields in body: ${missing.join(', ')}` 
      });
    }

    next();
  };
}

app.post('/api/register', requireFieldsInBody(['username', 'password']), async (req, res, next) => {
  const { username, password } = req.body;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, PASSWORD_HASH_SALT_ROUNDS);


  if(await userRepository.existsBy({displayname: username})){
    res.status(400).json({ message: 'Username is already in use'})
    return;
  }

  // Insert user into MySQL
  const user = await userRepository.create({
    displayname: username,
    password_hash: hashedPassword
  })

  await userRepository.save(user);

  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if(err) return next(err);
    if(!user) return res.status(401).json({ message: 'Invalid credentials' });
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({ message: 'ok' });
    });
  })(req, res, next)
}, (req, res) => {
  res.send(JSON.stringify({message: "ok"}))
});

app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// Check current session state endpoint
app.get('/api/user', requireAuthenticated, async (req, res) => {
  const userId = req.user?.id
  const user = await userRepository.findOneBy({id: userId})
  if(user === null){
    res.status(500).json({message: "Stale id"})
    return
  }
  
  res.status(200).json({ username: user.displayname, createdAt: user.created_at })
});

//#region Projects

app.get('/api/projects', requireAuthenticated, async (req, res) => {
  const userId = req.user!.id
  const projects = await projectRepository.findBy({ owner: {id: userId} })
  return res.status(200).json(projects)
});

app.post(
'/api/project/create',
requireAuthenticated,
requireFieldsInBody(['project_name', 'project_description']), async (req, res) => {
  const userId = req.user!.id
  const { project_name, project_description } = req.body

  const project = await projectRepository.create({
    name: project_name,
    description: project_description,
    owner: {id: userId}
  })
  await projectRepository.save(project)
  return res.status(200).json({message: "ok"})
});

app.put('/api/project/:projectId', requireAuthenticated, async (req, res) => {
  const projectId = parseInt(req.params.projectId.toString());
  const userId = req.user!.id;
  const { project_name, project_description } = req.body;

  const project = await projectRepository.findOneBy({ id: projectId, owner: { id: userId } });
  if (project === null){
    return res.status(404).json({ message: "Project not found" });
  }

  project.name = project_name ?? project.name;
  project.description = project_description ?? project.description;
  await projectRepository.save(project);

  return res.status(200).json({ message: "Project updated" });
});

app.delete('/api/project/:projectId', requireAuthenticated, async (req, res) => {
  const projectId = parseInt(req.params.projectId.toString());
  const userId = req.user!.id;

  const project = await projectRepository.findOneBy({ id: projectId, owner: { id: userId } });
  if (project === null){
    return res.status(404).json({ message: "Project not found" });
  }

  await projectRepository.remove(project);
  return res.status(200).json({ message: "Project deleted" });
});

app.get('/api/project/:projectId',
requireAuthenticated, async (req, res) => {
  const projectId = parseInt(req.params.projectId.toString())
  const userId = req.user!.id

  const project = await projectRepository.findOneBy({
    id: projectId,
    owner: {id: userId}
  })

  if(project === null){
    return res.status(404).json({message: "Project not found"})
  }

  res.json(project)
});

//#endregion


app.get('/api/projects/:projectId/tasks', requireAuthenticated, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId.toString());
    const userId = req.user!.id;

    // Verify project ownership
    const project = await projectRepository.findOneBy({ 
      id: projectId, 
      owner: { id: userId } 
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Fetch tasks belonging to this project that do not have a parent task (top-level)
    const tasks = await taskRepository.find({
      where: { 
        project_id: projectId
      },
      relations: {
        project: {
          owner: true
        },
        subTasks: {
          subTasks: true
        },
        parentTask: true
      }
    });

    return res.json(tasks);
  } catch (err) {
    next(err);
  }
});

app.get('/api/tasks/:taskId', requireAuthenticated, async (req, res) => {
  const taskId = parseInt(req.params.taskId.toString());

  const task = await taskRepository.findOne({
    where: { id: taskId },
    relations: {
      project: { owner: true },
      parentTask: true,
      subTasks: true
    }
  });

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  return res.json(task);
});

app.post('/api/tasks/create',
  requireAuthenticated,
  requireFieldsInBody(["name", "description"]),
  async (req, res, next) => {
    const userId = req.user!.id;
    const { name, description, expected_minutes, project_id, parent_task_id } = req.body;
    
    // Verify ownership of owner (project_id or parent_task_id)
    if (project_id) {
      const project = await projectRepository.findOneBy({ id: project_id, owner: { id: userId } });
      if (!project) return res.status(404).json({ message: 'Project not found' });
    } else if (parent_task_id) {
      const parentTask = await taskRepository.findOne({
        where: { id: parent_task_id },
        relations: { project: { owner: true } }
      });
      if (!parentTask) return res.status(404).json({ message: 'Parent task not found' });
    } else {
      return res.status(400).json({ message: 'Task must belong to either a project or a parent task' });
    }
    
    const task = taskRepository.create({
      name,
      description: description || '',
      expected_minutes: expected_minutes ? parseInt(expected_minutes) : null,
      project_id: project_id || null,
      parent_task_id: parent_task_id || null
    });

    await taskRepository.save(task);
    return res.status(201).json({ message: 'Task created successfully', task });
});

app.put('/api/tasks/:taskId', requireAuthenticated, async (req, res) => {
  const taskId = parseInt(req.params.taskId.toString());
  const { name, description, expected_minutes } = req.body;

  const task = await taskRepository.findOne({
      where: { id: taskId },
      relations: {
        project: { owner: true }
      }
    });
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  task.name = name ?? task.name;
  task.description = description ?? task.description;
  task.expected_minutes = expected_minutes !== undefined ? (expected_minutes ? parseInt(expected_minutes) : null) : task.expected_minutes;

  await taskRepository.save(task);
  return res.status(200).json({ message: 'Task updated successfully', task });
});

app.delete('/api/tasks/:taskId', requireAuthenticated, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.taskId.toString());
    const userId = req.user!.id;

    const task = await taskRepository.findOne({
      where: { id: taskId },
      relations: {
        project: { owner: true },
        parentTask: {
          project: { owner: true }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Helper function to resolve the owner ID whether attached directly to a project or via parent tasks
    let ownerId: number | undefined = undefined;

    if (task.project && task.project.owner) {
      ownerId = task.project.owner.id;
    } else if (task.parentTask) {
      // Traverse up to find the root container owner if it's a sub-task
      let current: Task | null = task.parentTask;
      while (current) {
        if (current.project && current.project.owner) {
          ownerId = current.project.owner.id;
          break;
        }
        current = current.parentTask || null;
      }
    }

    // Enforce ownership validation
    if (ownerId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await taskRepository.remove(task);
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
});

(async () => {
  initDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error(err))
})()

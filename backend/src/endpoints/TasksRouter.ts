import { Router } from "express";
import { requireAuthenticated } from "../middleware/userAuth";
import { projectRepository, taskRepository } from "../database/db";
import { Task } from "../entities/Task";

export const TasksRouter = Router()


// TasksRouter.get(
// '/ofproject/:projectId',
// requireAuthenticated,
// async (req, res) => {
//     const projectId = parseInt(req.params.projectId.toString());
//     const userId = req.user!.id;

//     // Verify project ownership
//     const project = await projectRepository.findOneBy({
//         id: projectId,
//         owner: { id: userId }
//     });

//     if (!project) {
//         return res.status(404).json({ message: 'Project not found' });
//     }

//     const tasks = await taskRepository.find({ where: { project_id: projectId } });

//     return res.json(tasks);
// });

TasksRouter.get(
'/:taskId',
requireAuthenticated,
async (req, res) => {
    const taskId = parseInt(req.params.taskId.toString());

    const task = await taskRepository.findOne({
        where: {
            id: taskId,
            project: { owner: { id: req.user!.id } }
        }
    });

    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }

    return res.json(task);
});

TasksRouter.post(
'/api/tasks/create',
requireAuthenticated,
//TODO require name
async (req, res) => {
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

TasksRouter.put(
'/:taskId',
requireAuthenticated,
async (req, res) => {
    const taskId = parseInt(req.params.taskId.toString());
    const { name, description, expected_minutes } = req.body;

    const task = await taskRepository.findOne({
        where: {
            id: taskId,
            project: { owner: { id: req.user!.id } }
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

TasksRouter.delete('/api/tasks/:taskId', requireAuthenticated, async (req, res, next) => {
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
});

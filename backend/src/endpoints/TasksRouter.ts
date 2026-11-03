import { Router, Request, Response } from "express";
import { requireAuthenticated } from "../middleware/userAuth";
import { projectRepository, taskRepository } from "../database/db";
import { Task } from "../entities/Task";
import { validateBody } from "../middleware/validateRequestBody";
import { createTaskBodySchema, createTaskBodySchemaType, updateTaskBodySchema, updateTaskBodySchemaType, updateTaskParamsSchema, updateTaskParamsSchemaType } from "../schemas/TaskSchema";
import z from "zod";

export const TasksRouter = Router()

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
validateBody(createTaskBodySchema),
async (req: Request<{}, {}, createTaskBodySchemaType>, res: Response) => {
    const userId = req.user!.id;
    const { name, description, parentTaskId, projectId } = req.body;


    const project = await projectRepository.findOneBy({ id: projectId, owner: { id: userId } });
    if (!project) return res.status(404).json({ message: 'Parent project not found' });

    if(parentTaskId){
        const parentTask = await taskRepository.findOne({
            where: { id: parentTaskId, project_id: projectId },
        });
        if (!parentTask) return res.status(404).json({message: 'Parent task not found'})
    }

    const task = taskRepository.create({
        name: name,
        description: description || '',
        project_id: projectId,
        parent_task_id: parentTaskId || null
    });

    await taskRepository.save(task);
    return res.status(201).json({ message: 'Task created successfully', task });
});

TasksRouter.put(
'/:taskId',
requireAuthenticated,
validateBody(updateTaskBodySchema),
async (req: Request<{taskId: string}, {}, updateTaskBodySchemaType>, res: Response) => {
    const taskId = parseInt(req.params.taskId);
    const { name, description } = req.body;

    if(Number.isNaN(taskId)){
        return res.status(400).json({message: "Invalid taskId"})
    }

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

    await taskRepository.save(task);
    return res.status(200).json({ message: 'Task updated successfully', task });
});

TasksRouter.delete(
'/api/tasks/:taskId',
requireAuthenticated,
async (req: Request<{taskId: string}, {}, {}>, res: Response) => {
    const taskId = parseInt(req.params.taskId);
    const userId = req.user!.id;

    if(Number.isNaN(taskId)){
        return res.status(400).json({message: "Invalid taskId"})
    }

    const task = await taskRepository.findOne({
        where: {
            id: taskId,
            project: { owner: { id: userId } }
        }
    });

    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }

    await taskRepository.remove(task);
    return res.status(200).json({ message: 'Task deleted successfully' });
});

import { Router, Request, Response } from "express";
import { requireAuthenticated } from "../middleware/userAuth";
import { projectRepository, taskRepository } from "../database/db";
import { Task } from "../entities/Task";
import { validateBody } from "../middleware/validateRequestBody";
import { createTaskBodySchema, createTaskBodySchemaType, updateTaskBodySchema, updateTaskBodySchemaType, updateTaskParamsSchema, updateTaskParamsSchemaType } from "../schemas/TaskSchema";
import z from "zod";

export const TasksRouter = Router()


async function findOwnedTask(taskId: number, userId: number){
    return await taskRepository.findOne({
        where: {
            id: taskId,
            project: { owner: { id: userId } } }
    });
}

function getTaskIdFromReq(req: Request) {
    const n = Number(req.params.taskId)
    return isNaN(n) ? null : n;
}


TasksRouter.get(
'/:taskId',
requireAuthenticated,
async (req, res) => {
    const taskId = getTaskIdFromReq(req);
    if(taskId == null){ return res.status(400).json({message: "Invalid taskId"}) }

    const userId = req.user!.id;

    const task = await findOwnedTask(taskId, userId)

    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }

    return res.json(task);
});

TasksRouter.post(
'/create',
requireAuthenticated,
validateBody(createTaskBodySchema),
async (req: Request<{}, {}, createTaskBodySchemaType>, res: Response) => {
    const userId = req.user!.id;
    const { name, description, dueDate, parentTaskId, projectId } = req.body;


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
        due_date: dueDate ?? null,
        completed_at: null,
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
    const taskId = getTaskIdFromReq(req);
    const { name, description, dueDate, completed } = req.body;
    const userId = req.user!.id;

    if(taskId == null){ return res.status(400).json({message: "Invalid taskId"}) }

    const task = await findOwnedTask(taskId, userId)

    if (task == null) { return res.status(404).json({ message: 'Task not found' }); }

    task.name = name ?? task.name;
    task.description = description ?? task.description;
    task.due_date = dueDate ? new Date(dueDate) : task.due_date;
    task.completed_at = completed !== undefined ? (completed ? new Date() : null) : task.completed_at;

    await taskRepository.save(task);
    return res.status(200).json({ message: 'Task updated successfully', task });
});

TasksRouter.delete(
'/:taskId',
requireAuthenticated,
async (req: Request<{taskId: string}, {}, {}>, res: Response) => {
    const taskId = getTaskIdFromReq(req);
    const userId = req.user!.id;

    if(taskId == null){ return res.status(400).json({message: "Invalid taskId"}) }

    const task = await findOwnedTask(taskId, userId);

    if (task == null) { return res.status(404).json({ message: 'Task not found' }); }

    await taskRepository.remove(task);
    return res.status(200).json({ message: 'Task deleted successfully' });
});

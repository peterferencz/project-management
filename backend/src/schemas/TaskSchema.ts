import * as z from "zod"

const TASK_NAME_MIN_CHARS = 4;
const TASK_NAME_MAX_CHARS = 20;
const TASK_DESCRIPTION_MAX_CHARS = 72;

const taskName = z.string().min(TASK_NAME_MIN_CHARS).max(TASK_NAME_MAX_CHARS);
const taskDescription = z.string().max(TASK_DESCRIPTION_MAX_CHARS);
const taskDueDate = z.iso.date().nullable()

export type createTaskBodySchemaType = z.infer<typeof createTaskBodySchema>;
export const createTaskBodySchema = z.object({
    name: taskName,
    description: taskDescription.optional(),
    dueDate: taskDueDate.optional(),
    parentTaskId: z.number().nonnegative().optional(),
    projectId: z.number().nonnegative()
})

export type updateTaskBodySchemaType = z.infer<typeof updateTaskBodySchema>;
export const updateTaskBodySchema = z.object({
    name: taskName.optional(),
    description: taskDescription.optional(),
    dueDate: taskDueDate.optional(),
    completed: z.boolean().optional()
})


export type updateTaskParamsSchemaType = z.infer<typeof updateTaskParamsSchema>;
export const updateTaskParamsSchema = z.object({
    taskId: z.number().min(1)
})

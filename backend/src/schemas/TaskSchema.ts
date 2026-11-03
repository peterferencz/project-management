import * as z from "zod"

const TASK_NAME_MIN_CHARS = 4;
const TASK_NAME_MAX_CHARS = 20;
const TASK_DESCRIPTION_MIN_CHARS = 8;
const TASK_DESCRIPTION_MAX_CHARS = 72;

export type createTaskBodySchemaType = z.infer<typeof createTaskBodySchema>;
export const createTaskBodySchema = z.object({
    name: z.string().min(TASK_NAME_MIN_CHARS).max(TASK_NAME_MAX_CHARS),
    description: z.string().min(TASK_DESCRIPTION_MIN_CHARS).max(TASK_DESCRIPTION_MAX_CHARS).optional(),
    parentTaskId: z.number().nonnegative().optional(),
    projectId: z.number().nonnegative()
})

export type updateTaskBodySchemaType = z.infer<typeof updateTaskBodySchema>;
export const updateTaskBodySchema = z.object({
    id: z.number().nonnegative(),
    name: z.string().min(TASK_NAME_MIN_CHARS).max(TASK_NAME_MAX_CHARS).optional(),
    description: z.string().min(TASK_DESCRIPTION_MIN_CHARS).max(TASK_DESCRIPTION_MAX_CHARS).optional()
})


export type updateTaskParamsSchemaType = z.infer<typeof updateTaskParamsSchema>;
export const updateTaskParamsSchema = z.object({
    taskId: z.number().min(1)
})

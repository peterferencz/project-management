import * as z from "zod"

const TASK_NAME_MIN_CHARS = 4;
const TASK_NAME_MAX_CHARS = 20;
const TASK_DESCRIPTION_MIN_CHARS = 8;
const TASK_DESCRIPTION_MAX_CHARS = 72;

export const createTaskBodySchema = z.object({
    name: z.string().min(TASK_NAME_MIN_CHARS).max(TASK_NAME_MAX_CHARS),
    description: z.string().min(TASK_DESCRIPTION_MIN_CHARS).max(TASK_DESCRIPTION_MAX_CHARS).optional(),
})

import * as z from "zod"

const PROJECT_NAME_MIN_CHARS = 1;
const PROJECT_NAME_MAX_CHARS = 64;
const PROJECT_DESCRIPTION_MIN_CHARS = 0;
const PROJECT_DESCRIPTION_MAX_CHARS = 255;


const projectCreateBodySchema = z.object({
    project_name: z.string().min(PROJECT_NAME_MIN_CHARS).max(PROJECT_NAME_MAX_CHARS),
    project_description: z.string().min(PROJECT_DESCRIPTION_MIN_CHARS).max(PROJECT_DESCRIPTION_MAX_CHARS).optional(),
})


const projectUpdateBodySchema = z.object({
    project_name: z.string().min(PROJECT_NAME_MIN_CHARS).max(PROJECT_NAME_MAX_CHARS).optional(),
    project_description: z.string().min(PROJECT_DESCRIPTION_MIN_CHARS).max(PROJECT_DESCRIPTION_MAX_CHARS).optional(),
})

export { projectCreateBodySchema, projectUpdateBodySchema }
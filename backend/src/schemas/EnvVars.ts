import * as z from "zod"


const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    
    SESSION_SECRET: z.string().min(32, 'must be at least 32 characters'),
    PASSWORD_HASH_SALT_ROUNDS: z.coerce.number().int().min(10).max(14),
  });

const parsed = schema.safeParse(process.env);




if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  console.error(`Invalid environment variables:\n${lines.join('\n')}`);
  process.exit(1);
}

const envVars = parsed.data;
const isProd = envVars.NODE_ENV === 'production';

export {
    envVars, isProd
}

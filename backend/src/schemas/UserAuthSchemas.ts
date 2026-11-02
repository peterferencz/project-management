import { Request, Response, NextFunction } from "express";
import * as z from "zod"

const USERNAME_MIN_CHARS = 4;
const USERNAME_MAX_CHARS = 20;
const PASSWORD_MIN_CHARS = 8;
const PASSWORD_MAX_CHARS = 72;

const loginBodySchema = z.object({
    username: z.string().min(USERNAME_MIN_CHARS).max(USERNAME_MAX_CHARS),
    password: z.string().min(PASSWORD_MIN_CHARS).max(PASSWORD_MAX_CHARS),
})


const registerBodySchema = z.object({
    username: z.string().min(USERNAME_MIN_CHARS).max(USERNAME_MAX_CHARS),
    password: z.string().min(PASSWORD_MIN_CHARS).max(PASSWORD_MAX_CHARS),
})


export { loginBodySchema, registerBodySchema }
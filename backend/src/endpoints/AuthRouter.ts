import { Router } from "express";
import { validateBody } from "../middleware/validateRequestBody";
import { loginBodySchema, registerBodySchema } from "../schemas/UserAuthSchemas";
import bcrypt from 'bcrypt';
import rateLimit from "express-rate-limit";
import passport from "passport";
import { envVars } from "../schemas/EnvVars";
import { userRepository } from "../database/db";



export const AuthRouter = Router()


const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true, // only failed attempts count
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Try again later.' },
});



AuthRouter.post(
'/login',
loginLimiter,
validateBody(loginBodySchema),
(req, res, next) => {
    passport.authenticate('local', (err?: unknown, user?: Express.User | false) => {
        if(err) return next(err);
        if(!user) return res.status(401).json({ message: 'Invalid credentials' });
        req.logIn(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            return res.status(200).json({ message: 'ok' });
            });
        })(req, res, next)
    }, (req, res) => {
    res.send(JSON.stringify({message: "ok"}))
});

AuthRouter.post(
'/logout',
(req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => {
            res.clearCookie('sid');
            res.json({ message: 'Logged out successfully' });
        });
    });
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many registrations. Try again later.' },
});

AuthRouter.post(
'/register',
registerLimiter,
validateBody(registerBodySchema),
async (req, res, next) => {
    const { username, password } = req.body;


    const hashedPassword = bcrypt.hashSync(password, envVars.PASSWORD_HASH_SALT_ROUNDS);


    if(await userRepository.existsBy({displayname: username})){
        res.status(409).json({ message: 'Username is already in use'})
        return;
    }

    const user = await userRepository.create({
        displayname: username,
        password_hash: hashedPassword
    })

    await userRepository.save(user);

    res.status(201).json({ message: 'User registered successfully' });
});

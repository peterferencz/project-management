import {Request, Response, NextFunction, type Express} from 'express';
import session from "express-session"
import passport from "passport"
import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';
import { userRepository } from '../database/db.js';
import { envVars } from '../schemas/EnvVars.js';
import * as z from "zod"
import rateLimit from 'express-rate-limit';
import { validateBody } from './validateRequestBody.js';
import { loginBodySchema, registerBodySchema } from '../schemas/UserAuthSchemas.js';
import { createClient } from 'redis';
import { error, fatal, ServerModule } from '../logger.js';
import { RedisStore } from 'connect-redis';


const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_HASH_SALT_ROUNDS = envVars.PASSWORD_HASH_SALT_ROUNDS
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-hihi', PASSWORD_HASH_SALT_ROUNDS);



function createSessionStore() {
  const client = createClient({ url: envVars.REDIS_URL });
  client.on('error', (err) => error("Redis", err));
  client.connect().catch((err) => {
    fatal("Redis", `Cannot connect to Redis server ${err}`)
  });
  
  return new RedisStore({ client, prefix: 'sess:' });
}

const expressSession = session({
  name: 'sid',
  secret: envVars.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: createSessionStore(),
  cookie: {
    // secure: true
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS
  }
})

const passportInit = passport.initialize()
const passportSession = passport.session()

const useUserAuthMiddleware = (app: Express) => {
  app.use(expressSession)
    
  app.use(passportInit)
  app.use(passportSession)


  registerLoginpath(app)
  registerRegisterpath(app)
}

// Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await userRepository
        .createQueryBuilder('u')
        .addSelect('u.password_hash')
        .where('u.displayname = :username', { username })
        .getOne()

        
      //Compare to an arbitrary hash to mitigate timing attack
      const isMatch = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
        
      if (user == null || !isMatch) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      const {password_hash, ...userStrippedOfHash} = user
      return done(null, {...userStrippedOfHash}, { message: 'Login successful'});
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userRepository.findOneBy({ id: id as number })

    if (user === null) {
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
});


const registerLoginpath = (app: Express) => {
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true, // only failed attempts count
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Try again later.' },
  });

  

  app.post('/api/login',
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

  app.post('/api/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie('sid');
        res.json({ message: 'Logged out successfully' });
      });
    });
  });
}

const registerRegisterpath = (app: Express) => {
  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many registrations. Try again later.' },
  });

  app.post('/api/register',
    registerLimiter,
    validateBody(registerBodySchema),
    async (req, res, next) => {
    const { username, password } = req.body;


    const hashedPassword = await bcrypt.hashSync(password, PASSWORD_HASH_SALT_ROUNDS);


    if(await userRepository.existsBy({displayname: username})){
      res.status(409).json({ message: 'Username is already in use'})
      return;
    }

    // Insert user into MySQL
    const user = await userRepository.create({
      displayname: username,
      password_hash: hashedPassword
    })

    await userRepository.save(user);

    res.status(201).json({ message: 'User registered successfully' });
  });
}


const requireAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) { return next() }
  res.status(401).json({message: "Unauthorized"})
}

export { useUserAuthMiddleware, requireAuthenticated }
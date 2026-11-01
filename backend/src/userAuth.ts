import {Request, Response, NextFunction, type Express} from 'express';
import session from "express-session"
import passport from "passport"
import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';
import { AppDataSource, initDB, userRepository } from './database/db.js';
import { User } from './entities/User.js';



if(!process.env.SESSION_SECRET){
  throw new Error('InvalidConfigurationError - no PORT defined in .env')
}




const expressSession = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
})

const passportInit = passport.initialize()
const passportSession = passport.session()

const useUserAuthMiddleware = (app: Express) => {
    app.use(expressSession)
    app.use(passportInit)
    app.use(passportSession)
}

// Passport Local Strategy
passport.use(
  new LocalStrategy(async (username: string, password: string, callback) => {
    try {
      const user = await userRepository.findOneBy({
        displayname: username
      })

      if (user == null) {
        return callback(null, false, { message: 'Invalid username or password' }); // No username
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return callback(null, false, { message: 'Invalid username or password' });  // Invalid passowrd
      }

      return callback(null, user, { message: 'Login successful'});
    } catch (err) {
      return callback(err);
    }
  })
);

passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: any, done: (err: any, user?: any) => void) => {
  try {
    const user = await userRepository.findOneBy({
      id: id
    })

    if (user === null) {
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const requireAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) { return next() }
  res.status(401).send(JSON.stringify({message: "Unauthorized"}))
}

export { useUserAuthMiddleware, requireAuthenticated }
import 'express';
import { User as UserEntity } from '../entities/User.js';

declare global {
  namespace Express {
    interface User extends UserEntity {}
  }
}


export {};
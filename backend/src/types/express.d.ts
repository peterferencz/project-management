import 'express';
import { UserEntity as UserEntity } from '../entities/UserEntity.js';

declare global {
  namespace Express {
    interface User extends Omit<UserEntity, "password_hash"> {}
  }
}


export {};
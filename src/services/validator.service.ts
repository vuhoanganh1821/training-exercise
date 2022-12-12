import { UserRepository,ProjectUserRepository } from './../repositories';
import {HttpErrors} from '@loopback/rest';
import * as isEmail from 'isemail';
import {Credentials} from '../repositories/index';

export async function validateCredentials(credentials: Credentials, userRepository: UserRepository) {
  if (!isEmail.validate(credentials.email)) {
    throw new HttpErrors.UnprocessableEntity('invalid Email');
  }
  const foundUser = await userRepository.findOne({
    where: {
      email: credentials.email
    }
  });
  if (foundUser) {
    throw new HttpErrors.UnprocessableEntity('This email already exists');
  }
  if (credentials.email.length < 8) {
    throw new HttpErrors.UnprocessableEntity('Email length should be greater than 8')
  }
  if (credentials.password.length < 8) {
    throw new HttpErrors.UnprocessableEntity("Passwordd length should be greater than 8")
  }
}

export async function validateProjectUser(projectUserRepository: ProjectUserRepository, userId: string, projectId: string) {
  const foundProjectUser = await projectUserRepository.findOne({
    where: {
      userId: userId,
      projectId: projectId,
    }
  })
  if (!foundProjectUser) {
    throw new HttpErrors.NotFound('User not found in this project')
  }
  return foundProjectUser
}


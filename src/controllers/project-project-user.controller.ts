import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Project,
  ProjectUser,
} from '../models';
import { User } from '@loopback/authentication-jwt';
import { authenticate } from '@loopback/authentication';
import { validateProjectUser } from '../services';
import { inject } from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import { EUserRole } from '../constants';
import set from 'lodash/set';
import { SecurityBindings } from '@loopback/security';
import { ProjectRepository, ProjectUserRepository } from '../repositories';

@authenticate('jwt')
export class ProjectProjectUserController {
  constructor(
    @repository(ProjectRepository)
    protected projectRepository: ProjectRepository,

    @repository(ProjectUserRepository)
    protected projectUserRepository: ProjectUserRepository,
  ) { }

  @get('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Array of Project has many ProjectUser',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(ProjectUser)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<ProjectUser>,
  ): Promise<ProjectUser[]> {
    return this.projectRepository.projectUsers(id).find(filter);
  }

  @post('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(ProjectUser)}},
      },
    },
  })
  async create(
    @inject(SecurityBindings.USER)
    currentUser: User,
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ProjectUser, {
            title: 'SetUserToProject',
            exclude: ['id', 'projectId']
          }),
        },
      },
    }) projectUser: Omit<ProjectUser, 'id'>,
  ): Promise<ProjectUser> {
    const userId = currentUser?.id
    const projectId = id
    const foundProjectUser = await validateProjectUser(this.projectUserRepository, userId, projectId)
    const currentUserRole = foundProjectUser?.role
    if (currentUserRole == EUserRole.USER) {
      throw new HttpErrors.Unauthorized('You cannot assign')
    }
    set(projectUser, 'projectId', id)
    return this.projectUserRepository.create(projectUser);
  }

  @patch('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Project.ProjectUser PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ProjectUser, {partial: true}),
        },
      },
    })
    projectUser: Partial<ProjectUser>,
    @param.query.object('where', getWhereSchemaFor(ProjectUser)) where?: Where<ProjectUser>,
  ): Promise<Count> {
    return this.projectRepository.projectUsers(id).patch(projectUser, where);
  }

  @del('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Project.ProjectUser DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(ProjectUser)) where?: Where<ProjectUser>,
  ): Promise<Count> {
    return this.projectRepository.projectUsers(id).delete(where);
  }
}

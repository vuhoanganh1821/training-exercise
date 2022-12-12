import { User } from '@loopback/authentication-jwt';
import { authenticate } from '@loopback/authentication';
import { inject } from '@loopback/core';
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
  HttpErrors
} from '@loopback/rest';
import { SecurityBindings } from '@loopback/security';
import {
  Project,
  Task,
} from '../models';
import set from 'lodash/set';
import { ProjectRepository, ProjectUserRepository, UserRepository, TaskRepository } from '../repositories';
import { validateProjectUser } from '../services';
import { EUserRole } from '../constants';

@authenticate('jwt')
export class ProjectTaskController {
  constructor(
    @repository(ProjectRepository)
    protected projectRepository: ProjectRepository,

    @repository(ProjectUserRepository)
    protected projectUserRepository: ProjectUserRepository,

    @repository(UserRepository)
    protected userRepository: UserRepository,

    @repository(TaskRepository)
    protected taskRepository: TaskRepository,
  ) { }

  @get('/projects/{id}/tasks', {
    responses: {
      '200': {
        description: 'Array of Project has many Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Task)},
          },
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER)
    currentUser: User,
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Task>,
  ): Promise<Task[]> {
    const userId = currentUser?.id
    const projectId = id
    const foundProjectUser = await validateProjectUser(this.projectUserRepository, userId, projectId)
    const currentUserRole = foundProjectUser?.role
    if (currentUserRole == EUserRole.USER) {
      return this.projectRepository.tasks(id).find({
        where: {
          projectId,
          isCreatedByAdmin: false
        }
      });
    }
    return this.projectRepository.tasks(id).find(filter);
  }

  @post('/projects/{id}/tasks', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(Task)}},
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
          schema: getModelSchemaRef(Task, {
            title: 'NewTaskInProject',
            exclude: ['id', 'status', 'isCreatedByAdmin', 'createdAt', 'updatedAt', 'projectId', 'userId', 'linkedTo', 'createdBy', 'updatedBy']
          }),
        },
      },
    }) task: Omit<Task, 'id'>,
  ): Promise<Task> {
    const userId = currentUser?.id
    const projectId = id
    const foundProjectUser = await validateProjectUser(this.projectUserRepository, userId, projectId)
    const currentUserRole = foundProjectUser?.role
    set(task, 'isCreatedByAdmin', currentUserRole === EUserRole.ADMIN)
    set(task, 'createdBy', userId)
    set(task, 'updatedBy', userId)
    set(task, 'createdAt', new Date())
    set(task, 'updatedAt', new Date())
    return this.projectRepository.tasks(id).create(task);
  }

  @patch('/projects/{projectId}/tasks/{taskId}', {
    responses: {
      '200': {
        description: 'Project.Task PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @inject(SecurityBindings.USER)
    currentUser: User,
    @param.path.string('projectId') projectId: string,
    @param.path.string('taskId') taskId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            partial: true,
            exclude: ['id', 'isCreatedByAdmin', 'projectId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
          }),
        },
      },
    })
    task: Partial<Task>,
    @param.query.object('where', getWhereSchemaFor(Task)) where?: Where<Task>,
  ): Promise<void> {
    const userId = currentUser?.id
    const foundProjectUser = await validateProjectUser(this.projectUserRepository, userId, projectId)
    const currentUserRole = foundProjectUser?.role
    if (task?.userId) {
      if (currentUserRole == EUserRole.USER) {
        throw new HttpErrors.UnprocessableEntity('You cannot assign task')
      }
      else {
        const foundedUser = await this.userRepository.findById(task.userId)
        if (!foundedUser) {
          throw new HttpErrors.NotFound('Not found user to assign')
        }
      }
    }
    set(task, 'updatedBy', userId)
    set(task, 'updatedAT', new Date())
    await this.taskRepository.updateById(taskId, task)
  }

  @del('/projects/{id}/tasks', {
    responses: {
      '200': {
        description: 'Project.Task DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @inject(SecurityBindings.USER)
    currentUser: User,
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Task)) where?: Where<Task>,
  ): Promise<Count> {
    return this.projectRepository.tasks(id).delete(where);
  }
}

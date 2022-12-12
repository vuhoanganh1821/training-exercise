import { authenticate } from '@loopback/authentication';
import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Task,
  Project,
} from '../models';
import {TaskRepository} from '../repositories';

export class TaskProjectController {
  constructor(
    @repository(TaskRepository)
    public taskRepository: TaskRepository,
  ) { }

  @authenticate('jwt')
  @get('/tasks/{id}/project', {
    responses: {
      '200': {
        description: 'Project belonging to Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Project)},
          },
        },
      },
    },
  })
  async getProject(
    @param.path.string('id') id: typeof Task.prototype.id,
  ): Promise<Project> {
    return this.taskRepository.project(id);
  }
}

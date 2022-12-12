import {Entity, model, property, belongsTo} from '@loopback/repository';
import { EUserRole } from '../constants';
import {Project} from './project.model';
import {User} from './user.model';

@model()
export class ProjectUser extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
    default: EUserRole.USER,
    jsonSchema: {
      enum: Object.values(EUserRole)
    }
  })
  role: EUserRole;

  @belongsTo(() => Project)
  projectId: string;

  @belongsTo(() => User)
  userId: string;

  constructor(data?: Partial<ProjectUser>) {
    super(data);
  }
}

export interface ProjectUserRelations {
  // describe navigational properties here
}

export type ProjectUserWithRelations = ProjectUser & ProjectUserRelations;

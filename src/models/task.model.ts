import {Entity, model, property, belongsTo} from '@loopback/repository';
import { ETaskStatus } from '../constants';
import {Project} from './project.model';
import {User} from './user.model';

@model()
export class Task extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'boolean',
    required: true,
  })
  isCreatedByAdmin: boolean;

  @property({
    type: 'string',
    default: ETaskStatus.TODO,
    jsonSchema: {
      enum: Object.values(ETaskStatus)
    }
  })
  status?: ETaskStatus;

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'date',
  })
  updatedAt?: string;

  @belongsTo(() => Project)
  projectId: string;

  @belongsTo(() => User)
  userId: string;

  @belongsTo(() => Task, {name: 'linked'})
  linkedTo: string;

  @belongsTo(() => User, {name: 'creator'})
  createdBy: string;

  @belongsTo(() => User, {name: 'updater'})
  updatedBy: string;


  constructor(data?: Partial<Task>) {
    super(data);
  }
}

export interface TaskRelations {
  // describe navigational properties here
}

export type TaskWithRelations = Task & TaskRelations;


import type { CollectionSchema } from 'deepspace/schema'

export const athleteEventsSchema: CollectionSchema = {
  name: 'athlete_events',

  columns: [
    {
      name: 'title',
      storage: 'text',
      interpretation: 'plain',
      required: true,
    },
    {
      name: 'day',
      storage: 'text',
      interpretation: 'plain',
      required: true,
    },
    {
      name: 'start',
      storage: 'text',
      interpretation: 'plain',
      required: true,
    },
    {
      name: 'end',
      storage: 'text',
      interpretation: 'plain',
      required: true,
    },
    {
      name: 'type',
      storage: 'text',
      interpretation: {
        kind: 'select',
        options: ['Training', 'Class', 'Assignment', 'Game'],
      },
      required: true,
    },
    {
      name: 'ownerId',
      storage: 'text',
      interpretation: 'plain',
      required: true,
      userBound: true,
      immutable: true,
    },
  ],

  ownerField: 'ownerId',

  permissions: {
    viewer: {
      read: false,
      create: false,
      update: false,
      delete: false,
    },
    member: {
      read: 'own',
      create: true,
      update: 'own',
      delete: 'own',
    },
    admin: {
      read: true,
      create: true,
      update: true,
      delete: true,
    },
  },
}

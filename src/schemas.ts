
import type { CollectionSchema } from 'deepspace/schema'
import { usersSchema } from './schemas/users-schema'
import { settingsSchema } from './schemas/admin-schema'
import { athleteEventsSchema } from './schemas/athlete-events-schema'

import { itemsSchema } from './schemas/items-schema'

export const schemas: CollectionSchema[] = [
  itemsSchema,
  usersSchema,
  settingsSchema,
  athleteEventsSchema,
]

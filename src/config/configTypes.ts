import type { z } from 'zod'

import type { folioConfigSchema } from './configSchema.js'

export type FolioConfig = z.infer<typeof folioConfigSchema>

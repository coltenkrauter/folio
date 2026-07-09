import type { z } from 'zod'

import type { folioConfigSchema, savedPaymentSchema } from './configSchema.js'

export type FolioConfig = z.infer<typeof folioConfigSchema>
export type SavedPayment = z.infer<typeof savedPaymentSchema>

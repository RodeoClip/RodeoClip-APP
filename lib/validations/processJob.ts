import { z } from 'zod'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

export const processJobSchema = z.object({
  fileIds: z.array(z.string().uuid()).min(1).max(10),
  fileNames: z.array(z.string().min(1).max(255)).min(1).max(10).optional(),
  useLogo: z.boolean(),
  muteAudio: z.boolean(),
  textOverlay: z.object({
    text: z.string().min(1).max(200),
    fontSize: z.number().int().min(12).max(200),
    color: z.string().regex(HEX_COLOR_RE, 'Cor deve ser hex (#RRGGBB)'),
    x: z.number().min(0).max(1080),
    y: z.number().min(0).max(1920),
  }).nullable(),
  logoParams: z.object({
    scale: z.number().min(0.1).max(5),
    x: z.number().min(0).max(1080),
    y: z.number().min(0).max(1920),
  }),
  speedMultiplier: z.number().min(0.1).max(100.0),
  stabilize: z.boolean(),
})

export type ProcessJobPayload = z.infer<typeof processJobSchema>

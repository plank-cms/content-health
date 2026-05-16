export type ContentHealthContentTypeConfig = {
  slug: string
  enabled: boolean
  requiredTextFields: string[]
  requiredMediaFields: string[]
  relationFields: string[]
  checkStaleDrafts: boolean
}

export type ContentHealthSettings = {
  contentTypes: ContentHealthContentTypeConfig[]
  staleDraftDays: number
}

export const defaultSettings: ContentHealthSettings = {
  contentTypes: [],
  staleDraftDays: 30,
}

export const defaultChecks = [
  {
    id: 'missing-required-text',
    label: 'Missing required text fields',
    description: 'Detects entries missing any configured text or descriptive fields.',
  },
  {
    id: 'broken-relations',
    label: 'Broken relations',
    description: 'Detects configured relation fields that point to missing records.',
  },
  {
    id: 'stale-drafts',
    label: 'Stale drafts',
    description: 'Detects drafts not updated within the configured time window.',
  },
  {
    id: 'missing-required-media',
    label: 'Missing required media fields',
    description: 'Detects entries missing any configured media or cover-like fields.',
  },
] as const

export type ContentHealthSettings = {
  contentTypeSlugs: string[]
  staleDraftDays: number
}

export const defaultSettings: ContentHealthSettings = {
  contentTypeSlugs: [],
  staleDraftDays: 30,
}

export const defaultChecks = [
  {
    id: 'missing-descriptions',
    label: 'Entries missing descriptions',
    description: 'Detects entries that have no value in the inferred description field.',
  },
  {
    id: 'broken-relations',
    label: 'Broken relations',
    description: 'Detects relation fields that point to non-existing records.',
  },
  {
    id: 'stale-drafts',
    label: 'Stale drafts',
    description: 'Detects draft entries not updated in the configured time window.',
  },
  {
    id: 'missing-covers',
    label: 'Entries missing covers',
    description: 'Detects entries without a value in the inferred cover field.',
  },
] as const

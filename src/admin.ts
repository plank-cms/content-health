import { defaultChecks, defaultSettings, type ContentHealthSettings } from './defaults.js'

export type ContentHealthAdminCheck = {
  id: string
  label: string
  description: string
}

export type ContentHealthAdminField =
  | {
      key: 'contentTypeSlugs'
      type: 'contentTypesMultiSelect'
      label: string
      description: string
      defaultValue: string[]
    }
  | {
      key: 'staleDraftDays'
      type: 'number'
      label: string
      description: string
      min: number
      defaultValue: number
    }

export type ContentHealthAdminModule = {
  addonId: string
  title: string
  description: string
  settingsNamespace: string
  checks: ContentHealthAdminCheck[]
  settings: {
    title: string
    description: string
    fields: ContentHealthAdminField[]
  }
  defaultSettings: ContentHealthSettings
}

export const adminModule: ContentHealthAdminModule = {
  addonId: 'content-health',
  title: 'Content Health',
  description: 'Tracks missing descriptions, broken relations, stale drafts and similar content issues.',
  settingsNamespace: 'addon:content-health',
  checks: [...defaultChecks],
  settings: {
    title: 'Analysis Scope',
    description: 'Choose which collection types are analyzed and how stale drafts are defined.',
    fields: [
      {
        key: 'contentTypeSlugs',
        type: 'contentTypesMultiSelect',
        label: 'Collection types',
        description: 'Only the selected collection types will be scanned by Content Health.',
        defaultValue: defaultSettings.contentTypeSlugs,
      },
      {
        key: 'staleDraftDays',
        type: 'number',
        label: 'Stale draft threshold',
        description: 'Drafts older than this number of days will be flagged as stale.',
        min: 1,
        defaultValue: defaultSettings.staleDraftDays,
      },
    ],
  },
  defaultSettings,
}

export default adminModule

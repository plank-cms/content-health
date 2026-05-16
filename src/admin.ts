import { defaultChecks, defaultSettings, type ContentHealthSettings } from './defaults.js'

export type ContentHealthAdminCheck = {
  id: string
  label: string
  description: string
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
    fields: []
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
    description: 'Choose which collection types are analyzed and explicitly map the fields that should be checked.',
    fields: [],
  },
  defaultSettings,
}

export default adminModule

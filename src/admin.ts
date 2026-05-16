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
  defaultSettings: ContentHealthSettings
  checks: ContentHealthAdminCheck[]
}

export const adminModule: ContentHealthAdminModule = {
  addonId: 'content-health',
  title: 'Content Health',
  description: 'Tracks missing descriptions, broken relations, stale drafts and similar content issues.',
  settingsNamespace: 'addon:content-health',
  defaultSettings,
  checks: [...defaultChecks],
}

export default adminModule

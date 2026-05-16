export type PlankAddonDashboardWidget = {
  id: string
  title: string
  order?: number
}

export type PlankAddonSection = {
  id: string
  title: string
  order?: number
}

export type PlankAddonManifest = {
  id: string
  packageName: string
  name: string
  version: string
  plankRange: string
  description?: string
  settingsNamespace?: string
  slots: {
    dashboardWidgets?: PlankAddonDashboardWidget[]
    addonsSections?: PlankAddonSection[]
  }
  admin?: {
    entry: string
  }
}

export const manifest = {
  id: 'content-health',
  packageName: '@plank-cms/addon-content-health',
  name: 'Content Health',
  version: '0.1.0',
  plankRange: '^0.27.4',
  description: 'Official Plank add-on that surfaces content quality issues across selected collection types.',
  settingsNamespace: 'addon:content-health',
  slots: {
    dashboardWidgets: [
      {
        id: 'content-health.widget',
        title: 'Content Health',
        order: 100,
      },
    ],
    addonsSections: [
      {
        id: 'content-health.section',
        title: 'Content Health',
        order: 100,
      },
    ],
  },
  admin: {
    entry: './dist/browser/admin.js',
  },
} satisfies PlankAddonManifest

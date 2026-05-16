import type { ContentHealthContentTypeConfig, ContentHealthSettings } from './defaults.js'

type ContentType = {
  name: string
  slug: string
  tableName?: string
}

type ContentHealthServerContext = {
  db: {
    query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>
  }
  getSettings: (namespace: string) => Promise<Record<string, string>>
  findAllContentTypes: () => Promise<ContentType[]>
  quoteIdentifier: (value: string) => string
}

type ContentHealthServerModule = {
  runAction: (args: {
    action: string
    input: unknown
    addon: {
      id: string
      packageName: string
      settingsNamespace: string | null
    }
    context: ContentHealthServerContext
  }) => Promise<unknown>
}

type ContentHealthReport = {
  staleDrafts: {
    byContentType: Array<{
      count: number
      name: string
      slug: string
    }>
    total: number
  }
}

function parseSettings(settings: Record<string, string>): ContentHealthSettings {
  const staleDraftDays = Number.parseInt(settings.staleDraftDays ?? '30', 10)
  const contentTypes = (() => {
    try {
      const parsed = JSON.parse(settings.contentTypes ?? '[]')
      if (!Array.isArray(parsed)) return []

      return parsed
        .filter((value): value is Record<string, unknown> => typeof value === 'object' && value !== null)
        .map((value) => ({
          slug: typeof value.slug === 'string' ? value.slug : '',
          enabled: value.enabled !== false,
          requiredTextFields: Array.isArray(value.requiredTextFields)
            ? value.requiredTextFields.filter((field): field is string => typeof field === 'string')
            : [],
          requiredMediaFields: Array.isArray(value.requiredMediaFields)
            ? value.requiredMediaFields.filter((field): field is string => typeof field === 'string')
            : [],
          relationFields: Array.isArray(value.relationFields)
            ? value.relationFields.filter((field): field is string => typeof field === 'string')
            : [],
          checkStaleDrafts: value.checkStaleDrafts !== false,
        }))
        .filter((value): value is ContentHealthContentTypeConfig => value.slug.length > 0)
    } catch {
      return []
    }
  })()

  return {
    contentTypes,
    staleDraftDays: Number.isFinite(staleDraftDays) ? staleDraftDays : 30,
  }
}

async function buildReport(
  settingsNamespace: string,
  context: ContentHealthServerContext,
): Promise<ContentHealthReport> {
  const [rawSettings, contentTypes] = await Promise.all([
    context.getSettings(settingsNamespace),
    context.findAllContentTypes(),
  ])

  const settings = parseSettings(rawSettings)
  const staleDraftTargets = settings.contentTypes.filter(
    (contentType) => contentType.enabled && contentType.checkStaleDrafts,
  )

  const byContentType = await Promise.all(
    staleDraftTargets.map(async (configuredType) => {
      const contentType = contentTypes.find((item) => item.slug === configuredType.slug)
      if (!contentType?.tableName) {
        return {
          count: 0,
          name: contentType?.name ?? configuredType.slug,
          slug: configuredType.slug,
        }
      }

      const quotedTableName = context.quoteIdentifier(contentType.tableName)
      const { rows } = await context.db.query(
        `SELECT COUNT(*)::int AS count
         FROM ${quotedTableName}
         WHERE status = 'draft'
           AND updated_at < NOW() - ($1::int * INTERVAL '1 day')`,
        [settings.staleDraftDays],
      )

      return {
        count: Number(rows[0]?.count ?? 0),
        name: contentType.name,
        slug: contentType.slug,
      }
    }),
  )

  return {
    staleDrafts: {
      byContentType,
      total: byContentType.reduce((sum, item) => sum + item.count, 0),
    },
  }
}

export const serverModule: ContentHealthServerModule = {
  async runAction({ action, addon, context }) {
    if (action !== 'getReport') {
      throw new Error(`Unknown action: ${action}`)
    }

    if (!addon.settingsNamespace) {
      throw new Error('Addon settings namespace is required')
    }

    return buildReport(addon.settingsNamespace, context)
  },
}

export default serverModule

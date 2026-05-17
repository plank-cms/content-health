import type { ContentHealthContentTypeConfig, ContentHealthSettings } from './defaults.js'

type ContentType = {
  fields?: Array<{
    name: string
    type: string
  }>
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
    items: Array<{
      authorAvatarUrl: string | null
      authorName: string
      contentTypeName: string
      contentTypeSlug: string
      entryId: string
      entryLabel: string
      staleDays: number
      updatedAt: string
    }>
    total: number
  }
  missingRequiredText: {
    items: Array<{
      authorAvatarUrl: string | null
      authorName: string
      contentTypeName: string
      contentTypeSlug: string
      entryId: string
      entryLabel: string
      missingFields: string[]
      updatedAt: string
    }>
    total: number
  }
  missingRequiredMedia: {
    items: Array<{
      authorAvatarUrl: string | null
      authorName: string
      contentTypeName: string
      contentTypeSlug: string
      entryId: string
      entryLabel: string
      missingFields: string[]
      updatedAt: string
    }>
    total: number
  }
}

type EntryRow = Record<string, unknown> & {
  id: string
  updated_at: string
  _author_avatar_url: string | null
  _author_first_name: string | null
  _author_last_name: string | null
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
  const missingRequiredTextTargets = settings.contentTypes.filter(
    (contentType) => contentType.enabled && contentType.requiredTextFields.length > 0,
  )
  const missingRequiredMediaTargets = settings.contentTypes.filter(
    (contentType) => contentType.enabled && contentType.requiredMediaFields.length > 0,
  )

  const staleDraftGroups = await Promise.all(
    staleDraftTargets.map(async (configuredType) => {
      const contentType = contentTypes.find((item) => item.slug === configuredType.slug)
      if (!contentType?.tableName) {
        return [] as ContentHealthReport['staleDrafts']['items']
      }

      const quotedTableName = context.quoteIdentifier(contentType.tableName)
      const { rows } = await context.db.query(
        `SELECT
           e.*,
           u.first_name AS _author_first_name,
           u.last_name AS _author_last_name,
           u.avatar_url AS _author_avatar_url
         FROM ${quotedTableName} e
         LEFT JOIN plank_users u ON u.id = e.created_by
         WHERE e.status = 'draft'
           AND e.updated_at < NOW() - ($1::int * INTERVAL '1 day')`,
        [settings.staleDraftDays],
      )

      return (rows as EntryRow[])
        .map((row) => ({
          authorAvatarUrl: row._author_avatar_url,
          authorName: getAuthorName(row),
          contentTypeName: contentType.name,
          contentTypeSlug: contentType.slug,
          entryId: row.id,
          entryLabel: getEntryLabel(row, contentType, configuredType),
          staleDays: getAgeInDays(row.updated_at),
          updatedAt: row.updated_at,
        }))
        .sort(
          (left, right) => new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime(),
        )
    }),
  )

  const missingRequiredTextGroups = await Promise.all(
    missingRequiredTextTargets.map(async (configuredType) => {
      const contentType = contentTypes.find((item) => item.slug === configuredType.slug)
      if (!contentType?.tableName) {
        return [] as ContentHealthReport['missingRequiredText']['items']
      }

      const quotedTableName = context.quoteIdentifier(contentType.tableName)
      const { rows } = await context.db.query(
        `SELECT
           e.*,
           u.first_name AS _author_first_name,
           u.last_name AS _author_last_name,
           u.avatar_url AS _author_avatar_url
         FROM ${quotedTableName} e
         LEFT JOIN plank_users u ON u.id = e.created_by`,
      )

      return (rows as EntryRow[])
        .map((row) => {
          const missingFields = configuredType.requiredTextFields.filter((fieldName) =>
            isMissingTextValue(row[fieldName]),
          )

          if (missingFields.length === 0) return null

          return {
            authorAvatarUrl: row._author_avatar_url,
            authorName: getAuthorName(row),
            contentTypeName: contentType.name,
            contentTypeSlug: contentType.slug,
            entryId: row.id,
            entryLabel: getEntryLabel(row, contentType, configuredType),
            missingFields,
            updatedAt: row.updated_at,
          }
        })
        .filter(
          (
            value,
          ): value is ContentHealthReport['missingRequiredText']['items'][number] => value !== null,
        )
        .sort(
          (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        )
    }),
  )

  const missingRequiredMediaGroups = await Promise.all(
    missingRequiredMediaTargets.map(async (configuredType) => {
      const contentType = contentTypes.find((item) => item.slug === configuredType.slug)
      if (!contentType?.tableName) {
        return [] as ContentHealthReport['missingRequiredMedia']['items']
      }

      const quotedTableName = context.quoteIdentifier(contentType.tableName)
      const { rows } = await context.db.query(
        `SELECT
           e.*,
           u.first_name AS _author_first_name,
           u.last_name AS _author_last_name,
           u.avatar_url AS _author_avatar_url
         FROM ${quotedTableName} e
         LEFT JOIN plank_users u ON u.id = e.created_by`,
      )

      return (rows as EntryRow[])
        .map((row) => {
          const missingFields = configuredType.requiredMediaFields.filter((fieldName) =>
            isMissingMediaValue(row[fieldName]),
          )

          if (missingFields.length === 0) return null

          return {
            authorAvatarUrl: row._author_avatar_url,
            authorName: getAuthorName(row),
            contentTypeName: contentType.name,
            contentTypeSlug: contentType.slug,
            entryId: row.id,
            entryLabel: getEntryLabel(row, contentType, configuredType),
            missingFields,
            updatedAt: row.updated_at,
          }
        })
        .filter(
          (
            value,
          ): value is ContentHealthReport['missingRequiredMedia']['items'][number] => value !== null,
        )
        .sort(
          (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        )
    }),
  )

  const staleDraftItems = staleDraftGroups.flat()
  const missingRequiredTextItems = missingRequiredTextGroups.flat()
  const missingRequiredMediaItems = missingRequiredMediaGroups.flat()

  return {
    staleDrafts: {
      items: staleDraftItems,
      total: staleDraftItems.length,
    },
    missingRequiredText: {
      items: missingRequiredTextItems,
      total: missingRequiredTextItems.length,
    },
    missingRequiredMedia: {
      items: missingRequiredMediaItems,
      total: missingRequiredMediaItems.length,
    },
  }
}

function getAgeInDays(updatedAt: string): number {
  const updated = new Date(updatedAt)
  if (Number.isNaN(updated.getTime())) return 0
  const diff = Date.now() - updated.getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

function getAuthorName(row: EntryRow): string {
  const parts = [row._author_first_name, row._author_last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : 'Unknown author'
}

function getEntryLabel(
  row: EntryRow,
  contentType: ContentType,
  configuredType: ContentHealthContentTypeConfig,
): string {
  const fieldName = getEntryLabelField(contentType, configuredType)
  const value = fieldName ? row[fieldName] : null

  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return row.id
}

function getEntryLabelField(
  contentType: ContentType,
  configuredType: ContentHealthContentTypeConfig,
): string | null {
  const fields = contentType.fields ?? []
  const direct = ['title', 'name', 'entry'].find((name) => fields.some((field) => field.name === name))
  if (direct) return direct

  const configured = configuredType.requiredTextFields.find((name) =>
    fields.some((field) => field.name === name),
  )
  if (configured) return configured

  const uidField = fields.find((field) => field.type === 'uid')
  if (uidField) return uidField.name

  const stringField = fields.find((field) => ['string', 'text', 'richtext'].includes(field.type))
  return stringField?.name ?? null
}

function isMissingTextValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

function isMissingMediaValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) {
    return value.filter((item) => String(item ?? '').trim().length > 0).length === 0
  }
  return false
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

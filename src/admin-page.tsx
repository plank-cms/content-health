import * as React from 'react'

type ContentFieldType =
  | 'string'
  | 'text'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'media'
  | 'media-gallery'
  | 'relation'
  | 'uid'
  | 'array'
  | 'navigation'

type ContentField = {
  name: string
  type: ContentFieldType
  relatedSlug?: string
}

type ContentType = {
  fields?: ContentField[]
  slug: string
  name: string
  kind: 'collection' | 'single'
}

type ContentHealthContentTypeConfig = {
  slug: string
  enabled: boolean
  requiredTextFields: string[]
  requiredMediaFields: string[]
  relationFields: string[]
  checkStaleDrafts: boolean
}

type ContentHealthSettings = {
  contentTypes: ContentHealthContentTypeConfig[]
  staleDraftDays: number
}

type AdminAddonRuntimeProps = {
  definition: {
    title: string
    description: string
    checks: Array<{
      id: string
      label: string
      description: string
    }>
  }
  settings: Record<string, string>
  contentTypes: ContentType[]
  runAction: <T = unknown>(action: string, input?: unknown) => Promise<T>
  saveSettings: (values: Record<string, string>) => Promise<Record<string, string>>
}

type AdminAddonRuntimeModule = {
  addonId: string
  DashboardPage?: React.ComponentType<AdminAddonRuntimeProps>
  AdminPage?: React.ComponentType<AdminAddonRuntimeProps>
}

type StaleDraftItem = {
  authorAvatarUrl: string | null
  authorName: string
  contentTypeName: string
  contentTypeSlug: string
  entryId: string
  entryLabel: string
  staleDays: number
  updatedAt: string
}

type MissingRequiredTextItem = {
  authorAvatarUrl: string | null
  authorName: string
  contentTypeName: string
  contentTypeSlug: string
  entryId: string
  entryLabel: string
  missingFields: string[]
  updatedAt: string
}

type ContentHealthReport = {
  staleDrafts: {
    items: StaleDraftItem[]
    total: number
  }
  missingRequiredText: {
    items: MissingRequiredTextItem[]
    total: number
  }
  missingRequiredMedia: {
    items: MissingRequiredTextItem[]
    total: number
  }
}

declare global {
  interface Window {
    PlankAddonAdminModules?: Record<string, AdminAddonRuntimeModule>
  }
}

const TEXT_FIELD_TYPES = new Set<ContentFieldType>(['string', 'text', 'richtext', 'uid'])
const MEDIA_FIELD_TYPES = new Set<ContentFieldType>(['media', 'media-gallery'])
const RELATION_FIELD_TYPES = new Set<ContentFieldType>(['relation'])

const colors = {
  background: 'var(--color-background)',
  foreground: 'var(--color-foreground)',
  muted: 'var(--color-muted-foreground)',
  border: 'var(--color-border)',
  input: 'var(--color-input)',
  warning: '#facc15',
  warningText: '#fde68a',
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
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
        .filter((value) => value.slug.length > 0)
    } catch {
      return []
    }
  })()

  return {
    contentTypes,
    staleDraftDays: Number.isFinite(staleDraftDays) ? staleDraftDays : 30,
  }
}

function cardStyle(padding = 24): React.CSSProperties {
  return {
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding,
  }
}

function smallLabelStyle(): React.CSSProperties {
  return {
    color: colors.muted,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }
}

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    alignItems: 'center',
    background: colors.foreground,
    border: `1px solid ${colors.foreground}`,
    borderRadius: 10,
    color: colors.background,
    cursor: disabled ? 'default' : 'pointer',
    display: 'inline-flex',
    fontSize: 14,
    fontWeight: 600,
    gap: 8,
    height: 40,
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    padding: '0 16px',
  }
}

function miniActionButtonStyle(): React.CSSProperties {
  return {
    alignItems: 'center',
    background: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.foreground,
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: 14,
    fontWeight: 600,
    height: 28,
    justifyContent: 'center',
    width: 28,
  }
}

function tableCellStyle(align: 'left' | 'center' | 'right' = 'left'): React.CSSProperties {
  return {
    borderTop: `1px solid ${colors.border}`,
    color: colors.foreground,
    fontSize: 14,
    padding: '14px 16px',
    textAlign: align,
    verticalAlign: 'middle',
  }
}

function StatCard({
  hint,
  label,
  value,
}: {
  hint: string
  label: string
  value: number | string
}) {
  return (
    <div style={cardStyle(24)}>
      <div
        style={{
          color: colors.foreground,
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ color: colors.foreground, fontSize: 38, fontWeight: 700, marginTop: 14 }}>
        {value}
      </div>
      <div style={{ color: colors.muted, fontSize: 14, marginTop: 10 }}>{hint}</div>
    </div>
  )
}

function SectionTitle({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <h2 style={{ color: colors.foreground, fontSize: 20, fontWeight: 600, margin: 0 }}>
        {title}
      </h2>
      <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
        {description}
      </p>
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        alignItems: 'center',
        background: checked ? colors.foreground : colors.input,
        border: 'none',
        borderRadius: 999,
        cursor: 'pointer',
        display: 'inline-flex',
        height: 22,
        padding: 3,
        position: 'relative',
        transition: 'background 160ms ease',
        width: 40,
      }}
    >
      <span
        style={{
          background: checked ? colors.background : colors.foreground,
          borderRadius: 999,
          display: 'block',
          height: 16,
          transform: checked ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 160ms ease',
          width: 16,
        }}
      />
    </button>
  )
}

function FieldBucket({
  configured,
  fields,
  label,
  onAdd,
  onRemove,
}: {
  configured: string[]
  fields: ContentField[]
  label: string
  onAdd: (fieldName: string) => void
  onRemove: (fieldName: string) => void
}) {
  const configuredFields = configured
    .map((fieldName) => fields.find((field) => field.name === fieldName))
    .filter((field): field is ContentField => Boolean(field))

  const availableFields = fields.filter((field) => !configured.includes(field.name))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ color: colors.foreground, fontSize: 15, fontWeight: 600 }}>{label}</div>

      <div
        style={{
          display: 'grid',
          gap: 16,
          alignItems: 'start',
          gridTemplateColumns: availableFields.length > 0 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
        }}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <p style={{ ...smallLabelStyle(), margin: 0 }}>Configured</p>
          {configuredFields.length > 0 ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {configuredFields.map((field) => (
                <div
                  key={field.name}
                  style={{
                    alignItems: 'center',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    color: colors.foreground,
                    display: 'flex',
                    gap: 10,
                    height: 56,
                    padding: '10px 12px',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                    {humanize(field.name)}
                  </span>
                  <span style={{ color: colors.muted, fontSize: 12 }}>{field.type}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(field.name)}
                    style={miniActionButtonStyle()}
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                border: `1px dashed ${colors.border}`,
                borderRadius: 10,
                color: colors.muted,
                fontSize: 14,
                padding: '12px 14px',
              }}
            >
              No fields configured.
            </div>
          )}
        </div>

        {availableFields.length > 0 && (
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ ...smallLabelStyle(), margin: 0 }}>Available</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {availableFields.map((field) => (
                <div
                  key={field.name}
                  style={{
                    alignItems: 'center',
                    border: `1px dashed ${colors.border}`,
                    borderRadius: 10,
                    color: colors.muted,
                    display: 'flex',
                    gap: 10,
                    height: 56,
                    padding: '10px 12px',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 14 }}>{humanize(field.name)}</span>
                  <span style={{ fontSize: 12 }}>{field.type}</span>
                  <button
                    type="button"
                    onClick={() => onAdd(field.name)}
                    style={miniActionButtonStyle()}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function buildEmptyConfig(slug: string): ContentHealthContentTypeConfig {
  return {
    slug,
    enabled: true,
    requiredTextFields: [],
    requiredMediaFields: [],
    relationFields: [],
    checkStaleDrafts: true,
  }
}

function getEntryLabelField(
  contentType: ContentType,
  config?: ContentHealthContentTypeConfig,
): string | null {
  const fields = contentType.fields ?? []
  const direct = ['title', 'name', 'entry'].find((name) => fields.some((field) => field.name === name))
  if (direct) return direct

  const configured = config?.requiredTextFields.find((name) =>
    fields.some((field) => field.name === name),
  )
  if (configured) return configured

  const uidField = fields.find((field) => field.type === 'uid')
  if (uidField) return uidField.name

  const stringField = fields.find((field) => ['string', 'text', 'richtext'].includes(field.type))
  return stringField?.name ?? null
}

function getAuthorInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '')
  return initials.join('') || '?'
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function DashboardPage({ runAction, settings }: AdminAddonRuntimeProps) {
  const [report, setReport] = React.useState<ContentHealthReport | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    setLoading(true)

    runAction<ContentHealthReport>('getReport')
      .then((nextReport) => {
        if (!active) return
        setReport(nextReport)
      })
      .catch(() => {
        if (active) setReport(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [runAction, settings])

  const staleDraftItems = report?.staleDrafts.items ?? []
  const missingRequiredTextItems = report?.missingRequiredText.items ?? []
  const missingRequiredMediaItems = report?.missingRequiredMedia.items ?? []

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={cardStyle(24)}>
        <div
          style={{
            alignItems: 'center',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            gap: 16,
            justifyContent: 'space-between',
            margin: '-24px -24px 0',
            padding: '20px 24px',
          }}
        >
          <SectionTitle
            title="Stale Draft Findings"
            description="Review every stale draft across the monitored collection types, ordered from the oldest update to the most recent one."
          />
          <div
            style={{
              alignSelf: 'flex-start',
              color: colors.foreground,
              fontSize: 16,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '...' : `${staleDraftItems.length} stale drafts`}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div style={{ color: colors.muted, fontSize: 14 }}>Loading stale drafts...</div>
          ) : staleDraftItems.length === 0 ? (
            <div style={{ color: colors.muted, fontSize: 14 }}>
              No stale drafts match the current threshold.
            </div>
          ) : (
            <div
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Entry</th>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Collection Type</th>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Last Updated</th>
                    <th style={{ ...tableCellStyle('center'), ...smallLabelStyle(), borderTop: 'none' }}>Author</th>
                  </tr>
                </thead>
                <tbody>
                  {staleDraftItems.map((item) => (
                    <tr key={`${item.contentTypeSlug}:${item.entryId}`}>
                      <td style={tableCellStyle()}>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <a
                            href={`/admin/content/${item.contentTypeSlug}/${item.entryId}`}
                            style={{
                              color: colors.foreground,
                              fontSize: 14,
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            {item.entryLabel}
                          </a>
                          <span style={{ color: colors.warningText, fontSize: 12 }}>
                            Stale for {item.staleDays} {item.staleDays === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      </td>
                      <td style={tableCellStyle()}>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <span style={{ fontWeight: 600 }}>{item.contentTypeName}</span>
                          <span style={{ color: colors.muted, fontSize: 12 }}>{item.contentTypeSlug}</span>
                        </div>
                      </td>
                      <td style={tableCellStyle()}>
                        <span style={{ color: colors.muted }}>{formatDateTime(item.updatedAt)}</span>
                      </td>
                      <td style={tableCellStyle('center')}>
                        <div
                          title={item.authorName}
                          style={{
                            alignItems: 'center',
                            display: 'inline-flex',
                            justifyContent: 'center',
                          }}
                        >
                          {item.authorAvatarUrl ? (
                            <img
                              src={item.authorAvatarUrl}
                              alt={item.authorName}
                              style={{
                                borderRadius: 999,
                                display: 'block',
                                height: 30,
                                objectFit: 'cover',
                                width: 30,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                alignItems: 'center',
                                background: colors.input,
                                borderRadius: 999,
                                color: colors.foreground,
                                display: 'inline-flex',
                                fontSize: 11,
                                fontWeight: 700,
                                height: 30,
                                justifyContent: 'center',
                                width: 30,
                              }}
                            >
                              {getAuthorInitials(item.authorName)}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div style={cardStyle(24)}>
        <div
          style={{
            alignItems: 'center',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            gap: 16,
            justifyContent: 'space-between',
            margin: '-24px -24px 0',
            padding: '20px 24px',
          }}
        >
          <SectionTitle
            title="Missing Required Text"
            description="Review entries missing one or more configured text fields across the monitored collection types."
          />
          <div
            style={{
              alignSelf: 'flex-start',
              color: colors.foreground,
              fontSize: 16,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '...' : `${missingRequiredTextItems.length} issues`}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div style={{ color: colors.muted, fontSize: 14 }}>Loading missing fields...</div>
          ) : missingRequiredTextItems.length === 0 ? (
            <div style={{ color: colors.muted, fontSize: 14 }}>
              No entries are currently missing configured text fields.
            </div>
          ) : (
            <div
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Entry</th>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Collection Type</th>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Missing Fields</th>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Last Updated</th>
                    <th style={{ ...tableCellStyle('center'), ...smallLabelStyle(), borderTop: 'none' }}>Author</th>
                  </tr>
                </thead>
                <tbody>
                  {missingRequiredTextItems.map((item) => (
                    <tr key={`${item.contentTypeSlug}:${item.entryId}:missing-text`}>
                      <td style={tableCellStyle()}>
                        <a
                          href={`/admin/content/${item.contentTypeSlug}/${item.entryId}`}
                          style={{
                            color: colors.foreground,
                            fontSize: 14,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          {item.entryLabel}
                        </a>
                      </td>
                      <td style={tableCellStyle()}>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <span style={{ fontWeight: 600 }}>{item.contentTypeName}</span>
                          <span style={{ color: colors.muted, fontSize: 12 }}>{item.contentTypeSlug}</span>
                        </div>
                      </td>
                      <td style={tableCellStyle()}>
                        <span style={{ color: colors.warningText, fontSize: 13 }}>
                          {item.missingFields.map(humanize).join(', ')}
                        </span>
                      </td>
                      <td style={tableCellStyle()}>
                        <span style={{ color: colors.muted }}>{formatDateTime(item.updatedAt)}</span>
                      </td>
                      <td style={tableCellStyle('center')}>
                        <div
                          title={item.authorName}
                          style={{
                            alignItems: 'center',
                            display: 'inline-flex',
                            justifyContent: 'center',
                          }}
                        >
                          {item.authorAvatarUrl ? (
                            <img
                              src={item.authorAvatarUrl}
                              alt={item.authorName}
                              style={{
                                borderRadius: 999,
                                display: 'block',
                                height: 30,
                                objectFit: 'cover',
                                width: 30,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                alignItems: 'center',
                                background: colors.input,
                                borderRadius: 999,
                                color: colors.foreground,
                                display: 'inline-flex',
                                fontSize: 11,
                                fontWeight: 700,
                                height: 30,
                                justifyContent: 'center',
                                width: 30,
                              }}
                            >
                              {getAuthorInitials(item.authorName)}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div style={cardStyle(24)}>
        <div
          style={{
            alignItems: 'center',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            gap: 16,
            justifyContent: 'space-between',
            margin: '-24px -24px 0',
            padding: '20px 24px',
          }}
        >
          <SectionTitle
            title="Missing Required Media"
            description="Review entries missing one or more configured media fields across the monitored collection types."
          />
          <div
            style={{
              alignSelf: 'flex-start',
              color: colors.foreground,
              fontSize: 16,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '...' : `${missingRequiredMediaItems.length} issues`}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div style={{ color: colors.muted, fontSize: 14 }}>Loading missing media...</div>
          ) : missingRequiredMediaItems.length === 0 ? (
            <div style={{ color: colors.muted, fontSize: 14 }}>
              No entries are currently missing configured media fields.
            </div>
          ) : (
            <div
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Entry</th>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Collection Type</th>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Missing Fields</th>
                    <th style={{ ...tableCellStyle(), ...smallLabelStyle(), borderTop: 'none' }}>Last Updated</th>
                    <th style={{ ...tableCellStyle('center'), ...smallLabelStyle(), borderTop: 'none' }}>Author</th>
                  </tr>
                </thead>
                <tbody>
                  {missingRequiredMediaItems.map((item) => (
                    <tr key={`${item.contentTypeSlug}:${item.entryId}:missing-media`}>
                      <td style={tableCellStyle()}>
                        <a
                          href={`/admin/content/${item.contentTypeSlug}/${item.entryId}`}
                          style={{
                            color: colors.foreground,
                            fontSize: 14,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          {item.entryLabel}
                        </a>
                      </td>
                      <td style={tableCellStyle()}>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <span style={{ fontWeight: 600 }}>{item.contentTypeName}</span>
                          <span style={{ color: colors.muted, fontSize: 12 }}>{item.contentTypeSlug}</span>
                        </div>
                      </td>
                      <td style={tableCellStyle()}>
                        <span style={{ color: colors.warningText, fontSize: 13 }}>
                          {item.missingFields.map(humanize).join(', ')}
                        </span>
                      </td>
                      <td style={tableCellStyle()}>
                        <span style={{ color: colors.muted }}>{formatDateTime(item.updatedAt)}</span>
                      </td>
                      <td style={tableCellStyle('center')}>
                        <div
                          title={item.authorName}
                          style={{
                            alignItems: 'center',
                            display: 'inline-flex',
                            justifyContent: 'center',
                          }}
                        >
                          {item.authorAvatarUrl ? (
                            <img
                              src={item.authorAvatarUrl}
                              alt={item.authorName}
                              style={{
                                borderRadius: 999,
                                display: 'block',
                                height: 30,
                                objectFit: 'cover',
                                width: 30,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                alignItems: 'center',
                                background: colors.input,
                                borderRadius: 999,
                                color: colors.foreground,
                                display: 'inline-flex',
                                fontSize: 11,
                                fontWeight: 700,
                                height: 30,
                                justifyContent: 'center',
                                width: 30,
                              }}
                            >
                              {getAuthorInitials(item.authorName)}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AdminPage({ contentTypes, saveSettings, settings }: AdminAddonRuntimeProps) {
  const collectionTypes = React.useMemo(
    () => contentTypes.filter((contentType) => contentType.kind === 'collection'),
    [contentTypes],
  )

  const initial = React.useMemo(() => parseSettings(settings), [settings])
  const [configuredTypes, setConfiguredTypes] = React.useState<ContentHealthContentTypeConfig[]>(
    initial.contentTypes,
  )
  const [staleDraftDays, setStaleDraftDays] = React.useState(initial.staleDraftDays)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setConfiguredTypes(initial.contentTypes)
    setStaleDraftDays(initial.staleDraftDays)
  }, [initial])

  const configuredCount = configuredTypes.length
  const configuredFieldCount = configuredTypes.reduce(
    (total, config) =>
      total
      + config.requiredTextFields.length
      + config.requiredMediaFields.length
      + config.relationFields.length,
    0,
  )

  const configuredMap = React.useMemo(
    () => new Map(configuredTypes.map((contentType) => [contentType.slug, contentType])),
    [configuredTypes],
  )

  function addContentType(slug: string) {
    setConfiguredTypes((current) => {
      if (current.some((contentType) => contentType.slug === slug)) return current
      return [...current, buildEmptyConfig(slug)]
    })
  }

  function removeContentType(slug: string) {
    setConfiguredTypes((current) => current.filter((contentType) => contentType.slug !== slug))
  }

  function patchContentType(
    slug: string,
    updater: (current: ContentHealthContentTypeConfig) => ContentHealthContentTypeConfig,
  ) {
    setConfiguredTypes((current) =>
      current.map((contentType) =>
        contentType.slug === slug ? updater(contentType) : contentType,
      ),
    )
  }

  function addField(
    slug: string,
    key: 'requiredTextFields' | 'requiredMediaFields' | 'relationFields',
    fieldName: string,
  ) {
    patchContentType(slug, (current) => ({
      ...current,
      [key]: current[key].includes(fieldName) ? current[key] : [...current[key], fieldName],
    }))
  }

  function removeField(
    slug: string,
    key: 'requiredTextFields' | 'requiredMediaFields' | 'relationFields',
    fieldName: string,
  ) {
    patchContentType(slug, (current) => ({
      ...current,
      [key]: current[key].filter((value) => value !== fieldName),
    }))
  }

  async function handleSave() {
    setSaving(true)

    try {
      await saveSettings({
        contentTypes: JSON.stringify(configuredTypes),
        staleDraftDays: String(staleDraftDays),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        }}
      >
        <StatCard
          label="Collections"
          value={configuredCount}
          hint="Collection types included in analysis"
        />
        <StatCard
          label="Mapped Fields"
          value={configuredFieldCount}
          hint="Fields checked across configured types"
        />
      </div>

      <div
        style={{
          ...cardStyle(24),
          alignItems: 'center',
          display: 'flex',
          gap: 16,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <h2 style={{ color: colors.foreground, fontSize: 18, fontWeight: 600, margin: 0 }}>
            Configuration
          </h2>
          <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>
            Map the exact fields that Content Health should validate for each collection type.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={primaryButtonStyle(saving)}
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>

      <div style={cardStyle(24)}>
        <SectionTitle
          title="Global Threshold"
          description="This value is used for every collection type that has stale draft checks enabled."
        />

        <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
          <div style={{ color: colors.foreground, fontSize: 14, fontWeight: 600 }}>
            Stale draft threshold
          </div>
          <input
            type="number"
            min={1}
            value={staleDraftDays}
            onChange={(event) => setStaleDraftDays(Number.parseInt(event.target.value, 10) || 1)}
            style={{
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              color: colors.foreground,
              fontSize: 14,
              height: 42,
              maxWidth: 240,
              padding: '0 12px',
            }}
          />
          <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Drafts older than this number of days will be reported as stale.
          </p>
        </div>
      </div>

      <div style={cardStyle(24)}>
        <SectionTitle
          title="Analysis Scope"
          description="Choose which collection types participate in Content Health and add the fields that should be checked."
        />

        <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ ...smallLabelStyle(), margin: 0 }}>Enabled collection types</p>
            {configuredTypes.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gap: 8,
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                }}
              >
                {configuredTypes.map((contentType) => {
                  const definition = collectionTypes.find((item) => item.slug === contentType.slug)
                  return (
                    <div
                      key={contentType.slug}
                      style={{
                        alignItems: 'center',
                        border: `1px solid ${colors.border}`,
                        borderRadius: 10,
                        color: colors.foreground,
                        display: 'flex',
                        gap: 10,
                        minHeight: 44,
                        padding: '10px 12px',
                      }}
                    >
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                        {definition?.name ?? humanize(contentType.slug)}
                      </span>
                      <span style={{ color: colors.muted, fontSize: 12 }}>{contentType.slug}</span>
                      <button
                        type="button"
                        onClick={() => removeContentType(contentType.slug)}
                        style={miniActionButtonStyle()}
                      >
                        -
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div
                style={{
                  border: `1px dashed ${colors.border}`,
                  borderRadius: 10,
                  color: colors.muted,
                  fontSize: 14,
                  padding: '12px 14px',
                }}
              >
                No collection types enabled yet.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ ...smallLabelStyle(), margin: 0 }}>Available collection types</p>
            <div
              style={{
                display: 'grid',
                gap: 8,
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              }}
            >
              {collectionTypes
                .filter((contentType) => !configuredMap.has(contentType.slug))
                .map((contentType) => (
                  <div
                    key={contentType.slug}
                    style={{
                      alignItems: 'center',
                      border: `1px dashed ${colors.border}`,
                      borderRadius: 10,
                      color: colors.muted,
                      display: 'flex',
                      gap: 10,
                      minHeight: 44,
                      padding: '10px 12px',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 14 }}>{contentType.name}</span>
                    <span style={{ fontSize: 12 }}>{contentType.slug}</span>
                    <button
                      type="button"
                      onClick={() => addContentType(contentType.slug)}
                      style={miniActionButtonStyle()}
                    >
                      +
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {configuredTypes.map((contentTypeConfig) => {
        const contentType = collectionTypes.find((item) => item.slug === contentTypeConfig.slug)
        const fields = contentType?.fields ?? []
        const textFields = fields.filter((field) => TEXT_FIELD_TYPES.has(field.type))
        const mediaFields = fields.filter((field) => MEDIA_FIELD_TYPES.has(field.type))
        const relationFields = fields.filter((field) => RELATION_FIELD_TYPES.has(field.type))

        return (
          <div key={contentTypeConfig.slug} style={cardStyle(24)}>
            <div
              style={{
                alignItems: 'flex-start',
                display: 'flex',
                gap: 24,
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <h3 style={{ color: colors.foreground, fontSize: 20, fontWeight: 600, margin: 0 }}>
                  {contentType?.name ?? humanize(contentTypeConfig.slug)}
                </h3>
                <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>
                  {contentTypeConfig.slug}
                </p>
              </div>

              <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
                <span style={{ color: colors.muted, fontSize: 14 }}>Check stale drafts</span>
                <ToggleSwitch
                  checked={contentTypeConfig.checkStaleDrafts}
                  onChange={(next) =>
                    patchContentType(contentTypeConfig.slug, (current) => ({
                      ...current,
                      checkStaleDrafts: next,
                    }))
                  }
                />
              </div>
            </div>

            <div style={{ display: 'grid', gap: 24, marginTop: 24 }}>
              <FieldBucket
                label="Required text fields"
                fields={textFields}
                configured={contentTypeConfig.requiredTextFields}
                onAdd={(fieldName) => addField(contentTypeConfig.slug, 'requiredTextFields', fieldName)}
                onRemove={(fieldName) =>
                  removeField(contentTypeConfig.slug, 'requiredTextFields', fieldName)
                }
              />

              <FieldBucket
                label="Required media fields"
                fields={mediaFields}
                configured={contentTypeConfig.requiredMediaFields}
                onAdd={(fieldName) => addField(contentTypeConfig.slug, 'requiredMediaFields', fieldName)}
                onRemove={(fieldName) =>
                  removeField(contentTypeConfig.slug, 'requiredMediaFields', fieldName)
                }
              />

              <FieldBucket
                label="Relation fields to validate"
                fields={relationFields}
                configured={contentTypeConfig.relationFields}
                onAdd={(fieldName) => addField(contentTypeConfig.slug, 'relationFields', fieldName)}
                onRemove={(fieldName) =>
                  removeField(contentTypeConfig.slug, 'relationFields', fieldName)
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const runtimeModule: AdminAddonRuntimeModule = {
  addonId: 'content-health',
  DashboardPage,
  AdminPage,
}

window.PlankAddonAdminModules = window.PlankAddonAdminModules ?? {}
window.PlankAddonAdminModules['content-health'] = runtimeModule

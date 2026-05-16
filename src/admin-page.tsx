import * as React from 'react'

type AdminAddonRuntimeProps = {
  addon: {
    id: string
    name: string
  }
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
  contentTypes: Array<{
    slug: string
    name: string
    kind: 'collection' | 'single'
  }>
  saveSettings: (values: Record<string, string>) => Promise<Record<string, string>>
}

type AdminAddonRuntimeModule = {
  addonId: string
  AdminPage: React.ComponentType<AdminAddonRuntimeProps>
}

declare global {
  interface Window {
    PlankAddonAdminModules?: Record<string, AdminAddonRuntimeModule>
  }
}

function parseSettings(settings: Record<string, string>) {
  const contentTypeSlugs = (() => {
    try {
      const parsed = JSON.parse(settings.contentTypeSlugs ?? '[]')
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
    } catch {
      return []
    }
  })()

  const staleDraftDays = Number.parseInt(settings.staleDraftDays ?? '30', 10)

  return {
    contentTypeSlugs,
    staleDraftDays: Number.isFinite(staleDraftDays) ? staleDraftDays : 30,
  }
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint: string
}) {
  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{hint}</div>
    </div>
  )
}

function SectionTitle({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function AdminPage({ definition, settings, contentTypes, saveSettings }: AdminAddonRuntimeProps) {
  const collectionTypes = React.useMemo(
    () => contentTypes.filter((contentType) => contentType.kind === 'collection'),
    [contentTypes],
  )

  const initial = React.useMemo(() => parseSettings(settings), [settings])
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(initial.contentTypeSlugs)
  const [staleDraftDays, setStaleDraftDays] = React.useState(initial.staleDraftDays)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setSelectedTypes(initial.contentTypeSlugs)
    setStaleDraftDays(initial.staleDraftDays)
  }, [initial])

  async function handleSave() {
    setSaving(true)

    try {
      await saveSettings({
        contentTypeSlugs: JSON.stringify(selectedTypes),
        staleDraftDays: String(staleDraftDays),
      })
    } finally {
      setSaving(false)
    }
  }

  function toggleContentType(slug: string, checked: boolean) {
    setSelectedTypes((current) =>
      checked ? [...current, slug] : current.filter((value) => value !== slug),
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Checks"
          value={definition.checks.length}
          hint="Configured issue detectors"
        />
        <StatCard
          label="Collections"
          value={selectedTypes.length}
          hint="Collection types included in analysis"
        />
        <StatCard
          label="Draft Window"
          value={`${staleDraftDays}d`}
          hint="Entries older than this count as stale"
        />
      </div>

      <div className="rounded-xl border bg-background p-6">
        <SectionTitle
          title="Analysis Scope"
          description="Choose what Content Health should analyze in this Plank instance."
        />

        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Collection types</div>
            <div className="grid gap-3 md:grid-cols-2">
              {collectionTypes.length > 0 ? collectionTypes.map((contentType) => (
                <label
                  key={contentType.slug}
                  className="flex items-start gap-3 rounded-lg border bg-background px-4 py-4"
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-white"
                    checked={selectedTypes.includes(contentType.slug)}
                    onChange={(event) => toggleContentType(contentType.slug, event.target.checked)}
                  />
                  <div>
                    <div className="font-medium text-foreground">{contentType.name}</div>
                    <div className="text-xs text-muted-foreground">{contentType.slug}</div>
                  </div>
                </label>
              )) : (
                <div className="rounded-lg border bg-background px-4 py-4 text-sm text-muted-foreground">
                  No collection types available.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Stale draft threshold</div>
            <input
              type="number"
              min={1}
              value={staleDraftDays}
              onChange={(event) => setStaleDraftDays(Number.parseInt(event.target.value, 10) || 1)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none ring-0 md:max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Drafts older than this number of days will be reported as stale.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium text-foreground transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-background p-6">
        <SectionTitle
          title="Enabled Checks"
          description={definition.description}
        />

        <div className="mt-6 grid gap-3">
          {definition.checks.map((check) => (
            <div key={check.id} className="rounded-lg border bg-background px-4 py-4">
              <div className="font-medium text-foreground">{check.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{check.description}</div>
              <div className="mt-3 text-xs text-muted-foreground">{check.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const runtimeModule: AdminAddonRuntimeModule = {
  addonId: 'content-health',
  AdminPage,
}

window.PlankAddonAdminModules = window.PlankAddonAdminModules ?? {}
window.PlankAddonAdminModules['content-health'] = runtimeModule


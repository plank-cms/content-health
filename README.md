# Plank Content Health (add-on)

Official Plank add-on for tracking content quality issues across selected collection types.

## Requirements

- Plank `>=0.28.0 <1.0.0`

## Installation

Install the add-on in your Plank project:

```bash
pnpm add @plank-cms/addon-content-health
```

Restart Plank after installing the package so the add-on can be discovered and registered.

## Enable The Add-on

Once your instance is running:

1. Open `Admin > Add-ons`
2. Enable `Content Health`
3. Open the add-on and configure the collection types you want to monitor

## What It Does

Content Health currently helps you track:

- stale drafts
- missing required text fields
- missing required media fields

The add-on provides:

- a `Dashboard` tab with findings and metrics
- an `Admin` tab for configuration
- contextual indicators in `Entries`

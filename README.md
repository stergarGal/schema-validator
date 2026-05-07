# Schema Validator

A QA tool for validating JSON-LD and JSON schemas on any URL. Paste your expected schema, point it at a page, and get an annotated diff showing exactly what's missing, wrong, or extra.

## Features

- Extracts JSON-LD schemas from any URL (including `@graph` arrays)
- Supports Basic Auth and `skipAuth` user-agent for staging environments
- Order-independent array comparison (matches objects by key fields and similarity)
- Three-panel report: **Expected** | **Actual** | **Annotated Actual** with inline comments
- Copy report as styled HTML — pastes cleanly into Google Docs

## Setup

**Requirements:** Node.js 18+

```bash
git clone https://github.com/stergarGal/schema-validator.git
cd schema-validator
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

For development with auto-reload:

```bash
npm run dev
```

## How to Use

### 1. Enter a URL

Paste the page or API endpoint you want to validate into the **Page or API endpoint** field. Press Enter or click **Fetch & Validate**.

### 2. Add Auth (optional)

If the URL is behind Basic Auth, click **+ Add Basic Auth credentials** and enter your username and password.

> All requests also send `User-Agent: SchemaValidator/1.0 skipAuth`, which can be used to bypass auth middleware on staging environments without credentials.

### 3. Paste Your Expected Schema

In the **Expected Schema** textarea, paste the JSON or JSON-LD you expect the page to have. This can be:

- A single schema object: `{ "@type": "Product", "name": "Widget" }`
- An array of schemas: `[{ "@type": "Product", ... }, { "@type": "BreadcrumbList", ... }]`

If you paste an array, each item is automatically matched to the extracted schema with the same `@type`.

### 4. Read the Report

The report shows three panels side by side:

| Panel | Description |
|---|---|
| **Expected** | Your expected schema, as-is |
| **Actual** | The schema extracted from the page, as-is |
| **Annotated Actual** | The actual schema with issues highlighted inline |

In the **Annotated Actual** panel:

- **Green** — field is missing from actual; needs to be added
- **Red** — field exists but has the wrong value; shows `// ⚠ expected: "..."` comment
- **Blue** — field is extra (not in expected schema)
- *Grey italic* — comment explaining the issue

### 5. Copy the Report

Click **📋 Copy Report** to copy a fully styled HTML version of the report. Paste it directly into Google Docs — formatting and colors are preserved.

### Strict Mode

Check **Strict mode** to treat extra fields (fields present on the page but not in your expected schema) as errors in the summary count.

## Example

**Expected schema:**
```json
{
  "@type": "Product",
  "name": "Widget Pro",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "USD"
  }
}
```

**Annotated Actual output:**
```
{
  "@type": "Product",
  "name": "Widget Pro",
  "offers": {
    "@type": "Offer",
    "price": "39.99"  // ⚠ expected: "29.99"
    "priceCurrency": "USD",
    "availability": "InStock"  // + extra, not expected
  },
  "sku": "WP-001"  // + extra, not expected
}
```

## Tech Stack

- **Backend:** Node.js + Express (proxies requests to avoid CORS issues)
- **HTML parsing:** Cheerio
- **HTTP client:** Axios (with self-signed cert support for staging)
- **Frontend:** Vanilla JS, single-file SPA (`public/index.html`)

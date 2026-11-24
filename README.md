# The Wedding Story by Pixel & Ink

One engine, many weddings.

| Folder | What lives there | Changes |
|---|---|---|
| `engine/` | The app itself (`app.js`, `app.css`) and interface text in English and Hindi (`strings.js`) | Product updates |
| `packs/` | One file per community: rites, glossary, day descriptions, drawings. Uses `{bride}`, `{groom}`, `{bride_family}`, `{groom_family}` | Once per community |
| `looks/` | One CSS and one JS file per look: colours, landing ornament, its explainer card | Once per look |
| `weddings/` | One file per wedding: names, families, days, venues, contacts, copy, chosen look | Every wedding |
| `template/wedding.html` | The page shell every wedding is built from | Rarely |

## Make a wedding page

1. Copy `weddings/aditi-ishaan.js` to `weddings/<slug>.js` and edit it.
2. Run `node tools/build.mjs <slug>`. The page is written to the `out` path in the wedding file.

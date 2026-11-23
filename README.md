# dsh-lora-panel

A read-only LoRA catalogue for the DeepSeek Harness left sidebar.

With a few dozen LoRAs on disk, the annoying part is remembering which file is which: the filenames
look like `nai2_v1_step2000.safetensors`, the trigger words live in a note somewhere, and the
recommended weight lives in a third place. This plugin puts them on one screen, grouped by base
model, and gives you a one-click copy of the exact string your generation script wants.

```
NijiReol | Semi-realistic Niji Style [Anima/Krea2/MOSS/NAI/Z-Image]   ← civitai_title, verbatim
version   MOSS v1.0
alias     niji
file      nijireol-lora2k-nb22-comfy.safetensors
kind      style
trigger   nijireol
weight    0.5                                    click the card → copies "filename:0.5"
```

## What it does

- Lists every entry of one JSON file as a card, grouped by base model.
- Each card shows the Civitai page title verbatim (bracket suffix kept), then version, alias, filename,
  kind, trigger words and recommended weight.
- Clicking a card copies `filename:weight` — e.g. `BunnySlop_MOSS.safetensors:0.6` — which is exactly
  the form `--lora` takes in most ComfyUI scripts.
- Entries with no known weight show **weight missing** and copy nothing. It will not invent a number.
- Entries whose `loader` is `LoraLoader` carry a **chain CLIP too** badge: those weights include
  text-encoder tensors, so the graph needs CLIP as well as MODEL.
- Re-reads the file every time the panel is opened. No cache, no stale view.
- Read-only. The plugin never writes, never calls ComfyUI, never touches any other path.

## Requirements

- DeepSeek Harness `^0.2.3-alpha.2` — declared in `engines.dsh`, so a DSH outside that range refuses
  to load the plugin instead of half-loading it.
- Node.js as required by that DSH release. DSH 0.2.3 wants Node `24.22.3+` (or `26.13.1+`); the plugin
  code itself only needs `>=20`, but it runs inside DSH, so DSH's floor is the real one.
- A JSON file describing your LoRAs. See [Data contract](#data-contract).

## Install

**If you already have an earlier copy of this panel installed, disable it first.** Two enabled copies
both register `GET /lora-panel/meta` and DSH will refuse the duplicate route.

1. Clone the repository somewhere permanent:

   ```bash
   git clone https://github.com/O0W2E1N7/dsh-lora-panel.git
   ```

2. Add that directory as a local bundle through the **Plugins** page, using the absolute path in
   `file:` form, e.g. `file:/absolute/path/to/dsh-lora-panel`. DSH links it into the profile's
   `node_modules`, reads `dsh.bundle.patch` from `package.json`, and applies the one line in
   `cordis.patch.yml`.
3. Restart DSH when the entry reports `restart-required`.
4. Open **LoRA 面板** / **LoRA panel** from the left sidebar.

To upgrade later, `git pull` in that directory and restart.

## Data contract

The whole plugin is a viewer for one JSON object. Top level is a map of **filename → metadata**:

```json
{
  "BunnySlop_MOSS.safetensors": {
    "alias": "slopm",
    "base": "MOSS Image",
    "base_group": "MOSS",
    "kind": "style",
    "civitai_title": "BunnySlop AI Style 『MOSS | Anima | Illustrious』",
    "civitai_version": "MOSS v6.9",
    "civitai_base": "MOSS Image",
    "civitai_confidence": "exact",
    "trigger": "@sl0p",
    "default_weight": 0.6,
    "loader": "LoraLoaderModelOnly",
    "note": "Stylised volume and gloss."
  }
}
```

Every field is optional. What the card actually does with each one:

| Field | Type | Shown on the card | Missing |
|---|---|---|---|
| `civitai_title` | string | headline, printed verbatim, bracket suffix kept | falls back to the filename |
| `civitai_version` | string | `version` row | `—` |
| `alias` | string | `alias` row | `—` |
| `kind` | string | `kind` row (`style` / `character` / `costume` / `slider` / `control`) | `—` |
| `trigger` | string | `trigger` row | `—` |
| `default_weight` | number \| null | `weight` row and the copied string | **weight missing**; clicking only warns, nothing is copied |
| `loader` | string | adds the **chain CLIP too** badge when it is `LoraLoader` | no badge |
| `base_group` | string | **the grouping key** | grouped under "ungrouped" |
| `base` | string | not displayed (kept for a future base filter) | — |
| `civitai_base` | string | not displayed | — |
| `civitai_confidence` | string | not displayed (provenance marker) | — |
| `trigger_alt` | string | not displayed (a caveat or alternative wording) | — |
| `note` | string | not displayed in v0.1 | — |

Only finite numbers count as a weight. `"0.6"` (a string) is treated as missing, by design: the copied
string has to be valid for `--lora`.

Entries whose value is not a JSON object are skipped and counted; the panel says how many were skipped
instead of silently dropping them.

### Group order

Fixed prefix: `MOSS` → `Anima` → `Illustrious / SDXL` → `Pony`. Any other `base_group` follows in the
order it first appears in the file, and entries without `base_group` come last under "ungrouped".

`examples/lora_meta.sample.json` is a two-entry file with every field present.

### Where the file lives

Default path:

```text
D:\CreativeModels\lora_meta.json
```

Override it with the `LORA_PANEL_META` environment variable on the process that starts DSH. The value
is read once, when the Host module loads:

```powershell
$env:LORA_PANEL_META = 'D:\ai\my-loras.json'
```

```bash
export LORA_PANEL_META="$HOME/ai/my-loras.json"
```

Save the file as UTF-8. A BOM is tolerated (the Host strips it before parsing); invalid JSON is not —
the panel shows `parse-failed` with the parser message and a **Retry** button.

## Permissions and privacy

- One Host route: `GET /lora-panel/meta`. `auth: 'required'`, owner peer only, `cache-control: no-store`.
- Non-owner peer → `403`; any method other than `GET` → `405`.
- Reads exactly one file: the path above. No directory listing, no glob, no second path.
- Never writes anything. Removing the plugin removes the sidebar entry and the page together.

## When something goes wrong

The panel shows the reason on an error card with a **Retry** button. It never falls back to stale data.

| What happened | What you see |
|---|---|
| File missing or unreadable | `unreadable`, with the `errno` code and message |
| File is not valid JSON | `parse-failed`, with the parser message |
| Top level is not an object map | `shape` |
| Host answered with a non-2xx status | `HTTP <status>` (no extra detail) |
| Request never reached the Host | network error |
| Host answered 200 but the body is not JSON | `parse-failed` (the body, not the network, is broken) |

## Compatibility

`engines.dsh` is `^0.2.3-alpha.2`. That range accepts `0.2.3-alpha.2` through `0.2.x` and rejects
`0.3.0`. A version-range check cannot promise that a newer `0.2.x` keeps the sidebar slot and the
client manifest shape intact — DSH's own `docs/upgrade-guide` is the place to check before upgrading.
If a release moves either, the plugin is refused at install time (`incompatible-version` in the plugin
manager) rather than half-loading. Widen the range only after the panel has been smoke-tested on that
release.

The panel uses `--dsw-alias-*` design tokens only, so it follows the active theme.

## Layout

| File | Role |
|---|---|
| `index.js` | Host half: registers the route, reads and validates the JSON. |
| `client.js` | Client half: `sidebar.panellist` entry, the main page, and the zh/en UI strings. |
| `cordis.patch.yml` | The single loader line this bundle inserts. |
| `locale/*.json` | Title and description for the **plugin detail page** — not the panel UI. |
| `icon.svg` | The package icon shown by the plugin manager. The sidebar row uses an inline icon from `client.js`. |
| `examples/lora_meta.sample.json` | Minimal data file. |

## License

MIT — see [LICENSE](LICENSE).

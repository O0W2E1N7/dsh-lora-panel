# dsh-lora-panel

A read-only LoRA catalogue for the [DeepSeek Harness](https://github.com/deepseek-ai) left sidebar.

If you keep several dozen LoRAs on disk, remembering which file is which is the annoying part: the
filenames are things like `nai2_v1_step2000.safetensors`, the trigger words live in a different note,
and the recommended weight lives in a third place. This plugin puts them all on one screen, grouped by
base model, and gives you a one-click copy of the exact string your generation script wants.

```
civitai_title              →  NijiReol | Semi-realistic Niji Style [Anima/Krea2/MOSS/NAI/Z-Image]
version / alias            →  MOSS v1.0 · niji
file                       →  nijireol-lora2k-nb22-comfy.safetensors
kind · trigger · weight    →  style · nijireol · 0.5        ← click to copy
```

## What it does

- Lists every entry of one JSON file as a card, grouped by base model.
- Each card shows the Civitai page title verbatim (bracket suffix kept), version name, alias,
  filename, kind, trigger words and recommended weight.
- Clicking a card copies `filename:weight` — for example `BunnySlop_MOSS.safetensors:0.6` — which is
  exactly the form `--lora` takes in most ComfyUI scripts.
- Entries with no known weight show **weight missing** and copy nothing. It will not invent a number.
- Entries whose `loader` is `LoraLoader` are badged **chain CLIP too**, because those weights carry
  text-encoder tensors and need CLIP as well as MODEL.
- Re-reads the file every time the panel is opened. No cache, no stale view.
- Read-only. The plugin never writes, never calls ComfyUI, never touches any other path.

## Requirements

- DeepSeek Harness `^0.2.3-alpha.2` (declared in `engines.dsh`; an out-of-range DSH refuses to load
  the plugin instead of letting it break silently).
- Node.js `>= 20`.
- A JSON file describing your LoRAs. See [Data contract](#data-contract).

## Install

### From the Plugins page

Put the package in the profile's `created-plugins/` directory and let the plugin manager install it:

```text
~/.dsh/profiles/<profile>/created-plugins/dsh-lora-panel/
```

Then install it through the Plugins page (or `plugin_manager install_bundle` with the directory as
the target). DSH links it into `node_modules/@dsh-local/…` and records the patch line from
`cordis.patch.yml`. Restart DSH when the page reports `restart-required`.

### Manually, for development

```bash
git clone https://github.com/O0W2E1N7/dsh-lora-panel.git
cd dsh-lora-panel
# then point the profile at this directory the same way the Plugins page would
```

The bundle contributes one line to the profile loader:

```yaml
- insert:
    - id: 'dsh-lora-panel:lora-panel'
      name: 'dsh-lora-panel'
```

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
    "civitai_confidence": "exact",
    "trigger": "@sl0p",
    "default_weight": 0.6,
    "loader": "LoraLoaderModelOnly",
    "note": "Stylised volume and gloss."
  }
}
```

| Field | Type | Used for | If missing |
|---|---|---|---|
| `alias` | string | short name shown on the card | card still renders |
| `base` | string | exact base-model name | falls back to `base_group` |
| `base_group` | string | **grouping** | grouped under "ungrouped" |
| `kind` | string | `style` / `character` / `costume` / `slider` / `control` | hidden |
| `civitai_title` | string | card headline, printed verbatim | falls back to the filename |
| `civitai_version` | string | version line | hidden |
| `civitai_base` | string | not displayed (kept for filtering later) | — |
| `civitai_confidence` | string | provenance marker, e.g. `exact` | not displayed |
| `trigger` | string | trigger words to paste into the prompt | shows `—` |
| `trigger_alt` | string | caveat or alternative wording | not displayed |
| `default_weight` | number \| null | the weight used in the copied string | **weight missing**, nothing is copied |
| `loader` | string | `LoraLoader` adds the CLIP badge | no badge |
| `note` | string | free text, not displayed in v0.1 | — |

Group order is fixed: `MOSS`, `Anima`, `Illustrious`, `SDXL`, `Pony`. Any other group name is
ordered after those, alphabetically.

`examples/lora_meta.sample.json` is a two-entry file with every field present.

### Where the file lives

Default path:

```text
D:\CreativeModels\lora_meta.json
```

Override it with the `LORA_PANEL_META` environment variable before starting DSH:

```powershell
$env:LORA_PANEL_META = 'D:\ai\my-loras.json'
```

```bash
export LORA_PANEL_META="$HOME/ai/my-loras.json"
```

## Permissions and privacy

- One Host route: `GET /lora-panel/meta`. `auth: 'required'`, owner peer only, `cache-control: no-store`.
- Non-owner → `403`, non-GET → `405`.
- Reads exactly one file: the path above. No directory listing, no glob, no second path.
- Never writes anything. Removing the plugin removes the sidebar entry and the page together.

Failure modes are shown, not swallowed. The panel distinguishes:

| `error` | Meaning |
|---|---|
| `unreadable` | file missing or not readable (detail carries the `errno` code) |
| `parse-failed` | file is not valid JSON |
| `shape` | top level is not an object map |
| `forbidden` | the request was not from the owner peer |

Each of those renders an error card with the detail text and a **Retry** button.

## Compatibility

`engines.dsh` is `^0.2.3-alpha.2`. That range accepts `0.2.3-alpha.2` through `0.2.x` and rejects
`0.3.0`; see DSH's own `docs/upgrade-guide` for what each release changes on the client-plugin
surface. If a DSH upgrade moves the sidebar slot or the client manifest format, the plugin will be
refused at install time rather than half-loading — check `incompatible-version` in the plugin
manager. Widen the range only after the panel has actually been smoke-tested on the new release.

The panel uses `--dsw-alias-*` design tokens only, so it follows the active theme.

## Layout

| File | Role |
|---|---|
| `index.js` | Host half: registers the route, reads and validates the JSON. |
| `client.js` | Client half: `sidebar.panellist` entry plus the main page, zh/en strings inline. |
| `cordis.patch.yml` | The single loader line this bundle inserts. |
| `locale/*.json` | Title and description for the plugin detail page. |
| `icon.svg` | Sidebar icon. |
| `examples/lora_meta.sample.json` | Minimal data file. |

UI strings live in `client.js` (the `zh` / `en` objects at the top), not in `locale/*.json` — the
latter only feeds the plugin detail page.

## License

MIT — see [LICENSE](LICENSE).

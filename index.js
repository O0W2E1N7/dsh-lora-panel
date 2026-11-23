/**
 * Host half of the read-only LoRA panel.
 *
 * The browser cannot read a local file, so this half serves one exact JSON
 * route that re-reads `D:\CreativeModels\lora_meta.json` on every request and
 * returns its entries unchanged: the object key is the LoRA file name, the
 * value is the sidecar metadata. Nothing is cached, nothing is written, and no
 * other path is reachable through the route.
 *
 * The route requires an owner Peer, as every browser carrier route does.
 */
import { readFile } from 'node:fs/promises';

export const name = 'lora-panel';

/** The route carrier. */
export const inject = ['webServer'];

/** The single file this plugin reads. Override with LORA_PANEL_META. */
const META_PATH =
  process.env.LORA_PANEL_META || 'D:\\CreativeModels\\lora_meta.json';

/** The exact path the browser addresses as the document-relative `lora-panel/meta`. */
const ROUTE_PATH = '/lora-panel/meta';

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-length', String(Buffer.byteLength(body)));
  res.end(body);
}

/** Flatten one filesystem or parse error into a short, displayable detail. */
function describe(error) {
  if (error === null || typeof error !== 'object') return String(error);
  const code = typeof error.code === 'string' ? error.code : '';
  const message = typeof error.message === 'string' ? error.message : '';
  if (code !== '' && message !== '') return code + ': ' + message;
  return code !== '' ? code : message !== '' ? message : String(error);
}

/**
 * Keep the file's shape: an object map of file name to metadata object.
 * A value that is not a plain object is counted as skipped instead of being
 * reshaped into something the file does not say.
 */
function normalize(parsed) {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const items = [];
  let skipped = 0;
  for (const file of Object.keys(parsed)) {
    const meta = parsed[file];
    if (meta === null || typeof meta !== 'object' || Array.isArray(meta)) {
      skipped += 1;
      continue;
    }
    items.push({ file, meta });
  }
  return { items, skipped };
}

export function apply(ctx) {
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: ROUTE_PATH,
        auth: 'required',
        handler: async (req, res, peer) => {
          if (peer === undefined || peer.principal.kind !== 'owner') {
            sendJson(res, 403, { ok: false, error: 'forbidden' });
            return;
          }
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.setHeader('allow', 'GET');
            res.end();
            return;
          }

          let raw;
          try {
            raw = await readFile(META_PATH, 'utf8');
            // PowerShell 5.1 的 `-Encoding UTF8` 会写 BOM，JSON.parse 见到 \uFEFF 直接失败
            if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
          } catch (error) {
            sendJson(res, 200, {
              ok: false,
              error: 'unreadable',
              path: META_PATH,
              detail: describe(error),
            });
            return;
          }

          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (error) {
            sendJson(res, 200, {
              ok: false,
              error: 'parse-failed',
              path: META_PATH,
              detail: describe(error),
            });
            return;
          }

          const normalized = normalize(parsed);
          if (normalized === null) {
            sendJson(res, 200, {
              ok: false,
              error: 'shape',
              path: META_PATH,
              detail: 'top-level JSON value is not an object map',
            });
            return;
          }

          sendJson(res, 200, {
            ok: true,
            path: META_PATH,
            readAt: new Date().toISOString(),
            count: normalized.items.length,
            skipped: normalized.skipped,
            items: normalized.items,
          });
        },
      }),
    'lora-panel: GET ' + ROUTE_PATH,
  );
}

window.__ModuleLoader__.load({
  id: 'dsh-lora-panel',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useRef, useState } = React;

    const NS = 'lora-panel';
    /** One id addresses both the sidebar entry and the main panel it opens. */
    const PANEL_ID = 'dsh-lora-panel.main';
    /** Document-relative form of the Host route `/lora-panel/meta`. */
    const FETCH_ROUTE = 'lora-panel/meta';
    /** Groups in the order the panel lists them; anything else follows in data order. */
    const GROUP_ORDER = ['MOSS', 'Anima', 'Illustrious / SDXL', 'Pony'];

    const zh = {
      entry: 'LoRA 面板',
      'page.title': 'LoRA 面板',
      'page.close': '返回对话',
      'page.loading': '正在读取…',
      'page.count': '共 {count} 支',
      'page.readOnly': '只读 · 每次打开重新读取',
      'page.skipped': '跳过 {count} 条非对象条目',
      'page.retry': '重试',
      'error.read': '读取失败',
      'error.unreadable': '读不到文件',
      'error.parse-failed': 'JSON 解析失败',
      'error.shape': '顶层不是「文件名 → 元数据」的对象',
      'error.http': '请求失败（HTTP {status}）',
      'error.network': '请求没有到达 Host',
      'group.unknown': '未分组',
      'card.version': '版本',
      'card.alias': '别名',
      'card.file': '文件',
      'card.kind': '类型',
      'card.trigger': '触发词',
      'card.weight': '权重',
      'card.empty': '—',
      'card.weightMissing': '权重待填',
      'card.weightRequired': '先填权重再复制',
      'card.clip': '需串联 CLIP',
      'card.copy': '点击复制 {text}',
      'card.copied': '已复制',
      'card.copyFailed': '复制失败',
    };

    const en = {
      entry: 'LoRA panel',
      'page.title': 'LoRA panel',
      'page.close': 'Back to conversation',
      'page.loading': 'Reading…',
      'page.count': '{count} LoRAs',
      'page.readOnly': 'Read-only · re-read on every open',
      'page.skipped': 'Skipped {count} non-object entries',
      'page.retry': 'Retry',
      'error.read': 'Read failed',
      'error.unreadable': 'Cannot read the file',
      'error.parse-failed': 'JSON parse failed',
      'error.shape': 'Top level is not a “file name → metadata” object',
      'error.http': 'Request failed (HTTP {status})',
      'error.network': 'The request never reached the Host',
      'group.unknown': 'Ungrouped',
      'card.version': 'Version',
      'card.alias': 'Alias',
      'card.file': 'File',
      'card.kind': 'Kind',
      'card.trigger': 'Trigger',
      'card.weight': 'Weight',
      'card.empty': '—',
      'card.weightMissing': 'Weight missing',
      'card.weightRequired': 'Fill the weight first',
      'card.clip': 'Chain CLIP too',
      'card.copy': 'Copy {text}',
      'card.copied': 'Copied',
      'card.copyFailed': 'Copy failed',
    };

    const CSS = [
      '.lora-panel-root{box-sizing:border-box;flex:1 1 auto;min-height:0;height:100%;overflow:auto;',
      'padding:28px clamp(20px,4vw,48px) 44px;color:var(--dsw-alias-label-primary);',
      'background:var(--dsw-alias-bg-base)}',
      '.lora-panel-inner{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:18px}',
      '.lora-panel-head{display:flex;align-items:flex-start;gap:16px;justify-content:space-between}',
      '.lora-panel-title{margin:0;font-size:18px;font-weight:600;line-height:1.3}',
      '.lora-panel-sub{margin:6px 0 0;display:flex;flex-wrap:wrap;gap:4px 12px;',
      'font-size:12px;line-height:1.5;color:var(--dsw-alias-state-idle-primary)}',
      '.lora-panel-path{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px}',
      '.lora-panel-close{flex:none;font:inherit;font-size:12px;padding:5px 12px;border-radius:8px;',
      'border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);',
      'cursor:pointer}',
      '.lora-panel-close:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.lora-panel-close:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.lora-panel-note{margin:0;font-size:12px;color:var(--dsw-alias-state-warn-primary)}',
      '.lora-panel-group{display:flex;flex-direction:column;gap:10px}',
      '.lora-panel-groupHead{display:flex;align-items:baseline;gap:8px;font-size:13px;font-weight:600;',
      'color:var(--dsw-alias-label-secondary)}',
      '.lora-panel-groupCount{font-size:12px;font-weight:400;color:var(--dsw-alias-state-idle-primary)}',
      '.lora-panel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(258px,1fr));gap:12px}',
      '.lora-panel-card{display:flex;flex-direction:column;gap:8px;box-sizing:border-box;width:100%;',
      'padding:12px 14px;text-align:left;font:inherit;color:inherit;cursor:pointer;border-radius:10px;',
      'border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}',
      '.lora-panel-card:hover{border-color:var(--dsw-alias-brand-primary)}',
      '.lora-panel-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.lora-panel-cardTitle{font-size:13px;font-weight:600;line-height:1.35;overflow-wrap:anywhere}',
      '.lora-panel-rows{display:grid;grid-template-columns:auto minmax(0,1fr);gap:2px 10px;margin:0;font-size:12px}',
      '.lora-panel-rowLabel{color:var(--dsw-alias-state-idle-primary);white-space:nowrap}',
      '.lora-panel-rowValue{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}',
      '.lora-panel-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px}',
      '.lora-panel-foot{display:flex;align-items:center;gap:8px;padding-top:8px;font-size:12px;',
      'border-top:1px solid var(--dsw-alias-border-l1)}',
      '.lora-panel-footLabel{color:var(--dsw-alias-state-idle-primary)}',
      '.lora-panel-weight{font-weight:600;font-variant-numeric:tabular-nums}',
      '.lora-panel-weightMissing{font-weight:600;color:var(--dsw-alias-state-warn-primary)}',
      '.lora-panel-badge{font-size:11px;line-height:1.6;padding:0 6px;border-radius:999px;',
      'border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-state-warn-primary)}',
      '.lora-panel-status{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary);',
      'min-height:1.5em;text-align:right}',
      '.lora-panel-statusOk{color:var(--dsw-alias-state-success-primary)}',
      '.lora-panel-statusWarn{color:var(--dsw-alias-state-warn-primary)}',
      '.lora-panel-message{display:flex;flex-direction:column;gap:10px;align-items:flex-start;',
      'padding:16px 18px;border-radius:10px;border:1px solid var(--dsw-alias-border-l1);',
      'background:var(--dsw-alias-bg-layer-1);font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.lora-panel-messageHead{font-size:13px;font-weight:600;color:var(--dsw-alias-state-error-primary)}',
      '.lora-panel-detail{margin:0;max-height:8em;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;',
      'font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}',
      '.lora-panel-retry{font:inherit;font-size:12px;padding:4px 12px;border-radius:8px;cursor:pointer;',
      'border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary)}',
      '.lora-panel-retry:hover{border-color:var(--dsw-alias-brand-primary)}',
    ].join('');

    /** Sidebar entry glyph: a card stack with a weight knob, drawn in the theme's text color. */
    function LoRAPanelIcon(props) {
      const size = props !== undefined && typeof props.size === 'number' ? props.size : 16;
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          focusable: 'false',
          'aria-hidden': 'true',
          style: { display: 'block' },
        },
        h('rect', {
          x: 4.5,
          y: 3.5,
          width: 15,
          height: 9,
          rx: 2,
          stroke: 'currentColor',
          strokeWidth: 1.6,
          opacity: 0.55,
        }),
        h('rect', { x: 2.5, y: 9.5, width: 15, height: 11, rx: 2, stroke: 'currentColor', strokeWidth: 1.6 }),
        h('path', { d: 'M5.5 14h6', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
        h('path', { d: 'M5.5 17.5h4.5', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
        h('circle', { cx: 17.5, cy: 17, r: 2.2, fill: 'currentColor' }),
      );
    }

    function text(value, empty) {
      if (typeof value === 'string' && value !== '') return value;
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
      return empty;
    }

    function weightOf(meta) {
      const value = meta.default_weight;
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    }

    function groupItems(items, unknownLabel) {
      const buckets = new Map();
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const meta = item.meta;
        const raw = typeof meta.base_group === 'string' ? meta.base_group.trim() : '';
        const key = raw === '' ? '' : raw;
        let bucket = buckets.get(key);
        if (bucket === undefined) {
          bucket = { key, name: key === '' ? unknownLabel : key, items: [] };
          buckets.set(key, bucket);
        }
        bucket.items.push(item);
      }
      const ordered = [];
      for (const name of GROUP_ORDER) {
        const bucket = buckets.get(name);
        if (bucket !== undefined) {
          ordered.push(bucket);
          buckets.delete(name);
        }
      }
      for (const key of Array.from(buckets.keys())) ordered.push(buckets.get(key));
      return ordered;
    }

    function errorText(t, error) {
      if (error === null || error === undefined) return t('error.read');
      if (error.kind === 'http') return t('error.http', { status: String(error.status) });
      if (error.kind === 'network') return t('error.network');
      if (error.kind === 'unreadable') return t('error.unreadable');
      if (error.kind === 'parse-failed') return t('error.parse-failed');
      if (error.kind === 'shape') return t('error.shape');
      return t('error.read');
    }

    /** One card. Clicking copies `<file>:<weight>`; a null default weight copies nothing. */
    function LoRACard(props) {
      const t = props.t;
      const item = props.item;
      const meta = item !== null && typeof item.meta === 'object' ? item.meta : {};
      const file = typeof item.file === 'string' ? item.file : '';
      const weight = weightOf(meta);
      const copyText = weight === null ? null : file + ':' + String(weight);
      const [notice, setNotice] = useState(null);
      const timer = useRef(null);

      useEffect(
        () => () => {
          if (timer.current !== null) clearTimeout(timer.current);
        },
        [],
      );

      const flash = useCallback((kind, message) => {
        setNotice({ kind, message });
        if (timer.current !== null) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          timer.current = null;
          setNotice(null);
        }, 1600);
      }, []);

      const onCopy = useCallback(() => {
        if (copyText === null) {
          flash('warn', t('card.weightRequired'));
          return;
        }
        const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
        if (clipboard === undefined || clipboard === null || typeof clipboard.writeText !== 'function') {
          flash('warn', t('card.copyFailed'));
          return;
        }
        clipboard.writeText(copyText).then(
          () => flash('ok', t('card.copied')),
          () => flash('warn', t('card.copyFailed')),
        );
      }, [copyText, flash, t]);

      const actionLabel = copyText === null ? t('card.weightRequired') : t('card.copy', { text: copyText });
      const rows = [
        { label: t('card.version'), value: text(meta.civitai_version, t('card.empty')) },
        { label: t('card.alias'), value: text(meta.alias, t('card.empty')), mono: true },
        { label: t('card.file'), value: file, mono: true },
        { label: t('card.kind'), value: text(meta.kind, t('card.empty')) },
        { label: t('card.trigger'), value: text(meta.trigger, t('card.empty')), mono: true },
      ];

      const statusClass =
        notice === null
          ? 'lora-panel-status'
          : notice.kind === 'ok'
            ? 'lora-panel-status lora-panel-statusOk'
            : 'lora-panel-status lora-panel-statusWarn';

      return h(
        'button',
        {
          type: 'button',
          className: 'lora-panel-card',
          'aria-label': actionLabel,
          title: actionLabel,
          onClick: onCopy,
        },
        h('span', { className: 'lora-panel-cardTitle' }, text(meta.civitai_title, file)),
        h(
          'span',
          { className: 'lora-panel-rows' },
          rows.map((row, index) =>
            h(
              React.Fragment,
              { key: String(index) },
              h('span', { className: 'lora-panel-rowLabel' }, row.label),
              h(
                'span',
                {
                  className: row.mono === true ? 'lora-panel-rowValue lora-panel-mono' : 'lora-panel-rowValue',
                },
                row.value,
              ),
            ),
          ),
        ),
        h(
          'span',
          { className: 'lora-panel-foot' },
          h('span', { className: 'lora-panel-footLabel' }, t('card.weight')),
          weight === null
            ? h('span', { className: 'lora-panel-weightMissing' }, t('card.weightMissing'))
            : h('span', { className: 'lora-panel-weight' }, String(weight)),
          meta.loader === 'LoraLoader' ? h('span', { className: 'lora-panel-badge' }, t('card.clip')) : null,
          h('span', { className: statusClass, role: 'status' }, notice === null ? '' : notice.message),
        ),
      );
    }

    function LoRAPanelPage(props) {
      const t = props.t;
      const close = props.close;
      const usePanelInfo =
        typeof props.usePanelInfo === 'function'
          ? props.usePanelInfo
          : (selector) => selector({ activePanelId: PANEL_ID });
      const active = usePanelInfo((info) => info.activePanelId === PANEL_ID);
      const [state, setState] = useState({ phase: 'loading', data: null, error: null });
      const [attempt, setAttempt] = useState(0);

      useEffect(() => {
        if (active !== true) return undefined;
        const controller = new AbortController();
        let cancelled = false;
        setState({ phase: 'loading', data: null, error: null });
        fetch(FETCH_ROUTE, {
          signal: controller.signal,
          cache: 'no-store',
          headers: { accept: 'application/json' },
        })
          .then((response) => {
            if (!response.ok) throw { kind: 'http', status: response.status };
            return response.json();
          })
          .then((payload) => {
            if (cancelled) return;
            if (payload === null || typeof payload !== 'object' || payload.ok !== true) {
              setState({
                phase: 'error',
                data: null,
                error: {
                  kind: payload !== null && typeof payload === 'object' ? payload.error : 'read',
                  detail: payload !== null && typeof payload === 'object' ? payload.detail : undefined,
                },
              });
              return;
            }
            setState({ phase: 'ready', data: payload, error: null });
          })
          .catch((error) => {
            if (cancelled || controller.signal.aborted) return;
            if (error !== null && typeof error === 'object' && error.kind === 'http') {
              setState({ phase: 'error', data: null, error });
              return;
            }
            setState({
              phase: 'error',
              data: null,
              error: {
                kind: 'network',
                detail: error !== null && typeof error === 'object' ? String(error.message) : String(error),
              },
            });
          });
        return () => {
          cancelled = true;
          controller.abort();
        };
      }, [active, attempt]);

      const items = state.data !== null ? state.data.items : [];
      const groups = useMemo(
        () => groupItems(items, t('group.unknown')),
        [items, t],
      );
      const count = state.data !== null && typeof state.data.count === 'number' ? state.data.count : items.length;
      const skipped = state.data !== null && typeof state.data.skipped === 'number' ? state.data.skipped : 0;
      const path = state.data !== null && typeof state.data.path === 'string' ? state.data.path : undefined;

      const header = h(
        'div',
        { className: 'lora-panel-head' },
        h(
          'div',
          null,
          h('h1', { className: 'lora-panel-title' }, t('page.title')),
          h(
            'p',
            { className: 'lora-panel-sub' },
            path !== undefined ? h('span', { className: 'lora-panel-path' }, path) : null,
            h('span', null, t('page.readOnly')),
            state.phase === 'ready' ? h('span', null, t('page.count', { count: String(count) })) : null,
          ),
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'lora-panel-close',
            'aria-label': t('page.close'),
            onClick: () => {
              if (typeof close === 'function') close();
            },
          },
          t('page.close'),
        ),
      );

      let body;
      if (state.phase === 'loading') {
        body = h('p', { className: 'lora-panel-note' }, t('page.loading'));
      } else if (state.phase === 'error') {
        body = h(
          'div',
          { className: 'lora-panel-message', role: 'alert' },
          h('span', { className: 'lora-panel-messageHead' }, errorText(t, state.error)),
          state.error !== null && state.error !== undefined && typeof state.error.detail === 'string' && state.error.detail !== ''
            ? h('p', { className: 'lora-panel-detail' }, state.error.detail)
            : null,
          h(
            'button',
            { type: 'button', className: 'lora-panel-retry', onClick: () => setAttempt((value) => value + 1) },
            t('page.retry'),
          ),
        );
      } else {
        body = h(
          React.Fragment,
          null,
          skipped > 0 ? h('p', { className: 'lora-panel-note' }, t('page.skipped', { count: String(skipped) })) : null,
          groups.map((group) =>
            h(
              'section',
              { className: 'lora-panel-group', key: group.key === '' ? '__unknown__' : group.key },
              h(
                'div',
                { className: 'lora-panel-groupHead' },
                h('span', null, group.name),
                h('span', { className: 'lora-panel-groupCount' }, String(group.items.length)),
              ),
              h(
                'div',
                { className: 'lora-panel-grid' },
                group.items.map((item) =>
                  h(LoRACard, { key: item.file, t, item }),
                ),
              ),
            ),
          ),
        );
      }

      return h(
        'div',
        { className: 'lora-panel-root' },
        h('style', null, CSS),
        h('div', { className: 'lora-panel-inner' }, header, body),
      );
    }

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, 'zh', zh), 'lora-panel: zh dictionary');
        ctx.effect(() => ctx.locale.register(NS, 'en', en), 'lora-panel: en dictionary');
        const t = ctx.locale.bind(NS);

        ctx.effect(
          () =>
            ctx.slots.inject('sidebar.panellist', () =>
              ctx.slots.register(
                { name: 'sidebar.panellist', id: PANEL_ID, order: 60, label: () => t('entry'), locale: NS },
                LoRAPanelIcon,
              ),
            ),
          'lora-panel: sidebar entry',
        );

        ctx.effect(
          () =>
            ctx.slots.inject('main', () =>
              ctx.slots.register(
                {
                  name: 'main',
                  key: PANEL_ID,
                  locale: NS,
                  inject: () => ({
                    close: () => {
                      ctx.layout.selectPanel(null);
                    },
                  }),
                },
                LoRAPanelPage,
              ),
            ),
          'lora-panel: main panel',
        );

        // Leaving the page only if this plugin owns the open panel: never reset another plugin's page.
        ctx.effect(
          () => () => {
            if (ctx.layout.panelInfo.getSnapshot().activePanelId === PANEL_ID) ctx.layout.selectPanel(null);
          },
          'lora-panel: leave panel on unload',
        );
      },
    };
  },
});

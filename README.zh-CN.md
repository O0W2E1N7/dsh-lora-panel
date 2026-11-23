# dsh-lora-panel

[English](README.md) | **简体中文**

给 DeepSeek Harness 左侧栏用的只读 LoRA 面板。

本地攒到几十支 LoRA 之后，麻烦的不是出图，是记不住哪个文件是哪个：文件名长成
`nai2_v1_step2000.safetensors` 这样，触发词在另一份笔记里，建议权重又在第三个地方。这个插件把它们
摆在一屏上，按底座分组，并把出图脚本吃得下的那串字符做成一次点击。

```
NijiReol | Semi-realistic Niji Style [Anima/Krea2/MOSS/NAI/Z-Image]   ← civitai_title，原样输出
版本      MOSS v1.0
别名      niji
文件名    nijireol-lora2k-nb22-comfy.safetensors
类型      style
触发词    nijireol
权重      0.5                                    点卡片 → 复制「文件名:0.5」
```

## 它做什么

- 把一个 JSON 文件的每条记录画成一张卡，按底座分组。
- 卡面第一行是 Civitai 页面标题（原样输出，方括号后缀不裁剪），其下依次是版本、别名、文件名、
  类型、触发词、建议权重。
- 点击卡片复制 `文件名:权重`，例如 `BunnySlop_MOSS.safetensors:0.6`——多数 ComfyUI 脚本的
  `--lora` 参数直接吃这个格式。
- 权重未知的条目标「权重待填」，点击只提示、不复制，不会替你编一个数字。
- `loader` 为 `LoraLoader` 的条目带「需串联 CLIP」徽标：这类权重含文本编码器张量，图里要把 CLIP
  和 MODEL 一起串。
- **每次打开都重新读文件**，不缓存，不给你看过期的数据。
- 只读。不写文件、不调 ComfyUI、不碰第二个路径。

## 要求

- DeepSeek Harness `^0.2.3-alpha.2`——写在 `engines.dsh` 里。超出这个范围的 DSH 会拒绝加载，
  而不是让它半载着坏掉。
- Node.js 版本跟着这个 DSH 版本走。DSH 0.2.3 要求 Node `24.22.3+`（或 `26.13.1+`）；插件代码本身
  只要 `>=20`，但它跑在 DSH 里，下限以 DSH 为准。
- 一个描述你 LoRA 的 JSON 文件，见[数据契约](#数据契约)。

## 安装

**如果之前装过这份面板的旧副本，先停用它。** 两份同时启用会各自注册 `GET /lora-panel/meta`，
DSH 会拒绝重复路由。

1. 克隆到固定位置：

   ```bash
   git clone https://github.com/O0W2E1N7/dsh-lora-panel.git
   ```

2. 在 **Plugins** 页面把这个目录加成本地 bundle，用绝对路径的 `file:` 形式，例如
   `file:/absolute/path/to/dsh-lora-panel`。DSH 会把它链进 profile 的 `node_modules`，从
   `package.json` 读 `dsh.bundle.patch`，应用 `cordis.patch.yml` 里那一行。
3. 条目提示 `restart-required` 时重启 DSH。
4. 从左侧栏打开「LoRA 面板」。

以后升级：在那个目录 `git pull`，重启。

## 数据契约

整个插件就是一个 JSON 对象的查看器。顶层是**文件名 → 元数据**的映射：

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

每个字段都可选。卡片对各字段的实际处理：

| 字段 | 类型 | 卡片上怎么用 | 缺失时 |
|---|---|---|---|
| `civitai_title` | string | 标题行，原样输出，方括号后缀保留 | 回退到文件名 |
| `civitai_version` | string | `版本` 行 | `—` |
| `alias` | string | `别名` 行 | `—` |
| `kind` | string | `类型` 行（`style` / `character` / `costume` / `slider` / `control`） | `—` |
| `trigger` | string | `触发词` 行 | `—` |
| `default_weight` | number \| null | `权重` 行，以及复制串里的权重 | **权重待填**；点击只提示，不复制 |
| `loader` | string | 为 `LoraLoader` 时加「需串联 CLIP」徽标 | 无徽标 |
| `base_group` | string | **分组依据** | 归入「未分组」 |
| `base` | string | 不显示（留给以后按底座筛选） | — |
| `civitai_base` | string | 不显示 | — |
| `civitai_confidence` | string | 不显示（来源标记） | — |
| `trigger_alt` | string | 不显示（注意事项或备选写法） | — |
| `note` | string | v0.1 不显示 | — |

只有有限数值才算权重。字符串 `"0.6"` 视为缺失——这是故意的：复制出来的串必须能被 `--lora` 解析。

值不是 JSON 对象的条目会被跳过并计数，面板会告诉你跳过了几条，而不是静默丢掉。

### 分组顺序

固定前缀：`MOSS` → `Anima` → `Illustrious / SDXL` → `Pony`。其它 `base_group` 按在文件里**首次出现的
顺序**排在后面，缺 `base_group` 的归到最后的「未分组」。

`examples/lora_meta.sample.json` 是一份两条记录、字段齐全的样例。

### 文件在哪

默认路径：

```text
D:\CreativeModels\lora_meta.json
```

用 `LORA_PANEL_META` 环境变量覆盖，值由启动 DSH 的那个进程继承，在 Host 模块加载时读一次：

```powershell
$env:LORA_PANEL_META = 'D:\ai\my-loras.json'
```

```bash
export LORA_PANEL_META="$HOME/ai/my-loras.json"
```

文件存成 UTF-8。带 BOM 也能读（Host 会在解析前剥掉）；JSON 语法错则不能——面板显示
`parse-failed` 加解析器原文，并给一个**重试**按钮。

## 权限与隐私

- Host 只有一条路由：`GET /lora-panel/meta`。`auth: 'required'`，仅 owner peer，`cache-control: no-store`。
- 非 owner peer → `403`；非 `GET` → `405`。
- 只读一个文件：上面那个路径。不列目录、不 glob、不碰第二个路径。
- 从不写任何东西。卸载插件时侧栏条目和页面一起消失。

## 出错时

面板把原因画在错误卡上，带一个**重试**按钮，不会拿旧数据冒充当前数据。

| 情况 | 看到什么 |
|---|---|
| 文件不存在或读不了 | `unreadable`，附 `errno` 代码与原文 |
| 文件不是合法 JSON | `parse-failed`，附解析器原文 |
| 顶层不是对象映射 | `shape` |
| Host 回了非 2xx 状态 | `HTTP <状态码>`（不带额外说明） |
| 请求根本没到 Host | 网络错误 |
| Host 回了 200 但响应体不是 JSON | `parse-failed`（坏的是响应体，不是网络） |

## 兼容性

`engines.dsh` 是 `^0.2.3-alpha.2`，接受 `0.2.3-alpha.2` 到 `0.2.x`，拒绝 `0.3.0`。版本范围检查
保证不了更新的 `0.2.x` 一定没动过侧栏 slot 和 client 清单格式——升级前看 DSH 自己的
`docs/upgrade-guide`。真动了，插件会在安装阶段被拒（插件管理器里显示 `incompatible-version`），
而不是半载着坏掉。要放宽范围，先在新版本上把面板实际跑一遍。

面板只用 `--dsw-alias-*` 设计令牌，跟随当前主题。

## 文件结构

| 文件 | 作用 |
|---|---|
| `index.js` | Host 半侧：注册路由，读取并校验 JSON。 |
| `client.js` | Client 半侧：`sidebar.panellist` 条目、主页面、zh/en 界面文案。 |
| `cordis.patch.yml` | 本 bundle 插入的唯一一行加载器配置。 |
| `locale/*.json` | **插件详情页**的标题与说明——不是面板界面文案。 |
| `icon.svg` | 插件管理器显示的包图标；侧栏那一行用的是 `client.js` 里的内联图标。 |
| `examples/lora_meta.sample.json` | 最小数据文件。 |

## 许可证

MIT，见 [LICENSE](LICENSE)。

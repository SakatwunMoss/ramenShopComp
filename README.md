# 麺くらべ（ramen-compare）

全国のラーメン店をエリア・系統で比較・検索するサイト。Next.js（App Router）+ **Cloudflare D1** + HotPepper API + Cloudflare Workers。

> 掲載データはホットペッパーグルメ掲載店のみが対象です。個人経営の小規模店は網羅できない場合があります。

## 技術スタック

- TypeScript / Next.js (App Router) / Tailwind CSS
- ホスティング: **Cloudflare Workers**（`@opennextjs/cloudflare`）
- DB: **Cloudflare D1**（SQLite・無料枠あり）
- データ取得: HotPepper グルメサーチ API
- バッチ: GitHub Actions（週次）+ ローカル `npm run fetch-shops`

## セットアップ

### 1. 依存関係

```bash
npm install
cp .env.local.example .env.local
```

### 2. Cloudflare D1

```bash
# ログイン（未済の場合）
npx wrangler login

# DB 作成 → 出力の database_id を wrangler.toml に貼る
npx wrangler d1 create ramen-compare

# スキーマ適用（ローカル / リモート）
npx wrangler d1 migrations apply DB --local
npx wrangler d1 migrations apply DB --remote
```

### 3. 環境変数（`.env.local`）

| 変数 | 用途 |
|------|------|
| `HOTPEPPER_API_KEY` | HotPepper API キー |
| `CLOUDFLARE_ACCOUNT_ID` | アカウント ID（ダッシュボード） |
| `CLOUDFLARE_API_TOKEN` | D1 編集権限付き API Token |
| `CLOUDFLARE_D1_DATABASE_ID` | D1 の database_id |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | AdSense（任意） |

アプリ本体の読み取りは Workers の D1 バインディング経由です（公開キー不要）。上記 Cloudflare 変数はバッチ書き込み専用です。

### 4. 店舗データ取得

```bash
# 1エリアのみ（初回推奨）
npm run fetch-shops -- --area=Z011

# 全国
npm run fetch-shops

# 書き込みなしで確認
npm run fetch-shops -- --area=Z011 --dry-run
```

### 5. ローカル開発

```bash
npm run dev
```

`initOpenNextCloudflareForDev` により、ローカルでも D1 バインディングを利用できます。

## Cloudflare Workers デプロイ

```bash
npx wrangler kv namespace create NEXT_INC_CACHE_KV
npx wrangler r2 bucket create ramen-compare-assets
# wrangler.toml の ID を更新後
npm run preview
npm run deploy
```

## GitHub Actions

| Workflow | トリガー | 内容 |
|----------|----------|------|
| `deploy.yml` | `main` への push / 手動 | OpenNext ビルド → Cloudflare Workers デプロイ |
| `sync-shops.yml` | 週1回 / 手動 | HotPepper → D1 店舗同期 |

必要な Secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`（Workers 編集 + D1 編集）
- `CLOUDFLARE_D1_DATABASE_ID`（店舗同期用）
- `HOTPEPPER_API_KEY`（店舗同期用）
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID`（任意・デプロイ時）

## ディレクトリ構成（要点）

```
src/app/                 # ページ（App Router）
src/components/          # UI（AdSense スロット含む）
src/lib/                 # D1 / 型 / 店舗クエリ
scripts/fetch-shops.ts   # HotPepper → D1 upsert
migrations/              # D1 DDL
wrangler.toml            # Workers + KV + R2 + D1
```

## 注意

- Supabase は使用していません（無料枠の代替として D1 を採用）
- ぐるなび API は使用しません
- D1 に RLS はありません。公開読み取りはアプリ経由のみ、書き込みは API Token 限定
- AdSense はレイアウト上のプレースホルダのみ

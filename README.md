# 麺くらべ（ramen-compare）

全国のラーメン店をエリア・系統で比較・検索するサイト。Next.js（App Router）+ Supabase + HotPepper API + Cloudflare Workers。

> 掲載データはホットペッパーグルメ掲載店のみが対象です。個人経営の小規模店は網羅できない場合があります。

## 技術スタック

- TypeScript / Next.js (App Router) / Tailwind CSS
- ホスティング: **Cloudflare Workers**（`@opennextjs/cloudflare`）
- DB: Supabase（Tokyo 推奨）
- データ取得: HotPepper グルメサーチ API
- バッチ: GitHub Actions（週次）+ ローカル `npm run fetch-shops`

## セットアップ

### 1. 依存関係

```bash
npm install
cp .env.local.example .env.local
```

### 2. 環境変数（`.env.local`）

| 変数 | 用途 |
|------|------|
| `HOTPEPPER_API_KEY` | HotPepper API キー |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon（公開読み取り） |
| `SUPABASE_SERVICE_ROLE_KEY` | バッチ書き込み専用（公開しない） |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | AdSense（任意） |

### 3. Supabase

1. Tokyo リージョンでプロジェクト作成
2. SQL Editor で `supabase/migrations/001_create_shops.sql` を実行
3. URL / anon key / service role key を `.env.local` に記入

### 4. 店舗データ取得

```bash
# 1エリアのみ（初回推奨）
npm run fetch-shops -- --area=Z011

# 全国
npm run fetch-shops

# 書き込みなしで確認
npm run fetch-shops -- --area=Z011 --dry-run
```

大エリアコードはマスタ API から動的取得します（ハードコードしません）。

### 5. ローカル開発

```bash
npm run dev
```

## Cloudflare Workers デプロイ

```bash
# KV / R2 作成例
npx wrangler kv namespace create NEXT_INC_CACHE_KV
npx wrangler r2 bucket create ramen-compare-assets

# wrangler.toml の ID / バケット名を更新後
npm run preview   # ローカル Workers プレビュー
npm run deploy    # 本番デプロイ
```

GitHub 連携での自動デプロイは Cloudflare ダッシュボード側でリポジトリを接続してください。

## GitHub Actions

`.github/workflows/sync-shops.yml` が週1回バッチを実行します。

必要な Secrets:

- `HOTPEPPER_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

手動実行時は `area` 入力（例: `Z011`）で1エリアのみも可能です。

## ディレクトリ構成（要点）

```
src/app/                 # ページ（App Router）
src/components/          # UI（AdSense スロット含む）
src/lib/                 # Supabase / 型 / 店舗クエリ
scripts/fetch-shops.ts   # HotPepper → Supabase upsert
supabase/migrations/     # DDL + RLS
wrangler.toml            # Workers + KV + R2
```

## 注意

- ぐるなび API は使用しません（無料提供終了済み）
- Workers では `@supabase/supabase-js`（fetch ベース）を利用。Node 固有 API に依存するライブラリは避けています
- AdSense はレイアウト上のプレースホルダのみ。審査申請は別途

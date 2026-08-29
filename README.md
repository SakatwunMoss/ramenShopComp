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
| `NEXT_PUBLIC_SITE_URL` | 公開URL（canonical / OGP / sitemap 用。本番では必須推奨） |

アプリ本体の読み取りは Workers の D1 バインディング経由です（公開キー不要）。上記 Cloudflare 変数はバッチ書き込み専用です。

### 4. 店舗データ取得

```bash
# スキーマ適用後（area_labels 含む）
npx wrangler d1 migrations apply DB --local
npx wrangler d1 migrations apply DB --remote

# 1エリアのみ（初回推奨）— 店舗 + エリア名ラベルを同期
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

## SEO・Search Console

### Google Search Console の所有権確認

どちらか一方でサイト所有権を確認します。

**A. HTML メタタグ（手早い）**

1. [Google Search Console](https://search.google.com/search-console) でプロパティを追加（URL プレフィックス）
2. 「HTML タグ」を選び、表示された `content` 値を控える
3. `src/app/layout.tsx` の `generateMetadata` に次を追加してデプロイする

```ts
verification: {
  google: "Search Console で発行されたコード",
},
```

4. Search Console で「確認」を押す

**B. DNS レコード（ドメイン単位・推奨）**

1. Search Console で「ドメイン」プロパティを追加
2. 表示された TXT レコードを DNS に追加
3. 反映後に確認

### サイトマップの送信

1. 本番で `https://あなたのドメイン/sitemap.xml` が開けることを確認
2. Search Console →「サイトマップ」→ `sitemap.xml` を送信
3. 分割サイトマップは `/sitemap/0.xml`（静的・エリア）、`/sitemap/1.xml` 以降（店舗）として生成される

本番では必ず `NEXT_PUBLIC_SITE_URL` を設定し、sitemap / robots / canonical の絶対 URL を正しいドメインにしてください。

### Lighthouse セルフチェック

デプロイ後（または `npm run preview` 後）に Chrome DevTools の Lighthouse で確認します。

1. シークレットウィンドウで対象 URL を開く（拡張機能の影響を避ける）
2. DevTools → Lighthouse → Categories で **Performance / SEO / Best Practices** を選択
3. モバイル・デスクトップそれぞれで実行
4. 特に確認したいページ例
   - トップ `/`
   - エリア LP `/areas/Z011`
   - 店舗詳細 `/shops/{id}`
5. SEO で canonical・メタ description・クロール可能なリンクが警告になっていないか確認
6. Performance で LCP（ヒーロー画像・店舗画像）と CLS を確認

## 画像・フォントについて（Cloudflare Workers）

`next/image` を利用していますが、Workers 環境では Vercel 向けの標準 Image Optimization が使えません。現状は `images.unoptimized: true` でレイアウト（width/height）による CLS 抑制のみ行い、配信は元 URL（HotPepper / 静的ファイル）のままです。

本番で最適化する場合は [OpenNext のガイド](https://opennext.js.org/cloudflare/howtos/image) に従い、`wrangler.toml` に Cloudflare Images の `IMAGES` バインディングを追加して `unoptimized` を外してください。

フォントは `@fontsource/shippori-mincho` / `@fontsource/zen-kaku-gothic-new` でセルフホストしています（ビルド成果物に同梱し、ランタイムの Google Fonts リクエストは発生しません）。日本語フォントは `next/font/google` だと数千分割ファイルの取得に失敗しやすいため、fontsource 方式を採用しています。

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
- `NEXT_PUBLIC_SITE_URL`（推奨・canonical / sitemap 用）

## ディレクトリ構成（要点）

```
src/app/                 # ページ（App Router）
  areas/                 # エリア別 LP（ロングテール SEO）
  shops/[id]/           # 店舗詳細
  sitemap.ts / robots.ts # 動的サイトマップ・robots
src/components/          # UI（AdSense スロット含む）
src/lib/                 # D1 / 型 / 店舗クエリ / SEO・JSON-LD
scripts/fetch-shops.ts   # HotPepper → D1 upsert（area_labels 含む）
migrations/              # D1 DDL
public/og-default.png    # デフォルト OGP
wrangler.toml            # Workers + KV + R2 + D1
```

## 注意

- Supabase は使用していません（無料枠の代替として D1 を採用）
- ぐるなび API は使用しません
- D1 に RLS はありません。公開読み取りはアプリ経由のみ、書き込みは API Token 限定
- AdSense はレイアウト上のプレースホルダのみ
- `/compare` はクエリ依存のため `robots.txt` と meta robots で noindex

# Lite App v4 (正本コードベース)

Lite App v4 は、客席 QR 注文・ハンディ注文・POS 会計・調理管理 (KDS)・マスタ管理・SaaS サブスクリプション管理を統合した次世代飲食店向け Web アプリケーションの正本（統合）コードベースです。
（※ `lite-app-v2`, `lite-app-v3`, `lite-handy-app` は本リポジトリへ統合・一本化されアーカイブされました）

## ローカル開発環境の操作情報

ブラウザでの動作確認時は以下の URL とアカウントを使用してください。

- **サービス紹介ランディングページ (LP):**
  - URL: http://localhost:5173/?view=lp
- **Staff / Handy / KDS / Admin / Seats 画面 (ログイン必須):**
  - URL: http://localhost:5173/?view=staff (または `?view=handy`, `?view=kds`, `?view=seats`, `?view=admin`)
  - 店舗スラッグ (`store`): `demo-bbq` (新規登録時は自由なスラッグ)
  - e-mail: `owner@example.com`
  - password: `demo1234`
- **新規店舗セルフサインアップ:**
  - `http://localhost:5173/` の「新規店舗登録」タブから即時開設可能。

## 画面一覧

- `lp`: SaaS サービス紹介ランディングページ (`LandingPageScreen`)
- `customer`: スマートフォン向け QR 注文 (`CustomerScreen`)
- `cust-tablet`: 10インチタブレット向け QR 注文 (`CustomerTabletScreen`)
- `staff`: 伝票一覧 / 注文詳細 / 会計・テンキー決済 / 正式領収書発行 / 卓QR印刷 (`StaffScreen`)
- `handy`: ハンディ直接注文入力 (`StaffHandyView` / `SeatsScreen` からの空席起票・追加注文)
- `kds`: 調理進捗管理キュー (`KdsScreen`)
- `seats`: 店舗座席稼働モニター (`SeatsScreen`)
- `admin`: マスタ管理 (メニュー・カテゴリ・トッピング・卓配置・フロア・プリンター・店舗・スタッフ・売上集計・レシート再発行・サブスクリプション管理)
- `sales`: 売上履歴・レジ締め画面
- `customer-qr` / `cust-tablet-qr`: 卓別 QR コード一覧表示 & 卓スタンド用 PDF バッチ印刷 (`TableQrListScreen`)
- `login`: スタッフログイン & 新規店舗セルフサインアップ (`LoginScreen`)

## アーキテクチャ・基盤技術

- **フロントエンド**: React 19, Vite 7 (`@vitejs/plugin-basic-ssl`), TypeScript 5, Vanilla CSS
- **バックエンド API / DB**: Cloudflare Workers + Cloudflare D1 (SQLite) (`customer-api-prototype`)
- **認証**: Firebase Authentication (`firebase.ts`) + 店舗スラッグ厳格検証
- **SaaS 課金 / サブスクリプション**: Stripe Checkout & Customer Portal 連携, Stripe Webhook, Feature Gate 機構
- **ブラウザ自動翻訳防御**: `domProtection.ts` による仮想 DOM 破壊（NotFoundError）防止パッチ常時適用

## Playwright

1 台のローカル PC 上で `Customer 複数コンテキスト + Staff/KDS 補助` を回すための最小土台を追加しています。

セットアップ:

```bash
npm install
```

実行前に `.env.playwright.example` を元に環境変数を設定してください。

最低限必要:
- `PW_CUSTOMER_STORE`
- `PW_CUSTOMER_QR`

任意:
- `PW_CUSTOMER_CONTEXTS=4`
- `PW_STAFF_EMAIL` / `PW_STAFF_PASSWORD`
- `PW_KDS_EMAIL` / `PW_KDS_PASSWORD`
- `PW_STAFF_STORAGE_STATE_PATH`
- `PW_KDS_STORAGE_STATE_PATH`
- `PW_EXERCISE_ORDER_FLOW=1`
- `PW_CUSTOMER_ORDER_ITEM_NAME`

実行:

```bash
npm run test:e2e:foundation
```

補足:
- 既定では複数 Customer コンテキストの表示確認だけを行い、実注文は送りません
- 実注文を含める場合だけ `PW_EXERCISE_ORDER_FLOW=1` を付けます
- UI には `data-testid` を追加してあるので、今後シナリオを増やしやすい構成です

## Playwright Load Notes

Additional lightweight order-wave env vars:

- `PW_CUSTOMER_ORDER_CONTEXTS`
- `PW_CUSTOMER_ORDERS_PER_CONTEXT`
- `PW_ORDER_STAGGER_MS`

Example:

```bash
PW_CUSTOMER_CONTEXTS=6 \
PW_CUSTOMER_ORDER_CONTEXTS=4 \
PW_CUSTOMER_ORDERS_PER_CONTEXT=2 \
PW_ORDER_STAGGER_MS=500 \
PW_EXERCISE_ORDER_FLOW=1 \
npm run test:e2e:foundation
```

Saved metrics can be summarized with:

```bash
npm run test:e2e:metrics
```

Repeated samples can be run and classified with:

```bash
npm run test:e2e:samples -- --runs 10
```

Cleanup for accumulated KDS / Staff tickets:

```bash
npm run test:e2e:cleanup
```

Dry-run only:

```bash
npm run test:e2e:cleanup -- --dry-run
```

Optional:

- `node tests/e2e/support/summarize-load-metrics.mjs --limit 10`
- `node tests/e2e/support/summarize-load-metrics.mjs --file tests/e2e/artifacts/load-metrics.jsonl`
- `node tests/e2e/support/summarize-load-metrics.mjs --scenario 12c/8o/3x/100ms`
- `node tests/e2e/support/run-load-samples.mjs --runs 10 --output tests/e2e/artifacts/load-run-results.jsonl`

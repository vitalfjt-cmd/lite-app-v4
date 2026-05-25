# Lite App

Lite 本体の React + TypeScript アプリです。

## ローカル開発環境の操作情報

ブラウザでの動作確認時は以下のURLとアカウントを使用してください。

- **Staff / KDS 画面 (ログイン必須):**
  - URL: http://localhost:5173/?view=staff (または `/?view=kds`)
  - e-mail: `owner@example.com`
  - password: `demo1234`

## 画面一覧

- `customer`: QR 注文
- `staff`: 伝票一覧 / 修正 / 会計補助
- `kds`: 調理キュー
- `admin`: メニュー / 卓 / スタッフ管理

実装メモ:
- `staff` / `admin` / `kds` は Supabase Auth + RLS 前提
- `customer` は `public-customer-api` 経由
- Customer URL は `?view=customer&store=<slug>&qr=<token>` を正とする

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

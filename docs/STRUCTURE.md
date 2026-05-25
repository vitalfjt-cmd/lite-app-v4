# プロジェクト構成 (STRUCTURE)

## 1. ディレクトリ構造
```text
lite-app-v2/
├── docs/               # ドキュメント (仕様、引き継ぎ等)
├── figma-mocks/        # デザインモック (画像)
├── tests/              # Playwright E2E テスト
└── src/
    ├── components/     # 共通コンポーネント
    ├── data/           # 静的データ、定数
    ├── lib/            # ビジネスロジック、API クライアント
    ├── screens/        # 各ビューの画面コンポーネント
    ├── App.tsx         # メインロジック、ルーティング
    ├── main.tsx        # エントリポイント
    └── styles.css      # 全体スタイル (CSS 変数、レイアウト)
```

## 2. 主要モジュールの役割
### 2.1 `src/lib/`
- `staffReadApi.ts`: スタッフ画面向けの API 通信。現在は Cloudflare Workers + D1 に接続。プロトタイプ用のモックエンドポイントも含む。
- `publicCustomerApi.ts`: QR 注文 (Customer) 向けの公開 API 通信 (Cloudflare Workers)。
- `appUtils.ts`: フォーマット変換、URL 解析、エラー表示等のユーティリティ。
- `supabase.ts`: (レガシー) 以前の Supabase 連携用コード。現在は非推奨。

### 2.2 `src/screens/`
各画面のコンポーネント。末尾に `Mock` が付くファイルは、特定の開発フェーズで使用されたプロトタイプや、機能検証用の簡易実装。
- `StaffScreen.tsx`: スタッフ向けメイン画面。
- `CustomerTabletScreen.tsx`: タブレット向け注文画面。
- `KdsScreen.tsx`: キッチンモニタ画面。

### 2.3 `src/styles.css`
プロジェクト全体のデザインシステムを定義。
- **Layout Tokens**: `--v-header-h`, `--v-footer-h` 等の変数により、100vh レイアウトの計算を一元管理。
- **Responsive**: モバイル (Customer) とタブレット (Staff/KDS) のスタイルを `body` クラス等で切り替え。

## 3. テスト
- **Playwright**: `tests/` 内にマルチコンテキストの E2E テストを実装。
- 複数のブラウザコンテキストを立ち上げ、Customer からの注文が Staff/KDS にリアルタイムに反映されるかを確認可能。

# プロジェクト構成 (STRUCTURE)

## 1. ディレクトリ構造
```text
lite-app-v4/
├── docs/               # ドキュメント (仕様書、構成書等)
├── figma-mocks/        # UIデザインモック画像
├── tests/              # Playwright E2E テスト
└── src/
    ├── components/     # 再利用可能な UI コンポーネント
    │   ├── AppLauncher.tsx   # ビュー切り替えランチャーモーダル
    │   ├── AppSidebar.tsx    # トップナビゲーションバー
    │   ├── TableQrModal.tsx  # 卓用QR表示モーダル
    │   └── ToppingModal.tsx  # トッピング選択モーダル
    ├── data/           # 定数・静的データ
    ├── hooks/          # 機能別カスタムフック
    │   ├── useAdminForm.ts       # 管理画面フォーム入力状態管理
    │   ├── useAdminOperations.ts # 管理画面 CRUD ミューテーション
    │   ├── useAuth.ts            # スタッフ認証・セッション管理
    │   ├── useCustomerFlow.ts    # 顧客向け QR 注文フロー管理
    │   ├── useDataLoading.ts     # データ取得・ポリング統括
    │   ├── useStaffData.ts       # 共通ドメイン状態保持
    │   └── useStaffOperations.ts # 注文・伝票・会計・KDS アクション管理
    ├── lib/            # ビジネスロジック・APIクライアント
    │   ├── adminSelectors.ts # 管理画面データ抽出ユーティリティ
    │   ├── adminUtils.ts     # 管理画面補助関数
    │   ├── appUtils.ts       # フォーマット、時間チェック、URL解析
    │   ├── firebase.ts       # Firebase Auth 接続クライアント
    │   ├── priceUtils.ts     # 税込/税抜・消費税計算
    │   ├── publicCustomerApi.ts # QR注文向け Workers 公開 API
    │   ├── staffReadApi.ts   # バックエンド Workers + D1 通信 API
    │   └── staffUtils.ts     # 伝票・KDS補助ロジック
    ├── screens/        # 各ビューのメイン画面コンポーネント
    │   ├── admin/            # マスタ管理 & 売上分析サブタブ群 (27コンポーネント)
    │   ├── staff/            # スタッフサブビュー (Handy入力 / 決済・割勘画面)
    │   ├── AdminScreen.tsx   # マスタ管理・売上分析メイン画面
    │   ├── CustomerScreen.tsx # モバイル向け QR 注文画面
    │   ├── CustomerTabletScreen.tsx # 10インチタブレット向け高機能 QR 注文画面
    │   ├── KdsScreen.tsx     # 調理管理 (KDS) 画面
    │   ├── LoginScreen.tsx   # スタッフログイン画面
    │   ├── SeatsScreen.tsx   # 店舗座席稼働モニター画面
    │   └── StaffScreen.tsx   # スタッフ伝票一覧・詳細画面
    ├── App.tsx         # ルーティング・全体状態管理メイン
    ├── constants.ts    # ビュー定義・定数
    ├── main.tsx        # エントリポイント
    ├── styles.css      # 全体スタイル (CSS変数、100vh固定レイアウト)
    └── types.ts        # TypeScript 型定義
```

## 2. 主要モジュールの役割
### 2.1 `src/lib/`
- **`staffReadApi.ts`**: Cloudflare Workers + D1 バックエンド通信クライアント。
- **`publicCustomerApi.ts`**: 顧客端末用 QR 注文通信 API。
- **`firebase.ts`**: Firebase Authentication によるスタッフログイン管理。
- **`priceUtils.ts`**: 店舗標準税率 (10%) / 軽減税率 (8%) および税込/税抜表示の計算モジュール。

### 2.2 `src/hooks/`
- **`useDataLoading`**: データ初期ロードおよび定期自動更新のオーケストレーター。
- **`useStaffData` / `useStaffOperations`**: 伝票データ保持および注文入力・伝票加算・テンキー会計・KDSステータス変更。
- **`useAdminForm` / `useAdminOperations`**: 各種マスタ（メニュー、トッピング、店舗、決済種別、卓配置等）および売上データのミューテーション。

### 2.3 `src/screens/`
- **`CustomerTabletScreen.tsx`**: 10インチタブレット専用設計の注文画面。多言語切替、トッピング選択、誤操作防止ロックを搭載。
- **`StaffScreen.tsx`**: スタッフ画面。`StaffHandyView` (ハンディ注文), `StaffPaymentView` (個別割勘・まとめ会計・テンキー決済) を統合。
- **`AdminScreen.tsx`**: 売上分析、レシート再発行、各種マスタ管理サブタブを切り替え表示。

## 3. テスト
- **Playwright (`tests/`)**:
  - E2E テストによる Customer 注文 → KDS 調理 → Staff 会計の一巡フロー検証。

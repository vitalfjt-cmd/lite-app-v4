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
    │   ├── OnboardingWizardModal.tsx # 初期導入ウィザードモーダル (店舗・卓・メニュー・テスト注文)
    │   ├── SubscriptionExpiredModal.tsx # サブスクリプション期限切れ・機能制限案内モーダル
    │   ├── TableQrModal.tsx  # 卓用QR表示モーダル
    │   └── ToppingModal.tsx  # トッピング選択モーダル
    ├── data/           # 定数・静的データ
    ├── hooks/          # 機能別カスタムフック
    │   ├── useAdminForm.ts       # 管理画面フォーム入力状態管理 (フロア・プリンター・インボイス対応)
    │   ├── useAdminOperations.ts # 管理画面 CRUD ミューテーション (フロア・プリンター・QR出力先)
    │   ├── useAuth.ts            # スタッフ認証・セッション管理
    │   ├── useCustomerFlow.ts    # 顧客向け QR 注文フロー管理 (単一/二重カテゴリ対応、機能制限判定)
    │   ├── useDataLoading.ts     # データ取得・ポリング統括 (フロア・プリンター・卓マスタ・課金状態紐付け)
    │   ├── useStaffData.ts       # 共通ドメイン状態保持 (1階層/2階層カテゴリ対応、商品重複排除)
    │   └── useStaffOperations.ts # 注文・伝票・会計・KDS アクション管理 (Feature Gate 機能制限判定)
    ├── lib/            # ビジネスロジック・APIクライアント
    │   ├── adminSelectors.ts # 管理画面データ抽出ユーティリティ
    │   ├── adminUtils.ts     # 管理画面補助関数
    │   ├── appUtils.ts       # フォーマット、時間チェック、URL解析
    │   ├── domProtection.ts  # ブラウザ自動翻訳による React DOM クラッシュ防止 (Node.prototype パッチ)
    │   ├── firebase.ts       # Firebase Auth 接続クライアント
    │   ├── priceUtils.ts     # 税込/税抜・消費税計算
    │   ├── publicCustomerApi.ts # QR注文向け Workers 公開 API
    │   ├── staffReadApi.ts   # バックエンド Workers + D1 通信 API (店舗登録・印刷・フロア・インボイス・サブスクリプション含む)
    │   └── staffUtils.ts     # 伝票・KDS補助ロジック
    ├── screens/        # 各ビューのメイン画面コンポーネント
    │   ├── admin/            # マスタ管理 & 売上分析サブタブ群 (全36ファイル: 35コンポーネント + types.ts)
    │   │   ├── AdminSubscriptionTab.tsx                 # サブスクリプション管理 (プラン・Stripe決済・ポータル)
    │   │   ├── AdminTableBatchQrPrintModal.tsx          # 卓スタンド用 QR コード一括 PDF 印刷モーダル
    │   │   ├── AdminFloorsTab.tsx / AdminFloorModal.tsx # フロアマスタ管理
    │   │   ├── AdminPrintersTab.tsx                     # プリンター総合設定・QR出力先設定
    │   │   ├── AdminLogicalPrintersTab.tsx / AdminLogicalPrinterModal.tsx # 論理プリンター設定
    │   │   ├── AdminPhysicalPrinterModal.tsx            # 物理プリンター設定 (IP/ポート等)
    │   │   ├── AdminPrinterRoutingRuleModal.tsx         # プリンタールーティングルール設定
    │   │   ├── AdminStoreTab.tsx                        # 店舗設定 (インボイス登録番号、店舗コード)
    │   │   ├── AdminMenuBooksTab.tsx / AdminMenuBookModal.tsx # メニューブック (表示モード設定)
    │   │   ├── AdminReceiptReissueTab.tsx               # レシート/領収書再発行 (部門別プリンター対応)
    │   │   └── ... (カテゴリ・商品・卓・決済種別・スタッフ・売上履歴等の各種タブ/モーダル)
    │   ├── staff/            # スタッフサブビュー (Handy入力 / 決済・領収書・割勘画面 / DirectActionView)
    │   ├── AdminScreen.tsx   # マスタ管理・売上分析メイン画面
    │   ├── CustomerScreen.tsx # モバイル向け QR 注文画面
    │   ├── CustomerTabletScreen.tsx # 10インチタブレット向け高機能 QR 注文画面
    │   ├── KdsScreen.tsx     # 調理管理 (KDS) 画面
    │   ├── LandingPageScreen.tsx # SaaS サービス紹介ランディングページ (`?view=lp`)
    │   ├── LoginScreen.tsx   # スタッフログイン & 新規店舗セルフサインアップ画面 (ログイン/新規登録タブ)
    │   ├── SeatsScreen.tsx   # 店舗座席稼働モニター画面 (空席起票・着席卓追加注文ハンディ遷移)
    │   ├── StaffScreen.tsx   # スタッフ伝票一覧・詳細画面
    │   └── TableQrListScreen.tsx # 卓用 QR コード一覧・発行画面 (customer-qr / cust-tablet-qr)
    ├── App.tsx         # ルーティング・全体状態管理メイン
    ├── constants.ts    # ビュー定義・定数
    ├── main.tsx        # エントリポイント
    ├── styles.css      # 全体スタイル (CSS変数、100vh固定レイアウト、LPスタイル)
    └── types.ts        # TypeScript 型定義
```

## 2. 主要モジュールの役割
### 2.1 `src/lib/`
- **`domProtection.ts`**: Google Chrome/Edge などのブラウザ翻訳機能が React の仮想 DOM ノード（`<font>` タグ挿入等）を書き換えることで発生する `removeChild` / `insertBefore` の JavaScript 例外（クラッシュ）を防止する Node プロトタイプパッチ。
- **`staffReadApi.ts`**: Cloudflare Workers + D1 バックエンド通信クライアント。新規店舗セルフサインアップ、伝票・マスタの同期に加え、動的プリンタールーティング印刷、卓用 QR コード印刷、インボイス番号管理、フロアマスタ API、サブスクリプションステータス取得、Stripe Checkout / Customer Portal セッション発行 API を提供。
- **`publicCustomerApi.ts`**: 顧客端末用 QR 注文通信 API。
- **`firebase.ts`**: Firebase Authentication によるスタッフログイン管理。
- **`priceUtils.ts`**: 店舗標準税率 (10%) / 軽減税率 (8%) および税込/税抜表示の計算モジュール。

### 2.2 `src/hooks/`
- **`useAuth.ts`**: Firebase Authentication によるスタッフログイン・新規店舗セルフサインアップ、店舗スラッグ厳格検証（ログイン中アカウントと接続先店舗の不一致防止）、セッションストレージおよび URL クエリパラメータへの永続化管理。
- **`useDataLoading`**: データ初期ロードおよび定期自動更新のオーケストレーター。フロア、プリンター、インボイス、サブスクリプション情報を含むマスタを同期。
- **`useStaffData` / `useStaffOperations`**: 伝票データ保持および注文入力・伝票加算・テンキー会計・KDSステータス変更。1階層/2階層カテゴリおよび商品重複排除に対応。サブスクリプション失効時の Feature Gate 書き込み制限を制御。
- **`useAdminForm` / `useAdminOperations`**: 各種マスタ（メニュー、トッピング、店舗、決済種別、卓配置、フロア、論理/物理プリンター、ルーティングルール、サブスクリプション等）および売上データのミューテーション。

### 2.3 `src/screens/` & `src/components/`
- **`LandingPageScreen.tsx`**: SaaS サービス紹介ランディングページ (`?view=lp`)。料金プラン、機能解説、FAQ、セルフサインアップへの CTA。
- **`OnboardingWizardModal.tsx`**: 新規登録店舗向けの対話型セットアップウィザード。店舗基本情報、卓配置、初期商品登録、テスト注文完了までの 4 ステップをナビゲート。
- **`SubscriptionExpiredModal.tsx`**: サブスクリプション期限切れ・失効時のブロックモーダル。プラン更新・Stripe 決済画面へ誘導。
- **`LoginScreen.tsx`**: スタッフログイン画面。店舗名・スラッグ・メールアドレス・パスワード入力による「新規店舗登録」タブを併設し、初期卓・初期管理者アカウントの即時開設に対応。
- **`CustomerTabletScreen.tsx`**: 10インチタブレット専用設計の注文画面。多言語切替、トッピング選択、誤操作防止ロックを搭載。単一/二重カテゴリ表示モードに対応。
- **`StaffScreen.tsx`**: スタッフ画面。`isHandyMode` による `StaffHandyView` (ハンディ注文特化ビュー: `?view=handy`)、`StaffPaymentView` (個別割勘・まとめ会計・テンキー決済・正式領収書発行) を統合。卓用QR印刷にも対応。
- **`AdminScreen.tsx`**: 売上分析、レシート再発行、各種マスタ、フロア管理、プリンター設定、サブスクリプション管理サブタブを切り替え表示。
- **`TableQrListScreen.tsx`**: モバイルおよびタブレット向け卓別 QR コード一覧画面。一括印刷およびプリンタールーティングに対応。

## 3. テスト
- **Playwright (`tests/`)**:
  - E2E テストによる Customer 注文 → KDS 調理 → Staff 会計の一巡フロー検証。
  - サブスクリプション機能制限（Feature Gate）および Stripe Webhook 結合検証。

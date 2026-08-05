# Lite App v4 仕様定義 (SPECIFICATION)

## 1. 概要
Lite App v4 は、飲食店向けの次世代 POS/OES (Order Entry System) 高機能 Web アプリケーションプロトタイプです。
React 19 + Vite 7 + TypeScript 5 をベースとしたシングルページアプリケーション (SPA) であり、ローカル開発での HTTPS アクセスをサポートする `@vitejs/plugin-basic-ssl` が導入されています。バックエンドには Cloudflare Workers + Cloudflare D1 (SQLite) および Firebase Auth を使用しています。

## 2. アーキテクチャ
### 2.1 画面管理 (View Switching)
`App.tsx` または AppSidebar / AppLauncher からビューを切り替えます。
主なビューは以下の通りです：
- `staff`: スタッフ向け伝票一覧・作成・明細・会計画面
- `customer`: スマートフォン向け QR 注文画面
- `cust-tablet`: 10インチタブレット向け QR 注文画面 (高度化されたUIレイアウト・トッピング選択・多言語対応)
- `kds`: キッチン向け調理・提供管理画面 (Kitchen Display System)
- `seats`: 店舗座席稼働モニター画面
- `admin`: マスタメンテナンス & 売上分析画面 (メニュー、カテゴリ、サブカテゴリ、トッピング、店舗、スタッフ、決済種別、卓配置、売上集計、レシート再発行)
- `login`: スタッフログイン画面

### 2.2 データ連携・開発環境
- **Staff / KDS / Admin / Seats**: Cloudflare Workers API (`staffReadApi.ts`) を介して Cloudflare D1 上の実データと同期。
- **Customer**: `publicCustomerApi.ts` (Cloudflare Workers) を経由した顧客用公開非認証アクセス。
- **SSL開発対応**: Vite 基本 SSL プラグイン (`@vitejs/plugin-basic-ssl`) を使用したローカル HTTPS 接続およびカメラ/QR スキャナー開発サポート。
- **認証**: Firebase Auth (`firebase.ts`) および Worker トークン認証 (`useAuth.ts`)。

### 2.3 モジュール構成 (Hooks & Lib)
大規模ロジックを独立したカスタムフックおよびライブラリに集約：
- **`useDataLoading`**: データ読み込みおよびバックグラウンドポリング統合管理。
- **`useAdminOperations` / `useAdminForm`**: 管理画面のマスタ更新・CRUD 操作およびフォーム状態管理。
- **`useStaffData` / `useStaffOperations`**: 伝票・注文明細・テンキー会計・KDSステータス変更・伝票加算アクション。
- **`useCustomerFlow`**: QR 注文カスタマー画面の状態および注文処理。
- **`useAuth`**: スタッフ認証セッションの管理。
- **`priceUtils.ts`**: 税込/税抜表示切り替えおよび標準税率 (10%) / 軽減税率 (8%) 計算。

## 3. 主要機能
### 3.1 注文 (Customer / Staff / Handy)
- **高度化 QR タブレット注文 (Cust-Tablet)**: 10インチタブレット専用レイアウト (`CustomerTabletScreen.tsx`)。トッピング指定、日/英言語切替、営業時間外判定、注文履歴確認モーダルを搭載。
- **ハンディ入力 (StaffHandyView)**: スタッフ画面から起動する簡易ハンディ入力。カテゴリ別検索、トッピング設定、買い物かごからの厨房一括送信。

### 3.2 会計・決済 (StaffPaymentView)
- **決済フロー**: 伝票選択 → 支払方法選択 → 預かり金額テンキー入力 → 会計確定。
- **伝票加算 (まとめ会計)**: 複数伝票をまとめた合算会計。
- **高度な会計**: 定額値引き・定率割引、個別会計、人数指定割勘。

### 3.3 座席・調理管理 (Seats / KDS)
- **座席モニター (Seats)**: 店舗テーブルの稼働・着席・未決済状態のリアルタイム可視化。
- **調理管理 (KDS)**: 未調理 (NEW) → 調理中 (COOKING) → 提供済み (SERVED) の進捗切り替え。

### 3.4 マスタ管理 & 売上分析 (Admin)
- **マスタ管理**: メニューブック、カテゴリ、サブカテゴリ、商品、トッピング、店舗設定、スタッフ、決済種別、卓配置 (Placements) の登録・編集。
- **売上分析**: 日別・時間帯別・カテゴリ別・サブカテゴリ別・商品別・決済種別売上データの集計およびレシート印刷/再発行。

## 4. UI/UX 方針
- **ビューポート制約**: 100vh 固定レイアウト。画面全体の誤スクロールを抑制し、内部スクロールを採用。
- **ダークモード**: 視認性に優れたダークテーマ。

## 5. 技術スタック
- **Frontend**: React 19, Vite 7 (`@vitejs/plugin-basic-ssl`), TypeScript 5, Vanilla CSS (`styles.css`)
- **Backend / Auth**: Cloudflare Workers, Cloudflare D1 (SQLite), Firebase Auth
- **Testing**: Playwright (`tests/`)

## 6. 制約事項・課題
- **リアルタイム同期**: 定期ポリング方式に基づく同期を行っており、WebSocket 等へのさらなる最適化が将来の課題。

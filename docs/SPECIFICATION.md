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
- `customer-qr`: モバイル向け 卓別 QR コード発行・表示画面 (`TableQrListScreen`)
- `cust-tablet-qr`: タブレット向け 卓別 QR コード発行・表示画面 (`TableQrListScreen`)
- `kds`: キッチン向け調理・提供管理画面 (Kitchen Display System)
- `seats`: 店舗座席稼働モニター画面
- `admin`: マスタメンテナンス & 売上分析画面 (メニュー、カテゴリ、サブカテゴリ、トッピング、店舗、スタッフ、決済種別、卓配置、フロア、プリンター、売上集計、レシート再発行)
- `login`: スタッフログイン画面

### 2.2 データ連携・開発環境
- **Staff / KDS / Admin / Seats**: Cloudflare Workers API (`staffReadApi.ts`) を介して Cloudflare D1 上の実データと同期。
- **Customer**: `publicCustomerApi.ts` (Cloudflare Workers) を経由した顧客用公開非認証アクセス。
- **SSL開発対応**: Vite 基本 SSL プラグイン (`@vitejs/plugin-basic-ssl`) を使用したローカル HTTPS 接続およびカメラ/QR スキャナー開発サポート。
- **認証**: Firebase Auth (`firebase.ts`) および Worker トークン認証 (`useAuth.ts`)。

### スタッフ認証・DBテーブル仕様 (Firebase Auth & Staff Tables)
- **Firebase Authentication**: スタッフのログイン本人確認・認証および UID (`auth_user_id`) の発行を担当。
- **`staff_users` テーブル (使用中)**: 店舗に所属するスタッフのプロファイル・権限マスタ。Firebase の UID (`auth_user_id`) に対し、店舗ごとの表示名 (`display_name`)、権限ロール (`role_type`: `ADMIN` / `STAFF` / `KDS`)、有効フラグ (`is_active`) を紐付けて保持・管理（マスタ管理画面の「スタッフ一覧」で編集可能）。
- **`staff_sessions` テーブル (非推奨・互換用)**: 開発初期の独自セッション管理用テーブル。Firebase Auth 導入後はセッション維持が Firebase SDK およびクライアント側 (`sessionStorage` 等) へ移行したため、アプリケーションの主要フローからは実質使われていません。

### 2.3 モジュール構成 (Hooks & Lib)
大規模ロジックを独立したカスタムフックおよびライブラリに集約：
- **`useDataLoading`**: データ読み込みおよびバックグラウンドポリング統合管理（フロア・プリンター・インボイス情報ロード含む）。
- **`useAdminOperations` / `useAdminForm`**: 管理画面のマスタ更新・CRUD 操作およびフォーム状態管理（フロア、プリンター、インボイス番号等）。
- **`useStaffData` / `useStaffOperations`**: 伝票・注文明細・テンキー会計・KDSステータス変更・伝票加算アクション。1階層/2階層カテゴリおよび商品重複排除対応。
- **`useCustomerFlow`**: QR 注文カスタマー画面の状態および注文処理（単一/二重カテゴリ表示モード対応）。
- **`useAuth`**: スタッフ認証セッションの管理。
- **`priceUtils.ts`**: 税込/税抜表示切り替えおよび標準税率 (10%) / 軽減税率 (8%) 計算。

## 3. 主要機能
### 3.1 注文 (Customer / Staff / Handy)
- **高度化 QR タブレット注文 (Cust-Tablet)**: 10インチタブレット専用レイアウト (`CustomerTabletScreen.tsx`)。メニューブックの単一/二重カテゴリ表示モードに対応。トッピング指定、日/英言語切替、営業時間外判定、注文履歴確認モーダルを搭載。
- **ハンディ入力 (StaffHandyView)**: スタッフ画面から起動する簡易ハンディ入力。1階層カテゴリモード対応および商品重複排除により素早い入力が可能。カテゴリ別検索、トッピング設定、買い物かごからの厨房一括送信。

### 3.2 会計・決済 (StaffPaymentView)
- **決済フロー**: 伝票選択 → 支払方法選択 → 預かり金額テンキー入力 → 会計確定。
- **インボイス制度（適格請求書）対応**: 店舗マスタの登録番号 (`invoice_number`: T+13桁) をレシート・領収書に印字。税率別（10%標準 / 8%軽減）対象金額と消費税額を出力。
- **正式領収書発行**: 発行種別を「レシート」と「領収書」で切り替え可能。宛名・但し書きを指定した領収書レイアウト印刷に対応。
- **自動割勘・高度な会計**: 来店人数に基づく割勘自動計算、個別会計（個別会計メモラベル付与、簡易レシート印字）、定額値引き・定率割引、伝票加算 (まとめ会計)。
- **レシート発行・再発行**: 会計完了時の自動/手動レシート印刷。管理画面からのレシート再発行（部門別プリンター出力、通常会計レシートとのフォーマット統一、ブラウザ印刷ダイアログ抑制）。

### 3.3 プリンタールーティング & 印刷管理 (Printer Routing)
- **動的プリンタールーティング**: 物理プリンター (`PhysicalPrinter`) と論理プリンター (`LogicalPrinter`) の分離。キッチン注文伝票と会計レシートプリンターの個別設定。部門・フロア・商品カテゴリ別のルーティングルール (`PrinterRoutingRule`)。
- **卓用 QR コード印刷**: 卓別 QR コード一覧画面 (`TableQrListScreen`) およびスタッフ画面からの印刷に対応。プリンター設定タブで QR コード出力先プリンターを制御可能。

### 3.4 座席・調理管理 (Seats / KDS)
- **座席モニター (Seats)**: 店舗テーブルの稼働・着席・未決済状態のリアルタイム可視化。フロア別の絞り込みに対応。
- **調理管理 (KDS)**: 未調理 (NEW) → 調理中 (COOKING) → 提供済み (SERVED) の進捗切り替え。

### 3.5 マスタ管理 & 売上分析 (Admin)
- **フロア管理 (Floors)**: フロアマスタの追加・編集、テーブルと `floor_id` の連携。
- **プリンター設定 (Printers)**: 物理プリンター、論理プリンター、ルーティングルール、QRコード印刷先の一元管理。
- **メニューブック管理**: 単一カテゴリ / 二重カテゴリ表示モードの切り替え設定。
- **商品マスタ管理**: WebP 変換・最大 400px リサイズによる画像最適化、カテゴリコード (`category_code`) 設定。
- **店舗設定**: 店舗コード (`store_code`)、インボイス登録番号 (`invoice_number`) の設定。
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

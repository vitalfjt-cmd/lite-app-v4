# Lite App v2 仕様定義 (SPECIFICATION)

## 1. 概要
Lite App v2 は、飲食店向けの次世代 POS/OES (Order Entry System) プロトタイプです。
React + Vite + TypeScript をベースとしたシングルページアプリケーション (SPA) であり、バックエンドには Cloudflare Workers + D1 を使用しています（Supabase から移行済み）。

## 2. アーキテクチャ
### 2.1 画面管理 (View Switching)
URL パラメータの `?view=...` またはハッシュフラグメントを使用して画面を切り替えます。
主なビューは以下の通りです：
- `customer`: モバイル向け QR 注文画面
- `cust-tablet`: 10インチタブレット向け QR 注文画面
- `staff`: スタッフ向け伝票管理・会計画面
- `kds`: キッチン向け調理管理画面 (Kitchen Display System)
- `admin`: メニュー・店舗・スタッフ管理画面

### 2.2 データ連携
- **Staff / KDS / Admin**: Cloudflare Workers API による認証とデータ連携。リアルタイム性は API ポリングまたは今後の実装予定。
- **Customer**: `public-customer-api` (Cloudflare Workers) を経由した非認証アクセス。
- **Prototype API**: `staffReadApi.ts` を通じて Cloudflare D1 上の実データにアクセス。開発時はローカルの Wrangler D1 (SQLite) を参照。

### 2.3 モジュール構成 (Hooks)
大規模なロジックを `App.tsx` から分離し、機能単位でカスタムフックに集約しています：
- **`useDataLoading`**: データ取得のオーケストレーター。認証状態に応じた初期データロードや定期更新を管理。
- **`useAdminOperations`**: 管理画面の CRUD 操作（ミューテーション）ロジック。
- **`useAdminForm`**: 管理画面の入力フォーム状態および編集フローの管理。
- **`useStaffData`**: スタッフ画面で共有されるドメイン状態（伝票、注文、マスターデータ）。
- **`useCustomerFlow`**: カスタマー画面の状態（カート、ステップ）と注文アクションの管理。
- **`useStaffOperations`**: スタッフによる注文操作、ステータス変更、会計処理などのアクション管理。
- **`useAuth`**: Supabase および D1 プロトタイプ認証の統合管理。

## 3. 主要機能
### 3.1 注文 (Customer / Staff)
- **QR 注文**: テーブルごとの QR コードからメニューを閲覧し、カートに入れて注文。
- **ハンディ入力 (Staff)**: スタッフによる直接注文入力。数量変更、取消、ステータス更新が可能。

### 3.2 会計 (Staff)
- **決済フロー**: 伝票選択 → 支払方法選択 → 完了。
- **高度な会計**: 
  - 値引き・割引機能。
  - 個別会計 (個別割勘)。
  - 単純割勘 (人数指定)。
- **テンキー入力**: 金額入力用のモーダルテンキーを実装。

### 3.3 調理管理 (KDS)
- **ステータス管理**: `未調理 (NEW)` → `調理中 (COOKING)` → `提供済み (SERVED)` の遷移。
- **表示切替**: 全件表示とテーブル別表示の切り替え。

## 4. デザイン・UI/UX 方針
- **ビューポート制約**: 100vh 固定レイアウト。グローバルスクロールを禁止し、内部コンテナでスクロールを実現 (特にタブレット環境での誤操作防止)。
- **レスポンシブ**:
  - `customer`: スマートフォンに最適化。
  - `staff` / `kds`: 10インチ以上のタブレットに最適化。高密度な情報表示。
- **ビジュアル**: ダークモードを基調としたモダンなデザイン。Lucide アイコン、スムーズなトランジション。

## 5. 技術スタック
- **Frontend**: React 19, Vite, TypeScript, Vanilla CSS (styles.css)
- **Backend**: Cloudflare Workers, Cloudflare D1 (SQLite)
- **Testing**: Playwright (E2E テスト, 負荷シミュレーション)

## 6. 制約事項・課題
- **更新の安定性**: 一部の環境でデータ更新が不安定な場合があり、Realtime 購読の最適化が必要。
- **レイアウト**: 10インチタブレットの特定解像度において、決済ボタンが隠れる等のオーバーフロー問題の継続的な修正が必要。

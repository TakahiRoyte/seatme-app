# SeatMe

## 飲食店向け空席・混雑・順番管理プラットフォーム構想

---

## 1. サービスの本質（Why）

本サービスは単なる「空席表示」ではない。

> 来店前の顧客の意思決定を加速し、  
> 空席を“売上”に変えるための  
> Physical × Digital 来店フローOS

- 来店者：上がる前に後悔しない  
- 従業員：余計な対応が減る  
- オーナー：回遊・平準化・売上改善が起きる  

---

## 2. 解決したい構造課題

### 2階以上の飲食店が抱える問題
- 外から混雑状況が見えない
- 「上がったのに満席」の不確実性コスト
- 空席があっても選ばれにくい

### 結果
- 機会損失
- 行列・クレーム・無駄対応
- 特定店舗への集中とビル全体の非効率

---

## 3. ユーザー別 利用シーン整理

### 3.1 来店者（エンドユーザー）

#### 主なユースケース
- 通行中に「今入れるか？」を知りたい
- 4人グループで入れるか判断したい
- 並ばずに順番待ちしたい
- 待ち時間を有効活用したい

#### 欲しい価値
- 判断の速さ
- 不確実性の低減
- 並ばない体験

---

### 3.2 従業員（店舗スタッフ）

#### 主なユースケース
- 忙しいピーク時の案内・電話対応
- 行列管理・呼び出し
- 空席状況の説明

#### 欲しい価値
- 作業が増えない
- クレームを減らしたい
- 判断をシステムに任せたい

---

### 3.3 店舗オーナー / ビルオーナー

#### 主なユースケース
- 空席時間の把握
- ピークの平準化
- テナント全体の回遊改善
- データを使った改善・リーシング

#### 欲しい価値
- 売上改善
- 運営の見える化
- 投資対効果の説明材料

---

## 4. 情報設計（レイヤー構造）

### レイヤー0：入口・通行人向け（0.5秒判断）

**表示場所**
- ビル入口サイネージ
- 店舗前簡易表示

**情報（最小）**
- 🟢 すぐ入れそう  
- 🟡 少し待つかも  
- 🔴 今は難しい  
- 店名 / 階数

**原則**
- 数字を出さない  
- 人数条件を出さない  

---

### レイヤー1：立ち止まった人向け（QR / Web）

**情報**
- 状況補足（カウンター中心 / テーブル少なめ 等）
- 待ち時間レンジ（0–10分 / 10–20分）
- 席タイプ（カウンター / テーブル / 個室）
- 喫煙 / 禁煙
- ラストオーダー

---

### レイヤー2：条件付き判断（詳細）

**対象**
- 4人以上のグループ
- 時間制約がある人

**情報例**
- 「4名テーブルはやや厳しめ」
- 「分かれて着席OK」
- 「次の空き見込み：10–20分」

**原則**
- 確定情報は出さない  
- “可能性”として表現する  

---

## 5. 機能レイヤー構成（将来含む）

### レイヤーA：Decision Layer（来店前判断）
- 空席情報のリアルタイム配信
- 複数店舗一覧表示
- 配信画面のカスタマイズ

---

### レイヤーB：Pre-Check-in Layer（並ばない）
- 店頭QRチェックイン
- 並び順管理（番号発行）
- 順番接近時の通知（LINE / SMS / Web Push）

---

### レイヤーC：Operation Layer（省力化）
- 客自身によるチェックイン
- 着席完了のワンタップ操作
- 未応答者の自動スキップ
- キャンセル自動処理

---

### レイヤーD：Insight Layer（分析・経営）
- 混雑・待ち時間分析
- 人数構成分析
- 空席状態遷移（🟢🟡🔴）分析
- 複数店舗ダッシュボード
- ビル全体の回遊ヒートマップ

---

## 6. 機能ロードマップ

| フェーズ | 主な機能 | 目的 |
|---|---|---|
| MVP | 空席表示 / 一覧 / QR | 判断を速くする |
| Phase 1 | チェックイン / 順番管理 / 通知 | 並ばせない |
| Phase 2 | 分析 / ダッシュボード | 売上改善・最適化 |

---

## 7. MVPの設計原則

### 原則1：精度より継続
- 高精度自動検知は後回し
- 手動＋半自動で成立させる

### 原則2：曖昧さはUIが吸収
- 人数・時間はレンジ表現
- 状況変動は明示

### 原則3：人が責任を負わない
- クレームはUIで予防
- 確約表現をしない

### 原則4：すべてをイベントとして記録
- check_in
- seat_assigned
- state_changed
- skipped
- canceled

→ 後から分析可能

---

## 8. 競合との差別化観点

- 大規模施設向け・高精度路線とは異なる
- 小〜中規模ビル / 雑居ビル特化
- 導入が軽い
- 運用が重くならない
- 入口UXに特化

---

## 9. 最終的に提供する価値

> 「このビルは、  
> 並ばず・迷わず・後悔せずに  
> 飲食できる」

- 来店者：安心して選べる
- 従業員：仕事が減る
- オーナー：空席が利益に変わる

---

## 10. 次の検討ステップ（推奨）

1. 昼ピーク30分の時系列シミュレーション  
2. MVPに載せる情報の最小セット確定  
3. チェックイン導入時のUX詳細設計  
4. ビルオーナー向けROIモデル化  

---

## 11. Techスタック

### Frontend
- **Framework**: SvelteKit (Svelte 5)
  - App Router architecture
  - Server Components & Server Actions
  - TypeScript

### Backend
- **Runtime**: Node.js 20+
- **API**: SvelteKit API Routes
- **Real-time Updates**: Server-Sent Events (SSE)
  - Note: On Vercel, SSE connections have 60s timeout on Hobby plan
  - Fallback to polling available for production stability

### Database
- **Development**: SQLite (local file-based)
- **Production**: [Turso](https://turso.tech/) (distributed libSQL)
  - SQLite-compatible cloud database
  - Free tier: 9GB storage, 1B row reads/month, 25M row writes/month
- **ORM**: Drizzle

### Deployment & Infrastructure
- **Hosting**: [Vercel](https://vercel.com/)
  - Serverless deployment
  - Free tier: 100GB bandwidth/month, unlimited deployments
  - Automatic HTTPS, CDN, and edge network
- **CI/CD**: GitHub integration with Vercel
- **Environment Management**: 
  - Local: `.env` (gitignored)
  - Production: Vercel environment variables

### Development Tools
- **Linting**: ESLint 9
- **Type Checking**: TypeScript strict mode
- **Package Manager**: pnpm
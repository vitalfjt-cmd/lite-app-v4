import { useState } from 'react'

type Props = {
  onStartTrial: () => void
  onLogin: () => void
  onDemoCustomer: () => void
  onDemoStaff: () => void
}

export function LandingPageScreen({
  onStartTrial,
  onLogin,
  onDemoCustomer,
  onDemoStaff,
}: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const faqs = [
    {
      q: '現在使っているレジ（紙伝票やガチャレジ、POSレジ）とどうやって併用しますか？',
      a: 'Lite Orderは既存のレジを置き換えることなく並走してご利用いただけます。お客様のスマホや卓上タブレットで注文を受け、画面に自動集計される「参考小計」や「注文明細」を確認しながら、現在お使いのレジへ手動で金額を入力してお会計いただきます。高額なレジ買い替えや連携開発費用は一切不要です。',
    },
    {
      q: '当システム単体で会計やプリンター印刷（レシート・キッチンプリンター）まで完結させることはできますか？',
      a: '可能です！Lite OrderにはPOSレジ画面・テンキー決済・領収書発行機能に加え、厨房へのキッチンプリンター自動出力機能も備わっています。これらを活用して本格運用を行う場合は、以下の機器とネットワーク環境をご用意いただく必要があります：\n\n【必要な機材】\n① 会計用端末（PCまたはタブレット）\n② レシートプリンター（ネットワーク対応ESC/POSプリンター）\n③ キャッシュドロワー（プリンター連動型、または手動プッシュ式）\n④ キッチンプリンター（厨房で紙伝票を出力したい場合／ESC/POS規格）\n\n【ネットワーク・IP設定上の前提条件】\n・レシートやキッチンプリンターへの印刷指示を行うため、店内のアクセスポイント（AP）やルーター、PC等において、各プリンターへのローカル固定IPアドレス設定が必要です。\n・本システムは一般的なIPv4ローカルネットワーク環境を前提として設計されており、IPoE（IPv6等）環境のみを前提とした設計にはなっておりません。ネットワーク機器の設定環境をご確認ください。',
    },
    {
      q: '既存のPOSレジやキャッシュドロアとシステム連携（自動データ同期）はできますか？',
      a: 'いいえ、外部のPOSレジやキャッシュドロアとのシステム的なデータ自動連携（API連動）は行いません。あえて高額なレジ連携システムを省くことで「月額2,980円・初期費用0円」の低価格を実現しています。注文受付と厨房伝達はLite Orderで行い、最終的な会計打ち込みは手元のレジで行う「シンプルな併用運用」となります。',
    },
    {
      q: '高額な専用タブレットやプリンターを購入する必要がありますか？',
      a: '不要です。専用のハードウェア購入や配線工事は一切不要です。お客様のスマートフォン、店舗の既存スマホ・タブレット・PCなどのWebブラウザ（SafariやChrome）ですぐに動きます。卓上に置くQRコードも、管理画面からお手持ちのプリンターでA4用紙に印刷するだけで用意できます。',
    },
    {
      q: 'テーブルのQRコードは、お客様が入れ替わるたびに都度印刷が必要ですか？',
      a: 'いいえ、都度印刷は一切不要です！テーブルに常設・固定で掲示しておくだけで運用できます。お客様が注文した瞬間に動的な伝票トークンが発行され、レジ側で会計完了（伝票クローズ）するとそのセッションは自動で注文不可になります。次のお客様が同じQRを読み込んでも、前の客のデータは引き継がれず安全に新しく始まります。',
    },
    {
      q: '会計後に客側のスマホから勝手に注文される心配はありませんか？',
      a: 'ありません。レジ側で会計完了（伝票クローズ）処理を行った時点で、お客様のブラウザが保持している伝票トークンはサーバー側で無効化されます。以降に注文ボタンを押しても「会計済みのため追加注文できません」と即座に遮断されます。',
    },
    {
      q: '無料トライアル終了後に自動で課金されますか？',
      a: 'いいえ、勝手に課金されることはありません。14日間の無料トライアル期間中はクレジットカードの登録なしでお試しいただけます。継続してご利用いただく場合のみ、管理画面から月額プラン（2,980円）をご契約いただきます。',
    },
    {
      q: '解約の縛りや違約金はありますか？',
      a: '一切ありません。いつでも管理画面から1クリックで解約が可能です。数ヶ月の長期契約縛りや違約金などもございませんので、繁忙期だけのお試し導入にも最適です。',
    },
  ]

  return (
    <div className="lp-container">
      {/* ナビゲーションバー */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="lp-logo-icon">⚡</span>
            <span className="lp-logo-text">Lite Order</span>
            <span className="lp-logo-badge">SaaS</span>
          </div>

          <nav className="lp-nav-links">
            <a href="#features">機能</a>
            <a href="#why-us">選ばれる理由</a>
            <a href="#steps">導入の流れ</a>
            <a href="#pricing">料金プラン</a>
            <a href="#faq">よくある質問</a>
          </nav>

          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" type="button" onClick={onLogin}>
              ログイン
            </button>
            <button className="lp-btn-cta" type="button" onClick={onStartTrial}>
              14日間無料で試す
            </button>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="lp-hero">
        <div className="lp-hero-bg-glow"></div>
        <div className="lp-hero-inner">
          <div className="lp-pill-badge">
            <span className="lp-pill-sparkle">✨</span>
            <span>初期費用0円・最短30分で今日から使えるスマホオーダー</span>
          </div>

          <h1 className="lp-hero-title">
            レジはそのままでOK。
            <br />
            <span className="lp-gradient-text">月額2,980円</span>で始める
            <br />
            スマホオーダー
          </h1>

          <p className="lp-hero-subtitle">
            高額な専用機材やレジの入れ替え・連携開発は一切不要。
            <br />
            管理画面から全卓QRコードをA4用紙に印刷して卓上に置くだけ。
            <br />
            注文はスマホから直接厨房へ届き、お会計は画面の小計を見ながら手元のレジを打つだけ。オーダー業務の手間を劇的に削減します。
          </p>

          <div className="lp-hero-cta-group">
            <button className="lp-btn-primary-large" type="button" onClick={onStartTrial}>
              <span>14日間の無料トライアルを始める</span>
              <span className="lp-btn-arrow">→</span>
            </button>
            <div className="lp-demo-buttons">
              <button className="lp-btn-secondary" type="button" onClick={onDemoCustomer}>
                📱 客席スマホ注文デモ
              </button>
              <button className="lp-btn-secondary" type="button" onClick={onDemoStaff}>
                🖥️ 厨房・管理画面デモ
              </button>
            </div>
          </div>

          <div className="lp-hero-guarantees">
            <span>✓ クレジットカード登録不要</span>
            <span>✓ 初期費用・機器費用 0円</span>
            <span>✓ 最短30分で導入完了</span>
            <span>✓ 契約期間の縛りなし</span>
          </div>

          {/* ヒーロービジュアル（プロダクトモックアップ） */}
          <div className="lp-hero-visual">
            <div className="lp-mockup-wrapper">
              {/* スマホモック */}
              <div className="lp-mock-phone">
                <div className="lp-phone-notch"></div>
                <div className="lp-phone-screen">
                  <div className="lp-phone-header">
                    <span className="lp-tag">卓番: テーブル 3</span>
                    <strong>ご注文メニュー</strong>
                  </div>
                  <div className="lp-phone-item">
                    <span className="lp-item-emoji">🥩</span>
                    <div className="lp-item-info">
                      <div className="lp-item-name">特選和牛カルビ</div>
                      <div className="lp-item-sub">タレ・ネギトッピング</div>
                    </div>
                    <span className="lp-item-price">¥1,280</span>
                  </div>
                  <div className="lp-phone-item">
                    <span className="lp-item-emoji">🍺</span>
                    <div className="lp-item-info">
                      <div className="lp-item-name">生ビール（中）</div>
                    </div>
                    <span className="lp-item-price">¥580</span>
                  </div>
                  <div className="lp-phone-item">
                    <span className="lp-item-emoji">🍚</span>
                    <div className="lp-item-info">
                      <div className="lp-item-name">ライス（大盛り）</div>
                    </div>
                    <span className="lp-item-price">¥350</span>
                  </div>
                  <div className="lp-phone-button">注文を確定する (3点)</div>
                </div>
              </div>

              {/* 厨房KDSモック */}
              <div className="lp-mock-kds">
                <div className="lp-kds-head">
                  <div className="lp-kds-title">
                    <span className="lp-live-dot"></span>
                    <span>厨房ディスプレイ (KDS)</span>
                  </div>
                  <span className="lp-kds-badge">リアルタイム連動</span>
                </div>
                <div className="lp-kds-body">
                  <div className="lp-kds-card urgent">
                    <div className="lp-kds-card-head">
                      <strong>卓 03</strong>
                      <span className="lp-time-badge">3分前</span>
                    </div>
                    <ul className="lp-kds-card-list">
                      <li>特選和牛カルビ × 1</li>
                      <li>生ビール（中） × 1</li>
                      <li>ライス（大） × 1</li>
                    </ul>
                    <div className="lp-kds-card-btn done">調理完了へ</div>
                  </div>
                  <div className="lp-kds-card">
                    <div className="lp-kds-card-head">
                      <strong>卓 01</strong>
                      <span className="lp-time-badge">8分前</span>
                    </div>
                    <ul className="lp-kds-card-list">
                      <li>極上牛タン塩 × 2</li>
                      <li>ハイボール × 2</li>
                    </ul>
                    <div className="lp-kds-card-btn">配膳完了</div>
                  </div>
                </div>
              </div>

              {/* A4印刷シートモック */}
              <div className="lp-mock-print-badge">
                <span className="print-icon">🖨️</span>
                <div className="print-badge-text">
                  <strong>A4印刷して卓に置くだけ</strong>
                  <span>都度印刷不要・固定QRコード対応</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* こんなお悩みありませんか？ */}
      <section className="lp-pain-points">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-eyebrow">CHALLENGES</span>
            <h2 className="lp-section-title">飲食店の現場でこんなお悩みはありませんか？</h2>
          </div>

          <div className="lp-pain-grid">
            <div className="lp-pain-card">
              <div className="lp-pain-icon">🏃‍♂️</div>
              <h3>注文取りでホールが駆け回り限界</h3>
              <p>
                「すいませーん！」と呼ばれるたびに手が止まり、料理の提供が遅れたり、ピーク時の注文取りこぼしが発生している。
              </p>
            </div>
            <div className="lp-pain-card">
              <div className="lp-pain-icon">💸</div>
              <h3>他社システムは初期費用が高すぎる</h3>
              <p>
                「初期費用30〜100万円」「月額1〜3万円」「専用タブレット何台も購入」など、小規模店には手が出ないシステムばかり。
              </p>
            </div>
            <div className="lp-pain-card">
              <div className="lp-pain-icon">📠</div>
              <h3>今のレジ運用を変えたくない</h3>
              <p>
                長年使い慣れたレジや紙伝票の運用があり、POSレジごと全部入れ替えるのはスタッフの負担も大きくリスクが高い。
              </p>
            </div>
          </div>

          <div className="lp-solution-banner">
            <span className="lp-solution-arrow">⬇️</span>
            <h3>すべて「Lite Order」が解決します！</h3>
            <p>
              既存レジ・会計運用は<strong>今のままで100%OK</strong>。
              <br />
              月額2,980円だけで、注文受付から厨房連携までの効率化を即日スタートできます。
            </p>
          </div>
        </div>
      </section>

      {/* 3つの選ばれる理由 */}
      <section className="lp-why-us" id="why-us">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-eyebrow">WHY CHOOSE US</span>
            <h2 className="lp-section-title">Lite Orderが小規模店舗に選ばれる3つの理由</h2>
          </div>

          <div className="lp-features-stacked">
            <div className="lp-feature-block">
              <div className="lp-feature-text">
                <span className="lp-feature-num">01</span>
                <h3>今のレジ・会計運用は一切変えなくてOK</h3>
                <p>
                  大手POSメーカーのように「レジ本体の買い替え」や「システム連携のための高額な改修工事」を迫ることはありません。ガチャレジ、POSレジ、紙伝票など、現在お使いのレジ・会計手順をそのまま続けられます。
                </p>
                <ul className="lp-check-list">
                  <li>高額なレジ買い替えやAPI連携開発コスト（数十万〜百万円）が完全ゼロ</li>
                  <li>システム連携をしないからこそ、どんなレジをお使いの店舗でも即日導入可能</li>
                  <li>画面に表示される参考小計と明細を見ながら、手元のレジを打つだけでスムーズにお会計完了</li>
                </ul>
                <div style={{ marginTop: '14px', fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>
                  ※POSレジやキャッシュドロアとのシステムデータ自動連携（API連動）は行いません。Lite Orderが集計した小計金額を見ながらレジ打ちしていただくシンプルな並走運用です。
                </div>
              </div>
              <div className="lp-feature-card-visual">
                <div className="lp-visual-box register-box">
                  <div className="box-title">既存レジはそのままでOK</div>
                  <div className="register-flow">
                    <span className="flow-step">客席スマホ注文</span>
                    <span className="flow-arrow">➔</span>
                    <span className="flow-step">厨房KDS</span>
                    <span className="flow-arrow">➔</span>
                    <span className="flow-step" style={{ background: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa' }}>小計を確認</span>
                    <span className="flow-arrow">➔</span>
                    <span className="flow-step current">手元のレジで会計</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-feature-block reverse">
              <div className="lp-feature-text">
                <span className="lp-feature-num">02</span>
                <h3>全卓QRをA4用紙に一括印刷して置くだけ</h3>
                <p>
                  管理画面の「全卓QR一括印刷」ボタンを押すだけで、店舗全テーブルのQRコードPOPがA4用紙に自動面付けされます。家庭用・事務所用のプリンターで印刷して卓上に置くだけで完了です。
                </p>
                <ul className="lp-check-list">
                  <li>配線工事やレシートプリンターの特殊設定は不要</li>
                  <li>お客様が入れ替わるたびにQRを都度印刷する手間ゼロ</li>
                  <li>PDFとして保存し、ラミネート加工やPOPスタンドに最適</li>
                </ul>
              </div>
              <div className="lp-feature-card-visual">
                <div className="lp-visual-box qr-sheet-box">
                  <div className="box-title">ワンクリックで全卓一括PDF出力</div>
                  <div className="qr-sheet-preview-mini">
                    <div className="mini-card">TABLE 1 📱</div>
                    <div className="mini-card">TABLE 2 📱</div>
                    <div className="mini-card">TABLE 3 📱</div>
                    <div className="mini-card">TABLE 4 📱</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-feature-block">
              <div className="lp-feature-text">
                <span className="lp-feature-num">03</span>
                <h3>月額2,980円の明朗ワンプライス（縛りなし）</h3>
                <p>
                  初期費用0円、月額2,980円（税込）のみ。テーブル数や端末台数による追加課金もありません。契約期間の縛りや解約金もないため、低リスクで今すぐ始められます。
                </p>
                <ul className="lp-check-list">
                  <li>業界最安級の月額2,980円固定</li>
                  <li>客席スマホ注文、厨房KDS、ハンディ、管理画面が全て使い放題</li>
                  <li>14日間の無料トライアルで効果を実感してから契約可能</li>
                </ul>
              </div>
              <div className="lp-feature-card-visual">
                <div className="lp-visual-box price-highlight-box">
                  <div className="price-big-label">月額利用料</div>
                  <div className="price-big-amount">
                    ¥2,980<span className="tax"> (税込)</span>
                  </div>
                  <div className="price-sub-note">初期費用 0円 / 解約金 0円</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 主要機能紹介 */}
      <section className="lp-features" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-eyebrow">FEATURES</span>
            <h2 className="lp-section-title">現場で本当に必要な機能だけを凝縮</h2>
            <p className="lp-section-desc">
              複雑な設定は排除し、忙しい飲食店の現場が直感的に迷わず使える画面設計を追求しました。
            </p>
          </div>

          <div className="lp-feature-grid">
            <div className="lp-grid-card">
              <div className="lp-grid-icon">📱</div>
              <h4>客席スマホQR注文</h4>
              <p>アプリのインストール不要。カメラでQRをかざすだけでメニューが開き、写真やトッピングを選んで即時注文できます。</p>
            </div>

            <div className="lp-grid-card">
              <div className="lp-grid-icon">🖥️</div>
              <h4>厨房ディスプレイ (KDS)</h4>
              <p>注文が入るとリアルタイムに厨房端末へ表示。注文経過時間によるカラー変化やワンタップ調理完了に対応。</p>
            </div>

            <div className="lp-grid-card">
              <div className="lp-grid-icon">📟</div>
              <h4>スタッフハンディ入力</h4>
              <p>ご年配のお客様など「スマホが苦手な方」には、スタッフがスマホから代理注文入力が可能。卓移動や数量変更も柔軟に対応。</p>
            </div>

            <div className="lp-grid-card">
              <div className="lp-grid-icon">📑</div>
              <h4>全卓QR一括A4印刷</h4>
              <p>管理画面からワンクリックで全卓のQRコードをA4用紙（またはPDF）に一括出力。卓上POPが数分で完成します。</p>
            </div>

            <div className="lp-grid-card">
              <div className="lp-grid-icon">🪟</div>
              <h4>客用常設タブレットモード</h4>
              <p>iPadやAndroidタブレットを卓上に常設する「タブレット注文」にも標準対応。PWAで全画面フルスクリーン動作します。</p>
            </div>

            <div className="lp-grid-card">
              <div className="lp-grid-icon">📊</div>
              <h4>売上・注文履歴・分析</h4>
              <p>日次・時間帯別・商品別の売上や客数をリアルタイムにグラフ集計。どのメニューが人気か一目で分かります。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 導入の流れ */}
      <section className="lp-steps" id="steps">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-eyebrow">HOW TO START</span>
            <h2 className="lp-section-title">最短30分、かんたん3ステップで開始</h2>
          </div>

          <div className="lp-steps-grid">
            <div className="lp-step-item">
              <div className="lp-step-badge">STEP 1</div>
              <h3>無料サインアップ</h3>
              <p>店舗名とメールアドレスを入力するだけ。30秒ですぐに店舗アカウントが開設されます。</p>
            </div>

            <div className="lp-step-item">
              <div className="lp-step-badge">STEP 2</div>
              <h3>メニューと卓を登録</h3>
              <p>直感的な管理画面で、商品名・価格・写真とテーブル番号を登録。エクセル等からのインポートも可能。</p>
            </div>

            <div className="lp-step-item">
              <div className="lp-step-badge">STEP 3</div>
              <h3>A4印刷して卓に置くだけ</h3>
              <p>全卓QRコードをA4印刷して卓上に設置。今日からお客様のスマホでオーダーが始まります！</p>
            </div>
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section className="lp-pricing" id="pricing">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-eyebrow">PRICING</span>
            <h2 className="lp-section-title">シンプルで透明な料金プラン</h2>
            <p className="lp-section-desc">追加オプション費用や端末ごとの追加料金は一切ありません。</p>
          </div>

          <div className="lp-pricing-wrapper">
            <div className="lp-price-card featured">
              <div className="lp-price-badge">14日間無料トライアル</div>
              <h3 className="lp-price-plan-name">Lite プラン</h3>
              <p className="lp-price-plan-desc">小規模飲食店の注文効率化に特化したオールインワンプラン</p>
              
              <div className="lp-price-figure">
                <span className="lp-price-currency">¥</span>
                <span className="lp-price-value">2,980</span>
                <span className="lp-price-period"> / 月 (税込)</span>
              </div>

              <div className="lp-price-meta">初期費用 0円 / 端末台数・卓数 無制限</div>

              <button className="lp-btn-primary-large" type="button" onClick={onStartTrial}>
                14日間無料で試してみる
              </button>

              <div className="lp-price-features-title">含まれるすべての機能:</div>
              <ul className="lp-price-features-list">
                <li>✓ 客席スマホQRコード注文（無制限）</li>
                <li>✓ 卓上常設タブレットモード（PWA）</li>
                <li>✓ リアルタイム厨房ディスプレイ（KDS）</li>
                <li>✓ スタッフハンディ注文入力</li>
                <li>✓ 全テーブルQRコード一括A4印刷（PDF出力）</li>
                <li>✓ メニュー・カテゴリ・トッピング管理</li>
                <li>✓ 売上・客数・時間帯別分析ダッシュボード</li>
                <li>✓ 契約期間の縛りなし・いつでも1クリック解約</li>
              </ul>
            </div>
          </div>

          {/* 競合他社比較表 */}
          <div className="lp-comparison-table-wrap">
            <table className="lp-comparison-table">
              <thead>
                <tr>
                  <th>比較項目</th>
                  <th className="highlight-col">Lite Order</th>
                  <th>大手POSメーカー</th>
                  <th>大手モバイルオーダー</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>初期費用</td>
                  <td className="highlight-col"><strong>0円</strong></td>
                  <td>30万円 〜 100万円</td>
                  <td>10万円 〜 30万円</td>
                </tr>
                <tr>
                  <td>月額費用</td>
                  <td className="highlight-col"><strong>2,980円 (税込)</strong></td>
                  <td>15,000円 〜 30,000円</td>
                  <td>10,000円 〜 20,000円</td>
                </tr>
                <tr>
                  <td>既存レジの併用</td>
                  <td className="highlight-col"><strong>そのまま併用（レジ変更不要）</strong></td>
                  <td>買い替え必須</td>
                  <td>指定の対応POSのみ</td>
                </tr>
                <tr>
                  <td>POSレジ自動データ連携</td>
                  <td className="highlight-col"><strong>なし（小計を見て手打ち）</strong></td>
                  <td>あり（高額初期費用）</td>
                  <td>あり（対応POSのみ）</td>
                </tr>
                <tr>
                  <td>専用端末の購入</td>
                  <td className="highlight-col"><strong>不要（手持ち端末でOK）</strong></td>
                  <td>専用機材の購入必須</td>
                  <td>指定プリンタ等の購入必須</td>
                </tr>
                <tr>
                  <td>QRコード印刷</td>
                  <td className="highlight-col"><strong>A4一括印刷（固定QR）</strong></td>
                  <td>都度レシート印刷</td>
                  <td>都度レシート印刷</td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: '12px', fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', lineHeight: '1.6' }}>
              ※Lite Orderは外部POSレジやキャッシュドロアとのシステム的なデータ連携（API連動）は行いません。伝票の参考小計や注文明細を確認しながら、現在お使いのレジへ手動入力してお会計いただく運用となります。
            </p>
          </div>

          {/* 当システムで会計まで完結したい場合の案内 */}
          <div className="lp-full-pos-box">
            <div className="lp-full-pos-head">
              <span className="lp-full-pos-icon">💡</span>
              <div>
                <h4>当システムで「レジ会計・プリンター印刷（レシート／厨房伝票）」まで完結したい場合は？</h4>
                <p>Lite Orderにはスタッフ用の会計画面・レシート再発行・売上日次締めに加え、<strong>厨房へのキッチンプリンター自動印刷機能</strong>も標準搭載されています。既存レジとの併用ではなく、<strong>当システム単体で会計や厨房伝票印刷まで一本化（本格運用）したい場合</strong>は、以下の機材とネットワーク環境をご準備いただくことで運用可能です。</p>
              </div>
            </div>

            <div className="lp-full-pos-grid">
              <div className="lp-pos-req-card">
                <h5>📦 ご用意いただく機器</h5>
                <ul>
                  <li><strong>会計用端末:</strong> PCまたはタブレット（1台）</li>
                  <li><strong>レシートプリンター:</strong> ネットワーク対応ESC/POS規格プリンター</li>
                  <li><strong>キャッシュドロワー:</strong> プリンター連動型、または手動プッシュオープン式</li>
                  <li><strong>キッチンプリンター（任意）:</strong> 厨房で調理伝票を紙で自動印刷したい場合に設置（ESC/POS規格対応）</li>
                </ul>
              </div>

              <div className="lp-pos-req-card warning">
                <h5>🌐 ネットワーク・IP設定の前提条件</h5>
                <ul>
                  <li><strong>IPアドレス固定設定:</strong> レシート出力およびキッチンプリンターへの印刷指示のため、店内のアクセスポイント（AP）やルーター、PC等において、各プリンターにローカル固定IPアドレスを割り当てる設定が必要です。</li>
                  <li><strong>ネットワーク環境:</strong> 本システムは一般的な<strong>IPv4ローカルネットワーク環境</strong>を前提として設計されており、<strong>IPoE（IPv6等）環境のみを前提とした設計にはなっておりません</strong>。店内のネットワーク環境をご確認ください。</li>
                </ul>
              </div>
            </div>

            <div className="lp-full-pos-foot">
              ※まずは「既存レジ併用（機材購入ゼロ・設定ゼロ）」で注文効率化からスタートし、運用の手応えに合わせて会計・キッチンプリンター等の機材を揃えていく段階的な移行もおすすめです。
            </div>
          </div>
        </div>
      </section>

      {/* よくある質問 */}
      <section className="lp-faq" id="faq">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-eyebrow">FAQ</span>
            <h2 className="lp-section-title">よくある質問</h2>
          </div>

          <div className="lp-faq-list">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`lp-faq-item ${openFaq === idx ? 'open' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="lp-faq-question">
                  <span className="q-mark">Q.</span>
                  <span>{faq.q}</span>
                  <span className="arrow-icon">{openFaq === idx ? '▲' : '▼'}</span>
                </div>
                {openFaq === idx && (
                  <div className="lp-faq-answer">
                    <span className="a-mark">A.</span>
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="lp-final-cta">
        <div className="lp-section-inner">
          <div className="lp-cta-card">
            <h2>まずは14日間、注文の軽さを体感してください</h2>
            <p>
              初期費用ゼロ・クレジットカード登録不要。
              <br />
              今夜の営業から、ホールのバタバタと注文取りこぼしを解消しませんか？
            </p>
            <button className="lp-btn-primary-large" type="button" onClick={onStartTrial}>
              無料で今すぐ始める
            </button>
            <div className="lp-cta-sub">30秒でアカウント登録完了・いつでも解約可能</div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <span className="lp-logo-icon">⚡</span>
              <span className="lp-logo-text">Lite Order</span>
            </div>
            <p>小規模店舗のための、最も始めやすい月額制モバイルオーダーSaaS</p>
          </div>

          <div className="lp-footer-links">
            <button type="button" onClick={onLogin}>店舗ログイン</button>
            <button type="button" onClick={onStartTrial}>無料新規登録</button>
            <button type="button" onClick={onDemoCustomer}>客席注文デモ</button>
            <button type="button" onClick={onDemoStaff}>厨房KDSデモ</button>
          </div>
        </div>
        <div className="lp-footer-copy">
          © {new Date().getFullYear()} Lite Order. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

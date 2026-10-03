# nz-english

ニュージーランド南島 8泊9日(2027年2〜3月)までに、旅行の会話を自分で回せるようになるためのリポジトリ。
学習パスは [PLAN.md](PLAN.md)(Claude と Codex で2往復して合意した版)。

## はじめに(迷ったらここ)

**毎日見るのは1か所: アプリの「今日」タブ** → https://moriwakihikari.github.io/nz-english/

| いつ | 見る場所 |
|------|---------|
| 毎日 | アプリ「今日」タブ(復習日が来た場面が1つ出る) |
| 紙で持ち歩く・講師に見せる | [`pdf/nz-english-scenes.pdf`](pdf/nz-english-scenes.pdf) |
| やり方を忘れた | 下の「毎日のやり方」 / [PLAN.md 3章](PLAN.md) |
| 今何週目か・全体の流れ | [PLAN.md 4章](PLAN.md) |
| 週末 | アプリ「記録」タブ → 下の週次テーブルに1行追加 |

### 初日(2026-10-03)にやること

1. abceed で無料 TOEIC 模試を1回。Listening / Reading の点をここにメモ: `L: ___ / R: ___`
2. YouTube "in-flight meal service" を字幕なし→字幕ありで1回ずつ。文字なら分かるなら「音の問題」
3. TOEIC 12月回に申込
4. Native Camp 7日間無料体験に登録
5. アプリで Scene 1 を開き、「聞こえてくる言葉」を 0.7 で全部聞く → フレーズ音読 → 結果を記録

### 2日目以降

アプリ「今日」タブ → 下の「毎日のやり方」6ステップ。同じ場面を 3〜5 日繰り返してから次へ。

### Native Camp で講師に最初に言うこと

> I'm practising travel English for New Zealand. Can we role-play this scene? Please speak slowly, and correct me on three points at most.
> (ニュージーランド旅行の英語を練習しています。この場面をロールプレイできますか? ゆっくり話して、訂正は3つまでにしてください。)

PDF の該当ページを画面共有するか、場面の英語タイトルをチャットに貼る。

## 中身

| パス | 何か |
|------|------|
| [`pdf/nz-english-scenes.pdf`](pdf/nz-english-scenes.pdf) | **8場面の台本 PDF**(印刷用・日英対訳) |
| [`scenes/`](scenes/) | 同じ台本の Markdown(1場面1ファイル)と元データ `scenes.json` |
| [`docs/`](docs/) | 「今日の旅行英語」ミニアプリ(GitHub Pages で配信) |
| [`log/`](log/) | 日次ログ。1日1ファイル、1コミット |
| [`PLAN.md`](PLAN.md) | 20週の学習パス・合格基準・TOEIC 方針 |

## 8場面

1. 空港到着・レンタカー会社を探す — Day 1 Christchurch
2. レンタカー受取(保険・傷・左側通行) — Day 1
3. 宿チェックイン・設備や予約の問題を伝える — 毎日
4. カフェ・レストランで注文、アレルギーや希望を伝える — 毎日
5. ガソリン給油・支払い — Tekapo / Wanaka / Te Anau
6. 道路・駐車・通行止め・一車線橋 — Pukaki / Milford Road
7. 観光予約・天候による変更・キャンセル — Hooker Valley / Milford cruise
8. パンク・故障・事故・体調不良 — いつでも

## 毎日のやり方(35〜50分)

1. アプリの「今日」タブを開く(復習日が来た場面、なければ次の未着手場面が出る)
2. 「聞こえてくる言葉」を ▶ で聞く(速さ 0.7 → 0.85 → 1.0)
3. 「自分が言うフレーズ」を音読 → 「英語を隠す」にチェックして日本語だけ見て言う
4. 「相手役だけ再生」で会話。自分の番は声に出してから「次へ」
5. Native Camp で同じ場面をロールプレイ(できない日は「自分の録音」で代替)
6. 「今日の結果」を記録 → 「記録」タブの Markdown をコピーして `log/YYYY-MM-DD.md` に貼り、コミット

同じ場面を 3〜5 日反復してから次へ。復習間隔は 1 → 3 → 7 → 14 → 30 日の固定。

## 週次の主指標

GitHub の草はログの入力記録でしかない。評価するのは週末の **「台本なしで自力処理できた場面数」**(アプリの「記録」タブに出る)。

| 週 | 期間 | 台本なしで処理できた場面数 | メモ |
|----|------|---------------------------|------|
| 1 | 2026-10-05 〜 | | |

## ビルド

```bash
node scripts/build.mjs   # scenes.json → scenes/*.md, pdf/scenes.html, docs/scenes.json
./scripts/pdf.sh         # 上に加えて Chrome headless で pdf/nz-english-scenes.pdf を生成(macOS)
```

アプリをローカルで見る:

```bash
cd docs && python3 -m http.server 8000   # http://localhost:8000
```

## ルール(PLAN.md より)

- 開発時間は週 30〜45 分まで。学習記録の入力は 1 分以内
- 同じ不便を 3 回経験した機能だけ作る。14 日使われなかった機能は作らない
- Claude API や自動採点は入れない

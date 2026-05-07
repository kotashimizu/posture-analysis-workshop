# 05 視点判別とKendall評価

## このステップの目的

- ランドマークから「矢状面（左/右）」「前額面（前/後）」を自動判別
- 矢状面：頭部前方位、肩前方位、体幹前後傾、骨盤傾斜、膝伸展度、足関節を計算
- 前額面：頭部側方傾斜、肩高さ左右差、骨盤高さ左右差、膝アライメント、足部を計算
- 姿勢タイプ判定（理想 / 後弯前弯型 / フラットバック / スウェイバック / 前弯強調 / 複合パターン）
- 各指標の所見テキストを自動生成

## AntiGravityに渡すプロンプト

---

```
姿勢分析アプリのStep 05を実装してください。
視点判別と Kendall評価のロジックをすべて作ります。これがアプリの「中身」です。

# 1. 視点自動判別

`src/lib/kendall/view-detector.ts` を作成：

- detectView(landmarks): ViewType を返す
- 判別ロジック：
  - 体高で正規化した肩・腰の水平距離（widthRatio）が 0.18 を超えるなら前額面、超えないなら矢状面
  - 前額面なら、鼻・両目の visibility 平均が 0.7 を超えるなら "frontal-front"、超えないなら "frontal-back"
  - 矢状面なら、左右の肩+耳の visibility を比較。右側が高ければ "sagittal-left"（被写体の右がカメラ向き）、左側が高ければ "sagittal-right"
- detectViewConfidence(landmarks): 全ランドマークの visibility 平均を返す
- 仮閾値には `// TODO: 要臨床調整` コメント

# 2. 閾値定数

`src/lib/kendall/thresholds.ts` を作成：

```ts
// TODO: 要臨床調整（仮値）
export const THRESHOLDS = {
  forwardHead: { mild: 5, severe: 10 },         // deg
  forwardShoulder: { mild: 5, severe: 10 },     // deg
  trunkLean: { mild: 3, severe: 7 },            // deg
  pelvicTilt: { mild: 5, severe: 10 },          // deg from neutral 180
  kneeHyperextension: { mild: 3, severe: 5 },   // deg over 180
  kneeFlexion: { mild: 5, severe: 10 },         // deg under 175
  ankle: { mild: 5, severe: 10 },               // deg from 90
  headTilt: { mild: 2, severe: 5 },             // deg
  shoulderAsymmetry: { mild: 0.02, severe: 0.04 },  // ratio of body height
  pelvicAsymmetry: { mild: 0.02, severe: 0.04 },
  kneeAlignment: { mild: 0.02, severe: 0.04 },
} as const;
```

# 3. 矢状面評価

`src/lib/kendall/sagittal.ts` を作成：

- evaluateSagittal(landmarks, view): EvalMetric[] を返す
- view が "sagittal-left" なら被写体の右側（landmarks 8, 12, 24, 26, 28）を優先、"sagittal-right" なら左側（7, 11, 23, 25, 27）を優先
- 6つの指標を計算：
  1. forwardHead：耳→肩の鉛直からの角度
  2. forwardShoulder：肩→大転子の鉛直からの角度
  3. trunkLean：肩中点→腰中点の鉛直からの角度
  4. pelvicTilt：肩→腰→膝の角度（180度からの逸脱）
  5. kneeExtension：腰→膝→足首の角度（180度からの逸脱、過伸展は hyperextension、屈曲は flexion）
  6. ankle：膝→足首→足先（foot_index）の角度（90度からの逸脱）
- 各指標で severity（normal/mild/severe）と direction（forward/backward/anterior/posterior/hyperextension/flexion など）を判定
- summary に短い日本語の所見：例「耳介が肩より前方にあります」「骨盤後傾方向の傾向です」
- displayValue は数値+単位（"6.5°" など）

# 4. 前額面評価

`src/lib/kendall/frontal.ts` を作成：

- evaluateFrontal(landmarks, view): EvalMetric[] を返す
- 5つの指標：
  1. headTilt：左右耳のy座標差から頭の傾き角を計算
  2. shoulderAsymmetry：左右肩のy座標差を体高比で
  3. pelvicAsymmetry：左右腰のy座標差を体高比で
  4. kneeAlignment：左右で腰-膝-足首の内反/外反を計算（簡易）
  5. footAlignment：左右の踵-足先の角度
- direction は left/right/medial/lateral/neutral

# 5. 姿勢タイプ判定（矢状面のみ）

`src/lib/kendall/posture-type.ts` を作成：

- classifyPostureType(metrics): PostureType を返す
- 全指標が normal なら "ideal"
- スコアリング方式：4類型（kyphosis-lordosis / lordosis / flat-back / sway-back）それぞれにスコアを計算し、最高スコアを返す
  - kyphosis-lordosis：頭部前方位 + 肩前方位 + 体幹前傾 + 骨盤前傾
  - lordosis：骨盤前傾 重視 + 頭部正常
  - flat-back：骨盤後傾 重視 + 膝過伸展なし + 体幹前傾なし
  - sway-back：体幹後傾 + 骨盤前方変位 + 膝過伸展
- スコアが全部0なら、最も逸脱の大きい指標の direction で振り分け（fallback、unclassified には絶対しない）

# 6. 所見テキスト生成

`src/lib/kendall/findings.ts` を作成：

- generateFindings(metrics, postureType, view): string[] を返す
- 姿勢タイプに応じた所見文（1〜2文）
- severity が normal でない指標について、それぞれ短い所見文を追加
- emダッシュ「—」「──」「ーーー」を使わない

# 7. エントリポイント

`src/lib/kendall/index.ts` を更新：

```ts
import type { Landmark, ViewType } from "@/types";
import { evaluateSagittal } from "./sagittal";
import { evaluateFrontal } from "./frontal";
import { classifyPostureType } from "./posture-type";
import { generateFindings } from "./findings";

export { detectView, detectViewConfidence } from "./view-detector";
export { THRESHOLDS } from "./thresholds";

const ESSENTIAL_INDICES = [0, 11, 12, 23, 24, 25, 26, 27, 28];

export function isReliablePose(landmarks: Landmark[]): boolean {
  return ESSENTIAL_INDICES.every((idx) => {
    const point = landmarks[idx];
    return point && (point.visibility ?? 0) > 0.4;
  });
}

export function evaluate(landmarks: Landmark[], view: ViewType) {
  const isSagittal = view.startsWith("sagittal");
  const metrics = isSagittal
    ? evaluateSagittal(landmarks, view)
    : evaluateFrontal(landmarks, view);
  const postureType = isSagittal ? classifyPostureType(metrics) : null;
  const findings = generateFindings(metrics, postureType, view);
  return { view, metrics, postureType, findings };
}
```

# 8. App.tsx で評価フローを統合

`src/App.tsx`：

```tsx
import { detectView, evaluate } from "@/lib/kendall";

const [detectedView, setDetectedView] = useState<ViewType | null>(null);
const [result, setResult] = useState<EvalResult | null>(null);

// runDetection の中で：
const nextDetectedView = detectView(rawLandmarks);
const nextResult = evaluate(rawLandmarks, nextDetectedView);
setLandmarks(rawLandmarks);
setDetectedView(nextDetectedView);
setResult(nextResult);
```

ViewSelector に detectedView を渡すと自動判別が表示されるようになります（既に Step 02 で実装済み）。

evaluate の結果（result）は console.log で確認するだけでOKです。レポート画面は次の Step 06 で作ります。

# 完了条件

- 画像をアップロード → 視点エリアが「自動判別: 矢状面（左向き）」のように表示される
- ブラウザのコンソールに `evaluate result:` のオブジェクトが出る（metrics と postureType と findings が入っている）
- npx tsc --noEmit でエラー0
- emダッシュが新規追加されていない

実装後に変更ファイルの一覧と確認手順を教えてください。
```

---

## 完了したら確認すること

1. ブラウザリロード
2. 全身が映った画像（横向きの矢状面 or 正面の前額面）をアップロード
3. 視点エリアに「自動判別: 矢状面（左向き）」などが表示される
4. 開発者ツールのコンソールに `result` オブジェクトのログ
5. metrics 配列に6個 or 5個の評価項目が入っている

## 次のステップ

`06_レポート画面.md` に進んでください。

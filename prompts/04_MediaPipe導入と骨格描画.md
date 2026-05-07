# 04 MediaPipe導入と骨格描画

## このステップの目的

- MediaPipeを使って、画像から人体の33点ランドマークを検出する
- Canvas に元画像 + 骨格（線と点）をオーバーレイ表示する

## AntiGravityに渡すプロンプト

---

```
姿勢分析アプリのStep 04を実装してください。
MediaPipe Pose Landmarker を導入して、画像から姿勢を検出し骨格を描画します。

# 1. 依存追加

package.json の dependencies に以下を追加：
- "@mediapipe/tasks-vision": "^0.10.22-rc.20250304"

# 2. Pose Detector ラッパー

`src/lib/pose-detector.ts` を作成：

```ts
import { PoseLandmarker, FilesetResolver, type PoseLandmarkerResult } from "@mediapipe/tasks-vision";

let imageLandmarker: PoseLandmarker | null = null;

async function createLandmarker(mode: "IMAGE" | "VIDEO", delegate: "GPU" | "CPU" = "GPU"): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
      delegate,
    },
    runningMode: mode,
    numPoses: 1,
  });
}

export async function initPoseDetector(onProgress?: (msg: string) => void) {
  if (imageLandmarker) return imageLandmarker;
  onProgress?.("MediaPipeを準備中...");
  try {
    imageLandmarker = await createLandmarker("IMAGE", "GPU");
  } catch {
    onProgress?.("GPU初期化に失敗したためCPUで準備中...");
    imageLandmarker = await createLandmarker("IMAGE", "CPU");
  }
  onProgress?.("MediaPipeの準備が完了しました。");
  return imageLandmarker;
}

export async function detectPose(source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<PoseLandmarkerResult> {
  const detector = await initPoseDetector();
  return detector.detect(source);
}

export function resetPoseDetectorForTest() {
  imageLandmarker?.close();
  imageLandmarker = null;
}
```

# 3. usePoseDetector hook

`src/hooks/usePoseDetector.ts` を作成：

- ステート: state ("idle" | "loading" | "ready" | "error")、message、error
- initialize 関数：initPoseDetector を呼ぶ。途中経過メッセージ更新
- detect 関数：detectPose を呼ぶ
- マウント時に自動 initialize
- 戻り値：{ state, message, error, initialize, detect }

# 4. ランドマーク信頼度チェック

`src/lib/kendall/index.ts` を作成（ロジック本体は次のStepで肉付け）：

```ts
import type { Landmark } from "@/types";

const ESSENTIAL_INDICES = [0, 11, 12, 23, 24, 25, 26, 27, 28];

export function isReliablePose(landmarks: Landmark[]): boolean {
  return ESSENTIAL_INDICES.every((idx) => {
    const point = landmarks[idx];
    return point && (point.visibility ?? 0) > 0.4;
  });
}
```

# 5. Geometry ユーティリティ

`src/lib/geometry.ts` を作成：

```ts
import type { Landmark } from "@/types";

export function midpoint(a: Landmark, b: Landmark): Landmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function distance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// 3点の角度（点 b を頂点とする）を度数法で返す
export function angleBetween(a: Landmark, b: Landmark, c: Landmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const magA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magB = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
  if (magA === 0 || magB === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magA * magB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

// ベクトル a→b の鉛直軸からの傾き角（度）
export function verticalAngle(a: Landmark, b: Landmark): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

// 体高（normalized座標での肩中点〜足首中点のy差）
export function bodyHeight(landmarks: Landmark[]): number {
  const shoulderMid = midpoint(landmarks[11], landmarks[12]);
  const ankleMid = midpoint(landmarks[27], landmarks[28]);
  return Math.abs(ankleMid.y - shoulderMid.y) || 1;
}
```

# 6. Canvas描画ユーティリティ

`src/lib/canvas-draw.ts` を作成：

- `drawSkeletonSimple(ctx, landmarks, width, height)`：33点のランドマークと、主要な接続線（顔・上肢・下肢・体幹）をシンプルに描画。線は青系（#1e3a8a）、点は赤系（#dc2626）
- POSE_CONNECTIONS の定義（隣接ランドマークのペアの配列）：
  - 顔：0-2, 0-5, 2-7, 5-8
  - 上肢：11-13, 13-15, 12-14, 14-16
  - 体幹：11-12, 11-23, 12-24, 23-24
  - 下肢：23-25, 25-27, 24-26, 26-28, 27-29, 27-31, 29-31, 28-30, 28-32, 30-32
- 線幅3、点半径4くらい

# 7. PoseCanvas コンポーネント

`src/components/PoseCanvas.tsx` を作成：

- Props: source: MediaSource | null、landmarks: Landmark[] | null、loading: boolean
- canvas を参照する useRef
- useEffect で source が変わったら：
  - canvas のサイズを source の元画像サイズに合わせる
  - canvas に元画像を描画
  - landmarks があれば、canvas-draw.ts の drawSkeletonSimple で骨格を上書き描画
- Card で囲む：CardHeader「プレビュー」、CardContent に canvas
- loading 中は Progress バーを表示
- source が null なら「ファイルを読み込むと表示されます」

# 8. App.tsx で検出フローを実装

`src/App.tsx` で：

```tsx
import { usePoseDetector } from "@/hooks/usePoseDetector";
import { isReliablePose } from "@/lib/kendall";
// ...
const pose = usePoseDetector();
const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);

const runDetection = async (nextSource: MediaSource) => {
  setAppError(null);
  setSource(nextSource);
  setLandmarks(null);

  try {
    const detection = await pose.detect(nextSource.element);
    const rawLandmarks = detection.landmarks[0] as Landmark[] | undefined;

    if (!rawLandmarks || !isReliablePose(rawLandmarks)) {
      setAppError(
        "人物の主要ランドマークを十分に検出できません。全身が画面に入るように撮影してください。",
      );
      return;
    }
    setLandmarks(rawLandmarks);
  } catch (error) {
    setAppError(error instanceof Error ? error.message : "姿勢検出に失敗しました。");
  }
};
```

handleFileAccepted、handleImageCaptured、handleVideoCaptured 内で source 設定後に runDetection を呼ぶように変更。

「プレビュー予定エリア」の Card を、PoseCanvas に置き換える：

```tsx
<PoseCanvas
  source={source}
  landmarks={landmarks}
  loading={pose.state === "loading"}
/>
```

MediaPipe読み込み中の Alert（pose.state === "loading"）と、エラー時の再試行ボタン Alert も、Card の前に追加してください。

# 完了条件

- 画像をアップロード or カメラで撮影すると、骨格（線と点）が画像上に表示される
- 全身が入っていない画像だと「ランドマークを検出できません」のエラー
- MediaPipeの初回ロード時にプログレスバーが表示される
- npx tsc --noEmit でエラー0

実装後に npm install からの起動コマンドと、確認手順を教えてください。
```

---

## 完了したら確認すること

1. ターミナルで `npm install`（@mediapipe/tasks-vision の追加）
2. `npm run dev` で再起動
3. ブラウザリロード
4. 全身が写った画像をアップロード（自分の写真でも、フリー素材でもOK）
5. 数秒待つと、画像の上に骨格（線+点）が表示される
6. カメラで撮影しても同じく骨格が表示される

## 詰まったら

- 初回はMediaPipeのモデル（約9MB）をダウンロードするので少し待つ
- 全身が入っていないとエラーになる：被写体を引いて撮影
- ブラウザのコンソールにCORSエラーが出たら、AntiGravityにそのまま貼って質問

## 次のステップ

`05_視点判別とKendall評価.md` に進んでください。

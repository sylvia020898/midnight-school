# 午夜校舍

第一人稱恐怖躲貓貓網頁遊戲。在深夜的三層校舍裡躲開只靠聲音找人的「她」，解開紙條上的謎語，從一樓的窗戶逃出去；或者找齊她的死因與冤屈，解開隱藏結局「真相」。

用 [three.js](https://threejs.org/)（r128）繪製 3D 場景，音效與音樂全部用 Web Audio 即時合成，沒有外部音檔。

## 檔案結構

| 檔案 | 內容 |
|---|---|
| `index.html` | 遊戲頁面（選單、HUD、對話框等版面） |
| `speedrun.html` | 速通測試版：開局就有全部紙條和線索，左側有按鈕可直接播放各段動畫 |
| `style.css` | 所有樣式 |
| `data.js` | 劇情與內容資料：黑板文字、紙條、支線文件、日記、道具、直播與回家的過場、時間限制 |
| `game.js` | 遊戲程式 |
| `assets/` | 隱藏結局的插畫與尋人啟事照片 |
| `artifact/` | 給 Claude Artifact 用的頁面版本（內容同上，只是沒有 `<html>` 外框），放上 GitHub 可以不用管 |

想改劇情、文字、時間或過場圖片，只要改 `data.js`，不用動 `game.js`。

## 在自己電腦上跑

因為遊戲會把圖片畫進 3D 貼圖，直接雙擊 `index.html`（`file://`）時瀏覽器會擋，請用本機伺服器開：

```bash
python -m http.server 8000
```

然後打開 http://localhost:8000 。

## 發布到 GitHub Pages

1. 在 GitHub 建一個新的 repository，把這個資料夾裡的檔案上傳（`index.html` 要在最上層）。
2. 到 repository 的 **Settings → Pages**，Source 選 **Deploy from a branch**，Branch 選 `main`、資料夾選 `/ (root)`，按 Save。
3. 等一兩分鐘，網址會是 `https://<你的帳號>.github.io/<repository 名稱>/`，速通版在後面加 `speedrun.html`。

## 操作

| 動作 | 鍵盤滑鼠 | 搖桿 | 手機 |
|---|---|---|---|
| 移動 | W A S D | 左搖桿 | 左下虛擬搖桿 |
| 轉頭 | 滑鼠 | 右搖桿 | 空白處拖曳 |
| 蹲下 | Shift（按住） | B | 右下人形 |
| 跳躍 | Space | A | 跳 |
| 撿起／翻找／拉抽屜 | E | Y | 手 |
| 投擲 | 左鍵或 Q | RT | 手 |
| 看紙條／線索／日記 | R | Back | 手 |
| 設定、暫停、存檔 | Esc | Start | 右上「設定」 |

進度每 30 秒自動存檔，關掉頁面時也會存；存檔和隱藏結局的解鎖紀錄都只存在這台裝置的瀏覽器（localStorage）。

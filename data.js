/* 午夜校舍 — story and content data.
   Change texts, clues, items, timings or cutscene pictures here; game.js reads everything from GAME_DATA.
   Strings with <br> / <span> are shown as HTML inside the paper pop-up. */
window.GAME_DATA = {
  // seconds before she goes mad (main quest without the side quest)
  timeLimitSec: 720,
  // seconds you must survive after finding all three side-quest documents
  dawnSec: 150,
  // chalkboard text per classroom (index = floor*4 + class); second value 1 = written in blood
  blackboards: [
  ['值日生：林○○  陳○○\n數學習作 P.42 明天交',0],['安靜自習',0],['不要回頭',0],['放學後\n不要留在教室',0],
  ['十二個人\n十三張椅子',0],['她  還  在  這  裡',0],['誰把燈關掉的？',0],['躲好喔',0],
  ['一、二、三……\n我要來找你了',0],['找到你了',1],['畢業快樂！',0],['第十三節課',0]],
  // throwable items: name and how far the impact can be heard (metres)
  items: {scissors:{name:'剪刀',noise:11},ext:{name:'滅火器',noise:18},chalk:{name:'粉筆',noise:6},bag:{name:'書包',noise:9},eraser:{name:'橡皮擦',noise:5}},
  // what each main-quest note says before its riddle (note 1, note 2)
  noteTexts: ['她看不見，只聽得見。蹲著走就不會有腳步聲；就算撞上她，也千萬別動。','我把出口拆成三張紙條藏起來，怕被她發現。快沒時間了，她十二分鐘後就會醒透。'],
  // riddle hint for each hiding place
  hidingPlaces: {desk:'它躲在學生每天低頭伸手、塞滿考卷的地方。',podium:'它躲在老師每天靠著說話的那個木箱的抽屜裡。',board:'它貼在教室最後面，跟尋人啟事擠在一起。'},
  // side-quest documents (t = title, h = body)
  sideDocs: [
  {t:'二年三班點名簿（九月）',h:`<span style="font-family:var(--mono);font-size:14px">9/16　林語晴　缺<br>9/17　林語晴　缺<br>9/18　林語晴　缺<br>9/19　林語晴　缺<br>……</span><br>整頁都是同一行。頁邊有導師的字：<span class="riddle">「家長來電，未返家。」</span>`},
  {t:'一封沒寄出去的信',h:`「那天晚自習後，是我們說要玩躲貓貓的。我們叫語晴躲進三樓最後面的掃具間，說數到一百就去找她。<br>是我鎖的門。<br>我以為隔天就會有人開門，我忘了隔天開始放中秋連假……<br>收假那天我聽到工友在樓上大叫。<span class="riddle">對不起，我一直不敢說。」</span>`},
  {t:'訓導處內部公文',h:`主旨：二年三班林姓學生事件處理方式。<br>說明：本案對外一律以「學生離家、下落不明」處理，請各位老師勿與媒體及家屬多談。三樓掃具間即日起封閉。<br><span class="riddle">（右下角蓋著校長的章。家屬到現在還在貼尋人啟事。）</span>`}],
  // her diary, appears after all three side-quest documents
  diary: [
  {t:'第一天（應該是晚上）',h:'她們說數到一百就來找我。我在心裡數了好多次一百了。門打不開。我一直敲、一直喊，喊到喉嚨好痛。外面只有蟬在叫。'},
  {t:'第二天',h:'門縫下面有一點點光，所以現在是白天吧。我想起來了，明天開始放中秋連假。口袋裡只有一支原子筆和這本小簿子。好熱。我把耳朵貼在門上，只要聽到腳步聲我就喊。今天一次都沒有。'},
  {t:'第三天',h:'好渴。我已經分不清楚眼睛是張開還是閉著，到處都一樣黑。可是我的耳朵變得好靈，連很遠很遠的聲音都聽得到。走廊上是不是有人在走？是來找我的嗎？'},
  {t:'第四天',h:'如果有人撿到這本簿子，拜託告訴我媽媽，我不是自己跑掉的。我一直都在這裡。<br>我一直都在等你們來找我。'},
  {t:'最後一頁',h:'<span class="riddle" style="font-size:22px;letter-spacing:.3em">找　到　我</span>'}],
  // livestream re-enactment: picture, camera (focus point + push-in), caption and chat lines
  liveScenes: (()=>{const s=[
  {cap:'那天晚自習結束後，班上那幾個人，第一次對她笑。',chat:[['阿哲','這是哪間學校？'],['小雨','主播你真的在學校裡面？'],['路人K','畫面好暗']]},
  {cap:'「我們玩躲貓貓。妳躲進掃具間，我們數到一百就去找妳。」',chat:[['米米','躲貓貓……'],['阿哲','不要進去啊'],['Kevin','好毛']]},
  {cap:'然後，他們從外面把門鎖上，笑著回家了。',chat:[['小雨','鎖門？？？'],['路人K','這是霸凌吧'],['Ann','太過分了']]},
  {cap:'隔天開始放中秋連假。四天，掃具間裡沒有水、沒有光，只有蟬聲。',chat:[['米米','四天……'],['Ann','我哭了'],['阿哲','她一個人在裡面']]},
  {cap:'她在黑暗裡一直聽著，走廊上有沒有人來找她。',chat:[['Kevin','這本日記……'],['小雨','她一直在等人找她'],['路人K','雞皮疙瘩']]},
  {cap:'學校對外說：她離家出走。她的家人，到現在還在貼尋人啟事。',chat:[['Ann','學校還壓下來？？'],['阿哲','去查這間學校'],['米米','#還林語晴一個公道'],['路人K','已分享'],['小雨','#還林語晴一個公道'],['Kevin','#還林語晴一個公道']]}],img=['assets/live1.webp','assets/live2.webp','assets/live3.webp','assets/live4.png','assets/live5.webp','assets/live6.webp'],cam=[{fx:.5,fy:.4,z:.12},{fx:.53,fy:.38,z:.22},{fx:.4,fy:.5,z:.1,shake:1},{fx:.62,fy:.45,z:.14},{fx:.5,fy:.5,z:.12},{fx:.72,fy:.45,z:.2}];return s.map((o,i)=>Object.assign({img:img[i],cam:cam[i]},o));})(),
  // the walk home between the stream and the dream
  homeScenes: [{src:'assets/home1.webp',cap:'直播結束了。天已經全亮，你一個人走在回家的路上。'},{src:'assets/home2.webp',cap:'回到房間，你倒在床上，很快就睡著了。'}],
  // the line that fades in during the dream
  dreamLine: '謝謝你，終於有人，能替我發聲了。'
};
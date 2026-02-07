// public/sketch.js
// 规则：
// 1) 弹幕自然下落
// 2) 落到地面后锁住
// 3) 锁住后默认在最底部（groundY）
// 4) 只有当它和“下面已有文字”在 X 方向有重叠时，才被顶到上面一层
// 5) 最早的优先占底层；后来的遇到冲突才叠上去
// 6) 在线人数越多字越小（main.js 调 setPlayers）

let bullets = [];
let lockedIds = []; // 按“锁住/发送”时间顺序保存 id（越早越底层优先）
let players = 1;

function setPlayers(n) {
  players = Math.max(1, n);
}
window.setPlayers = setPlayers;

function sizeByPlayers(base) {
  let s = base / (1 + 0.18 * (players - 1));
  if (s < 10) s = 10;
  if (s > 32) s = 32;
  return s;
}

function addBullet(data) {
  bullets.push({
    id: data.id,
    text: data.text,
    color: data.color,      // {r,g,b}
    x: random(20, width - 200),
    y: -30,
    targetY: -30,
    speed: random(1.4, 3.6),
    locked: false,
    w: 0                    // 文本宽度（每帧更新）
  });

  if (bullets.length > 300) bullets.splice(0, bullets.length - 300);
}
window.addBullet = addBullet;

function findBulletById(id) {
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].id === id) return bullets[i];
  }
  return null;
}

function rangesOverlap(a1, a2, b1, b2) {
  // 区间重叠（稍微给一点容错）
  return !(a2 < b1 || b2 < a1);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
  textAlign(LEFT, TOP);
}

function draw() {
  background(0);

  const bottomMargin = 60;         // 给输入框留空间
  const groundY = height - bottomMargin;
  const topLimit = 20;

  const s = sizeByPlayers(26);
  const lineH = s + 10;

  // 统一字号后再算 textWidth（否则不准）
  textSize(s);

  // 先更新所有锁住弹幕的宽度（用于碰撞判断）
  for (let i = 0; i < lockedIds.length; i++) {
    const b = findBulletById(lockedIds[i]);
    if (b) b.w = textWidth(b.text);
  }

  // 1) 处理下落 & 绘制
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];

    fill(b.color.r, b.color.g, b.color.b);
    text(b.text, b.x, b.y);

    if (!b.locked) {
      b.y += b.speed;

      // 落到地面就锁住（不弹、不瞬移）
      if (b.y >= groundY) {
        b.locked = true;
        b.targetY = groundY;   // 默认落地就待最下面
        b.y = groundY;         // 贴地一下没问题，这里不会造成“弹”，因为目标也是 groundY
        b.w = textWidth(b.text);

        lockedIds.push(b.id);
      }
    }
  }

  // 2) 碰撞式堆叠：只在“撞到文字”时往上摞
  //    按 lockedIds 顺序：越早越优先占底
  for (let i = 0; i < lockedIds.length; i++) {
    const cur = findBulletById(lockedIds[i]);
    if (!cur) continue;

    // 默认：就在底部
    let target = groundY;

    const curL = cur.x;
    const curR = cur.x + cur.w;

    // 只跟“更早锁住的（更底层优先）”比较
    for (let j = 0; j < i; j++) {
      const below = findBulletById(lockedIds[j]);
      if (!below) continue;

      const belowL = below.x;
      const belowR = below.x + below.w;

      // 如果 X 方向有重叠，就需要叠在它上面
      if (rangesOverlap(curL, curR, belowL, belowR)) {
        // 要在它上面一层：y 更小
        const need = below.targetY - lineH;
        if (need < target) target = need;
      }
    }

    // 不让它堆出屏幕顶
    if (target < topLimit) target = topLimit;

    cur.targetY = target;
  }

  // 3) 平滑挤压到目标位置（不生硬）
  for (let i = 0; i < lockedIds.length; i++) {
    const b = findBulletById(lockedIds[i]);
    if (!b) continue;
    b.y = lerp(b.y, b.targetY, 0.18);
  }

  // （可选）太多锁住弹幕就清理最老的，防止一直涨
  if (lockedIds.length > 160) {
    lockedIds.splice(0, lockedIds.length - 160);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// ====================== ASSETS ======================
const bgImg = new Image(); bgImg.src = "assets/images/bg.jpg";
const shipImg = new Image(); shipImg.src = "assets/images/ship.png";
const bulletImg = new Image(); bulletImg.src = "assets/images/bullets.png";
const enemyImg = new Image(); enemyImg.src = "assets/images/enemy.png";

const bgm = new Audio("assets/sounds/bgmusic.mp3"); bgm.loop = true;
const pewSfx = new Audio("assets/sounds/blaster-pew.wav");
const boomSfx = new Audio("assets/sounds/boom.wav");
const dieSfx = new Audio("assets/sounds/dies.wav");

// ====================== GAME STATE ======================
let player = {
  x: 50, y: canvas.height / 2 - 25, width: 50, height: 50, speed: 4,
  bullets: [], lives: 3, lastShot: 0
};

let enemies = [], explosions = [], score = 0, keys = {};
let gameRunning = false, gameOver = false, paused = false;
let enemySpawnTimer = 0, backgroundX = 0;

// ====================== CONTROLS ======================
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (!isMobile && e.code === "Enter") {
    if (!gameRunning) startGame();
    if (gameOver) resetGame();
  }
  if (e.code === "KeyP" && gameRunning) paused = !paused;
});
document.addEventListener("keyup", (e) => keys[e.code] = false);

canvas.addEventListener("touchstart", () => {
  if (isMobile && !gameRunning && !gameOver) startGame();
  else if (isMobile && gameOver) resetGame();
});

// ====================== GAME LOOP ======================
function startGame() {
  gameRunning = true;
  paused = false;
  gameOver = false;
  bgm.play();
}

function resetGame() {
  score = 0;
  enemies = [];
  explosions = [];
  player.lives = 3;
  player.bullets = [];
  player.x = 50;
  player.y = canvas.height / 2 - 25;
  gameOver = false;
  gameRunning = true;
  paused = false;
  bgm.play();
}

function update() {
  if (!gameRunning || paused) return;

  backgroundX -= 2;
  if (backgroundX <= -canvas.width) backgroundX = 0;

  if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
  if (keys["ArrowDown"] && player.y < canvas.height - player.height) player.y += player.speed;

  if (keys["Space"]) {
    let now = Date.now();
    if (now - player.lastShot > 400) {
      player.bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - 5,
        width: 20, height: 10, speed: 7
      });
      pewSfx.currentTime = 0;
      pewSfx.play();
      player.lastShot = now;
    }
  }

  for (let i = player.bullets.length - 1; i >= 0; i--) {
    let b = player.bullets[i];
    b.x += b.speed;
    if (b.x > canvas.width) player.bullets.splice(i, 1);
  }

  enemySpawnTimer++;
  if (enemySpawnTimer > 80) {
    enemies.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 40),
      width: 40, height: 40, speed: 2.5
    });
    enemySpawnTimer = 0;
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.x -= e.speed;
    if (e.x + e.width < 0) enemies.splice(i, 1);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    for (let j = player.bullets.length - 1; j >= 0; j--) {
      let e = enemies[i], b = player.bullets[j];
      if (b.x < e.x + e.width && b.x + b.width > e.x &&
          b.y < e.y + e.height && b.y + b.height > e.y) {
        enemies.splice(i, 1);
        player.bullets.splice(j, 1);
        explosions.push({ x: e.x, y: e.y, timer: 20 });
        boomSfx.currentTime = 0;
        boomSfx.play();
        score += 10;
        break;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    if (player.x < e.x + e.width && player.x + player.width > e.x &&
        player.y < e.y + e.height && player.y + player.height > e.y) {
      enemies.splice(i, 1);
      player.lives--;
      dieSfx.currentTime = 0;
      dieSfx.play();
      if (player.lives <= 0) {
        gameOver = true;
        gameRunning = false;
        bgm.pause();
      }
    }
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].timer--;
    if (explosions[i].timer <= 0) explosions.splice(i, 1);
  }
}

function draw() {
  // background scrolling
  ctx.drawImage(bgImg, backgroundX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, backgroundX + canvas.width, 0, canvas.width, canvas.height);

  // player
  ctx.drawImage(shipImg, player.x, player.y, player.width, player.height);

  // bullets
  for (let b of player.bullets) {
    ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height);
  }

  // enemies
  for (let e of enemies) {
    ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
  }

  // explosions
  for (let ex of explosions) {
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(ex.x + 20, ex.y + 20, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // UI
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Lives: " + player.lives, canvas.width - 100, 20);

  if (!gameRunning && !gameOver) {
    ctx.fillStyle = "yellow";
    ctx.font = "28px Arial";
    const startMsg = isMobile ? "Tap to Start" : "Press ENTER to Start";
    ctx.fillText(startMsg, canvas.width / 2 - 120, canvas.height / 2);
  }

  if (paused) {
    ctx.fillStyle = "yellow";
    ctx.font = "28px Arial";
    ctx.fillText("PAUSED", canvas.width / 2 - 60, canvas.height / 2);
  }

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2 - 20);
    ctx.fillStyle = "yellow";
    ctx.font = "20px Arial";
    const restartMsg = isMobile ? "Tap to Restart" : "Press ENTER to Restart";
    ctx.fillText(restartMsg, canvas.width / 2 - 120, canvas.height / 2 + 40);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ====================== TOUCH CONTROLS FOR MOBILE ======================
if (isMobile) {
  const mobileUI = document.getElementById("mobileUI");
  if (mobileUI) mobileUI.style.display = "flex";

  const btnUp = document.getElementById("btnUp");
  const btnDown = document.getElementById("btnDown");
  const btnShoot = document.getElementById("btnShoot");
  const btnPause = document.getElementById("btnPause");

  btnUp.addEventListener("touchstart", () => keys["ArrowUp"] = true);
  btnUp.addEventListener("touchend", () => keys["ArrowUp"] = false);

  btnDown.addEventListener("touchstart", () => keys["ArrowDown"] = true);
  btnDown.addEventListener("touchend", () => keys["ArrowDown"] = false);

  btnShoot.addEventListener("touchstart", () => keys["Space"] = true);
  btnShoot.addEventListener("touchend", () => keys["Space"] = false);

  btnPause.addEventListener("touchstart", () => {
    if (gameRunning) paused = !paused;
  });
}

gameLoop();

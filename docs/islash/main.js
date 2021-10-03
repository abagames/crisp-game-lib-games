title = "I SLASH";

description = `
[Hold] Slash
`;

characters = [
  `
  ll
 ll
llll
 l  l
l l
`,
  `
   ll
 ll
  l
 l ll
l  
`,
  `
   ll
 ll
  l
 l l
  l l 
`,
];

options = {
  viewSize: { x: 200, y: 50 },
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 7,
};

/** @type {{x: number, ticks: number, isRemoved: boolean}[]} */
let enemies;
let nextEnemyDist;
/**
 * @type {{
 * x: number, vx: number, slashDist: number, ticks: number, hitX: number,
 * state: "wait" | "slash"
 * }}
 */
let player;
let isSlashReady;
let floorX;
let multiplier;
const playerY = 37;

function update() {
  if (!ticks) {
    enemies = [];
    nextEnemyDist = 0;
    player = {
      x: 10,
      vx: 0,
      slashDist: 0,
      ticks: 0,
      hitX: 0,
      state: "wait",
    };
    isSlashReady = false;
    floorX = 100;
    multiplier = 1;
  }
  const scr = (player.x - 30) * 0.05;
  color("light_black");
  rect(0, 40, 200, 10);
  floorX = wrap(floorX - scr, 0, 200);
  color("white");
  rect(floorX, 40, 1, 10);
  nextEnemyDist -= scr + (player.state === "wait" ? sqrt(difficulty) : 0);
  if (enemies.length === 0) {
    nextEnemyDist = 0;
  }
  if (nextEnemyDist <= 0) {
    const d = rnd(15, 30);
    const c = rndi(3, 10);
    let x = 203;
    times(c, (i) => {
      enemies.push({ x, ticks: 0, isRemoved: false });
      x += d;
    });
    nextEnemyDist = d * c + rnd(30);
  }
  if (input.isJustReleased) {
    isSlashReady = true;
  }
  const isSlashing = isSlashReady && input.isPressed;
  player.x -= scr + player.vx;
  if (player.x < 0) {
    play("lucky");
    end();
  }
  player.vx *= 0.9;
  if (isSlashing && player.vx < 1 && player.state === "wait") {
    player.slashDist = (enemies[0].x - player.x) * 2;
    startSlash();
  }
  if (player.state === "wait") {
    if (enemies[0].x < player.x) {
      hitEnemy(0);
    }
  } else {
    color("red");
    rect(player.x, playerY, -player.slashDist, 1);
    player.ticks--;
    if (player.ticks < 0) {
      if (isSlashing) {
        startSlash();
      } else {
        player.state = "wait";
      }
    }
  }
  color("black");
  if (player.vx > 1) {
    player.hitX -= scr;
    rect(player.x, playerY, player.hitX - player.x, 1);
  }
  char("a", player.x, playerY);
  remove(enemies, (e) => {
    if (e.isRemoved) {
      return true;
    }
    e.x -= scr;
    if (player.state === "wait") {
      e.x -= sqrt(difficulty);
      e.ticks += sqrt(difficulty);
    }
    char(addWithCharCode("b", floor(e.ticks / 15) % 2), e.x, playerY);
  });
  text(`x${multiplier}`, 3, 9);

  function startSlash() {
    player.x += player.slashDist;
    let isHitting = false;
    if (enemies.length > 1 && enemies[1].x < player.x) {
      hitEnemy(1);
      isHitting = true;
    } else {
      player.state = "slash";
      player.ticks = 9 / sqrt(difficulty);
    }
    if (enemies[0].x < player.x) {
      color("red");
      particle(enemies[0].x, playerY);
      enemies[0].isRemoved = true;
      if (!isHitting) {
        play("explosion");
        addScore(multiplier, enemies[0].x, playerY);
        multiplier++;
      }
    } else {
      player.state = "wait";
    }
  }

  function hitEnemy(ei) {
    play("select");
    player.vx = (player.x - enemies[ei].x + 9) * 0.25;
    player.x = enemies[ei].x - 6;
    player.hitX = enemies[ei].x;
    color("black");
    particle(player.hitX, playerY, 9, player.vx, PI, 0.1);
    player.state = "wait";
    if (multiplier > 1) {
      multiplier--;
    }
  }
}

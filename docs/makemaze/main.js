title = "MAKE MAZE";

description = `
[Tap][Slide]
 Add/Remove wall
`;

characters = [
  `
llll l
llll l

ll lll
ll lll

`,
  `
  ll
  lll
llllll
llllll
  lll
  ll
`,
  `
  ll
 l ll
l llll
llllll
 llll
  ll
`,
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  isDrawingScoreFront: true,
  seed: 30,
};

/** @type {boolean[][]} */
let walls;
let wallOfs;
/** @type {boolean[][]} */
let wallFills;
let pwp;
/**
 * @type {{
 * pos: Vector, angle: number, angleVel: number, scPos: Vector,
 * moveInterval: number, ticks: number, isAngry: boolean
 * }[]}
 */
let enemies;
let nextEnemyTicks;
/** @type {Vector[]} */
let golds;
let goldMinY;
let missScr;
let multiplier;
const wallSize = vec(16, 18);
const angleOfs = [
  vec(1, 0),
  vec(1, 1),
  vec(0, 1),
  vec(-1, 1),
  vec(-1, 0),
  vec(-1, -1),
  vec(0, -1),
  vec(1, -1),
];

function update() {
  if (!ticks) {
    walls = times(wallSize.x, (x) =>
      times(wallSize.y, (y) => {
        return (
          x === 0 ||
          x === 15 ||
          (y === 10 && (x === 1 || x === 14)) ||
          (y === 12 && x > 1 && x < 14) ||
          (y === 14 && (x < 7 || x > 8))
        );
      })
    );
    wallOfs = vec(5, -2);
    wallFills = times(wallSize.x, (x) => times(wallSize.y, (y) => false));
    pwp = vec();
    enemies = [];
    nextEnemyTicks = 0;
    golds = [];
    goldMinY = 99;
    missScr = 0;
    multiplier = 1;
  }
  let scr = 0.01 * sqrt(difficulty) + missScr;
  missScr *= 0.9;
  const gy = goldMinY * 6 + wallOfs.y;
  if (gy > 50) {
    scr += (gy - 50) * 0.02 * sqrt(difficulty);
  }
  wallOfs.y -= scr;
  enemies.forEach((e) => {
    e.scPos.y -= scr;
  });
  if (wallOfs.y < -2) {
    for (let y = 1; y < wallSize.y; y++) {
      for (let x = 0; x < wallSize.x; x++) {
        walls[x][y - 1] = walls[x][y];
      }
    }
    for (let x = 0; x < wallSize.x; x++) {
      walls[x][wallSize.y - 1] = x === 0 || x === 15;
    }
    golds.push(vec(rndi(1, wallSize.x - 1), wallSize.y - 1));
    wallOfs.y += 6;
    enemies.forEach((e) => {
      e.pos.y--;
    });
    golds.forEach((g) => {
      g.y--;
    });
    pwp.y--;
  }
  if (input.isPressed) {
    const wp = vec(input.pos)
      .sub(wallOfs.x - 3, wallOfs.y - 3)
      .div(6)
      .floor();
    if (
      wp.x > 0 &&
      wp.x < wallSize.x - 1 &&
      wp.y >= 0 &&
      wp.y < wallSize.y &&
      !wp.equals(pwp) &&
      !checkGold(wp)
    ) {
      play("select");
      walls[wp.x][wp.y] = !walls[wp.x][wp.y];
      pwp.set(wp);
    }
  } else {
    pwp.set();
  }
  color("light_purple");
  for (let y = 0; y < wallSize.y; y++) {
    for (let x = 0; x < wallSize.x; x++) {
      if (walls[x][y]) {
        char("a", wallOfs.x + x * 6, wallOfs.y + y * 6);
      }
    }
  }
  nextEnemyTicks--;
  if (nextEnemyTicks < 0) {
    let x;
    for (let i = 0; i < 99; i++) {
      x = rndi(1, wallSize.x - 1);
      if (!walls[x][0]) {
        break;
      }
    }
    const pos = vec(x, 0);
    enemies.push({
      pos,
      angle: 2,
      angleVel: rndi(2) * 2 - 1,
      scPos: vec(wallOfs.x + pos.x * 6, wallOfs.y + pos.y * 6),
      moveInterval: ceil(60 / sqrt(difficulty)),
      ticks: 0,
      isAngry: false,
    });
    nextEnemyTicks = 150 / sqrt(difficulty);
  }
  remove(enemies, (e) => {
    e.ticks--;
    if (e.ticks < 0) {
      let pp = vec(e.pos);
      removeGold(e.pos);
      let isMoving = false;
      if (!checkDownExit(e.pos)) {
        e.isAngry = true;
        e.angle = 2;
        e.pos.y++;
        removeGold(e.pos);
        if (walls[e.pos.x][e.pos.y]) {
          play("powerUp");
          walls[e.pos.x][e.pos.y] = false;
        }
      } else {
        e.isAngry = false;
        for (let i = 0; i < 99; i++) {
          if (
            getWall(e.pos, e.angle) ||
            getWall(e.pos, e.angle + e.angleVel * 2) ||
            getWall(e.pos, e.angle + e.angleVel * 3) ||
            getWall(e.pos, e.angle + e.angleVel * 4) ||
            e.pos.y < 0 ||
            e.pos.y >= wallSize.y
          ) {
            break;
          }
          e.pos.add(angleOfs[e.angle]);
          removeGold(e.pos);
          isMoving = true;
        }
        if (e.pos.y < 0 || e.pos.y >= wallSize.y) {
          isMoving = true;
        }
        for (let i = 0; i < (isMoving ? 0 : 99); i++) {
          let a = wrap(e.angle + e.angleVel * 2, 0, 8);
          for (let j = 0; j < 4; j++) {
            if (!getWall(e.pos, a)) {
              if (i > 0 && a !== e.angle) {
                break;
              }
              e.pos.add(angleOfs[a]);
              removeGold(e.pos);
              e.angle = a;
              break;
            }
            a = wrap(a - e.angleVel * 2, 0, 8);
          }
          if (a !== e.angle || e.pos.y < 0 || e.pos.y >= wallSize.y) {
            break;
          }
        }
      }
      if (pp.distanceTo(e.pos) > 1) {
        play("hit");
      }
      e.ticks = e.moveInterval;
    }
    e.scPos.add(
      vec(wallOfs.x + e.pos.x * 6, wallOfs.y + e.pos.y * 6)
        .sub(e.scPos)
        .mul(0.1)
    );
    color(e.isAngry ? "red" : e.angleVel < 0 ? "blue" : "purple");
    char("b", e.scPos, { rotation: wrap(e.angle / 2, 0, 4) });
    if (e.pos.y >= wallSize.y) {
      play("explosion");
      missScr++;
      if (multiplier > 1) {
        multiplier--;
      }
      addScore(-multiplier, e.scPos.x, 99);
      particle(e.scPos.x, 110, 19, 2, -PI / 2, -PI / 8);
    }
    return e.pos.y < 0 || e.pos.y >= wallSize.y;
  });
  goldMinY = 99;
  golds.forEach((g) => {
    walls[g.x][g.y] = false;
    const x = wallOfs.x + g.x * 6;
    const y = wallOfs.y + g.y * 6;
    color(y < 30 ? "red" : "yellow");
    char("c", x, y);
    if (g.y < goldMinY) {
      goldMinY = g.y;
    }
    if (y < 0) {
      play("lucky");
      text("X", x, 3);
      end();
    }
  });
}

function getWall(cp, ta) {
  const p = vec(cp).add(angleOfs[wrap(ta, 0, 8)]);
  if (p.y < 0 || p.y >= wallSize.y) {
    return false;
  }
  return walls[p.x][p.y];
}

function removeGold(p) {
  color("yellow");
  remove(golds, (g) => {
    if (p.equals(g)) {
      play("coin");
      addScore(multiplier, wallOfs.x + g.x * 6, wallOfs.y + g.y * 6);
      particle(wallOfs.x + g.x * 6, wallOfs.y + g.y * 6);
      multiplier++;
      return true;
    }
  });
}

function checkGold(p) {
  let exists = false;
  golds.forEach((g) => {
    if (p.equals(g)) {
      exists = true;
    }
  });
  return exists;
}

function checkDownExit(p) {
  for (let x = 1; x < wallSize.x - 1; x++) {
    for (let y = 0; y < wallSize.y; y++) {
      wallFills[x][y] = false;
    }
  }
  wallFills[p.x][p.y] = true;
  for (let i = 0; i < 9; i++) {
    for (let x = 1; x < wallSize.x - 1; x++) {
      for (let y = 1; y < wallSize.y; y++) {
        if (
          !walls[x][y] &&
          !wallFills[x][y] &&
          (wallFills[x - 1][y] || wallFills[x][y - 1])
        ) {
          if (y === wallSize.y - 1) {
            return true;
          }
          wallFills[x][y] = true;
        }
      }
    }
    for (let x = wallSize.x - 2; x > 0; x--) {
      for (let y = wallSize.y - 2; y >= 0; y--) {
        if (
          !walls[x][y] &&
          !wallFills[x][y] &&
          (wallFills[x + 1][y] || wallFills[x][y + 1])
        ) {
          wallFills[x][y] = true;
        }
      }
    }
  }
  return false;
}

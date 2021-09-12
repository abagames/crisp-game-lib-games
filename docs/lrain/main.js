title = "L RAIN";

description = `
[Slide] Move
`;

characters = [
  `
  ll
  ll
b ll b
b ll b
bbllbb
b ll b
`,
];

options = {
  theme: "dark",
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 7,
};

/** @type {{pos: Vector, vy: number, width: number, ticks: number}[]} */
let lasers;
let nextLaserTicks;
let laserDurationAngle;
/** @type {{pos: Vector, vy: number, size: Vector, color: Color}[]} */
let laserBoxes;
/** @type {{pos: Vector, px: number, energy: number, invincible: number}} */
let ship;
let safeX;
let safeVx;
let multiplier;

function update() {
  if (!ticks) {
    lasers = [];
    nextLaserTicks = 0;
    laserDurationAngle = 0;
    laserBoxes = [];
    ship = { pos: vec(50, 50), px: 50, energy: 0, invincible: 0 };
    safeX = 50;
    safeVx = 0;
    multiplier = 1;
  }
  ship.px = ship.pos.x;
  ship.pos.x = clamp(input.pos.x, 0, 99);
  color("white");
  rect(ship.pos.x + 2, ship.pos.y - 3, ship.px + 6 - (ship.pos.x + 2), 6);
  rect(ship.pos.x - 2, ship.pos.y - 3, ship.px - 6 - (ship.pos.x - 2), 6);
  color("black");
  rect(ship.pos.x, ship.pos.y - 2, 1, 4);
  safeX += safeVx / (lasers.length + 1);
  safeVx += wrap(safeVx + rnds(0.01), -0.1, 0.1);
  safeVx *= 0.99;
  if ((safeX < 9 && safeVx < 0) || (safeX > 90 && safeVx > 0)) {
    safeVx *= -1;
  }
  laserDurationAngle += 0.001 * difficulty;
  nextLaserTicks--;
  if (nextLaserTicks < 0) {
    play("laser");
    const x = rnd(99);
    const vy = sqrt(difficulty) * 3 * (rndi(2) * 2 - 1);
    const width = rnd(3, 9);
    if (abs(x - safeX) > width + 2) {
      lasers.push({
        pos: vec(x, vy > 0 ? 0 : 99),
        vy,
        width,
        ticks: 0,
      });
    }
    let tr = abs(cos(laserDurationAngle));
    if (tr < 0.15) {
      tr = 5;
    }
    nextLaserTicks = rnd(30 / tr) / difficulty;
  }
  color("light_red");
  remove(lasers, (l) => {
    if (l.pos.y < 0 || l.pos.y > 99) {
      l.ticks += difficulty;
      let w = sin(l.ticks * 0.1) * l.width * 2;
      if (w <= 0) {
        return true;
      }
      w = clamp(w, 0, l.width - 1);
      const sy = abs(l.vy) * rnd(3, 5);
      times(floor(w), () => {
        laserBoxes.push({
          pos: vec(
            l.pos.x + rnds(w),
            l.pos.y +
              (50 - l.pos.y) * 2 +
              (rnd(9) + sy / 2) * (l.vy > 0 ? -1 : 1)
          ),
          vy: l.vy * 3,
          size: vec(3, sy),
          color: rnd() < 0.5 ? "red" : "purple",
        });
      });
    } else {
      l.pos.y += l.vy;
      const y = l.vy > 0 ? 0 : 99;
      rect(l.pos.x - l.width, y, l.width * 2, l.pos.y - y);
      if (l.pos.y < 0 || l.pos.y > 99) {
        play("coin");
      }
    }
  });
  let isHit = false;
  remove(laserBoxes, (b) => {
    b.pos.y += b.vy;
    color(b.color);
    const c = box(b.pos, b.size).isColliding.rect;
    if (c.white) {
      play("hit");
      addScore(multiplier);
      color("black");
      particle(ship.pos, 1);
      ship.energy += 0.1;
      if (ship.energy > 15) {
        play("explosion");
        play("powerUp");
        multiplier++;
        particle(ship.pos, 30, 3);
        ship.energy = 0;
        ship.invincible = 30;
      }
    }
    if (c.black) {
      isHit = true;
    }
    return b.pos.y < -b.size.y / 2 || b.pos.y > 99 + b.size.y / 2;
  });
  if (ship.energy < 3 && isHit) {
    play("lucky");
    end();
  }
  color("light_cyan");
  arc(ship.pos, 15, 2);
  color("cyan");
  arc(ship.pos, ship.energy, 2);
  color("black");
  if (ship.invincible >= 3) {
    ship.invincible *= 1 - 0.02 * sqrt(difficulty);
    arc(ship.pos, ship.invincible);
    if (ticks % 4 < 2) {
      color("cyan");
    }
  }
  char("a", ship.pos);
  color("black");
  text(`x${multiplier}`, 3, 9);
}

title = "R RING";

description = `
[Slide] Move
`;

characters = [
  `
 c c
blblb
lblbl
 lbl
 l l
 l l
`,
  `
 bb
bccb
cllc
cllc
bccb
 bb
`,
  `
 lrl
r   r
 lrl 
L L L
 LLL
`,
];

options = {
  theme: "dark",
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 7,
};

/**
 * @type {{
 * pos: Vector, posHistory:Vector[], targetPos: Vector, angle: number,
 * stopTicks: number, moveTicks: number, fireTicks: number,
 * }}
 */
let ship;
let optionCount;
/** @type {{pos: Vector, vy: number, radius: number, isHit: boolean }[]} */
let rings;
/** @type {{pos :Vector, vy: number, color: Color}[]} */
let stars;
let multiplier;
let nextPowerUpTicks;
let maxOptionCount;

function update() {
  if (!ticks) {
    ship = {
      pos: vec(20, 20),
      angle: 0,
      posHistory: [],
      targetPos: vec(20, 20),
      stopTicks: 0,
      moveTicks: 0,
      fireTicks: 0,
    };
    optionCount = 0;
    rings = [];
    // @ts-ignore
    stars = times(20, () => {
      return {
        pos: vec(rnd(99), rnd(99)),
        vy: rnd(0.5, 1),
        color: ["light_cyan", "light_purple", "light_black"][rndi(3)],
      };
    });
    multiplier = 1;
    nextPowerUpTicks = 60;
    maxOptionCount = 1;
  }
  const sd = sqrt(difficulty);
  stars.forEach((s) => {
    s.pos.y += s.vy;
    if (s.pos.y > 99) {
      s.pos.x = rnd(99);
      s.pos.y = 0;
    }
    color(s.color);
    rect(s.pos, 1, 1);
  });
  ship.stopTicks--;
  if (ship.stopTicks < 0) {
    ship.moveTicks = rnd(120, 180) / sd;
    ship.stopTicks = ship.moveTicks + rnd(40, 60) / sd;
  }
  ship.moveTicks--;
  if (ship.moveTicks > 0) {
    if (ship.pos.distanceTo(ship.targetPos) < 5) {
      ship.targetPos.set(rnd(10, 90), rnd(3, 30));
    }
    const ta = ship.pos.angleTo(ship.targetPos);
    const oa = wrap(ta - ship.angle, -PI, PI);
    const va = 0.1 * difficulty;
    if (abs(oa) < va) {
      ship.angle = ta;
    } else {
      ship.angle += oa > 0 ? va : -va;
    }
    ship.pos.addWithAngle(ship.angle, 0.5 * difficulty).clamp(0, 99, 0, 50);
    ship.posHistory.unshift(vec(ship.pos));
    if (ship.posHistory.length > 99) {
      ship.posHistory.pop();
    }
  }
  color("black");
  char("a", ship.pos);
  ship.fireTicks--;
  if (ship.fireTicks < 0) {
    play("hit");
    fire(ship.pos);
  }
  nextPowerUpTicks--;
  if (nextPowerUpTicks < 0) {
    play("powerUp");
    optionCount++;
    if (optionCount > maxOptionCount) {
      optionCount = 0;
      maxOptionCount = clamp(maxOptionCount + 1, 1, 4);
    }
    nextPowerUpTicks = (optionCount === 0 ? 60 : 300 / optionCount) / sd;
  }
  times(optionCount, (i) => {
    const p = ship.posHistory[(i + 1) * 24];
    const s = sin(((ticks % 40) * PI * 2) / 40) * 0.2 + 1;
    char("b", p, { scale: { x: s, y: s } });
    if (ship.fireTicks < 0) {
      fire(p);
    }
  });
  if (ship.fireTicks < 0) {
    ship.fireTicks = 60 / difficulty;
  }
  color("purple");
  remove(rings, (r) => {
    r.pos.y += r.vy;
    r.radius += r.vy * 0.5;
    arc(
      r.pos.x,
      r.pos.y - r.radius * 0.3,
      r.radius * 0.6,
      3,
      PI / 4,
      (PI / 4) * 3
    );
  });
  color("red");
  remove(rings, (r) => {
    arc(
      r.pos.x - r.radius * 0.32,
      r.pos.y,
      r.radius * 0.2,
      3,
      (PI / 6) * 5,
      (PI / 6) * 7
    );
    arc(
      r.pos.x + r.radius * 0.32,
      r.pos.y,
      r.radius * 0.2,
      3,
      -(PI / 6),
      PI / 6
    );
  });
  color("black");
  if (char("c", clamp(input.pos.x, 0, 99), 95).isColliding.rect.red) {
    play("explosion");
    end();
  }
  remove(rings, (r) => {
    color(r.isHit ? "light_purple" : "purple");
    if (
      arc(
        r.pos.x,
        r.pos.y + r.radius * 0.3,
        r.radius * 0.6,
        3,
        -PI / 4,
        -(PI / 4) * 3
      ).isColliding.char.c &&
      !r.isHit
    ) {
      play("coin");
      addScore(multiplier, r.pos);
      multiplier++;
      r.isHit = true;
    }
    if (r.pos.y > 110) {
      if (!r.isHit && multiplier > 1) {
        multiplier--;
      }
      return true;
    }
  });
  color("black");
  text(`+${multiplier}`, 3, 9);

  function fire(p) {
    rings.push({ pos: vec(p), vy: sd, radius: 1, isHit: false });
  }
}

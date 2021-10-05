title = "SMOKE G";

description = `
[Tap] Smoke
`;

characters = [
  `
llllll
ll l l
ll l l
llllll
 l  l
 l  l
  `,
  `
llllll
ll l l
ll l l
llllll
ll  ll
  `,
  `
  lll
ll l l
 llll
 l  l
ll  ll
`,
  `
  lll
ll l l
 llll
  ll
 l  l
 l  l
`,
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 9,
};

/** @type {{pos: Vector, target: Vector, ticks: number}[]} */
let grenades;
/** @type {{pos: Vector, radius: number, isExtending: boolean}[]} */
let smokes;
/** @type {{pos: Vector, angle: number}[]} */
let enemies;
let nextEnemyDist;
let currentSide;
let nextSideChangeCount;
/** @type {{pos: Vector, angle: number}} */
let player;
const shotRange = 50;

function update() {
  if (!ticks) {
    grenades = [];
    smokes = [];
    enemies = [];
    nextEnemyDist = 0;
    currentSide = 1;
    nextSideChangeCount = 0;
    player = { pos: vec(50, 90), angle: -PI / 2 };
  }
  const scr = sqrt(difficulty) * 0.1;
  if (input.isJustPressed && smokes.length < 9) {
    play("select");
    grenades.push({
      pos: vec(player.pos),
      target: vec(input.pos).clamp(0, 99, 0, 99),
      ticks: 0,
    });
  }
  color("light_black");
  remove(grenades, (g) => {
    g.ticks += sqrt(difficulty);
    g.pos.add(vec(g.target).sub(g.pos).mul(0.1));
    g.pos.y += cos((g.ticks / 30) * PI * 4) + scr;
    box(g.pos, 4);
    if (g.ticks > 30) {
      play("hit");
      smokes.push({ pos: vec(g.target), radius: 0, isExtending: true });
      return true;
    }
  });
  color("black");
  remove(smokes, (s) => {
    if (s.isExtending) {
      s.radius += (10 - s.radius) * 0.2 * sqrt(difficulty);
      if (s.radius > 9) {
        s.isExtending = false;
        s.radius = 10;
      }
    } else {
      s.radius *= 1 - 0.005 * sqrt(difficulty);
    }
    s.pos.y += scr;
    arc(s.pos, s.radius);
    return !s.isExtending && s.radius < 2;
  });
  if (enemies.length === 0) {
    nextEnemyDist = 0;
  }
  nextEnemyDist -= scr;
  if (nextEnemyDist < 0) {
    nextSideChangeCount--;
    if (nextSideChangeCount < 0) {
      currentSide *= -1;
      nextSideChangeCount = rnd(1, 5);
      nextEnemyDist += 7;
    }
    const pos = vec(50 + rnd(40) * currentSide, -3);
    enemies.push({ pos, angle: player.pos.angleTo(pos) + rnds(0.2) });
    nextEnemyDist += rnd(5, 9);
  }
  let te;
  let minDist = 99;
  color("transparent");
  enemies.forEach((e) => {
    const ta = player.pos.angleTo(e.pos);
    const d = player.pos.distanceTo(e.pos);
    if (bar(player.pos, d, 2, ta, 0).isColliding.rect.black) {
      return;
    }
    if (d < minDist) {
      minDist = d;
      te = e;
    }
  });
  if (te != null) {
    // @ts-ignore
    const ta = player.pos.angleTo(te.pos);
    const oa = wrap(ta - player.angle, -PI, PI);
    const av = 0.012 * sqrt(difficulty);
    if (abs(oa) < av) {
      player.angle = ta;
    } else {
      player.angle += oa < 0 ? -av : av;
    }
  }
  color("light_cyan");
  bar(player.pos, shotRange * 1.1, 2, player.angle, 0);
  color("blue");
  char(addWithCharCode("a", floor(ticks / 20) % 2), player.pos, {
    mirror: { x: abs(wrap(player.angle, -PI, PI)) < PI / 2 ? 1 : -1 },
  });
  remove(enemies, (e) => {
    e.pos.y += scr;
    color("transparent");
    const c1 = bar(
      e.pos,
      e.pos.distanceTo(player.pos),
      2,
      e.pos.angleTo(player.pos),
      0
    ).isColliding.rect;
    const av = 0.008 * sqrt(difficulty);
    if (!c1.black) {
      const ta = e.pos.angleTo(player.pos);
      const oa = wrap(ta - e.angle, -PI, PI);
      if (abs(oa) < av) {
        e.angle = ta;
      } else {
        e.angle += oa < 0 ? -av : av;
      }
      color("light_purple");
    } else {
      color("light_black");
    }
    const c2 = bar(e.pos, shotRange, 2, e.angle, 0).isColliding.char;
    if (!c1.black && (c2.a || c2.b)) {
      play("explosion");
      color("purple");
      bar(e.pos, shotRange, 4, e.angle, 0);
      end();
    }
    color(c1.black ? "light_red" : "red");
    const c3 = char(addWithCharCode("c", floor(ticks / 30) % 2), e.pos, {
      mirror: { x: abs(wrap(e.angle, -PI, PI)) < PI / 2 ? 1 : -1 },
    }).isColliding.rect;
    if (c3.light_cyan) {
      play("laser");
      color("cyan");
      bar(player.pos, shotRange, 4, player.angle, 0);
      particle(player.pos, 20, 3, player.angle, 0);
      color("red");
      particle(e.pos);
      addScore(1);
      return true;
    }
    if (e.pos.y > 99) {
      play("explosion");
      color("red");
      text("X", e.pos.x, 96);
      end();
    }
  });
}

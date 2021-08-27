title = "G TAIL";

description = `
[Slide] Move
`;

characters = [
  `
 llll
llccll
llccll
llllll
bbbbbb
bb  bb
`,
  `
 rrrr
rRRrRr
rrRRRr
rRRrrr
rrRrRr
 rrrr
`,
];

options = {
  theme: "dark",
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 9,
};

/**
 * @type {{
 * pos: Vector, vel: Vector, accel: number, posHistory: Vector[], golds: number[]
 * }[]}
 */
let meteors;
let nextMeteorTicks;
let multiplier;
let shipPos;
/** @type {{pos: Vector, vy: number, color: Color}[]} */
let stars;

function update() {
  if (!ticks) {
    meteors = [];
    nextMeteorTicks = 0;
    multiplier = 1;
    shipPos = vec(50, 50);
    // @ts-ignore
    stars = times(30, () => {
      return {
        pos: vec(rnd(99), rnd(99)),
        vy: rnd(1, 2),
        color: ["light_cyan", "light_red", "light_yellow"][rndi(3)],
      };
    });
  }
  stars.forEach((s) => {
    s.pos.y += s.vy;
    color(s.color);
    rect(s.pos, 1, 1);
    if (s.pos.y > 110) {
      s.pos.set(rnd(99), -rnd(9));
    }
  });
  if (shipPos.y > 99) {
    shipPos.y = 99;
    end();
  }
  shipPos.x = clamp(input.pos.x, 0, 99);
  shipPos.y += (50 - shipPos.y) * 0.001;
  color("black");
  const oy = clamp(shipPos.y - 55, 0, 99);
  char("a", shipPos.x + rnds(oy * 0.01), shipPos.y + rnds(oy * 0.01));
  color("red");
  particle(shipPos.x, shipPos.y + 2, 1, 2, PI / 2, PI / 8);
  if (meteors.length < 0) {
    nextMeteorTicks = 0;
  }
  nextMeteorTicks--;
  if (nextMeteorTicks < 0) {
    meteors.push({
      pos: vec(rnd(10, 90), -5),
      vel: vec(rnds(0.5)),
      accel: rnd(1, sqrt(difficulty)),
      posHistory: [],
      golds: times(rndi(3, 8), (i) => (i + 2) * 5),
    });
    nextMeteorTicks = (rnd(99, 120) / sqrt(difficulty)) * sqrt(meteors.length);
  }
  remove(meteors, (m) => {
    m.vel.add(vec(shipPos).sub(m.pos).div(999).mul(m.accel));
    m.vel.clamp(-2, 2, -2, 2);
    m.pos.add(m.vel);
    m.posHistory.unshift(vec(m.pos));
    if (m.posHistory.length > 200) {
      m.posHistory.pop();
    }
    color("yellow");
    remove(m.golds, (g) => {
      if (m.posHistory.length > g) {
        if (text("$", m.posHistory[g]).isColliding.char.a) {
          play("coin");
          particle(m.posHistory[g]);
          addScore(multiplier);
          return true;
        }
      }
    });
    if (m.golds.length === 0) {
      play("powerUp");
      const p = m.pos.clamp(5, 95, 5, 95);
      addScore(multiplier, p);
      color("red");
      particle(p, 20, 2);
      multiplier++;
      return true;
    }
    color("black");
    if (char("b", m.pos).isColliding.char.a) {
      play("explosion");
      color("black");
      particle(shipPos, 30, 3);
      shipPos.y += 10;
      return true;
    }
    if (!m.pos.isInRect(-3, -3, 106, 106)) {
      color("red");
      box(vec(m.pos).clamp(-3, 103, -3, 103), 8);
    }
    return !m.pos.isInRect(-100, -100, 300, 300);
  });
  color("black");
  text(`x${multiplier}`, 3, 9);
}

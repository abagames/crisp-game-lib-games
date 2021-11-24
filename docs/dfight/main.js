title = "D FIGHT";

description = `
[Slide] Move
`;

characters = [
  `
 l 
llll
 l
l l
l  l
`,
  `
 l 
llll
 l
  l
 l
`,
  `
 ll 
llllll
 ll
 ll
ll ll
ll  ll
`,
  `
 ll 
llllll
 ll
 ll
  ll
 ll
`,
];

options = {
  viewSize: { x: 200, y: 100 },
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 800,
};

/** @type {{x: number}[]} */
let domes;
let nextDomeDist;
/**
 * @type {{
 * pos: Vector, vel: Vector, target: any, targetDistance: number,
 * aimLength: number, fireLength: number,
 * moveTicks: number, mirrorX: 1 | -1,
 * type: "player" | "ally" | "enemy", isAlive: boolean
 * }[]}
 */
let agents;
let nextAllyAgentTicks;
let nextEnemyAgentTicks;
let enemyCount;
let allyCount;
const domeRadius = 40;
const maxAimDistance = 99;

function update() {
  if (!ticks) {
    domes = [{ x: 100 }];
    nextDomeDist = 0;
    agents = [
      {
        pos: vec(99, 87),
        vel: vec(),
        target: undefined,
        targetDistance: 0,
        aimLength: 0,
        fireLength: 0,
        moveTicks: 0,
        mirrorX: 1,
        type: "player",
        isAlive: true,
      },
    ];
    nextAllyAgentTicks = 9;
    nextEnemyAgentTicks = 0;
    enemyCount = allyCount = 0;
  }
  const sd = sqrt(difficulty);
  const scr = sd * 0.2;
  nextDomeDist -= scr;
  if (nextDomeDist < 0) {
    domes.push({ x: 200 + domeRadius });
    nextDomeDist += rnd(70, 150);
  }
  color("yellow");
  remove(domes, (d) => {
    d.x -= scr;
    arc(d.x, 90, domeRadius, 3, PI, PI * 2);
    return d.x < -domeRadius;
  });
  color("light_black");
  rect(0, 90, 200, 10);
  nextAllyAgentTicks--;
  if (nextAllyAgentTicks < 0) {
    addAgent("ally");
    allyCount++;
    nextAllyAgentTicks = (rnd(120, 150) * allyCount) / sd;
  }
  if (enemyCount === 0) {
    nextEnemyAgentTicks = 0;
  }
  nextEnemyAgentTicks--;
  if (nextEnemyAgentTicks < 0) {
    addAgent("enemy");
    enemyCount++;
    nextEnemyAgentTicks += (rnd(60, 80) * enemyCount) / sd;
  }
  allyCount = enemyCount = 0;
  const p = vec();
  agents.forEach((a) => {
    if (a.type === "player") {
      a.pos.x += (clamp(input.pos.x, 3, 197) - a.pos.x) * 0.2;
    } else {
      if (a.type === "ally") {
        allyCount++;
      } else {
        enemyCount++;
      }
      a.vel.y += difficulty * 0.05;
      if (a.pos.x < 3 && a.vel.x < 0) {
        a.pos.x = 3;
        a.vel.x *= -1;
      }
      if (a.pos.x > 197 && a.vel.x > 0) {
        a.pos.x = 197;
        a.vel.x *= -1;
      }
      if (a.pos.y >= 87) {
        a.pos.y = 87;
        a.vel.y = 0;
        if (rnd() < 0.01) {
          a.vel.y = -rnd(3, 6) * sd;
        }
      }
    }
    a.pos.add(a.vel);
    a.vel.mul(0.9);
    if (a.target == null) {
      a.target = getNearest(a);
      return;
    }
    const d = a.pos.distanceTo(a.target.pos);
    const an = a.pos.angleTo(a.target.pos);
    a.mirrorX = abs(an) < PI / 2 ? 1 : -1;
    if (!a.target.isAlive || d > maxAimDistance) {
      a.target = undefined;
      a.aimLength = a.fireLength = 0;
      return;
    }
    if (a.type !== "player") {
      let vx = -1;
      if (a.pos.x > a.target.pos.x) {
        vx *= -1;
      }
      if (d > a.targetDistance) {
        vx *= -1;
      }
      a.vel.x += vx * sd * 0.1;
    }
    if (a.fireLength > 0) {
      const pl = a.fireLength;
      a.fireLength += sd * 3;
      color(a.type === "enemy" ? "red" : "blue");
      const c = bar(
        p.set(a.pos).addWithAngle(an, a.fireLength),
        9,
        4,
        an,
        1
      ).isColliding;
      a.aimLength = d;
      if (c.rect.yellow || p.y > 90 || a.fireLength > maxAimDistance) {
        a.fireLength = a.aimLength = 0;
        if (c.rect.yellow) {
          play("hit");
          particle(p, 9, 3, an, 0.3);
        }
      }
    } else {
      a.aimLength +=
        sd *
        (a.type === "enemy" ? 0.4 : a.type === "ally" ? 0.2 : 0.9) *
        d *
        0.03;
      if (a.aimLength > d) {
        play("laser");
        a.fireLength = 5;
      }
      color(a.type === "enemy" ? "red" : a.type === "ally" ? "blue" : "green");
      text("x", p.set(a.pos).addWithAngle(an, a.aimLength));
      color(a.type === "enemy" ? "light_red" : "light_blue");
      bar(a.pos, a.aimLength, 1, an, 0);
    }
  });
  remove(agents, (a) => {
    color(a.type === "enemy" ? "purple" : a.type === "ally" ? "blue" : "green");
    a.moveTicks++;
    const c = char(
      addWithCharCode(
        a.type === "player" ? "c" : "a",
        a.pos.y < 87 ? 0 : floor(a.moveTicks / 15) % 2
      ),
      a.pos,
      { mirror: { x: a.mirrorX } }
    ).isColliding.rect;
    if (a.type === "enemy" && c.blue) {
      play("powerUp");
      particle(a.pos);
      addScore(1);
      a.isAlive = false;
      return true;
    }
    if (a.type === "ally" && c.red) {
      play("coin");
      particle(a.pos);
      a.isAlive = false;
      return true;
    }
    if (a.type === "player" && c.red) {
      play("explosion");
      end();
    }
  });

  function addAgent(type) {
    const x = rnd() < 0.3 ? -3 : 203;
    agents.push({
      pos: vec(x, 87),
      vel: vec((x < 0 ? 1 : -1) * sd),
      target: undefined,
      targetDistance: rnd(30, 60),
      aimLength: 0,
      fireLength: 0,
      moveTicks: 0,
      mirrorX: x < 0 ? 1 : -1,
      type,
      isAlive: true,
    });
  }

  function getNearest(a) {
    let nd = maxAimDistance;
    let n;
    agents.forEach((aa) => {
      if (a === aa) {
        return;
      }
      if (
        (a.type === "player" || a.type === "ally") &&
        (aa.type === "player" || aa.type === "ally")
      ) {
        return;
      }
      if (a.type === "enemy" && aa.type === "enemy") {
        return;
      }
      const d = a.pos.distanceTo(aa.pos);
      if (d < nd) {
        nd = d;
        n = aa;
      }
    });
    return n;
  }
}

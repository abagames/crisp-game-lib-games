title = "ZOOM IO";

description = `
[Hold]
 Zoom &
 Go forward
`;

characters = [];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  isDrawingScoreFront: true,
  isDrawingParticleFront: true,
  seed: 3,
};

/**
 * @type {{
 * pos: Vector, angle: number, speed: number,
 * type: "player" | "enemy" | "bonus"
 * }[]}
 */
let arrows;
let nextArrowTicks;
let nextArrowCount;
let nextAngles;
let zoom;
/** @type {number[]} */
let lines;
let scr;
let multiplier;
const cp = vec(50, 50);

function update() {
  if (!ticks) {
    arrows = [
      {
        pos: vec(50, 50),
        angle: -PI / 2,
        speed: 0,
        type: "player",
      },
    ];
    nextArrowTicks = nextArrowCount = 0;
    nextAngles = times(2, () => rnd(PI * 2));
    zoom = 1;
    lines = times(20, (i) => (i % 10) * 10);
    scr = vec();
    multiplier = 1;
  }
  color("light_cyan");
  for (let i = 0; i < 20; i++) {
    if (i < 10) {
      lines[i] = wrap(lines[i] + scr.x, 0, 100);
      rect((lines[i] - 50) * zoom + 50, 0, 1, 100);
    } else {
      lines[i] = wrap(lines[i] + scr.y, 0, 100);
      rect(0, (lines[i] - 50) * zoom + 50, 100, 1);
    }
  }
  nextArrowTicks--;
  if (nextArrowTicks < 0) {
    if (rnd() < 0.1) {
      let na = rnd(PI * 2);
      if (nextArrowCount % 2 === 1 && zoom > 5) {
        na = arrows[0].angle;
      }
      nextAngles[nextArrowCount % 2] = na;
    }
    const pos = vec(50, 50).addWithAngle(nextAngles[nextArrowCount % 2], 70);
    const tp = vec(50, 50).addWithAngle(rnd(PI * 2), rnd(20, 40));
    arrows.push({
      pos,
      angle: pos.angleTo(tp),
      speed: rnd(1, difficulty + 0.1) * 0.1,
      type: nextArrowCount % 2 === 0 ? "bonus" : "enemy",
    });
    nextArrowTicks = 20 / sqrt(difficulty);
    nextArrowCount++;
  }
  if (input.isJustPressed || input.isJustReleased) {
    play("laser");
  }
  if (input.isPressed) {
    zoom = clamp(zoom + 0.05 * sqrt(difficulty), 1, 9);
    multiplier += zoom * 0.1 * sqrt(difficulty);
  } else {
    zoom += (1 - zoom) * (0.03 * sqrt(difficulty));
  }
  if (zoom < 2) {
    multiplier += (0.5 - multiplier) * 0.02;
  }
  remove(arrows, (a) => {
    if (a.type === "player") {
      a.angle += input.isPressed ? 0 : (sqrt(difficulty) * 0.1) / zoom;
      a.speed += (sqrt(difficulty) * (zoom - 1) * 0.1 - a.speed) * 0.05;
      scr.set().addWithAngle(a.angle, -a.speed);
      color("cyan");
    } else {
      a.pos.addWithAngle(a.angle, a.speed);
      a.pos.add(scr);
      color(a.type === "enemy" ? "red" : "yellow");
    }
    const p = vec(a.pos).sub(cp).mul(zoom).add(cp);
    const d = a.pos.distanceTo(cp);
    if (
      a.type === "player" ||
      (sqrt(zoom) > 0.5 + d * 0.03 && p.isInRect(0, 0, 99, 99))
    ) {
      const bp = vec(p).addWithAngle(a.angle, -1 * zoom);
      let c = bar(p, 5 * zoom, 3 * zoom, a.angle).isColliding.rect;
      c = {
        ...c,
        ...box(vec(bp).addWithAngle(a.angle + PI / 2, 2 * zoom), 2 * zoom)
          .isColliding.rect,
      };
      c = {
        ...c,
        ...box(vec(bp).addWithAngle(a.angle - PI / 2, 2 * zoom), 2 * zoom)
          .isColliding.rect,
      };
      if (a.type !== "player" && c.cyan) {
        if (a.type === "bonus") {
          play("powerUp");
          particle(p, 5 * zoom, sqrt(zoom));
          addScore(ceil(multiplier), 50, 50);
          return true;
        } else {
          play("explosion");
          end();
        }
      }
    } else {
      bar(50, 50, 30, 1, cp.angleTo(p), 0);
    }
    return d > 70;
  });
  color("black");
  text(`+${ceil(multiplier)}`, 3, 9);
}

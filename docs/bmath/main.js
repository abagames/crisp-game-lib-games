title = "B MATH";

description = `
[Tap] Answer
`;

characters = [];

options = {
  theme: "crt",
  seed: 1,
};

/** @type {number[]} */
let values;
/** @type {"+" | "-" | "X" | "/"} */
let operator;
/** @type {number[]} */
let anss;
let ans;
let leftTime;
let targetTime;
let ansTicks;
let ansIndex;
let multiplier;

function update() {
  const sd = sqrt(difficulty);
  const cd = clamp((difficulty - 1) * 2, 0, 1);
  if (!ticks) {
    values = times(2, () => 0);
    anss = times(5, () => 0);
    nextQuestion();
    leftTime = PI * 2;
    ansTicks = 0;
    ansIndex = 0;
    multiplier = 1;
    sss.setTempo(90);
    sss.playMml(bgmMml);
  }
  color("black");
  text(`x${multiplier}`, 3, 9);
  text(`${values[0]}`, 50 - (values[0] > 9 ? 6 : 0), 36);
  text(`${values[1]}`, 50 - (values[1] > 9 ? 6 : 0), 45);
  text(operator, 35, 41);
  rect(25, 50, 40, 1);
  if (ansTicks > 0) {
    text(`${ans}`, 50 - (ans > 9 ? 6 : 0), 55);
    leftTime += (targetTime - leftTime) * 0.1;
    ansTicks--;
    if (ansTicks <= 0) {
      nextQuestion();
    }
  } else {
    ansIndex = floor(input.pos.x / 20);
    if (input.isJustPressed) {
      if (ansIndex >= 0 && ansIndex < 5) {
        ansTicks = 30 / sd;
        addScore(ceil(leftTime * 9 * multiplier));
        const tt = leftTime + (PI / 2) * (anss[ansIndex] === ans ? 2 : -1);
        if (anss[ansIndex] === ans) {
          if (tt >= PI * 2) {
            multiplier++;
            play("powerUp");
          } else {
            play("coin");
          }
        } else {
          if (multiplier > 1) {
            multiplier--;
            play("explosion");
          }
        }
        targetTime = clamp(tt, 0, PI * 2);
      }
    }
  }
  leftTime -= sd * 0.01;
  if (leftTime < 0) {
    leftTime = 0;
    text(`${ans}`, 50 - (ans > 9 ? 6 : 0), 55);
    sss.stopMml();
    play("explosion");
    end();
  }
  arc(45, 45, 33, 3, PI / 2 + leftTime, PI / 2);
  anss.forEach((a, i) => {
    color("black");
    if (ansIndex === i) {
      box(i * 20 + 10, 85, 18, 8);
      if (ansTicks > 0) {
        text(`${a === ans ? "OK" : "NG"}`, i * 20 + 7, 92);
      }
      color("white");
    }
    text(`${a}`, i * 20 + 13 - (a > 9 ? 6 : 0), 85);
  });

  function nextQuestion() {
    operator =
      rnd(cd) > 0.9 ? "/" : rnd(cd) > 0.7 ? "X" : rnd(cd) > 0.5 ? "-" : "+";
    if (operator === "/" || operator === "X") {
      values[1] = rndi(2, 10);
      ans = floor(rnd(10, 100) / values[1]);
      values[0] = values[1] * ans;
      if (operator === "X") {
        const a = ans;
        ans = values[0];
        values[0] = a;
        if (rnd() < 0.5) {
          const v0 = values[0];
          values[0] = values[1];
          values[1] = v0;
        }
      }
    } else {
      ans = rndi(10, 100);
      values[0] = rndi(1, ans);
      values[1] = ans - values[0];
      if (operator === "-") {
        const v0 = values[0];
        values[0] = ans;
        ans = values[1];
        values[1] = v0;
      }
    }
    const ci = rndi(5);
    times(5, (i) => {
      if (i === ci) {
        anss[i] = ans;
        return;
      }
      for (let j = 0; j < 9; j++) {
        let a = ans + rnds(5);
        if (rnd() < 0.3) {
          a += a * rnds(0.1, 0.2);
        }
        a = clamp(round(a), 1, 99);
        anss[i] = a;
        let iv = a !== ans;
        for (let k = 0; k < i; k++) {
          if (anss[k] === a) {
            iv = false;
          }
        }
        if (iv) {
          break;
        }
      }
    });
  }
}

const bgmMml = [
  "@select@s932484663 v25 l16 o4 ddd>d<ddc+>d <dd+f>d+<dc>d<b ccc>d+<cd>cc <cdc+>d<dd+f>d",
  "@select@s596044616 v25 l16 o5 <g>ara<d>d<g+a ga+f>d+<g>g<g>f+ <g>g<grg>agg cac+add+fa",
  "@click@d@s295759538 v50 l16 o4 cr8.cr2^8. c r8.cr2^8.",
  "@explosion@d@s643964207 v40 l16 o4 r4.^16c r2.^8. c r2",
  "@hit@d@s775900152 v50 l16 o4 r8cr8.cr2^8. c r8.cr2^16",
];

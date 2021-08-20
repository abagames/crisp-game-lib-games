title = "BREED C";

description = `
[Tap] 
 Erase blocks
 (4 or more 
  linked)
`;

characters = [];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  isDrawingScoreFront: true,
  seed: 1,
};

/** @type {number[][]} */
let grid;
/** @type {number[][]} */
let prevGrid;
/** @type {boolean[][]} */
let erasingGrid;
let erasingTicks;
let erasingCount;
let nextGridTicks;
let nextGridCount;
/** @type {number[]} */
let pressedTicks;
let multiplier;
const gridSize = 15;
const colorCount = 4;
const colors = ["red", "green", "blue", "yellow"];

function update() {
  const cgp = floor(gridSize / 2);
  if (!ticks) {
    grid = times(gridSize, () => times(gridSize, () => -1));
    prevGrid = times(gridSize, () => times(gridSize, () => -1));
    erasingGrid = times(gridSize, () => times(gridSize, () => false));
    nextGridTicks = 0;
    nextGridCount = 0;
    erasingTicks = 0;
    multiplier = 1;
  }
  const ip = vec(
    floor((input.pos.x - 50) / 6 + gridSize / 2),
    floor((input.pos.y - 53) / 6 + gridSize / 2)
  );
  if (ip.isInRect(0, 0, gridSize, gridSize)) {
    color("light_black");
    box((ip.x - gridSize / 2) * 6 + 53, (ip.y - gridSize / 2) * 6 + 56, 7);
  }
  erasingTicks--;
  if (erasingTicks >= 0) {
    if (erasingTicks === 0) {
      for (let i = 0; i < 99; i++) {
        let dc =
          erasingCount % 2 === 0
            ? downHorizontal() + downVertical()
            : downVertical() + downHorizontal();
        if (dc === 0) {
          break;
        }
      }
      nextGridTicks = 120 / sqrt(difficulty);
      erasingCount++;
    }
    drawGrid();
    return;
  }
  if (grid[cgp][cgp] < 0) {
    grid[cgp][cgp] = rndi(colorCount);
  }
  if (input.isJustPressed) {
    if (ip.isInRect(0, 0, gridSize, gridSize) && grid[ip.x][ip.y] >= 0) {
      times(gridSize, (x) =>
        times(gridSize, (y) => {
          erasingGrid[x][y] = false;
        })
      );
      erasingGrid[ip.x][ip.y] = true;
      let tec = 1;
      for (let i = 0; i < 99; i++) {
        let ec = checkErasingDown() + checkErasingUp();
        tec += ec;
        if (ec === 0) {
          break;
        }
      }
      if (tec < 4) {
        play("hit");
        addScore(-tec, input.pos);
        addGrid();
        addGrid();
      } else {
        play("powerUp");
        addScore(tec * multiplier, input.pos);
        multiplier++;
        for (let x = 0; x < gridSize; x++) {
          for (let y = 0; y < gridSize; y++) {
            if (erasingGrid[x][y]) {
              grid[x][y] = -1;
            }
          }
        }
        erasingTicks = ceil(60 / sqrt(difficulty));
        drawGrid();
        return;
      }
    } else {
      addGrid();
      addGrid();
    }
  }
  nextGridTicks--;
  if (nextGridTicks < 0) {
    addGrid();
  }
  if (drawGrid() >= gridSize * gridSize) {
    play("explosion");
    end();
  }

  function drawGrid() {
    color("black");
    text(`x${multiplier}`, 3, 9);
    let gc = 0;
    times(gridSize, (x) =>
      times(gridSize, (y) => {
        const c = grid[x][y];
        if (c >= 0) {
          // @ts-ignore
          color(colors[c]);
          box(53 + (x - gridSize / 2) * 6, 56 + (y - gridSize / 2) * 6, 5);
          gc++;
        }
      })
    );
    return gc;
  }

  function addGrid() {
    play("coin");
    multiplier = 1;
    times(gridSize, (x) =>
      times(gridSize, (y) => {
        prevGrid[x][y] = grid[x][y];
      })
    );
    if (nextGridCount % 2 === 0) {
      addHorizontal();
    } else {
      addVertical();
    }
    nextGridCount++;
    nextGridTicks = 120 / sqrt(difficulty);
  }

  function addHorizontal() {
    const cx = floor(gridSize / 2);
    for (let x = 0; x < cx - 1; x++) {
      times(gridSize, (y) => {
        grid[x][y] = prevGrid[x + 1][y];
      });
    }
    for (let x = gridSize - 1; x > cx + 1; x--) {
      times(gridSize, (y) => {
        grid[x][y] = prevGrid[x - 1][y];
      });
    }
    times(gridSize, (y) => {
      const c = prevGrid[cx][y];
      if (c >= 0) {
        const nx = rnd() < 0.5 ? -1 : 1;
        const nc = wrap(c + rndi(colorCount - 1), 0, colorCount);
        grid[cx + nx][y] = nc;
        grid[cx][y] = nc;
        grid[cx - nx][y] = c;
      }
    });
  }

  function addVertical() {
    const cy = floor(gridSize / 2);
    for (let y = 0; y < cy - 1; y++) {
      times(gridSize, (x) => {
        grid[x][y] = prevGrid[x][y + 1];
      });
    }
    for (let y = gridSize - 1; y > cy + 1; y--) {
      times(gridSize, (x) => {
        grid[x][y] = prevGrid[x][y - 1];
      });
    }
    times(gridSize, (x) => {
      const c = prevGrid[x][cy];
      if (c >= 0) {
        const ny = rnd() < 0.5 ? -1 : 1;
        const nc = wrap(c + rndi(colorCount - 1), 0, colorCount);
        grid[x][cy + ny] = nc;
        grid[x][cy] = nc;
        grid[x][cy - ny] = c;
      }
    });
  }

  function downHorizontal() {
    let dc = 0;
    const cx = floor(gridSize / 2);
    for (let x = cx; x >= 1; x--) {
      times(gridSize, (y) => {
        if (grid[x][y] === -1 && grid[x - 1][y] >= 0) {
          grid[x][y] = grid[x - 1][y];
          grid[x - 1][y] = -1;
          dc++;
        }
      });
    }
    for (let x = cx; x <= gridSize - 2; x++) {
      times(gridSize, (y) => {
        if (grid[x][y] === -1 && grid[x + 1][y] >= 0) {
          grid[x][y] = grid[x + 1][y];
          grid[x + 1][y] = -1;
          dc++;
        }
      });
    }
    return dc;
  }

  function downVertical() {
    let dc = 0;
    const cy = floor(gridSize / 2);
    for (let y = cy; y > -1; y--) {
      times(gridSize, (x) => {
        if (grid[x][y] === -1 && grid[x][y - 1] >= 0) {
          grid[x][y] = grid[x][y - 1];
          grid[x][y - 1] = -1;
          dc++;
        }
      });
    }
    for (let y = cy; y <= gridSize - 2; y++) {
      times(gridSize, (x) => {
        if (grid[x][y] === -1 && grid[x][y + 1] >= 0) {
          grid[x][y] = grid[x][y + 1];
          grid[x][y + 1] = -1;
          dc++;
        }
      });
    }
    return dc;
  }

  function checkErasingDown() {
    let ec = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (!erasingGrid[x][y]) {
          continue;
        }
        const c = grid[x][y];
        if (
          x < gridSize - 1 &&
          !erasingGrid[x + 1][y] &&
          grid[x + 1][y] === c
        ) {
          erasingGrid[x + 1][y] = true;
          ec++;
        }
        if (
          y < gridSize - 1 &&
          !erasingGrid[x][y + 1] &&
          grid[x][y + 1] === c
        ) {
          erasingGrid[x][y + 1] = true;
          ec++;
        }
      }
    }
    return ec;
  }

  function checkErasingUp() {
    let ec = 0;
    for (let x = gridSize - 1; x >= 0; x--) {
      for (let y = gridSize - 1; y >= 0; y--) {
        if (!erasingGrid[x][y]) {
          continue;
        }
        const c = grid[x][y];
        if (x > 0 && !erasingGrid[x - 1][y] && grid[x - 1][y] === c) {
          erasingGrid[x - 1][y] = true;
          ec++;
        }
        if (y > 0 && !erasingGrid[x][y - 1] && grid[x][y - 1] === c) {
          erasingGrid[x][y - 1] = true;
          ec++;
        }
      }
    }
    return ec;
  }
}

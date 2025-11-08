const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const scoreDisplay = document.getElementById("scoreDisplay");
const bestDisplay = document.getElementById("bestDisplay");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const gameOverlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayScore = document.getElementById("overlayScore");
const overlayBest = document.getElementById("overlayBest");
const touchButtons = document.querySelectorAll(".touch-keys button");
const hasGameDom = Boolean(
  canvas &&
  ctx &&
  scoreDisplay &&
  bestDisplay &&
  pauseButton &&
  restartButton &&
  gameOverlay &&
  overlayTitle &&
  overlayScore &&
  overlayBest
);

console.log("%cHowdy! I'm %cDevMatei%c, and if you go at coordinates -806,-348 on the canvas you will be looking at my game made for the %cYSWS hackclub challange called %cIFrame%c! Hope you like it! :D",
    "color: #ff6584; font-size: 16px;", 
    "color: #6ad972; font-size: 16px;", 
    "color: #ff6584; font-size: 16px;", 
    "color: #ffca3a; font-size: 16px;",
    "color: #ff6584; font-size: 16px;", 
    "color: #6ad972; font-size: 16px;", 
)

const storage = (() => {
try {
    const testKey = "__adaptasnake-check__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return localStorage;
} catch (error) {
    console.warn("Storage disabled, high score won't persist.", error);
    return null;
}
})();

const settings = {
gridSize: 15,
snakeColor: "#6ad972",
snakeHeadColor: "#b8f18b",
appleColor: "#ff6565",
baseTickMs: 140,
speedStep: 6,
speedUpEvery: 4,
minTickMs: 70
};

let pixelRatio = window.devicePixelRatio || 1;
let boardPixels = 400;
let lastFrame = performance.now();
let accumulator = 0;
let score = 0;
let bestScore = 0;
let currentTickMs = settings.baseTickMs;

if (storage) {
const stored = Number.parseInt(storage.getItem("adaptasnake-best") || "0", 10);
if (!Number.isNaN(stored)) {
    bestScore = stored;
}
}

const state = {
running: false,
reasonPaused: null,
direction: { x: 1, y: 0 },
pendingDirection: { x: 1, y: 0 },
snake: [],
apple: { x: 0, y: 0 },
locked: false
};

const preventSpaceScroll = (event) => {
if (event.code === "Space") {
    event.preventDefault();
}
};

const hideOverlay = () => {
gameOverlay.hidden = true;
state.locked = false;
};

const showOverlay = (reason) => {
state.locked = true;
overlayTitle.textContent = reason === "bit tail" ? "You ate yourself" : "You crashed";
overlayScore.textContent = score.toString();
overlayBest.textContent = bestScore.toString();
gameOverlay.hidden = false;
pauseButton.textContent = "Resume";
};

const resetGame = () => {
const startX = Math.floor(settings.gridSize / 3);
const startY = Math.floor(settings.gridSize / 2);
state.snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY }
];
state.direction = { x: 1, y: 0 };
state.pendingDirection = { x: 1, y: 0 };
score = 0;
currentTickMs = settings.baseTickMs;
accumulator = 0;
state.running = false;
state.reasonPaused = null;
scoreDisplay.textContent = "0";
updateBest(bestScore);
spawnApple();
hideOverlay();
};

const spawnApple = () => {
let newApple;
do {
    newApple = {
    x: Math.floor(Math.random() * settings.gridSize),
    y: Math.floor(Math.random() * settings.gridSize)
    };
} while (state.snake.some((segment) => segment.x === newApple.x && segment.y === newApple.y));
state.apple = newApple;
};

const updateBest = (value) => {
bestDisplay.textContent = value.toString();
overlayBest.textContent = value.toString();
};

const persistBest = (value) => {
if (!storage) return;
storage.setItem("adaptasnake-best", value.toString());
};

const bumpScore = () => {
score += 1;
scoreDisplay.textContent = score.toString();
if (score > bestScore) {
    bestScore = score;
    persistBest(bestScore);
    updateBest(bestScore);
}
const level = Math.floor(score / settings.speedUpEvery);
const target = settings.baseTickMs - level * settings.speedStep;
currentTickMs = Math.max(settings.minTickMs, target);
};

const draw = () => {
ctx.fillStyle = "#0a0d14";
ctx.fillRect(0, 0, boardPixels, boardPixels);
drawGridHint();

const cellSize = boardPixels / settings.gridSize;

state.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? settings.snakeHeadColor : settings.snakeColor;
    ctx.fillRect(
    Math.floor(segment.x * cellSize) + 0.5,
    Math.floor(segment.y * cellSize) + 0.5,
    Math.ceil(cellSize) - 1,
    Math.ceil(cellSize) - 1
    );
});

ctx.fillStyle = settings.appleColor;
ctx.beginPath();
ctx.arc(
    (state.apple.x + 0.5) * cellSize,
    (state.apple.y + 0.5) * cellSize,
    cellSize * 0.35,
    0,
    Math.PI * 2
);
ctx.fill();
};

const drawGridHint = () => {
ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
ctx.lineWidth = 1;
const cellSize = boardPixels / settings.gridSize;

for (let i = 1; i < settings.gridSize; i += 1) {
    const pos = Math.floor(i * cellSize) + 0.5;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, boardPixels);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(boardPixels, pos);
    ctx.stroke();
}
};

  const setRunning = (flag) => {
    if (state.locked) return;
    state.running = flag;
    state.reasonPaused = flag ? null : state.reasonPaused;
    pauseButton.textContent = state.running ? "Pause" : "Resume";
  };

  const updateCompactMode = () => {
    const isCompact = window.innerWidth < 500 || window.innerHeight < 500;
    const isMicro = window.innerWidth <= 220 || window.innerHeight <= 220;
    const hideBest = isCompact || !storage;
    document.body.classList.toggle("mini-mode", isCompact);
    document.body.classList.toggle("micro-mode", isMicro);
    document.body.classList.toggle("hide-best", hideBest);
    pauseButton.hidden = isMicro;
    if (isMicro) {
      pauseButton.setAttribute("aria-hidden", "true");
    } else {
      pauseButton.removeAttribute("aria-hidden");
    }
  };

const step = () => {
state.direction = state.pendingDirection;
const currentHead = state.snake[0];
let nextX = currentHead.x + state.direction.x;
let nextY = currentHead.y + state.direction.y;

if (nextX < 0) nextX = settings.gridSize - 1;
if (nextY < 0) nextY = settings.gridSize - 1;
if (nextX >= settings.gridSize) nextX = 0;
if (nextY >= settings.gridSize) nextY = 0;

const head = { x: nextX, y: nextY };

if (state.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    state.running = false;
    state.reasonPaused = "bit tail";
    showOverlay("bit tail");
    return;
}

state.snake.unshift(head);

if (head.x === state.apple.x && head.y === state.apple.y) {
    bumpScore();
    spawnApple();
} else {
    state.snake.pop();
}
};

  const handleResize = () => {
    updateCompactMode();
    const board = canvas.parentElement;
    const isMini = document.body.classList.contains("mini-mode");
    let size;

    if (isMini) {
      const boardRect = board.getBoundingClientRect();
      const styles = getComputedStyle(board);
      const paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const paddingY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      let availableWidth = Math.max(60, boardRect.width - paddingX);
      let availableHeight = Math.max(60, boardRect.height - paddingY);
      const hud = board.querySelector(".hud");
      const hudStyles = hud ? getComputedStyle(hud) : null;
      const hudHeight = hud
        ? hud.offsetHeight +
          (hudStyles ? parseFloat(hudStyles.marginTop) + parseFloat(hudStyles.marginBottom) : 0)
        : 0;
      const controls = board.querySelector(".touch-keys");
      const controlsStyles = controls ? getComputedStyle(controls) : null;
      const controlsHeight = controls
        ? controls.offsetHeight +
          (controlsStyles
            ? parseFloat(controlsStyles.marginTop) + parseFloat(controlsStyles.marginBottom)
            : 0)
        : 0;
      availableHeight = Math.max(60, availableHeight - hudHeight - controlsHeight);
      size = Math.max(60, Math.min(availableWidth, availableHeight));
      size = Math.floor(size);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    } else {
      canvas.style.width = "";
      canvas.style.height = "";
      const rect = canvas.getBoundingClientRect();
      size = Math.max(80, Math.min(rect.width, rect.height || rect.width));
      size = Math.floor(size);
    }

    pixelRatio = window.devicePixelRatio || 1;
    boardPixels = Math.max(settings.gridSize, Math.floor(size * pixelRatio));
    canvas.width = boardPixels;
    canvas.height = boardPixels;
  };
// if you see this you are cool
const togglePause = (forcedState) => {
if (state.locked) return;
const targetState = forcedState ?? !state.running;
setRunning(targetState);
if (!targetState) {
    state.reasonPaused = state.reasonPaused || "manual pause";
}
};

const handleVisibility = () => {
if (document.hidden || document.visibilityState !== "visible") {
    if (state.running) {
    state.running = false;
    state.reasonPaused = "focus-lost";
    pauseButton.textContent = "Resume";
    }
} else if (!state.locked && state.reasonPaused === "focus-lost") {
    state.running = true;
    state.reasonPaused = null;
    pauseButton.textContent = "Pause";
}
};

const handleBlur = () => {
if (state.running) {
    state.running = false;
    state.reasonPaused = "focus-lost";
    pauseButton.textContent = "Resume";
}
};

const applyDirection = (axisX, axisY) => {
if (state.locked) return;
const isHorizontal = axisX !== 0;
const isVertical = axisY !== 0;
if ((isHorizontal && state.direction.x !== 0) || (isVertical && state.direction.y !== 0)) {
    return;
}

state.pendingDirection = { x: axisX, y: axisY };

if (!state.running) {
    setRunning(true);
}
};

const handleKeydown = (event) => {
preventSpaceScroll(event);
switch (event.key) {
    case "ArrowUp":
    case "w":
    case "W":
    applyDirection(0, -1);
    break;
    case "ArrowDown":
    case "s":
    case "S":
    applyDirection(0, 1);
    break;
    case "ArrowLeft":
    case "a":
    case "A":
    applyDirection(-1, 0);
    break;
    case "ArrowRight":
    case "d":
    case "D":
    applyDirection(1, 0);
    break;
    case " ":
    togglePause();
    break;
    case "r":
    case "R":
    resetGame();
    setRunning(false);
    state.reasonPaused = "manual reset";
    break;
    case "Enter":
    if (state.locked) {
        resetGame();
        setRunning(true);
    }
    break;
    default:
    break;
}
};

const handleTouchButtons = () => {
touchButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
    const dir = btn.dataset.dir;
    if (dir === "up") applyDirection(0, -1);
    if (dir === "down") applyDirection(0, 1);
    if (dir === "left") applyDirection(-1, 0);
    if (dir === "right") applyDirection(1, 0);
    });
});
};

const registerSwipe = () => {
let startX = 0;
let startY = 0;
let tracking = false;
const minDistance = 18;

canvas.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    tracking = true;
});

canvas.addEventListener("touchmove", (event) => {
    if (!tracking) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) < minDistance && Math.abs(dy) < minDistance) return;

    if (Math.abs(dx) > Math.abs(dy)) {
    applyDirection(Math.sign(dx), 0);
    } else {
    applyDirection(0, Math.sign(dy));
    }
    tracking = false;
});

canvas.addEventListener("touchend", () => {
    tracking = false;
});
};

const loop = (timestamp) => {
requestAnimationFrame(loop);
if (!state.running) {
    draw();
    lastFrame = timestamp;
    return;
}

accumulator += timestamp - lastFrame;
lastFrame = timestamp;

while (accumulator >= currentTickMs) {
    accumulator -= currentTickMs;
    step();
    if (!state.running) break;
}

draw();
};

const bindUi = () => {
window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", handleResize, { passive: true });
document.addEventListener("visibilitychange", handleVisibility);
window.addEventListener("blur", handleBlur);
window.addEventListener("focus", handleVisibility);
document.addEventListener("keydown", handleKeydown, { passive: false });
pauseButton.addEventListener("click", () => togglePause());
restartButton.addEventListener("click", () => {
    resetGame();
    setRunning(true);
});
handleTouchButtons();
registerSwipe();
};

  const init = () => {
    bestDisplay.textContent = bestScore.toString();
    pixelRatio = window.devicePixelRatio || 1;
    resetGame();
    handleResize();
    updateCompactMode();
    bindUi();
    requestAnimationFrame((ts) => {
      lastFrame = ts;
      loop(ts);
    });
};

// 404 page functionality
const handle404 = () => {
    document.body.classList.add("error");
    const missingPath = document.getElementById("missingPath");
    if (missingPath) {
        missingPath.textContent = window.location.pathname || "/";
    }
};

if (hasGameDom) {
    init();
} else {
    handle404();
}

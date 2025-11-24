// miniprogram/utils/tetris.js

const ROWS = 20;
const COLS = 10;

const TetrominoType = {
  I: 'I',
  J: 'J',
  L: 'L',
  O: 'O',
  S: 'S',
  T: 'T',
  Z: 'Z'
};

const SHAPES = {
  I: [{x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:3, y:1}],
  J: [{x:0, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}],
  L: [{x:2, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}],
  O: [{x:1, y:0}, {x:2, y:0}, {x:1, y:1}, {x:2, y:1}],
  S: [{x:1, y:0}, {x:2, y:0}, {x:0, y:1}, {x:1, y:1}],
  T: [{x:1, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}],
  Z: [{x:0, y:0}, {x:1, y:0}, {x:1, y:1}, {x:2, y:1}]
};

const COLORS = {
  I: '#00FFFF',
  J: '#0000FF',
  L: '#FFA500',
  O: '#FFFF00',
  S: '#00FF00',
  T: '#800080',
  Z: '#FF0000'
};

class Tetromino {
  constructor(type) {
    this.type = type;
    // Deep copy the shape
    this.shape = JSON.parse(JSON.stringify(SHAPES[type]));
    this.color = COLORS[type];
  }

  getRotatedPoints() {
    if (this.type === TetrominoType.O) return this.shape;

    // Use standard SRS pivots or simplified center logic
    // Using shape[2] as center mostly, similar to Kotlin impl
    // shape[1] for I
    let centerIndex = 2;
    if (this.type === TetrominoType.I) centerIndex = 1;

    const center = this.shape[centerIndex];
    
    return this.shape.map(p => {
      const relX = p.x - center.x;
      const relY = p.y - center.y;
      // Clockwise rotation: x' = -y, y' = x (in screen coords)
      // newX = center.x - relY
      // newY = center.y + relX
      return {
        x: center.x - relY,
        y: center.y + relX
      };
    });
  }

  rotate() {
    this.shape = this.getRotatedPoints();
  }
}

class TetrisGame {
  constructor(callbacks) {
    this.callbacks = callbacks; // { onStateChanged, onScoreChanged, onGameOver }
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    this.score = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.currentTetromino = null;
    this.currentX = 0;
    this.currentY = 0;
    
    this.spawnTetromino();
  }

  spawnTetromino() {
    const keys = Object.keys(TetrominoType);
    const type = keys[Math.floor(Math.random() * keys.length)];
    this.currentTetromino = new Tetromino(type);
    this.currentX = Math.floor(COLS / 2) - 2;
    this.currentY = 0;

    if (!this.isValidMove(this.currentTetromino.shape, this.currentX, this.currentY)) {
      this.isGameOver = true;
      if (this.callbacks.onGameOver) this.callbacks.onGameOver();
    }
    if (this.callbacks.onStateChanged) this.callbacks.onStateChanged();
  }

  tick() {
    if (this.isPaused || this.isGameOver) return;

    if (this.isValidMove(this.currentTetromino.shape, this.currentX, this.currentY + 1)) {
      this.currentY++;
    } else {
      this.lockTetromino();
      this.clearLines();
      this.spawnTetromino();
    }
    if (this.callbacks.onStateChanged) this.callbacks.onStateChanged();
  }

  moveLeft() {
    if (this.isPaused || this.isGameOver) return;
    if (this.isValidMove(this.currentTetromino.shape, this.currentX - 1, this.currentY)) {
      this.currentX--;
      if (this.callbacks.onStateChanged) this.callbacks.onStateChanged();
    }
  }

  moveRight() {
    if (this.isPaused || this.isGameOver) return;
    if (this.isValidMove(this.currentTetromino.shape, this.currentX + 1, this.currentY)) {
      this.currentX++;
      if (this.callbacks.onStateChanged) this.callbacks.onStateChanged();
    }
  }

  rotate() {
    if (this.isPaused || this.isGameOver) return;
    const rotatedShape = this.currentTetromino.getRotatedPoints();
    if (this.isValidMove(rotatedShape, this.currentX, this.currentY)) {
      this.currentTetromino.shape = rotatedShape;
      if (this.callbacks.onStateChanged) this.callbacks.onStateChanged();
    }
  }

  fastDrop() {
    if (this.isPaused || this.isGameOver) return;
    while (this.isValidMove(this.currentTetromino.shape, this.currentX, this.currentY + 1)) {
      this.currentY++;
    }
    this.lockTetromino();
    this.clearLines();
    this.spawnTetromino();
    if (this.callbacks.onStateChanged) this.callbacks.onStateChanged();
  }

  isValidMove(shape, x, y) {
    for (const point of shape) {
      const newX = x + point.x;
      const newY = y + point.y;

      if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
      if (newY >= 0 && this.board[newY][newX] !== 0) return false;
    }
    return true;
  }

  lockTetromino() {
    const shape = this.currentTetromino.shape;
    const color = this.currentTetromino.color;
    
    for (const point of shape) {
      const newX = this.currentX + point.x;
      const newY = this.currentY + point.y;
      if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
        this.board[newY][newX] = color; // Store color hex directly
      }
    }
  }

  clearLines() {
    let linesCleared = 0;
    let newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    let targetRow = ROWS - 1;

    for (let r = ROWS - 1; r >= 0; r--) {
      let full = true;
      for (let c = 0; c < COLS; c++) {
        if (this.board[r][c] === 0) {
          full = false;
          break;
        }
      }
      if (!full) {
        newBoard[targetRow] = this.board[r];
        targetRow--;
      } else {
        linesCleared++;
      }
    }
    
    this.board = newBoard;

    if (linesCleared > 0) {
      this.score += linesCleared * 100;
      if (this.callbacks.onScoreChanged) this.callbacks.onScoreChanged(this.score);
    }
  }

  restart() {
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    this.score = 0;
    this.isGameOver = false;
    this.isPaused = false;
    if (this.callbacks.onScoreChanged) this.callbacks.onScoreChanged(0);
    this.spawnTetromino();
  }
}

module.exports = {
  TetrisGame,
  ROWS,
  COLS
};


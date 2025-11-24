// miniprogram/utils/minesweeper.js

const ROWS = 12;
const COLS = 10;
const MINES_COUNT = 15;

const CellState = {
  HIDDEN: 0,
  REVEALED: 1,
  FLAGGED: 2
};

class MinesweeperGame {
  constructor(callbacks) {
    this.callbacks = callbacks; // { onStateChanged, onGameOver, onWin }
    this.init();
  }

  init() {
    this.board = [];
    this.state = 'PLAYING'; // PLAYING, WON, LOST
    this.minesLeft = MINES_COUNT;
    
    // Initialize board
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          isMine: false,
          neighborMines: 0,
          state: CellState.HIDDEN
        });
      }
      this.board.push(row);
    }

    this.placeMines();
    this.calculateNeighbors();
    
    this.notify();
  }

  placeMines() {
    let minesPlaced = 0;
    while (minesPlaced < MINES_COUNT) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (!this.board[r][c].isMine) {
        this.board[r][c].isMine = true;
        minesPlaced++;
      }
    }
  }

  calculateNeighbors() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!this.board[r][c].isMine) {
          let count = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const nr = r + i;
              const nc = c + j;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && this.board[nr][nc].isMine) {
                count++;
              }
            }
          }
          this.board[r][c].neighborMines = count;
        }
      }
    }
  }

  toggleFlag(r, c) {
    if (this.state !== 'PLAYING') return;
    const cell = this.board[r][c];
    if (cell.state === CellState.REVEALED) return;

    if (cell.state === CellState.HIDDEN) {
      cell.state = CellState.FLAGGED;
      this.minesLeft--;
    } else if (cell.state === CellState.FLAGGED) {
      cell.state = CellState.HIDDEN;
      this.minesLeft++;
    }
    this.notify();
  }

  reveal(r, c) {
    if (this.state !== 'PLAYING') return;
    const cell = this.board[r][c];
    
    if (cell.state === CellState.FLAGGED || cell.state === CellState.REVEALED) return;

    cell.state = CellState.REVEALED;

    if (cell.isMine) {
      this.state = 'LOST';
      this.revealAll();
      if (this.callbacks.onGameOver) this.callbacks.onGameOver();
    } else {
      if (cell.neighborMines === 0) {
        this.floodFill(r, c);
      }
      this.checkWin();
    }
    this.notify();
  }

  floodFill(r, c) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const nr = r + i;
        const nc = c + j;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const neighbor = this.board[nr][nc];
          if (neighbor.state === CellState.HIDDEN) {
            neighbor.state = CellState.REVEALED;
            if (neighbor.neighborMines === 0) {
              this.floodFill(nr, nc);
            }
          }
        }
      }
    }
  }

  revealAll() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.board[r][c].state = CellState.REVEALED;
      }
    }
  }

  checkWin() {
    let hiddenCount = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.board[r][c].state !== CellState.REVEALED) {
          hiddenCount++;
        }
      }
    }
    if (hiddenCount === MINES_COUNT) {
      this.state = 'WON';
      if (this.callbacks.onWin) this.callbacks.onWin();
    }
  }

  notify() {
    if (this.callbacks.onStateChanged) {
      this.callbacks.onStateChanged({
        board: this.board,
        minesLeft: this.minesLeft,
        state: this.state
      });
    }
  }
}

module.exports = {
  MinesweeperGame,
  ROWS,
  COLS,
  CellState
};


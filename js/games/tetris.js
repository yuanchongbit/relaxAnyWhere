// miniprogram/js/games/tetris.js
import Scene from '../base/scene'

const ROWS = 20;
const COLS = 10;
const COLORS = ['#000000', '#00FFFF', '#0000FF', '#FFA500', '#FFFF00', '#00FF00', '#800080', '#FF0000'];

const SHAPES = [
  [], // Empty
  [{x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:3, y:1}], // I
  [{x:0, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}], // J
  [{x:2, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}], // L
  [{x:1, y:0}, {x:2, y:0}, {x:1, y:1}, {x:2, y:1}], // O
  [{x:1, y:0}, {x:2, y:0}, {x:0, y:1}, {x:1, y:1}], // S
  [{x:1, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}], // T
  [{x:0, y:0}, {x:1, y:0}, {x:1, y:1}, {x:2, y:1}]  // Z
];

export default class TetrisScene extends Scene {
  constructor(main) {
    super(main)
    this.reset()
    
    // UI Layout
    this.cellSize = Math.min(this.screenWidth / COLS, (this.screenHeight - 150) / ROWS) * 0.9
    this.boardWidth = this.cellSize * COLS
    this.boardHeight = this.cellSize * ROWS
    this.startX = (this.screenWidth - this.boardWidth) / 2
    this.startY = 80 // Header space
    
    // Buttons
    const btnY = this.screenHeight - 80
    this.buttons = [
      { id: 'left', text: '←', x: 20, y: btnY, w: 60, h: 60 },
      { id: 'rotate', text: '↻', x: 100, y: btnY, w: 60, h: 60 },
      { id: 'down', text: '↓', x: 180, y: btnY, w: 60, h: 60 },
      { id: 'right', text: '→', x: 260, y: btnY, w: 60, h: 60 },
      { id: 'back', text: 'Menu', x: 20, y: 20, w: 80, h: 40 }
    ]
  }

  reset() {
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0))
    this.score = 0
    this.isGameOver = false
    this.lastTick = 0
    this.spawnTetromino()
  }

  onEnter() {
    this.reset()
  }

  spawnTetromino() {
    const type = Math.floor(Math.random() * 7) + 1
    this.currentType = type
    // Deep copy shape
    this.currentShape = JSON.parse(JSON.stringify(SHAPES[type]))
    this.currentX = Math.floor(COLS / 2) - 2
    this.currentY = 0

    if (!this.isValidMove(this.currentShape, this.currentX, this.currentY)) {
      this.isGameOver = true
    }
  }

  update() {
    if (this.isGameOver) return

    const now = Date.now()
    if (now - this.lastTick > 500) {
      this.tick()
      this.lastTick = now
    }
  }

  tick() {
    if (this.isValidMove(this.currentShape, this.currentX, this.currentY + 1)) {
      this.currentY++
    } else {
      this.lockTetromino()
      this.clearLines()
      this.spawnTetromino()
    }
  }

  isValidMove(shape, x, y) {
    for (const p of shape) {
      const nx = x + p.x
      const ny = y + p.y
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false
      if (ny >= 0 && this.board[ny][nx] !== 0) return false
    }
    return true
  }

  lockTetromino() {
    for (const p of this.currentShape) {
      const nx = this.currentX + p.x
      const ny = this.currentY + p.y
      if (ny >= 0) this.board[ny][nx] = this.currentType
    }
  }

  clearLines() {
    let lines = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(cell => cell !== 0)) {
        this.board.splice(r, 1)
        this.board.unshift(Array(COLS).fill(0))
        lines++
        r++ // Check same row again
      }
    }
    this.score += lines * 100
  }

  // Simplified rotation
  rotate() {
    const newShape = this.currentShape.map(p => {
       // Center approximation
       const cx = 1.5, cy = 1.5 // Simplified pivot
       // Actually let's use the first block as pivot for simple shapes or center of mass
       // Sticking to previous simple SRS logic or simple pivot
       
       // Just simple 90 degree around 'center' of the shape points
       // Finding bounding box center
       
       // Let's use the logic from previous Kotlin:
       // For I: shape[1], others shape[2]
       const pivotIdx = this.currentType === 1 ? 1 : 2 
       const center = this.currentShape[pivotIdx] || this.currentShape[1]
       
       const relX = p.x - center.x
       const relY = p.y - center.y
       return { x: center.x - relY, y: center.y + relX }
    })
    
    if (this.isValidMove(newShape, this.currentX, this.currentY)) {
      this.currentShape = newShape
    }
  }

  render(ctx) {
    // UI
    ctx.fillStyle = 'white'
    ctx.font = '20px Arial'
    ctx.fillText(`Score: ${this.score}`, this.screenWidth - 100, 40)
    
    if (this.isGameOver) {
      ctx.fillStyle = 'red'
      ctx.font = '40px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', this.screenWidth / 2, this.screenHeight / 2)
      ctx.font = '20px Arial'
      ctx.fillText('Tap Menu to Restart', this.screenWidth / 2, this.screenHeight / 2 + 50)
    }

    // Board Background
    ctx.strokeStyle = '#333'
    ctx.strokeRect(this.startX, this.startY, this.boardWidth, this.boardHeight)

    // Locked blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.board[r][c] !== 0) {
          this.drawBlock(ctx, c, r, this.board[r][c])
        }
      }
    }

    // Current Tetromino
    if (this.currentShape && !this.isGameOver) {
      for (const p of this.currentShape) {
        this.drawBlock(ctx, this.currentX + p.x, this.currentY + p.y, this.currentType)
      }
    }

    // Controls
    this.buttons.forEach(btn => {
      ctx.fillStyle = '#444'
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h)
      ctx.fillStyle = 'white'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(btn.text, btn.x + btn.w/2, btn.y + btn.h/2 + 7)
    })
  }

  drawBlock(ctx, gridX, gridY, type) {
    const x = this.startX + gridX * this.cellSize
    const y = this.startY + gridY * this.cellSize
    ctx.fillStyle = COLORS[type] || 'white'
    ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2)
  }

  handleTouch(type, e) {
    if (type !== 'end') return
    const touch = e.changedTouches[0]
    const x = touch.clientX
    const y = touch.clientY

    this.buttons.forEach(btn => {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        if (btn.id === 'back') this.main.switchScene('menu')
        if (this.isGameOver) return
        
        if (btn.id === 'left' && this.isValidMove(this.currentShape, this.currentX - 1, this.currentY)) this.currentX--
        if (btn.id === 'right' && this.isValidMove(this.currentShape, this.currentX + 1, this.currentY)) this.currentX++
        if (btn.id === 'down') this.tick() // Fast drop or single drop
        if (btn.id === 'rotate') this.rotate()
      }
    })
  }
}


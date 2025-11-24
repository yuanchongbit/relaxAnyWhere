// 移植 Minesweeper 逻辑
const ROWS = 12
const COLS = 10
const MINES = 15
const CELL_W = 30 // base size, will recalculate

export default class MinesweeperScene {
  constructor(exitCb) {
    this.exitCb = exitCb
    const info = wx.getSystemInfoSync()
    this.width = info.windowWidth
    this.height = info.windowHeight
    this.dpr = info.pixelRatio

    // 计算布局
    // 顶部预留高度：胶囊底部 + 边距
    let menuRect
    try {
       menuRect = wx.getMenuButtonBoundingClientRect()
    } catch(e) {
       menuRect = { top: 40, bottom: 80, height: 32 }
    }
    const topPadding = menuRect.bottom + 10
    const bottomAreaHeight = 100 // 底部留给模式切换按钮
    
    // 可用高度
    const availableHeight = this.height - topPadding - bottomAreaHeight - 20
    const availableWidth = this.width * 0.95
    
    this.cellSize = Math.min(Math.floor(availableWidth / COLS), Math.floor(availableHeight / ROWS))
    this.boardW = this.cellSize * COLS
    this.boardH = this.cellSize * ROWS
    this.boardX = (this.width - this.boardW) / 2
    this.boardY = topPadding + (availableHeight - this.boardH) / 2

    // Header Controls (Back, Mines Count, Restart)
    // Back 放左上角，与胶囊对齐
    this.btnBack = { x: 20, y: menuRect.top, w: 60, h: menuRect.height, text: 'Back', type: 'rect' }
    
    // Mines Count 放在中间
    this.headerY = (menuRect.top + menuRect.height/2)
    
    // Restart 放在 Board 下方
    const controlY = this.boardY + this.boardH + 20
    this.btnRestart = { x: this.width/2 - 55, y: controlY, w: 110, h: 40, text: 'Restart', type: 'rect' }
    
    // Toggle Mode Button
    this.mode = 'REVEAL' // REVEAL or FLAG
    // Mode 放在 Restart 下方
    this.btnMode = { x: this.width/2 - 55, y: controlY + 60, w: 110, h: 40, text: 'Mode: Tap', type: 'rect' }

    this.reset()
  }

  reset() {
    this.board = []
    this.gameOver = false
    this.won = false
    this.minesLeft = MINES
    
    // Init board
    for(let r=0; r<ROWS; r++) {
      let row = []
      for(let c=0; c<COLS; c++) {
        row.push({ isMine: false, state: 0, neighbors: 0 }) // state: 0 hidden, 1 revealed, 2 flagged
      }
      this.board.push(row)
    }

    // Place mines
    let placed = 0
    while(placed < MINES) {
      let r = Math.floor(Math.random()*ROWS)
      let c = Math.floor(Math.random()*COLS)
      if(!this.board[r][c].isMine) {
        this.board[r][c].isMine = true
        placed++
      }
    }

    // Calc neighbors
    for(let r=0; r<ROWS; r++) {
      for(let c=0; c<COLS; c++) {
        if(!this.board[r][c].isMine) {
          let count = 0
          for(let i=-1; i<=1; i++) 
            for(let j=-1; j<=1; j++) {
               let nr = r+i, nc = c+j
               if(nr>=0 && nr<ROWS && nc>=0 && nc<COLS && this.board[nr][nc].isMine) count++
            }
          this.board[r][c].neighbors = count
        }
      }
    }
  }

  update() {}

  render(ctx) {
    const dpr = this.dpr

    // BG
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, this.width*dpr, this.height*dpr)

    // Header
    ctx.fillStyle = '#fff'
    ctx.font = `${20 * dpr}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`Mines: ${this.minesLeft}`, (this.width/2)*dpr, this.headerY*dpr)

    // Board
    for(let r=0; r<ROWS; r++) {
      for(let c=0; c<COLS; c++) {
        this.drawCell(ctx, r, c)
      }
    }

    // Buttons
    this.drawBtn(ctx, this.btnBack)
    this.drawBtn(ctx, this.btnRestart)
    this.drawBtn(ctx, this.btnMode)

    // Status
    if(this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, 0, this.width*dpr, this.height*dpr)
      ctx.fillStyle = 'red'
      ctx.font = `${40*dpr}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText('Game Over', (this.width/2)*dpr, (this.height/2)*dpr)
      ctx.font = `${20*dpr}px Arial`
      ctx.fillStyle = '#fff'
      ctx.fillText('Tap Restart', (this.width/2)*dpr, (this.height/2 + 50)*dpr)
    } else if (this.won) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, 0, this.width*dpr, this.height*dpr)
      ctx.fillStyle = 'green'
      ctx.font = `${40*dpr}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText('You Won!', (this.width/2)*dpr, (this.height/2)*dpr)
    }
  }

  drawCell(ctx, r, c) {
    const dpr = this.dpr
    const cell = this.board[r][c]
    const x = (this.boardX + c * this.cellSize) * dpr
    const y = (this.boardY + r * this.cellSize) * dpr
    const size = (this.cellSize - 2) * dpr

    if (cell.state === 0) { // Hidden
      ctx.fillStyle = '#888'
    } else if (cell.state === 1) { // Revealed
      ctx.fillStyle = cell.isMine ? '#f00' : '#ccc'
    } else { // Flagged
      ctx.fillStyle = '#888'
    }

    ctx.fillRect(x, y, size, size)

    if (cell.state === 2) {
      ctx.fillStyle = 'orange'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${size*0.6}px Arial`
      ctx.fillText('🚩', x + size/2, y + size/2)
    } else if (cell.state === 1) {
      if (cell.isMine) {
        ctx.fillStyle = '#000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `${size*0.6}px Arial`
        ctx.fillText('💣', x + size/2, y + size/2)
      } else if (cell.neighbors > 0) {
        const colors = ['blue', 'green', 'red', 'darkblue']
        ctx.fillStyle = colors[cell.neighbors-1] || 'black'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `${size*0.8}px Arial`
        ctx.fillText(cell.neighbors, x + size/2, y + size/2)
      }
    }
  }

  drawBtn(ctx, btn) {
    const dpr = this.dpr
    ctx.fillStyle = '#333'
    ctx.fillRect(btn.x * dpr, btn.y * dpr, btn.w * dpr, btn.h * dpr)
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 1 * dpr
    ctx.strokeRect(btn.x * dpr, btn.y * dpr, btn.w * dpr, btn.h * dpr)
    
    ctx.fillStyle = btn.text.includes('Flag') ? '#ffcc00' : '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${16 * dpr}px Arial`
    ctx.fillText(btn.text, (btn.x + btn.w/2) * dpr, (btn.y + btn.h/2) * dpr)
  }

  handleTouch(x, y) {
    if (this.isInside(x, y, this.btnBack)) {
      this.exitCb()
      return
    }
    if (this.isInside(x, y, this.btnRestart)) {
      this.reset()
      return
    }
    if (this.isInside(x, y, this.btnMode)) {
      this.mode = this.mode === 'REVEAL' ? 'FLAG' : 'REVEAL'
      this.btnMode.text = `Mode: ${this.mode === 'REVEAL' ? 'Tap' : 'Flag'}`
      return
    }

    if (this.gameOver || this.won) return

    // Board click
    if (x >= this.boardX && x < this.boardX + this.boardW &&
        y >= this.boardY && y < this.boardY + this.boardH) {
      
      const c = Math.floor((x - this.boardX) / this.cellSize)
      const r = Math.floor((y - this.boardY) / this.cellSize)
      
      this.handleCellClick(r, c)
    }
  }

  handleCellClick(r, c) {
    const cell = this.board[r][c]
    if (cell.state === 1) return // Already revealed

    if (this.mode === 'FLAG') {
      if (cell.state === 0) {
        cell.state = 2
        this.minesLeft--
      } else if (cell.state === 2) {
        cell.state = 0
        this.minesLeft++
      }
    } else {
      if (cell.state === 2) return // Can't reveal flagged
      
      if (cell.isMine) {
        cell.state = 1
        this.gameOver = true
        this.revealAll()
      } else {
        this.reveal(r, c)
        this.checkWin()
      }
    }
  }

  reveal(r, c) {
    if (r<0 || r>=ROWS || c<0 || c>=COLS) return
    const cell = this.board[r][c]
    if (cell.state !== 0 || cell.isMine) return
    
    cell.state = 1
    if (cell.neighbors === 0) {
      for(let i=-1; i<=1; i++)
        for(let j=-1; j<=1; j++)
           this.reveal(r+i, c+j)
    }
  }

  revealAll() {
    for(let r=0; r<ROWS; r++)
      for(let c=0; c<COLS; c++)
        this.board[r][c].state = 1
  }

  checkWin() {
    let hidden = 0
    for(let r=0; r<ROWS; r++)
      for(let c=0; c<COLS; c++)
        if(this.board[r][c].state !== 1) hidden++
    
    if(hidden === MINES) this.won = true
  }

  isInside(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
  }
}


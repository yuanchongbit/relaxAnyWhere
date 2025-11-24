export default class MainMenu {
  constructor(startTetrisCb, startMinesweeperCb, startSudokuCb) {
    this.startTetris = startTetrisCb
    this.startMinesweeper = startMinesweeperCb
    this.startSudoku = startSudokuCb
    
    const info = wx.getSystemInfoSync()
    this.width = info.windowWidth
    this.height = info.windowHeight
    this.dpr = info.pixelRatio

    // 按钮区域 (逻辑坐标)
    this.btnTetris = { x: this.width / 2 - 80, y: this.height / 2 - 100, w: 160, h: 50 }
    this.btnMine = { x: this.width / 2 - 80, y: this.height / 2 - 20, w: 160, h: 50 }
    this.btnSudoku = { x: this.width / 2 - 80, y: this.height / 2 + 60, w: 160, h: 50 }
  }

  reset() {}

  update() {}

  render(ctx) {
    const dpr = this.dpr
    
    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${30 * dpr}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText('Game Collection', this.width / 2 * dpr, (this.height / 2 - 120) * dpr)

    // Tetris 按钮
    this.drawButton(ctx, this.btnTetris, 'Tetris', '#333333')
    
    // 扫雷按钮
    this.drawButton(ctx, this.btnMine, 'Minesweeper', '#333333')
    
    // 数独按钮
    this.drawButton(ctx, this.btnSudoku, 'Sudoku', '#333333')
  }

  drawButton(ctx, btn, text, color) {
    const dpr = this.dpr
    ctx.fillStyle = color
    ctx.fillRect(btn.x * dpr, btn.y * dpr, btn.w * dpr, btn.h * dpr)
    
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2 * dpr
    ctx.strokeRect(btn.x * dpr, btn.y * dpr, btn.w * dpr, btn.h * dpr)

    ctx.fillStyle = '#ffffff'
    ctx.font = `${20 * dpr}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, (btn.x + btn.w / 2) * dpr, (btn.y + btn.h / 2) * dpr)
  }

  handleTouch(x, y) {
    // x, y 是 clientX, clientY，也就是逻辑坐标
    if (this.isInside(x, y, this.btnTetris)) {
      this.startTetris()
    } else if (this.isInside(x, y, this.btnMine)) {
      this.startMinesweeper()
    } else if (this.isInside(x, y, this.btnSudoku)) {
      this.startSudoku()
    }
  }

  isInside(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
  }
}


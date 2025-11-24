// 数独游戏场景
const SIZE = 9

export default class SudokuScene {
  constructor(exitCb) {
    this.exitCb = exitCb
    const info = wx.getSystemInfoSync()
    this.width = info.windowWidth
    this.height = info.windowHeight
    this.dpr = info.pixelRatio

    // 计算布局
    let menuRect
    try {
       menuRect = wx.getMenuButtonBoundingClientRect()
    } catch(e) {
       menuRect = { top: 40, bottom: 80, height: 32 }
    }
    
    const topPadding = menuRect.bottom + 10
    const bottomAreaHeight = 120 // 底部留给数字选择按钮
    
    // 可用高度
    const availableHeight = this.height - topPadding - bottomAreaHeight - 20
    const availableWidth = this.width * 0.95
    
    // 棋盘大小 (正方形)
    this.boardSize = Math.min(availableWidth, availableHeight)
    this.cellSize = this.boardSize / SIZE
    this.boardX = (this.width - this.boardSize) / 2
    this.boardY = topPadding + (availableHeight - this.boardSize) / 2

    // Header Controls (Back, Difficulty, New Game)
    this.btnBack = { x: 20, y: menuRect.top, w: 60, h: menuRect.height, text: 'Back', type: 'rect' }
    this.headerY = (menuRect.top + menuRect.height/2)
    
    // 底部数字按钮 (1-9)
    const numBtnY = this.boardY + this.boardSize + 15
    const numBtnSize = Math.min(35, (this.width - 40) / 9)
    const numBtnGap = (this.width - numBtnSize * 9) / 10
    
    this.numberButtons = []
    for (let i = 1; i <= 9; i++) {
      this.numberButtons.push({
        num: i,
        x: numBtnGap + (i - 1) * (numBtnSize + numBtnGap),
        y: numBtnY,
        w: numBtnSize,
        h: numBtnSize
      })
    }
    
    // 清除按钮
    this.btnClear = {
      x: this.width / 2 - 50,
      y: numBtnY + numBtnSize + 10,
      w: 100,
      h: 35,
      text: 'Clear'
    }
    
    // 新游戏按钮
    this.btnNewGame = {
      x: this.width / 2 - 50,
      y: menuRect.top,
      w: 100,
      h: menuRect.height,
      text: 'New'
    }

    this.selectedCell = null // { row, col }
    this.reset()
  }

  reset() {
    // 生成数独谜题
    this.generatePuzzle()
    this.selectedCell = null
    this.won = false
  }

  // 生成完整的数独解决方案
  generateSolution() {
    this.board = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0))
    
    // 使用回溯算法填充数独
    this.solveSudoku(this.board)
    
    return this.board
  }

  // 数独求解器 (回溯算法)
  solveSudoku(board) {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (board[row][col] === 0) {
          // 尝试填入 1-9
          const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])
          for (const num of numbers) {
            if (this.isValidPlacement(board, row, col, num)) {
              board[row][col] = num
              if (this.solveSudoku(board)) {
                return true
              }
              board[row][col] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }

  // 检查数字放置是否合法
  isValidPlacement(board, row, col, num) {
    // 检查行
    for (let c = 0; c < SIZE; c++) {
      if (board[row][c] === num) return false
    }
    
    // 检查列
    for (let r = 0; r < SIZE; r++) {
      if (board[r][col] === num) return false
    }
    
    // 检查 3x3 宫格
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (board[r][c] === num) return false
      }
    }
    
    return true
  }

  // 打乱数组
  shuffleArray(array) {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  // 生成谜题 (移除一些数字)
  generatePuzzle() {
    // 先生成完整解决方案
    this.solution = this.generateSolution()
    
    // 复制一份作为谜题
    this.board = this.solution.map(row => [...row])
    
    // 标记初始固定的数字
    this.fixed = Array(SIZE).fill(null).map(() => Array(SIZE).fill(false))
    
    // 移除一些数字 (简单难度：移除40个，中等：50个，困难：60个)
    const cellsToRemove = 40
    let removed = 0
    
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * SIZE)
      const col = Math.floor(Math.random() * SIZE)
      
      if (this.board[row][col] !== 0) {
        this.board[row][col] = 0
        removed++
      }
    }
    
    // 标记剩余的为固定数字
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (this.board[r][c] !== 0) {
          this.fixed[r][c] = true
        }
      }
    }
    
    // 用户填入的数字
    this.userBoard = this.board.map(row => [...row])
  }

  update() {}

  render(ctx) {
    const dpr = this.dpr

    // BG
    ctx.fillStyle = '#F5F5DC' // 米色背景
    ctx.fillRect(0, 0, this.width * dpr, this.height * dpr)

    // Header
    ctx.fillStyle = '#333'
    ctx.font = `${18 * dpr}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Sudoku', (this.width / 2) * dpr, this.headerY * dpr)

    // 绘制数独棋盘
    this.drawBoard(ctx)

    // 绘制数字按钮
    this.numberButtons.forEach(btn => {
      this.drawNumberButton(ctx, btn)
    })

    // 绘制控制按钮
    this.drawBtn(ctx, this.btnBack)
    this.drawBtn(ctx, this.btnClear)
    this.drawBtn(ctx, this.btnNewGame)

    // 胜利提示
    if (this.won) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, 0, this.width * dpr, this.height * dpr)
      ctx.fillStyle = '#4CAF50'
      ctx.font = `${40 * dpr}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText('You Won!', (this.width / 2) * dpr, (this.height / 2) * dpr)
    }
  }

  drawBoard(ctx) {
    const dpr = this.dpr
    const bx = this.boardX * dpr
    const by = this.boardY * dpr
    const bs = this.boardSize * dpr
    const cs = this.cellSize * dpr

    // 绘制选中单元格高亮
    if (this.selectedCell) {
      const { row, col } = this.selectedCell
      ctx.fillStyle = 'rgba(100, 150, 255, 0.3)'
      ctx.fillRect(
        bx + col * cs,
        by + row * cs,
        cs,
        cs
      )
    }

    // 绘制单元格网格
    ctx.strokeStyle = '#999'
    ctx.lineWidth = 1 * dpr
    for (let i = 0; i <= SIZE; i++) {
      // 3x3 宫格粗线
      if (i % 3 === 0) {
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 3 * dpr
      } else {
        ctx.strokeStyle = '#999'
        ctx.lineWidth = 1 * dpr
      }
      
      // 横线
      ctx.beginPath()
      ctx.moveTo(bx, by + i * cs)
      ctx.lineTo(bx + bs, by + i * cs)
      ctx.stroke()
      
      // 竖线
      ctx.beginPath()
      ctx.moveTo(bx + i * cs, by)
      ctx.lineTo(bx + i * cs, by + bs)
      ctx.stroke()
    }

    // 绘制数字
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${this.cellSize * 0.6 * dpr}px Arial`
    
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const num = this.userBoard[row][col]
        if (num !== 0) {
          const cx = bx + col * cs + cs / 2
          const cy = by + row * cs + cs / 2
          
          // 固定数字用黑色，用户填入用蓝色
          if (this.fixed[row][col]) {
            ctx.fillStyle = '#000'
            ctx.font = `bold ${this.cellSize * 0.6 * dpr}px Arial`
          } else {
            ctx.fillStyle = '#2196F3'
            ctx.font = `${this.cellSize * 0.6 * dpr}px Arial`
          }
          
          ctx.fillText(num.toString(), cx, cy)
        }
      }
    }
  }

  drawNumberButton(ctx, btn) {
    const dpr = this.dpr
    
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(btn.x * dpr, btn.y * dpr, btn.w * dpr, btn.h * dpr)
    
    ctx.strokeStyle = '#2E7D32'
    ctx.lineWidth = 2 * dpr
    ctx.strokeRect(btn.x * dpr, btn.y * dpr, btn.w * dpr, btn.h * dpr)
    
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${18 * dpr}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(btn.num.toString(), (btn.x + btn.w / 2) * dpr, (btn.y + btn.h / 2) * dpr)
  }

  drawBtn(ctx, btn) {
    const dpr = this.dpr
    ctx.fillStyle = '#666'
    ctx.fillRect(btn.x * dpr, btn.y * dpr, btn.w * dpr, btn.h * dpr)
    ctx.strokeStyle = '#888'
    ctx.lineWidth = 1 * dpr
    ctx.strokeRect(btn.x * dpr, btn.y * dpr, btn.w * dpr, btn.h * dpr)
    
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${14 * dpr}px Arial`
    ctx.fillText(btn.text, (btn.x + btn.w / 2) * dpr, (btn.y + btn.h / 2) * dpr)
  }

  handleTouch(x, y) {
    // Back 按钮
    if (this.isInside(x, y, this.btnBack)) {
      this.exitCb()
      return
    }
    
    // New Game 按钮
    if (this.isInside(x, y, this.btnNewGame)) {
      this.reset()
      return
    }
    
    // Clear 按钮
    if (this.isInside(x, y, this.btnClear)) {
      if (this.selectedCell) {
        const { row, col } = this.selectedCell
        if (!this.fixed[row][col]) {
          this.userBoard[row][col] = 0
        }
      }
      return
    }

    if (this.won) return

    // 棋盘点击 - 选择单元格
    if (x >= this.boardX && x < this.boardX + this.boardSize &&
        y >= this.boardY && y < this.boardY + this.boardSize) {
      const col = Math.floor((x - this.boardX) / this.cellSize)
      const row = Math.floor((y - this.boardY) / this.cellSize)
      
      if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
        this.selectedCell = { row, col }
      }
      return
    }

    // 数字按钮点击
    for (const btn of this.numberButtons) {
      if (this.isInside(x, y, btn)) {
        if (this.selectedCell) {
          const { row, col } = this.selectedCell
          if (!this.fixed[row][col]) {
            this.userBoard[row][col] = btn.num
            this.checkWin()
          }
        }
        return
      }
    }
  }

  checkWin() {
    // 检查是否所有单元格都填满
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (this.userBoard[r][c] === 0) return
        
        // 检查是否与解决方案一致
        if (this.userBoard[r][c] !== this.solution[r][c]) return
      }
    }
    
    this.won = true
  }

  isInside(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
  }
}


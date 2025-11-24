// 移植 Tetris 逻辑
const ROWS = 20
const COLS = 10
const TetrominoType = { I:'I', J:'J', L:'L', O:'O', S:'S', T:'T', Z:'Z' }
const SHAPES = {
  I: [{x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:3, y:1}],
  J: [{x:0, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}],
  L: [{x:2, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}],
  O: [{x:1, y:0}, {x:2, y:0}, {x:1, y:1}, {x:2, y:1}],
  S: [{x:1, y:0}, {x:2, y:0}, {x:0, y:1}, {x:1, y:1}],
  T: [{x:1, y:0}, {x:0, y:1}, {x:1, y:1}, {x:2, y:1}],
  Z: [{x:0, y:0}, {x:1, y:0}, {x:1, y:1}, {x:2, y:1}]
}
const COLORS = {
  I: '#00FFFF', J: '#0000FF', L: '#FFA500', O: '#FFFF00', S: '#00FF00', T: '#800080', Z: '#FF0000'
}

class Tetromino {
  constructor(type) {
    this.type = type
    this.shape = JSON.parse(JSON.stringify(SHAPES[type]))
    this.color = COLORS[type]
  }
  rotate() {
    if (this.type === 'O') return
    let center = this.type === 'I' ? this.shape[1] : this.shape[2]
    this.shape = this.shape.map(p => ({
      x: center.x - (p.y - center.y),
      y: center.y + (p.x - center.x)
    }))
  }
}

export default class TetrisScene {
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
    
    // 顶部 Back 按钮
    this.btnBack = { x: 20, y: menuRect.top, w: 60, h: menuRect.height, text: 'Back', type: 'rect-trans' }
    
    // 屏幕区域计算
    // LCD 屏幕区域：顶部开始，占据上半部分
    // 留出顶部 80px 给 Back 按钮和标题
    const screenTop = menuRect.bottom + 10
    const controlHeight = this.width * 0.8 // 下方控制区高度，大约接近正方形
    
    // 剩余高度给屏幕
    let screenHeight = this.height - screenTop - controlHeight - 20
    // 保证屏幕比例
    const screenWidth = this.width * 0.85
    const screenX = (this.width - screenWidth) / 2
    
    // 棋盘在屏幕内
    // 棋盘宽高比 1:2
    // 计算 cellSize
    // 屏幕内布局：左侧棋盘 (10列)，右侧信息区 (约6列宽)
    // 总宽度单位 = 16
    const totalUnits = 16
    this.cellSize = Math.floor(Math.min((screenWidth * 0.9) / totalUnits, (screenHeight * 0.9) / ROWS))
    
    this.boardW = this.cellSize * COLS
    this.boardH = this.cellSize * ROWS
    
    // 居中对齐
    const contentW = this.cellSize * totalUnits
    const paddingX = (screenWidth - contentW) / 2
    const paddingY = (screenHeight - this.boardH) / 2
    
    this.screenRect = { x: screenX, y: screenTop, w: screenWidth, h: screenHeight }
    
    this.boardX = screenX + paddingX
    this.boardY = screenTop + paddingY
    
    this.infoX = this.boardX + this.boardW + this.cellSize
    this.infoY = this.boardY
    
    // 控制区布局
    const controlY = screenTop + screenHeight + 20
    const controlAreaH = this.height - controlY
    const controlCenterY = controlY + controlAreaH / 2 - 20 // control area vertical center
    
    // 使用 25% 和 75% 分割左右区域
    // 根据反馈调整重心：左侧稍微往中靠 (0.28)，右侧十字键显著往左移 (0.70) 避免贴边
    const leftCX = this.width * 0.28
    const rightCX = this.width * 0.70
    
    // 1. 功能键 (P, R) - 左侧上方
    // 排列在 Drop 键上方
    const funcBtnSize = 35
    const funcSpacing = 50
    const funcY = controlCenterY - 60
    
    this.btnPause = { x: leftCX - funcSpacing/2, y: funcY, w: funcBtnSize, h: funcBtnSize, text: 'P', type: 'circle-green', label: 'Pause' }
    this.btnRestart = { x: leftCX + funcSpacing/2, y: funcY, w: funcBtnSize, h: funcBtnSize, text: 'R', type: 'circle-red', label: 'Reset' }
    
    // 2. Drop 键 (Space) - 左侧下方
    const bigBtnSize = 90
    const dropY = controlCenterY + 30
    this.btnDrop = { x: leftCX, y: dropY, w: bigBtnSize, h: bigBtnSize, text: 'DROP', type: 'circle-blue-big', label: 'Space' }

    // 3. 十字键 (右侧) - 居中于右侧区域
    const dPadCY = controlCenterY
    const dBtnSize = 55
    const dGap = 5
    
    this.btnRotate = { x: rightCX, y: dPadCY - dBtnSize - dGap, w: dBtnSize, h: dBtnSize, text: '↻', type: 'circle-blue', label: 'Rotation' }
    this.btnDown = { x: rightCX, y: dPadCY + dBtnSize + dGap, w: dBtnSize, h: dBtnSize, text: '↓', type: 'circle-blue', label: 'Down' }
    this.btnLeft = { x: rightCX - dBtnSize - dGap, y: dPadCY, w: dBtnSize, h: dBtnSize, text: '←', type: 'circle-blue', label: 'Left' }
    this.btnRight = { x: rightCX + dBtnSize + dGap, y: dPadCY, w: dBtnSize, h: dBtnSize, text: '→', type: 'circle-blue', label: 'Right' }

    // 装饰用的 Sound 键移除，或保留在 Reset 旁
    // 根据用户反馈 "Pause Reset and Drop should be on the left side"，这里只保留 P 和 R 比较简洁
    
    this.reset()
  }

  reset() {
    this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0))
    this.score = 0
    this.level = 1
    this.lines = 0
    this.gameOver = false
    this.paused = false
    this.lastTime = 0
    this.dropInterval = 500
    this.timer = 0
    this.nextType = this.randomType()
    this.spawn()
  }
  
  randomType() {
    const types = Object.keys(TetrominoType)
    return types[Math.floor(Math.random() * types.length)]
  }

  spawn() {
    this.curr = new Tetromino(this.nextType)
    this.nextType = this.randomType()
    
    this.currX = Math.floor(COLS/2) - 2
    this.currY = 0
    if (!this.isValid(this.curr.shape, this.currX, this.currY)) {
      this.gameOver = true
    }
  }

  isValid(shape, ox, oy) {
    return shape.every(p => {
      const x = ox + p.x
      const y = oy + p.y
      return x >= 0 && x < COLS && y < ROWS && (y < 0 || this.board[y][x] === 0)
    })
  }

  update() {
    if (this.gameOver || this.paused) return

    const now = Date.now()
    if (!this.lastTime) this.lastTime = now
    const dt = now - this.lastTime
    this.lastTime = now

    this.timer += dt
    if (this.timer > this.dropInterval) {
      this.timer = 0
      if (this.isValid(this.curr.shape, this.currX, this.currY + 1)) {
        this.currY++
      } else {
        this.lock()
        this.clearLines()
        this.spawn()
      }
    }
  }

  lock() {
    this.curr.shape.forEach(p => {
      const x = this.currX + p.x
      const y = this.currY + p.y
      if (y >= 0) this.board[y][x] = this.curr.color
    })
  }
  
  fastDrop() {
    while (this.isValid(this.curr.shape, this.currX, this.currY + 1)) {
        this.currY++
    }
    this.lock()
    this.clearLines()
    this.spawn()
  }

  clearLines() {
    let lines = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(c => c !== 0)) {
        this.board.splice(r, 1)
        this.board.unshift(Array(COLS).fill(0))
        lines++
        r++ // Check same row again
      }
    }
    if (lines > 0) {
        this.lines += lines
        this.score += lines * 100 * this.level
        this.level = Math.floor(this.lines / 10) + 1
        this.dropInterval = Math.max(100, 500 - (this.level - 1) * 50)
    }
  }

  render(ctx) {
    const dpr = this.dpr
    
    // 1. 绘制黄色外壳背景
    ctx.fillStyle = '#F0D145'
    ctx.fillRect(0, 0, this.width * dpr, this.height * dpr)
    
    // 2. 绘制 LCD 屏幕区域
    // 外边框
    ctx.fillStyle = '#000'
    ctx.beginPath()
    // 稍微做点圆角
    const sr = this.screenRect
    const r = 10
    const sx = sr.x * dpr, sy = sr.y * dpr, sw = sr.w * dpr, sh = sr.h * dpr
    
    // 手动绘制圆角矩形以兼容旧版本基础库
    const borderPadding = 25 // symmetric padding
    ctx.moveTo(sx + r*dpr, sy - 40*dpr)
    ctx.lineTo(sx + sw + borderPadding*dpr - r*dpr, sy - 40*dpr)
    // 右上角
    ctx.arc(sx + sw + borderPadding*dpr - r*dpr, sy - 40*dpr + r*dpr, r*dpr, -Math.PI/2, 0)
    ctx.lineTo(sx + sw + borderPadding*dpr, sy + sh + 20*dpr - r*dpr)
    // 右下角
    ctx.arc(sx + sw + borderPadding*dpr - r*dpr, sy + sh + 20*dpr - r*dpr, r*dpr, 0, Math.PI/2)
    ctx.lineTo(sx - borderPadding*dpr + r*dpr, sy + sh + 20*dpr)
    // 左下角
    ctx.arc(sx - borderPadding*dpr + r*dpr, sy + sh + 20*dpr - r*dpr, r*dpr, Math.PI/2, Math.PI)
    ctx.lineTo(sx - borderPadding*dpr, sy - 40*dpr + r*dpr)
    // 左上角
    ctx.arc(sx - borderPadding*dpr + r*dpr, sy - 40*dpr + r*dpr, r*dpr, Math.PI, Math.PI*3/2)
    
    ctx.closePath()
    ctx.fill()
    
    // 屏幕本体
    ctx.fillStyle = '#9CAD88' // LCD 绿
    ctx.fillRect(sx, sy, sw, sh)
    
    // 绘制装饰文字 Good Old Tetris
    ctx.fillStyle = '#000'
    ctx.font = `bold ${16 * dpr}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText('Good Old Tetris', sx + sw/2, sy - 15*dpr)
    
    // 3. 绘制游戏内容
    // Board Border
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2 * dpr
    ctx.strokeRect(this.boardX * dpr, this.boardY * dpr, this.boardW * dpr, this.boardH * dpr)
    
    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1 * dpr
    for(let i=0; i<=ROWS; i++) {
        ctx.beginPath(); ctx.moveTo(this.boardX*dpr, (this.boardY + i*this.cellSize)*dpr); ctx.lineTo((this.boardX+this.boardW)*dpr, (this.boardY + i*this.cellSize)*dpr); ctx.stroke()
    }
    for(let i=0; i<=COLS; i++) {
        ctx.beginPath(); ctx.moveTo((this.boardX + i*this.cellSize)*dpr, this.boardY*dpr); ctx.lineTo((this.boardX + i*this.cellSize)*dpr, (this.boardY+this.boardH)*dpr); ctx.stroke()
    }

    // Static Blocks (Pixel style black)
    ctx.fillStyle = '#000'
    for (let r=0; r<ROWS; r++) {
      for (let c=0; c<COLS; c++) {
        if (this.board[r][c]) {
          this.drawPixelBlock(ctx, c, r)
        }
      }
    }

    // Active Block
    if (this.curr && !this.gameOver) {
      this.curr.shape.forEach(p => {
        const x = this.currX + p.x
        const y = this.currY + p.y
        if (y >= 0) this.drawPixelBlock(ctx, x, y)
      })
    }
    
    // Info Panel
    ctx.fillStyle = '#000'
    ctx.textAlign = 'right'
    ctx.font = `${12 * dpr}px monospace`
    
    const infoX = (this.infoX + 4 * this.cellSize) * dpr
    const startY = this.infoY * dpr
    const gapY = 30 * dpr
    
    ctx.fillText('Score', infoX, startY + gapY * 0)
    ctx.font = `bold ${16 * dpr}px monospace`
    ctx.fillText(this.score, infoX, startY + gapY * 0 + 20*dpr)
    
    ctx.font = `${12 * dpr}px monospace`
    ctx.fillText('Level', infoX, startY + gapY * 2)
    ctx.font = `bold ${16 * dpr}px monospace`
    ctx.fillText(this.level, infoX, startY + gapY * 2 + 20*dpr)
    
    ctx.font = `${12 * dpr}px monospace`
    ctx.fillText('Next', infoX, startY + gapY * 4)
    
    // Draw Next Piece
    if (this.nextType) {
        const shape = SHAPES[this.nextType]
        const nextScale = 0.6
        const nextCell = this.cellSize * nextScale
        const nextBaseX = infoX - 3 * this.cellSize * dpr // Approximate center
        const nextBaseY = startY + gapY * 4 + 10 * dpr
        
        shape.forEach(p => {
            const x = nextBaseX + p.x * nextCell * dpr
            const y = nextBaseY + p.y * nextCell * dpr
            const size = (nextCell - 1) * dpr
            
            // LCD pixel style
            ctx.fillStyle = '#000'
            ctx.fillRect(x, y, size, size)
            ctx.fillStyle = '#9CAD88'
            ctx.fillRect(x + 2*dpr, y + 2*dpr, size - 4*dpr, size - 4*dpr)
            ctx.fillStyle = '#000'
            ctx.fillRect(x + 4*dpr, y + 4*dpr, size - 8*dpr, size - 8*dpr)
        })
    }

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(sx, sy, sw, sh)
      ctx.fillStyle = '#fff'
      ctx.font = `${20 * dpr}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', sx + sw/2, sy + sh/2)
    }

    // Controls
    this.drawBtn(ctx, this.btnBack)
    
    this.drawCircleBtn(ctx, this.btnPause)
    // this.drawCircleBtn(ctx, this.btnSound)
    this.drawCircleBtn(ctx, this.btnRestart)
    
    this.drawCircleBtn(ctx, this.btnDrop)
    
    this.drawCircleBtn(ctx, this.btnRotate)
    this.drawCircleBtn(ctx, this.btnDown)
    this.drawCircleBtn(ctx, this.btnLeft)
    this.drawCircleBtn(ctx, this.btnRight)
  }

  drawPixelBlock(ctx, c, r) {
    const dpr = this.dpr
    const x = (this.boardX + c * this.cellSize) * dpr
    const y = (this.boardY + r * this.cellSize) * dpr
    const size = (this.cellSize - 1) * dpr
    
    // LCD pixel look: nested squares
    ctx.fillStyle = '#000'
    ctx.fillRect(x, y, size, size)
    ctx.fillStyle = '#9CAD88'
    ctx.fillRect(x + 2*dpr, y + 2*dpr, size - 4*dpr, size - 4*dpr)
    ctx.fillStyle = '#000'
    ctx.fillRect(x + 4*dpr, y + 4*dpr, size - 8*dpr, size - 8*dpr)
  }
  
  drawBtn(ctx, btn) {
      const dpr = this.dpr
      if (btn.type === 'rect-trans') {
          ctx.fillStyle = 'rgba(0,0,0,0.3)'
          ctx.fillRect(btn.x * dpr, btn.y * dpr, btn.w * dpr, btn.h * dpr)
          ctx.fillStyle = '#fff'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.font = `${14 * dpr}px Arial`
          ctx.fillText(btn.text, (btn.x + btn.w/2) * dpr, (btn.y + btn.h/2) * dpr)
      }
  }

  drawCircleBtn(ctx, btn) {
    const dpr = this.dpr
    const cx = btn.x * dpr
    const cy = btn.y * dpr
    const r = (btn.w / 2) * dpr
    
    // Body - Flat Style
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    
    let color = '#333'
    // Use slightly flatter/pastel colors or standard flat material colors
    if (btn.type.includes('green')) color = '#4CAF50'
    if (btn.type.includes('red')) color = '#F44336'
    if (btn.type.includes('blue')) color = '#2196F3'
    
    ctx.fillStyle = color
    ctx.fill()
    
    // Simple Border for definition
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 1 * dpr
    ctx.stroke()
    
    // Label Text (below or inside?) Image has labels below
    if (btn.label) {
        ctx.fillStyle = '#000'
        ctx.font = `${12 * dpr}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(btn.label, cx, cy + r + 5*dpr)
    }
    
    // Icon inside
    if (!btn.type.includes('green') && !btn.type.includes('red') && btn.text !== 'DROP') {
        // Arrows / Rotate
        ctx.fillStyle = '#fff'  // White icon on colored button looks better flat
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `bold ${24 * dpr}px Arial` // Slightly larger font
        ctx.fillText(btn.text, cx, cy)
    } else if (btn.text === 'DROP') {
        // For DROP text inside button
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle' 
        ctx.font = `bold ${20 * dpr}px Arial`
        ctx.fillText(btn.text, cx, cy)
    } else {
        // For P and R text inside button
         ctx.fillStyle = '#fff'
         ctx.textAlign = 'center'
         ctx.textBaseline = 'middle'
         ctx.font = `bold ${16 * dpr}px Arial`
         ctx.fillText(btn.text, cx, cy)
    }
  }

  handleTouch(x, y) {
    if (this.isInsideRect(x, y, this.btnBack)) {
      this.exitCb()
      return
    }
    
    if (this.isInsideCircle(x, y, this.btnRestart)) {
      this.reset()
      return
    }

    if (this.isInsideCircle(x, y, this.btnPause)) {
      if (!this.gameOver) {
         this.paused = !this.paused
      }
      return
    }

    if (this.gameOver || this.paused) return

    if (this.isInsideCircle(x, y, this.btnLeft)) {
      if (this.isValid(this.curr.shape, this.currX - 1, this.currY)) this.currX--
    } else if (this.isInsideCircle(x, y, this.btnRight)) {
      if (this.isValid(this.curr.shape, this.currX + 1, this.currY)) this.currX++
    } else if (this.isInsideCircle(x, y, this.btnDown)) {
        // Soft drop (speed up)
        if (this.isValid(this.curr.shape, this.currX, this.currY + 1)) this.currY++
    } else if (this.isInsideCircle(x, y, this.btnRotate)) {
       const newShape = this.curr.shape.map(p => {
         let center = this.curr.type === 'I' ? this.curr.shape[1] : this.curr.shape[2]
         if(this.curr.type === 'O') return p
         return {
           x: center.x - (p.y - center.y),
           y: center.y + (p.x - center.x)
         }
       })
       if (this.isValid(newShape, this.currX, this.currY)) this.curr.shape = newShape
    } else if (this.isInsideCircle(x, y, this.btnDrop)) {
        this.fastDrop()
    }
  }

  isInsideRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
  }
  
  isInsideCircle(x, y, btn) {
      const dx = x - btn.x
      const dy = y - btn.y
      const r = btn.w / 2 // radius
      return dx*dx + dy*dy <= r*r
  }
}

// miniprogram/js/games/menu.js
import Scene from '../base/scene'

export default class MenuScene extends Scene {
  constructor(main) {
    super(main)
    
    // 按钮布局区域
    this.buttons = [
      { id: 'tetris', text: 'Tetris', y: this.screenHeight / 2 - 60, height: 50 },
      { id: 'minesweeper', text: 'Minesweeper', y: this.screenHeight / 2 + 20, height: 50 }
    ]
  }

  render(ctx) {
    // 标题
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 30px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Game Collection', this.screenWidth / 2, this.screenHeight / 2 - 150)

    // 按钮
    this.buttons.forEach(btn => {
      // 按钮背景
      ctx.fillStyle = '#333333'
      ctx.fillRect(this.screenWidth / 2 - 100, btn.y, 200, btn.height)
      // 按钮边框
      ctx.strokeStyle = '#555555'
      ctx.strokeRect(this.screenWidth / 2 - 100, btn.y, 200, btn.height)
      
      // 文字
      ctx.fillStyle = '#ffffff'
      ctx.font = '20px Arial'
      ctx.fillText(btn.text, this.screenWidth / 2, btn.y + 32)
    })
  }

  handleTouch(type, e) {
    if (type !== 'end') return

    const touch = e.changedTouches[0]
    const x = touch.clientX
    const y = touch.clientY

    this.buttons.forEach(btn => {
      const btnX = this.screenWidth / 2 - 100
      if (x >= btnX && x <= btnX + 200 && y >= btn.y && y <= btn.y + btn.height) {
        this.main.switchScene(btn.id)
      }
    })
  }
}


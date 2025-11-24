// miniprogram/js/main.js
import MenuScene from './games/menu'
import TetrisScene from './games/tetris'
import MinesweeperScene from './games/minesweeper'

/**
 * 游戏入口主类
 * 负责场景切换和全局渲染循环
 */
export default class Main {
  constructor() {
    this.canvas = wx.createCanvas()
    this.ctx = this.canvas.getContext('2d')
    this.currentScene = null
    
    // 简单的场景管理器
    this.scenes = {
      menu: new MenuScene(this),
      tetris: new TetrisScene(this),
      minesweeper: new MinesweeperScene(this)
    }

    this.init()
  }

  init() {
    // 监听全局触摸事件
    wx.onTouchStart((e) => this.handleTouch('start', e))
    wx.onTouchMove((e) => this.handleTouch('move', e))
    wx.onTouchEnd((e) => this.handleTouch('end', e))

    this.switchScene('menu')
    this.loop()
  }

  switchScene(sceneName) {
    if (this.currentScene) {
      this.currentScene.onExit()
    }
    this.currentScene = this.scenes[sceneName]
    this.currentScene.onEnter()
  }

  handleTouch(type, e) {
    if (this.currentScene) {
      this.currentScene.handleTouch(type, e)
    }
  }

  loop() {
    this.update()
    this.render()
    requestAnimationFrame(() => this.loop())
  }

  update() {
    if (this.currentScene) {
      this.currentScene.update()
    }
  }

  render() {
    // 清屏
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillStyle = '#111111'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    if (this.currentScene) {
      this.currentScene.render(this.ctx)
    }
  }
}


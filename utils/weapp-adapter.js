// 简单的 adapter
const info = wx.getSystemInfoSync()
const windowWidth = info.windowWidth
const windowHeight = info.windowHeight

// 小游戏环境全局对象是 GameGlobal，类似于浏览器的 window
const _window = GameGlobal

// 挂载 global canvas
if (typeof canvas === 'undefined') {
  _window.canvas = wx.createCanvas()
}

// 修正尺寸
canvas.width = windowWidth * info.pixelRatio
canvas.height = windowHeight * info.pixelRatio

// 模拟 window 对象属性
if (typeof window === 'undefined') {
    GameGlobal.window = GameGlobal
}

GameGlobal.innerWidth = windowWidth
GameGlobal.innerHeight = windowHeight

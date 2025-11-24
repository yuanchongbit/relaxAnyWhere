// 简单的场景管理器
import './utils/weapp-adapter'
import MainMenu from './js/main-menu'
import TetrisScene from './js/tetris-scene'
import MinesweeperScene from './js/minesweeper-scene'
import SudokuScene from './js/sudoku-scene'

// 获取全局 canvas
const ctx = canvas.getContext('2d')

// 全局状态
const gameState = {
  currentScene: null,
  scenes: {}
}

// 初始化场景
function init() {
  gameState.scenes.menu = new MainMenu(startTetris, startMinesweeper, startSudoku)
  gameState.scenes.tetris = new TetrisScene(backToMenu)
  gameState.scenes.minesweeper = new MinesweeperScene(backToMenu)
  gameState.scenes.sudoku = new SudokuScene(backToMenu)

  // 默认进入主菜单
  switchScene('menu')

  // 游戏主循环
  requestAnimationFrame(loop)
}

function switchScene(sceneName) {
  gameState.currentScene = gameState.scenes[sceneName]
  gameState.currentScene.reset()
}

function startTetris() {
  switchScene('tetris')
}

function startMinesweeper() {
  switchScene('minesweeper')
}

function startSudoku() {
  switchScene('sudoku')
}

function backToMenu() {
  switchScene('menu')
}

function loop() {
  // 清屏
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (gameState.currentScene) {
    gameState.currentScene.update()
    gameState.currentScene.render(ctx)
  }

  requestAnimationFrame(loop)
}

// 处理点击事件
wx.onTouchStart((e) => {
  const x = e.touches[0].clientX
  const y = e.touches[0].clientY
  if (gameState.currentScene) {
    gameState.currentScene.handleTouch(x, y)
  }
})

// 启动
init()

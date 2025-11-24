// miniprogram/js/base/scene.js
export default class Scene {
  constructor(main) {
    this.main = main
    this.canvas = main.canvas
    this.screenWidth = main.canvas.width
    this.screenHeight = main.canvas.height
  }

  onEnter() {}
  onExit() {}
  update() {}
  render(ctx) {}
  handleTouch(type, e) {}
}


new Vue({
  el: '#app',
  data: {
    isCanvasRender: true, // 渲染模式
    isGameOver: false, // 游戏结束标志
    isChessState: false, // 悔棋按钮
    isUndoChessState: false, // 撤销悔棋按钮
    isIplay: true, // 已方出手标志
    size: 40, // 棋格尺寸
    rows: 15, // 棋格行数
    blackChess: '#333', // Canvas 黑子颜色
    whiteChess: '#e6d2d5', // Canvas 白字颜色
    cvsBoard: null, // Canvas 棋盘引用
    cvsItem: null, // Canvas 棋子引用
    chessMap: {}, // 棋子映射表
    chessState: [], // 记录落子, 栈结构
    undoState: [] // 记录悔子, 栈结构
  },

  mounted() {
    this.init()
    this.drawChessBoard()
  },

  methods: {
    /**
     * 初始化
     */
    init() {
      const { _format, rows, chessMap } = this

      this.cvsBoard = this.cvsBoard || this.$refs.canvasBoard.getContext('2d')
      this.cvsItem = this.cvsItem || this.$refs.canvasItem.getContext('2d')

      this.isGameOver = false
      this.isIplay = true
      this.isChessState = false
      this.isUndoChessState = false
      this.chessState = []
      this.undoState = []

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < rows; j++) {
          chessMap[_format(i, j)] = ''
        }
      }
    },

    /**
     * 重置游戏
     */
    reset() {
      this.removeAllChess()
      this.init()
      this.$forceUpdate()
    },

    /**
     * 切换渲染模式
     */
    switchRender() {
      this.isCanvasRender = !this.isCanvasRender
    },

    /**
     * 落子
     * @param {*} e 事件 DOM
     * @param {*} x DOM 横坐标
     * @param {*} y DOM 纵坐标
     */
    handleChess(e, x, y) {
      const {
        _format,
        size,
        isCanvasRender,
        isGameOver,
        isIplay,
        chessMap,
        chessState
      } = this

      if (isGameOver) return

      if (isCanvasRender) {
        y = Math.floor(e.offsetX / size)
        x = Math.floor(e.offsetY / size)
      }

      // 允许落子
      if (!chessMap[_format(x, y)]) {
        // 更新棋子映射表
        chessMap[_format(x, y)] = isIplay ? 'black' : 'white'
        // 记录落子顺序
        chessState.unshift([x, y, isIplay])
        this.isChessState = true
        // 清空'悔棋栈'
        this.undoState = []
        this.isUndoChessState = false
        // 渲染落子
        this.drawChessItem(x, y, isIplay)
        this.$forceUpdate()
        // 判断是否胜利
        this.checkWin(x, y, isIplay)
        if (!isGameOver) this.isIplay = !isIplay
      }
    },

    /**
     * 悔棋
     */
    regretChess() {
      const { _format, undoState, chessState, chessMap } = this

      // 取得上一步落子坐标, 更新当前落子记录, 同时添加进'悔棋栈'
      undoState.unshift(chessState.shift())
      this.isChessState = chessState.length > 0 ? true : false
      this.isUndoChessState = true
      const [preX, preY, prePlay] = undoState[0]
      // 渲染悔棋
      chessMap[_format(preX, preY)] = ''
      this.removeChessItem(preX, preY)
      // 出手权翻转
      this.isIplay = prePlay
    },

    /**
     * 撤销悔棋
     */
    undoRegretChess() {
      const { _format, undoState, chessState, chessMap } = this

      // 取得上一步悔棋坐标, 更新'悔棋栈', 同时恢复当前落子记录
      chessState.unshift(undoState.shift())
      this.isUndoChessState = undoState.length > 0 ? true : false
      this.isChessState = true
      const [preX, preY, prePlay] = chessState[0]
      // 渲染撤销悔棋
      chessMap[_format(preX, preY)] = prePlay ? 'black' : 'white'
      this.drawChessItem(preX, preY, prePlay)
      // 出手权恢复
      this.isIplay = !prePlay
    },

    /**
     * 判断胜利
     * @param {number} x 棋子横坐标
     * @param {number} y 棋子纵坐标
     * @param {boolean} isIplay 已方先手标志
     */
    checkWin(x, y, isIplay) {
      const curChess = isIplay ? 'black' : 'white'

      if (
        this._horizontal(x, y, curChess) ||
        this._vertical(x, y, curChess) ||
        this._leftSlant(x, y, curChess) ||
        this._rightSlant(x, y, curChess)
      )
        this.isGameOver = true
    },

    /**
     * Canvas 绘制棋盘
     */
    drawChessBoard() {
      const { rows, size, cvsBoard } = this
      const border = size / 2 // 边界间距

      for (let i = 0; i < rows; i++) {
        cvsBoard.moveTo(size * i + border, border)
        cvsBoard.lineTo(size * i + border, size * rows - border)
        cvsBoard.stroke()
        cvsBoard.moveTo(border, size * i + border)
        cvsBoard.lineTo(size * rows - border, size * i + border)
        cvsBoard.stroke()
      }
    },

    /**
     * Canvas 绘制棋子
     * @param {number} x 棋子横坐标
     * @param {number} y 棋子纵坐标
     * @param {boolean} isIplay 已方出手标志
     */
    drawChessItem(x, y, isIplay) {
      const { cvsItem, size, blackChess, whiteChess } = this
      const border = size / 2 // 边界间距

      cvsItem.beginPath()
      cvsItem.arc(size * y + border, size * x + border, 19, 0, 2 * Math.PI)
      cvsItem.closePath()
      cvsItem.fillStyle = isIplay ? blackChess : whiteChess
      cvsItem.fill()
    },

    /**
     * 移除单个棋子
     * @param {number} x 棋子横坐标
     * @param {number} y 棋子纵坐标
     */
    removeChessItem(x, y) {
      const { cvsItem, size } = this
      cvsItem.clearRect(y * size, x * size, size, size)
    },

    /**
     * 移除所有棋子
     */
    removeAllChess() {
      const { cvsItem, size, rows } = this
      cvsItem.clearRect(0, 0, size * rows, size * rows)
    },

    /**
     * 转换坐标格式
     * @param {number} x DOM 横坐标
     * @param {number} y DOM 纵坐标
     */
    _format(x, y) {
      return x + '-' + y
    },

    /**
     * 横向判断
     *
     * @param {number} x 棋子横坐标
     * @param {number} y 棋子纵坐标
     * @param {string} curChess 棋子颜色
     * @returns boolean
     */
    _horizontal(x, y, curChess) {
      const { _format, chessMap } = this
      let count = 0

      for (let i = 1; i < 5; i++) {
        if (y - i >= 0 && curChess === chessMap[_format(x, y - i)]) count++
        else if (y + i < 15 && curChess === chessMap[_format(x, y + i)]) count++
        else count = 0
      }
      return count >= 4
    },

    /**
     * 纵向判断
     *
     * @param {number} x 棋子横坐标
     * @param {number} y 棋子纵坐标
     * @param {string} curChess 棋子颜色
     * @returns boolean
     */
    _vertical(x, y, curChess) {
      const { _format, chessMap } = this
      let count = 0

      for (let i = 1; i < 5; i++) {
        if (x - i >= 0 && curChess === chessMap[_format(x - i, y)]) count++
        else if (x + i < 15 && curChess === chessMap[_format(x + i, y)]) count++
        else count = 0
      }

      return count >= 4
    },

    /**
     * 左斜判断
     *
     * @param {number} x 棋子横坐标
     * @param {number} y 棋子纵坐标
     * @param {string} curChess 棋子颜色
     * @returns boolean
     */
    _leftSlant(x, y, curChess) {
      const { _format, chessMap } = this
      let count = 0

      for (let i = 1; i < 5; i++) {
        if (
          Math.max(x, y) + i < 15 &&
          curChess === chessMap[_format(x + i, y + i)]
        )
          count++
        else if (
          Math.min(x, y) - i >= 0 &&
          curChess === chessMap[_format(x - i, y - i)]
        )
          count++
        else count = 0
      }

      return count >= 4
    },

    /**
     * 右斜判断
     *
     * @param {number} x 棋子横坐标
     * @param {number} y 棋子纵坐标
     * @param {string} curChess 棋子颜色
     * @returns boolean
     */
    _rightSlant(x, y, curChess) {
      const { _format, chessMap } = this
      let count = 0

      for (let i = 1; i < 5; i++) {
        if (
          x + i < 15 &&
          y - i >= 0 &&
          curChess === chessMap[_format(x + i, y - i)]
        )
          count++
        else if (
          x - i >= 0 &&
          y + i < 15 &&
          curChess === chessMap[_format(x - i, y + i)]
        )
          count++
        else count = 0
      }

      return count >= 4
    }
  }
})

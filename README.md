# MikuPet - Live2D 桌面宠物

使用 Electron 构建的 Miku Live2D 桌面宠物应用，具备智能动画系统和实用的时间管理功能。

## 主要功能

✨ **Live2D 模型展示** - 流畅的初音未来模型显示和动画播放  
📝 **智能待办事项** - 带时间提醒的 TodoList 管理  
🎬 **优化动画系统** - 三层动画速度控制，自然流畅  
🖱️ **互动体验** - 点击交互、视线跟随、右键菜单  
🪟 **窗口管理** - 透明无边框、置顶显示、尺寸调整  

## 项目结构

```
Live2Dpet/
├── main.js              # Electron 主进程
├── index.html           # 主页面和样式引用
├── renderer.js          # Live2D 渲染和交互逻辑
├── todolist.js          # 待办事项功能
├── todolist.css         # 待办事项样式
├── package.json         # 项目配置 (productName: "MikuPet")
├── Model/21miku_normal_3.0_f_t03/  # Live2D 模型资源
└── public/
    ├── assets/icon.png  # 应用图标
    └── live2dcubismcore.min.js
```

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产模式
npm start
```

## 核心特性

### 🎭 动画系统
- **启动欢迎**: 随机握手动作 + 微笑表情 (70% 速度)
- **待机循环**: 每12秒自动播放待机动画 (60% 速度)  
- **交互响应**: 点击触发随机动画 + Toast 提示 (80% 速度)

### 📝 TodoList 功能
- **时间管理**: 添加待办事项和提醒时间
- **智能提醒**: 5分钟前自动提醒 + 动画响应
- **本地存储**: 数据持久化保存
- **滚动支持**: 自定义滚动条和鼠标滚轮

### 🎮 交互控制
- **右键菜单**: 
  - 📝 待办事项管理
  - 📏 调整模型大小 (300×400 / 400×500 / 500×600)
  - 📌 切换置顶状态
  - ➖ 最小化 / ❌ 关闭应用
- **视线跟随**: 鼠标移动时模型视线跟随
- **窗口拖拽**: 透明窗口可拖拽移动

## 技术栈

- **Electron** - 跨平台桌面应用
- **PIXI.js 6.x** - 2D 渲染引擎  
- **pixi-live2d-display** - Live2D 模型支持
- **Live2D Cubism Core 4** - 核心运行时

## 开发说明

### 核心文件
- `renderer.js` - Live2D 渲染、动画控制、交互处理
- `todolist.js` - 待办事项逻辑 (已提取CSS到独立文件)
- `todolist.css` - 待办事项样式 (280行+，使用 !important 确保样式优先级)

### 添加新动画
```javascript
// 在 playRandomMotion() 中添加新动画
const newMotions = ['w-new-motion-name'];
const newExpressions = ['face_new_expression'];
const newToastMessages = ['新的提示信息'];
```

### 自定义模型
替换 `Model/` 目录下的模型文件，并修改 `renderer.js` 中的模型路径。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

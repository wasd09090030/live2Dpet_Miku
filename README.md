# Live2D 桌面宠物应用

一个使用 Electron、Cubism 4 和 pixi-live2d-display 构建的桌面宠物应用。

## 功能特性

- ✨ Live2D 模型显示和动画播放
- 🖱️ 鼠标交互和模型点击响应
- 👁️ 鼠标跟随视线效果
- 🎭 随机动画播放
- 🪟 透明无边框窗口
- 📌 始终置顶显示
- 🎯 可拖拽窗口

## 项目结构

```
Live2Dpet/
├── main.js              # Electron 主进程
├── index.html           # 渲染页面
├── renderer.js          # 渲染进程逻辑
├── package.json         # 项目配置
├── Model/               # Live2D 模型文件
│   └── 21miku_normal_3.0_f_t03/
│       ├── *.model3.json    # 模型配置文件
│       ├── *.moc3           # 模型数据
│       ├── *.physics3.json  # 物理参数
│       ├── textures/        # 贴图文件
│       └── motions/         # 动作文件
└── public/
    └── live2dcubismcore.min.js  # Live2D Core 库
```

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 开发模式运行：
```bash
npm run dev
```

3. 生产模式运行：
```bash
npm start
```

4. 构建应用：
```bash
npm run build
```

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **PIXI.js 6.x**: 2D 渲染引擎
- **pixi-live2d-display**: Live2D 模型显示库
- **Live2D Cubism Core**: Live2D 核心运行时

## 使用说明

1. 启动应用后，Live2D 模型会显示在屏幕右下角
2. 鼠标悬停在窗口上会显示控制按钮
3. 点击模型可以触发随机动画
4. 鼠标移动时模型会跟随鼠标视线
5. 模型会定期播放待机动画

## 控制功能

- **最小化按钮**: 最小化窗口到任务栏
- **关闭按钮**: 完全退出应用
- **拖拽**: 可以拖拽窗口改变位置
- **点击**: 点击模型播放随机动画

## 自定义模型

要使用其他 Live2D 模型，请：

1. 将模型文件放在 `Model/` 目录下
2. 修改 `renderer.js` 中的模型路径：
```javascript
const modelUrl = './Model/你的模型文件夹/模型文件.model3.json';
```

## 开发说明

### 主要文件说明

- `main.js`: 控制应用生命周期、窗口创建和系统交互
- `renderer.js`: 处理 Live2D 模型加载、动画播放和用户交互
- `index.html`: 定义用户界面和样式

### 添加新功能

1. **新动画**: 在 `playRandomMotion()` 函数中添加动画逻辑
2. **新交互**: 在 `setupInteraction()` 函数中添加事件监听
3. **UI 改进**: 修改 `index.html` 中的样式和布局

## 常见问题

### Q: 模型不显示？
A: 检查模型文件路径是否正确，确保所有必要文件都存在。

### Q: 动画不播放？
A: 确保模型的 motion 文件存在且格式正确。

### Q: 应用无法启动？
A: 检查 Node.js 和 npm 版本，确保所有依赖都已正确安装。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

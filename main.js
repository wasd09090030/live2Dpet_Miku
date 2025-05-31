const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let isDev = process.argv.includes('--dev');

function createWindow() {
  // 获取屏幕尺寸
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  
  // 窗口尺寸
  const windowWidth = 400;
  const windowHeight = 500;
    // 计算窗口位置：放在右侧，垂直在任务栏正上方
  const windowX = screenWidth - windowWidth - 60; // 右侧，留20px边距
  const windowY = screenHeight - windowHeight + 60; // 紧贴工作区底部（任务栏上方）
    // 创建主窗口
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    icon: path.join(__dirname, 'public', 'assets', 'icon.png'), // 设置应用图标
    x: windowX, // 右侧位置
    y: windowY, // 任务栏正上方
    frame: false, // 无边框窗口
    transparent: true, // 透明背景
    alwaysOnTop: true, // 总在最上层
    resizable: false,
    movable: false, // 禁止移动窗口
    skipTaskbar: false, // 始终显示在任务栏
    show: false, // 初始隐藏，加载完成后显示
    backgroundColor: '#00000000', // 显式设置透明背景色
    hasShadow: false, // 禁用窗口阴影
    thickFrame: false, // 禁用厚边框
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // 允许加载本地文件
      backgroundThrottling: false, // 防止后台节流影响透明度
      offscreen: false // 确保不使用离屏渲染
    }
  });
  // 加载页面
  mainWindow.loadFile('index.html');
  // 页面加载完成后显示窗口（确保透明度正常）
  mainWindow.once('ready-to-show', () => {
    // 延迟显示，确保所有内容都已加载
    setTimeout(() => {
      mainWindow.show();
      // 强制刷新窗口以确保透明度生效
      mainWindow.webContents.executeJavaScript(`
        document.body.style.background = 'transparent';
        document.documentElement.style.background = 'transparent';
      `);
    }, 500);
  });

  // 开发模式下打开调试工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 窗口设置为不可移动，但保持鼠标交互
  mainWindow.setIgnoreMouseEvents(false);
}

// 应用准备就绪时创建窗口
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC通信处理
ipcMain.handle('get-model-path', () => {
  return path.join(__dirname, 'Model', '21miku_normal_3.0_f_t03', '21miku_normal_3.0_f_t03.model3.json');
});

ipcMain.handle('close-app', () => {
  app.quit();
});

ipcMain.handle('minimize-app', () => {
  mainWindow.minimize();
});

// 新增：切换置顶状态
ipcMain.handle('toggle-always-on-top', () => {
  const isOnTop = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!isOnTop);
  return !isOnTop;
});

// 新增：获取窗口信息
ipcMain.handle('get-window-info', () => {
  const bounds = mainWindow.getBounds();
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isAlwaysOnTop: mainWindow.isAlwaysOnTop(),
    isMaximized: mainWindow.isMaximized(),
    isMinimized: mainWindow.isMinimized()
  };
});

ipcMain.handle('resize-app-window', (event, width, height) => {
  // 只调整窗口大小和位置
  if (mainWindow) {
    // 右侧对齐，底部对齐
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const windowX = screenWidth - width - 20;
    const windowY = screenHeight - height + 80;
    mainWindow.setBounds({ width, height, x: windowX, y: windowY });
    // 通知渲染进程调整PIXI和模型
    mainWindow.webContents.send('resize-model', width, height);
  }
});

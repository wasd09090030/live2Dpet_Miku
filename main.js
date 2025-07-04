const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let isDev = process.argv.includes('--dev');
let globalMouseTracker = null;

// 设置应用图标 - 在应用准备就绪前设置
const iconPath = path.join(__dirname, 'favicon.ico');
console.log('应用图标路径:', iconPath);

// 验证图标文件
if (fs.existsSync(iconPath)) {
  console.log('图标文件验证成功');
  // 在Windows上设置dock图标
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.live2d.desktop-pet');
  }
} else {
  console.error('图标文件不存在:', iconPath);
}

function createWindow() {
  // 获取屏幕尺寸
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  
  // 窗口尺寸
  const windowWidth = 400;
  const windowHeight = 500;
    // 计算窗口位置：放在右侧，垂直在任务栏正上方
  const windowX = screenWidth - windowWidth - 60; // 右侧，留20px边距
  const windowY = screenHeight - windowHeight + 60; // 紧贴工作区底部（任务栏上方）
  
  // 使用全局图标路径
  console.log('设置应用图标路径:', iconPath);
  
  // 验证图标文件是否存在
  if (!fs.existsSync(iconPath)) {
    console.warn('图标文件不存在:', iconPath);
  } else {
    console.log('图标文件存在，大小:', fs.statSync(iconPath).size, 'bytes');
  }
  
  // 创建主窗口
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    icon: iconPath, // 设置应用图标
    title: 'Live2D Desktop Pet', // 窗口标题
    x: windowX, // 右侧位置
    y: windowY, // 任务栏正上方
    frame: false, // 无边框窗口
    transparent: true, // 透明背景
    alwaysOnTop: true, // 总在最上层
    resizable: false,
    movable: false, // 禁止移动窗口
    skipTaskbar: false, // 始终显示在任务栏 - 这里图标应该会显示
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
  
  // 设置应用在任务栏和窗口管理器中的图标
  if (process.platform === 'win32') {
    // Windows平台额外设置
    app.setAppUserModelId('com.live2d.desktop-pet');
  }
  
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
  // 设置初始鼠标穿透状态（默认启用穿透，但保留事件转发）
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  
  // 启动全局鼠标位置跟踪
  startGlobalMouseTracking();
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

// 新增：动态控制鼠标穿透
ipcMain.handle('set-mouse-transparent', (event, transparent, options = {}) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(transparent, options);
    console.log(`鼠标穿透状态设置为: ${transparent}`);
    return true;
  }
  return false;
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

// 全局鼠标位置跟踪
function startGlobalMouseTracking() {
  if (globalMouseTracker) {
    clearInterval(globalMouseTracker);
  }
  
  globalMouseTracker = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isMinimized()) {
      try {
        // 获取当前鼠标位置
        const mousePos = screen.getCursorScreenPoint();
        const windowBounds = mainWindow.getBounds();
        
        // 计算相对于窗口的鼠标位置
        const relativeX = mousePos.x - windowBounds.x;
        const relativeY = mousePos.y - windowBounds.y;
        
        // 检查鼠标是否在窗口内
        const isInWindow = relativeX >= 0 && relativeX <= windowBounds.width && 
                          relativeY >= 0 && relativeY <= windowBounds.height;
        
        if (isInWindow) {
          // 将鼠标位置发送到渲染进程（只在需要时发送）
          mainWindow.webContents.send('global-mouse-move', {
            x: relativeX,
            y: relativeY,
            screenX: mousePos.x,
            screenY: mousePos.y,
            windowBounds: windowBounds
          });
        }
      } catch (error) {
        // 忽略错误，可能是窗口正在销毁
        console.log('全局鼠标跟踪暂时失败，将在下次循环重试');
      }
    }
  }, 16); // 约60fps的更新频率
}

// 停止全局鼠标跟踪
function stopGlobalMouseTracking() {
  if (globalMouseTracker) {
    clearInterval(globalMouseTracker);
    globalMouseTracker = null;
  }
}

// 应用退出时清理
app.on('before-quit', () => {
  stopGlobalMouseTracking();
});

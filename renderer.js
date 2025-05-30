const sizePresets = {
    300: { w: 300, h: 400, scale: 0.08, x: 150, y: 50 },
    400: { w: 400, h: 500, scale: 0.1, x: 200, y: 60 },
    500: { w: 500, h: 600, scale: 0.12, x: 250, y: 70 }
};

const { ipcRenderer } = require('electron');
ipcRenderer.on('resize-model', (event, width, height) => {
    // 动态调整PIXI画布
    if (app && app.renderer) {
        app.renderer.resize(width, height);
    }    // 动态调整模型缩放和位置
    if (model) {
        let preset = sizePresets[width] || sizePresets[300];
        model.scale.set(preset.scale);
        model.x = preset.x;
        model.y = preset.y;
        model.anchor.set(0.5, 0); // 改为顶部中心锚点
    }
});

// 全局变量
let app, model, stage;
let isModelLoaded = false;

// 暴露到全局作用域以便调试
window.playRandomMotion = playRandomMotion;
window.playIdleAnimation = playIdleAnimation;

// 初始化应用
async function init() {
    try {
        console.log('开始初始化Live2D应用...');
        
        // 强制设置透明背景
        document.body.style.background = 'transparent';
        document.body.style.backgroundColor = 'transparent';
        document.documentElement.style.background = 'transparent';
        document.documentElement.style.backgroundColor = 'transparent';
        
        document.getElementById('loading').textContent = '正在初始化...';
        updateStatusBar('⏳ 初始化应用...');
        
        // 等待Live2D Cubism Core加载
        await waitForCubismCore();
        
        // 初始化PIXI应用（PIXI.js已通过script标签加载）
        document.getElementById('loading').textContent = '正在初始化PIXI应用...';
        initPIXIApp();
        
        document.getElementById('loading').textContent = '正在加载Live2D模型...';
        // 加载Live2D模型
        await loadModel();
          // 设置交互
        setupInteraction();
        
        // 设置键盘快捷键
        setupKeyboardShortcuts();
        
        // 隐藏加载提示
        document.getElementById('loading').style.display = 'none';
        
        console.log('Live2D应用初始化完成');
        updateStatusBar('🎉 应用就绪 - 右键菜单或快捷键操作');
        
    } catch (error) {
        console.error('初始化失败:', error);
        document.getElementById('loading').textContent = '加载失败: ' + error.message;
        document.getElementById('loading').style.color = '#ff0000';
    }
}

// 等待Cubism Core加载
function waitForCubismCore() {
    return new Promise((resolve, reject) => {
        const checkCubism = () => {
            if (window.Live2DCubismCore) {
                console.log('Live2D Cubism Core已加载');
                resolve();
            } else {
                setTimeout(checkCubism, 100);
            }
        };
        checkCubism();
        
        // 超时处理
        setTimeout(() => {
            if (!window.Live2DCubismCore) {
                reject(new Error('Live2D Cubism Core加载超时'));
            }        }, 10000);
    });
}

// 初始化PIXI应用
function initPIXIApp() {
    // 检查 PIXI 是否已加载
    if (typeof PIXI === 'undefined') {
        throw new Error('PIXI.js 未加载或加载失败');
    }
    
    console.log('PIXI.js 已就绪，开始初始化应用...');    app = new PIXI.Application({
        view: document.getElementById('canvas'),
        width: 300,
        height: 400,
        transparent: true,
        backgroundColor: 0x000000, // 黑色背景
        backgroundAlpha: 0, // 完全透明
        clearBeforeRender: true, // 每帧清除画面
        preserveDrawingBuffer: false, // 不保留绘制缓冲区
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
    });

    stage = app.stage;
    
    // 暴露 PIXI 到 window，以便 pixi-live2d-display 能够自动更新模型
    window.PIXI = PIXI;
    
    console.log('PIXI 应用初始化完成');
}

// 加载Live2D模型
async function loadModel() {
    try {
        console.log('pixi-live2d-display已通过script标签加载');
        
        // 等待一下确保库完全加载
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 使用相对路径加载模型
        const modelUrl = './Model/21miku_normal_3.0_f_t03/21miku_normal_3.0_f_t03.model3.json';
        
        // 从 PIXI.live2d 命名空间获取 Live2DModel
        if (!window.PIXI || !window.PIXI.live2d || !window.PIXI.live2d.Live2DModel) {
            throw new Error('PIXI.live2d.Live2DModel未找到，请确保cubism4.min.js已正确加载');
        }
        
        const Live2DModel = window.PIXI.live2d.Live2DModel;
        console.log('开始加载Live2D模型:', modelUrl);
        
        // 加载模型
        model = await Live2DModel.from(modelUrl);
        console.log('模型加载成功, 宽度:', model.width, '高度:', model.height);
          // 暴露模型到全局作用域以便调试
        window.model = model;
        window.app = app;
        
        // 设置模型大小和位置 - 使用默认的小号尺寸配置
        const defaultPreset = sizePresets[300];
        model.scale.set(defaultPreset.scale);
        model.x = defaultPreset.x;
        model.y = defaultPreset.y;
        model.anchor.set(0.5, 0); // 改为顶部中心锚点，这样模型会从顶部开始显示
        
        // 添加到舞台
        stage.addChild(model);
          // 启动模型动画
        if (model.internalModel) {
            console.log('模型内部结构加载完成');
            // 播放启动欢迎动画
            playStartupAnimation();
            // 延迟三秒后开始播放待机动画
            setTimeout(() => {
                playIdleAnimation();
            }, 3000);
        } else {
            console.warn('模型内部结构未加载');
        }
          isModelLoaded = true;
        console.log('Live2D模型加载完成');
        
    } catch (error) {
        console.error('模型加载失败:', error);
        throw error;
    }
}

// 播放启动欢迎动画
function playStartupAnimation() {
    if (!model || !model.internalModel) {
        console.warn('模型或内部结构未准备好，无法播放启动动画');
        return;
    }
    
    try {
        // 定义可用的握手动作
        const shakehandMotions = [
            'w-happy11-shakehand',
            'w-happy02-shakehand', 
            'w-happy01-shakehand',
            'w-cool01-shakehand',
            'w-adult01-shakehand',
            'w-adult-shakehand01-additional'
        ];
        
        // 定义可用的微笑表情
        const smileExpressions = [
            'face_smile_01',
            'face_smile_02',
            'face_smile_03',
            'face_smile_04',
            'face_smile_05',
            'face_smile_06',
            'face_smile_07'
        ];
        
        // 随机选择握手动作
        const randomShakehand = shakehandMotions[Math.floor(Math.random() * shakehandMotions.length)];
        
        // 随机选择微笑表情  
        const randomSmile = smileExpressions[Math.floor(Math.random() * smileExpressions.length)];
        
        console.log(`🎉 启动欢迎！播放握手动作: ${randomShakehand}`);
        console.log(`😊 启动欢迎！播放微笑表情: ${randomSmile}`);
        
        // 先播放握手动作（优先级3，确保播放）
        model.motion(randomShakehand, 0, 3);
        
        // 延迟800ms后播放微笑表情，让握手动作先完成一部分
        setTimeout(() => {
            if (model && model.internalModel) {
                model.expression(randomSmile);
                console.log(`表情切换到: ${randomSmile}`);
            }
        }, 800);
        
        // 显示欢迎提示
        showToast(`🎉 欢迎回来！初音未来为您问好~`);
        
        // 2.5秒后恢复正常表情，为切换到待机状态做准备
        setTimeout(() => {
            if (model && model.internalModel) {
                // 切换到默认表情动作
                model.expression('face_normal_01');
                console.log('恢复到默认表情，准备进入待机状态');
            }
        }, 2500);
        
    } catch (error) {
        console.error('播放启动动画失败:', error);
        // 如果启动动画失败，播放一个简单的默认动画
        try {
            model.motion('face_band_smile_01', 0, 2);
            console.log('播放备用欢迎动画');
            showToast('🎉 欢迎回来！');
        } catch (fallbackError) {
            console.error('播放备用动画也失败:', fallbackError);
        }
    }
}

// 播放待机动画
function playIdleAnimation() {
    if (!model || !model.internalModel) {
        console.warn('模型或内部结构未准备好');
        return;
    }
    
    try {
        // 定义默认动作和对应表情列表
        const idleActions = [
            { motion: 'w-normal04-nod', expression: 'face_closeeye_01' },
            { motion: 'w-normal04-forward', expression: 'face_band_smallmouth_01' },
            { motion: 'w-normal04-shakehead', expression: 'face_band_wanawana_01' },
            { motion: 'w-special02-guruguru', expression: 'face_blushed_01' },
            { motion: 'w-pure12-fidget', expression: 'face_idol_trouble_01' },
            { motion: 'w-special15-yurayura', expression: 'face_idol_wink_02' }
        ];
        
        let currentActionIndex = 0;
        
        // 播放当前动作和表情的函数
        const playCurrentIdleAction = () => {
            if (!model || !isModelLoaded) return;
            
            const currentAction = idleActions[currentActionIndex];
            
            try {
                console.log(`🎭 播放待机动作: ${currentAction.motion}`);
                console.log(`😊 播放待机表情: ${currentAction.expression}`);
                
                // 播放动作
                if (model.motion) {
                    model.motion(currentAction.motion, 0, 2);
                }
                
                // 延迟500ms后播放表情，让动作先开始
                setTimeout(() => {
                    if (model && model.internalModel && model.expression) {
                        model.expression(currentAction.expression);
                        console.log(`表情切换到: ${currentAction.expression}`);
                    }
                }, 500);
                
            } catch (error) {
                console.warn(`播放待机动作失败 ${currentAction.motion}:`, error);
                // 如果当前动作失败，尝试播放一个备用动画
                try {
                    model.motion('face_band_normal_01', 0, 1);
                    model.expression('face_normal_01');
                    console.log('播放备用待机动画');
                } catch (fallbackError) {
                    console.error('播放备用待机动画也失败:', fallbackError);
                }
            }
            
            // 移动到下一个动作
            currentActionIndex = (currentActionIndex + 1) % idleActions.length;
        };
        
        // 立即播放第一个动作
        playCurrentIdleAction();
        
        // 每10秒切换到下一个动作
        const idleInterval = setInterval(() => {
            if (model && isModelLoaded) {
                playCurrentIdleAction();
            } else {
                // 如果模型不再可用，清除定时器
                clearInterval(idleInterval);
            }
        }, 10000); // 10秒间隔
        
        // 将定时器ID保存到全局，以便需要时可以清除
        window.idleAnimationInterval = idleInterval;
        
        console.log('待机动画循环已启动，每10秒切换一次动作');
        
    } catch (error) {
        console.warn('播放待机动画失败:', error);
    }
}

// 播放随机动画
function playRandomMotion() {
    if (!model || !isModelLoaded) {
        console.warn('模型未准备好');
        return;
    }
    
    try {
        // 预定义一些用于交互的动画名称（区别于待机动画）
        const interactionMotions = [
            'face_band_smile_01',
            'face_band_smile_02',
            'face_band_wink_01',
            'face_band_blushed_01',
            'face_smile_01',
            'face_blushed_01',
            'w-happy02-shakehand',
            'w-happy01-shakehand',
            'w-cool01-shakehand'
        ];
        
        // 对应的表情
        const interactionExpressions = [
            'face_smile_01',
            'face_smile_02',
            'face_smile_03',
            'face_blushed_01',
            'face_idol_smile_01',
            'face_idol_blushed_01',
            'face_idol_wink_02'
        ];
        
        // 随机选择一个交互动画
        const randomMotion = interactionMotions[Math.floor(Math.random() * interactionMotions.length)];
        const randomExpression = interactionExpressions[Math.floor(Math.random() * interactionExpressions.length)];
        
        if (model.motion) {
            model.motion(randomMotion, 0, 3); // 优先级3，确保能播放
            console.log('播放交互动画:', randomMotion);
            
            // 延迟300ms后播放表情
            setTimeout(() => {
                if (model && model.internalModel && model.expression) {
                    model.expression(randomExpression);
                    console.log('播放交互表情:', randomExpression);
                }
            }, 300);
        } else {
            console.warn('模型motion方法不可用');
        }
    } catch (error) {
        console.warn('播放随机动画失败:', error);
    }
}

// 设置交互
function setupInteraction() {
    const canvas = document.getElementById('canvas');
    const app = document.getElementById('app');
    
    // 模型交互事件（仅在canvas上）
    canvas.addEventListener('mousedown', onModelPointerDown);
    canvas.addEventListener('mousemove', onModelPointerMove);
    canvas.addEventListener('mouseup', onModelPointerUp);
    canvas.addEventListener('click', onModelClick);
    
    // 触摸事件（仅在canvas上）
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        onModelPointerDown({ clientX: touch.clientX, clientY: touch.clientY });
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        onModelPointerMove({ clientX: touch.clientX, clientY: touch.clientY });
    });
      canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        onModelPointerUp();
    });
    
    // 添加右键菜单
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
    });
}

// 显示右键菜单
function showContextMenu(x, y) {
    // 移除现有菜单
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // 计算菜单位置 - 右上角展开
    const menuWidth = 150;
    const menuHeight = 240; // 菜单大致高度
    const offsetX = 10; // 向右偏移
    const offsetY = -menuHeight - 10; // 向上偏移整个菜单高度
    
    const menuX = x + offsetX;
    const menuY = y + offsetY;
    
    // 创建菜单
    const menu = document.createElement('div');
    menu.className = 'context-menu';    menu.style.cssText = `
        position: fixed;
        left: ${menuX}px;
        top: ${menuY}px;
        background: rgba(30, 30, 30, 0.95) !important;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 8px 0;
        min-width: ${menuWidth}px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        font-size: 14px;
        color: white !important;
        -webkit-app-region: no-drag;
        transform-origin: bottom left;
        animation: menuSlideInFromTopRight 0.2s ease-out;
    `;
    
    // 添加动画样式
    if (!document.querySelector('#menu-animation-style')) {
        const style = document.createElement('style');
        style.id = 'menu-animation-style';
        style.textContent = `
            @keyframes menuSlideInFromTopRight {
                from {
                    opacity: 0;
                    transform: scale(0.8) translate(-15px, 15px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translate(0, 0);
                }
            }
        `;
        document.head.appendChild(style);
    }const menuItems = [
        { text: '🎭 播放随机动画', action: () => playRandomMotion() },
        { text: '🎉 播放欢迎动画', action: () => playStartupAnimation() },
        { text: '📏 调整模型大小', action: () => showResizeSubMenu(x, y) },
        { text: '📌 切换置顶', action: () => toggleAlwaysOnTop() },
        { text: '➖ 最小化', action: () => ipcRenderer.invoke('minimize-app') },
        { text: '❌ 关闭应用', action: () => ipcRenderer.invoke('close-app') }
    ];
    
    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.textContent = item.text;
        menuItem.style.cssText = `
            padding: 8px 16px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.background = 'rgba(100, 149, 237, 0.3)';
        });
        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.background = 'transparent';
        });
        menuItem.addEventListener('click', () => {
            item.action();
            menu.remove();
        });
        menu.appendChild(menuItem);
    });
    
    document.body.appendChild(menu);
    
    // 点击其他地方关闭菜单
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// 新增：显示调整模型大小的子菜单
function showResizeSubMenu(x, y) {
    // 移除现有菜单
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();
    
    // 计算子菜单位置 - 右上角展开
    const subMenuWidth = 180;
    const subMenuHeight = 120; // 子菜单大致高度（3个选项）
    const offsetX = 15; // 向右偏移更多，避免重叠
    const offsetY = -subMenuHeight - 15; // 向上偏移整个子菜单高度
    
    const subMenuX = x + offsetX;
    const subMenuY = y + offsetY;
    
    // 创建子菜单
    const subMenu = document.createElement('div');
    subMenu.className = 'context-menu';    subMenu.style.cssText = `
        position: fixed;
        left: ${subMenuX}px;
        top: ${subMenuY}px;
        background: rgba(25, 25, 25, 0.96) !important;
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 8px 0;
        min-width: ${subMenuWidth}px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
        z-index: 1001;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        font-size: 15px;
        color: white !important;
        -webkit-app-region: no-drag;
        transform-origin: bottom left;
        animation: menuSlideInFromTopRight 0.2s ease-out;
    `;
    const sizes = [
        { label: '小号（300×400）', w: 300, h: 400 },
        { label: '中号（400×500）', w: 400, h: 500 },
        { label: '大号（500×600）', w: 500, h: 600 }
    ];
    sizes.forEach(size => {
        const item = document.createElement('div');
        item.textContent = size.label;
        item.style.cssText = `padding: 8px 20px; cursor: pointer; transition: background 0.2s;`;
        item.addEventListener('mouseenter', () => {
            item.style.background = 'rgba(100, 149, 237, 0.3)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
        });
        item.addEventListener('click', () => {
            ipcRenderer.invoke('resize-app-window', size.w, size.h);
            subMenu.remove();
        });
        subMenu.appendChild(item);
    });
    document.body.appendChild(subMenu);
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!subMenu.contains(e.target)) {
                subMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// 居中模型
function centerModel() {
    if (model) {
        model.x = 200;
        model.y = 480;
        console.log('模型已居中');
    }
}

// 切换置顶状态
async function toggleAlwaysOnTop() {
    try {
        const newState = await ipcRenderer.invoke('toggle-always-on-top');
        console.log('窗口置顶状态已切换为:', newState ? '开启' : '关闭');
        
        // 显示提示
        showToast(newState ? '🔒 窗口已置顶' : '🔓 窗口取消置顶');
    } catch (error) {
        console.error('切换置顶状态失败:', error);
        showToast('❌ 操作失败');
    }
}

// 显示提示信息
function showToast(message) {
    // 移除现有提示
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 20px;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        font-size: 14px;
        z-index: 2000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
    `;
    
    document.body.appendChild(toast);
    
    // 动画显示
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // 3秒后隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 更新状态栏
function updateStatusBar(message) {
    const statusBar = document.getElementById('statusBar');
    if (statusBar) {
        statusBar.textContent = message;
    }
}

function onModelPointerDown(event) {
    if (!isModelLoaded) return;
    
    // 不再记录拖拽状态，只处理模型交互
    console.log('模型交互开始');
}

function onModelPointerMove(event) {
    if (!model || !isModelLoaded) return;
    
    // 鼠标跟随效果（视线跟随）
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    
    // 应用视线跟随
    if (model.internalModel && model.internalModel.focusController) {
        model.internalModel.focusController.focus(x, y);
    }
}

function onModelPointerUp() {
    // 移除拖拽状态设置
    console.log('模型交互结束');
}

function onModelClick(event) {
    if (!isModelLoaded) return;
    
    // 点击模型时播放随机动画
    playRandomMotion();
    
    console.log('模型被点击');
}

// 添加键盘快捷键支持
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // 组合键检测
        const isCtrlPressed = e.ctrlKey;
        const isAltPressed = e.altKey;
        const isShiftPressed = e.shiftKey;
        
        switch (e.code) {
            case 'Space':
                if (!isCtrlPressed && !isAltPressed) {
                    e.preventDefault();
                    playRandomMotion();
                    showToast('🎭 播放随机动画');
                }
                break;
                  case 'KeyC':
                if (isCtrlPressed && !isAltPressed) {
                    e.preventDefault();
                    playStartupAnimation();
                    showToast('🎉 播放欢迎动画');
                }
                break;
                
            case 'KeyT':
                if (isCtrlPressed && !isAltPressed) {
                    e.preventDefault();
                    toggleAlwaysOnTop();
                }
                break;
                
            case 'F5':
                if (!isCtrlPressed && !isAltPressed) {
                    e.preventDefault();
                    location.reload();
                }
                break;
                
            case 'Escape':
                if (!isCtrlPressed && !isAltPressed) {
                    e.preventDefault();
                    ipcRenderer.invoke('minimize-app');
                }
                break;
                
            case 'F4':
                if (isAltPressed) {
                    e.preventDefault();
                    ipcRenderer.invoke('close-app');
                }
                break;
        }
    });
      console.log('键盘快捷键已启用:');
    console.log('- 空格键: 播放随机动画');
    console.log('- Ctrl+C: 播放欢迎动画');
    console.log('- Ctrl+T: 切换置顶');
    console.log('- F5: 重载应用');
    console.log('- Esc: 最小化');
    console.log('- Alt+F4: 关闭应用');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupKeyboardShortcuts();
});

// 错误处理
window.addEventListener('error', (event) => {
    console.error('应用错误:', event.error);
    document.getElementById('loading').textContent = '应用错误: ' + event.error.message;
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
    document.getElementById('loading').textContent = '加载错误: ' + event.reason.message;
});

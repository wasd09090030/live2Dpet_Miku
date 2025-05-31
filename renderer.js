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
        
        // 显示随机加载GIF动画
        showLoadingGif();
        
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
        
        // 初始隐藏canvas画布，等GIF播放完毕后再显示
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.opacity = '0';
            canvas.style.transition = 'opacity 0.5s ease-in';
        }
        
        document.getElementById('loading').textContent = '正在加载Live2D模型...';// 加载Live2D模型
        await loadModel();
        
        // 设置交互
        setupInteraction();
        
        // 隐藏加载提示
        document.getElementById('loading').style.display = 'none';
        
        // 注意：GIF隐藏和启动动画播放现在由 loadModel() 函数内部控制时序
        
        console.log('Live2D应用初始化完成');
        updateStatusBar('🎉 应用就绪 - 右键菜单操作');
          } catch (error) {
        console.error('初始化失败:', error);
        document.getElementById('loading').textContent = '加载失败: ' + error.message;
        document.getElementById('loading').style.color = '#ff0000';
        
        // 错误时也要隐藏GIF动画（会自动处理延时）
        hideLoadingGif();
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
    
    console.log('PIXI.js 已就绪，开始初始化应用...');
    
    // 获取当前窗口的实际尺寸，而不是硬编码
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    console.log(`使用窗口尺寸: ${windowWidth}×${windowHeight}`);
    
    app = new PIXI.Application({
        view: document.getElementById('canvas'),
        width: windowWidth,
        height: windowHeight,
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
        console.log('模型加载成功, 宽度:', model.width, '高度:', model.height);        // 暴露模型到全局作用域以便调试
        window.model = model;
        window.app = app;
        
        // 根据当前窗口尺寸选择合适的预设配置
        const windowWidth = window.innerWidth;
        let selectedPreset;
        if (windowWidth >= 500) {
            selectedPreset = sizePresets[500];
        } else if (windowWidth >= 400) {
            selectedPreset = sizePresets[400];
        } else {
            selectedPreset = sizePresets[300];
        }
        
        console.log(`窗口宽度: ${windowWidth}px，使用预设配置:`, selectedPreset);
        
        // 设置模型大小和位置
        model.scale.set(selectedPreset.scale);
        model.x = selectedPreset.x;
        model.y = selectedPreset.y;
        model.anchor.set(0.5, 0); // 改为顶部中心锚点，这样模型会从顶部开始显示// 添加到舞台
        stage.addChild(model);
        
        // 初始隐藏模型，等GIF播放完毕后再显示
        model.visible = false;
        console.log('模型已添加到舞台但暂时隐藏，等待GIF播放完毕');
        
        // 启动模型动画 - 使用回调机制确保在GIF完全隐藏后再播放
        if (model.internalModel) {
            console.log('模型内部结构加载完成');
              // 使用回调机制确保启动动画在GIF完全隐藏后才播放
            hideLoadingGif(() => {
                console.log('GIF已完全隐藏，现在显示模型并开始播放启动动画');
                
                // 先显示canvas画布
                const canvas = document.getElementById('canvas');
                if (canvas) {
                    canvas.style.opacity = '1';
                }
                
                // 显示模型（可以添加渐入效果）
                model.visible = true;
                model.alpha = 0; // 从透明开始
                
                // 模型渐入效果
                const fadeInModel = () => {
                    if (model.alpha < 1) {
                        model.alpha += 0.05; // 每帧增加透明度
                        requestAnimationFrame(fadeInModel);
                    } else {
                        model.alpha = 1; // 确保完全不透明
                        // 模型完全显示后播放启动动画
                        playStartupAnimation();
                    }
                };
                fadeInModel();
                
                // 启动动画播放3秒后开始待机动画
                setTimeout(() => {
                    playIdleAnimation();
                }, 3000);
            });
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
        
        // 播放握手动作，添加更长的淡入淡出时间和更慢的播放速度
        if (model.motion) {
            const motionState = model.motion(randomShakehand, 0, 3);
            // 设置动画播放速度为0.7倍（更慢）
            if (motionState) {
                motionState.speed = 0.7;
            }
        }
        
        // 延迟1200ms后播放微笑表情，让握手动作先完成更多部分
        setTimeout(() => {
            if (model && model.internalModel) {
                model.expression(randomSmile);
                console.log(`表情切换到: ${randomSmile}`);
            }
        }, 1200);
        
        // 显示欢迎提示
        showToast(`😊 你好吖！~`);
        
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
                  // 播放动作，设置慢速播放
                if (model.motion) {
                    const motionState = model.motion(currentAction.motion, 0, 2);
                    // 设置待机动画播放速度为0.6倍（更慢更自然）
                    if (motionState) {
                        motionState.speed = 0.6;
                    }
                }
                
                // 延迟800ms后播放表情，让动作先开始更长时间
                setTimeout(() => {
                    if (model && model.internalModel && model.expression) {
                        model.expression(currentAction.expression);
                        console.log(`表情切换到: ${currentAction.expression}`);
                    }
                }, 800);
                
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
          // 每12秒切换到下一个动作（更长间隔让动画更舒缓）
        const idleInterval = setInterval(() => {
            if (model && isModelLoaded) {
                playCurrentIdleAction();
            } else {
                // 如果模型不再可用，清除定时器
                clearInterval(idleInterval);
            }
        }, 12000); // 12秒间隔
        
        // 将定时器ID保存到全局，以便需要时可以清除
        window.idleAnimationInterval = idleInterval;
        
        console.log('待机动画循环已启动，每12秒切换一次动作');
        
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
      try {        // 预定义一些用于交互的动画名称（区别于待机动画）
        const interactionMotions = [
            'w-adult01-pose',       // 替换：成熟姿势动作
            'w-adult02-glad',       // 替换：开心动作
            'w-adult01-blushed',    // 替换：脸红动作
            'w-adult02-blushed',    // 替换：另一种脸红动作
            'w-adult01-nod',        // 替换：点头动作
            'w-adult02-nod',        // 替换：另一种点头动作
            'w-happy02-shakehand',
            'w-happy01-shakehand',
            'w-cool01-shakehand',
            'w-cute01-sleep05B',   // 新增：可爱睡觉动作
            'w-cute01-wink04' ,     // 新增：可爱眨眼动作
            'w-cute11-nbforward'   // 新增：可爱前倾动作
        ];
        
        // 对应的表情
        const interactionExpressions = [
            'face_smile_01',
            'face_smile_02',
            'face_smile_03',
            'face_blushed_01',
            'face_idol_smile_01',
            'face_idol_blushed_01',
            'face_idol_wink_02',
            'face_closeeye_01',     // 新增：适合睡觉动作的闭眼表情
            'face_closeeye_02',     // 新增：另一种闭眼表情
            'face_idol_closeeye_01', // 新增：偶像风格闭眼表情
            'face_idol_wink_01',    // 新增：适合眨眼动作的表情
            'face_idol_wink_02',    // 新增：另一种眨眼表情
            'face_idol_wink_03',     // 新增：第三种眨眼表情
            'face_surprise_01' // 新增：惊讶表情
        ];
        
        // 对应的Toast显示文本
        const toastMessages = [
            '嗯哼哼~',     // w-adult01-pose
            '😊 我很开心呢！',        // w-adult02-glad
            '😳 有点害羞...', // w-adult01-blushed
            '😊 脸红红的~',          // w-adult02-blushed
            '有什么事吗？',    // w-adult01-nod
            '好的好的😖~',          // w-adult02-nod
            '哈咯哈咯！💕',        // w-happy02-shakehand
            '🥰 最喜欢你了！💕',          // w-happy01-shakehand
            '💕💕💕~',         // w-cool01-shakehand
            '😴 好困呀，要睡觉了...', // w-cute01-sleep05B
            '😉 嘿嘿~',          // w-cute01-wink04
            '😳 哇哦，怎么了吗？', // w-cute11-nbforward
        ];
          // 随机选择一个交互动画
        const randomIndex = Math.floor(Math.random() * interactionMotions.length);
        const randomMotion = interactionMotions[randomIndex];
        const randomExpression = interactionExpressions[Math.floor(Math.random() * interactionExpressions.length)];
        const toastMessage = toastMessages[randomIndex];
        
        if (model.motion) {
            const motionState = model.motion(randomMotion, 0, 3); // 优先级3，确保能播放
            // 设置交互动画播放速度为0.8倍（稍慢但响应快）
            if (motionState) {
                motionState.speed = 0.8;
            }
            console.log('播放交互动画:', randomMotion);
            
            // 显示对应的Toast消息
            showToast(toastMessage);
            
            // 延迟600ms后播放表情，让动作有更多展示时间
            setTimeout(() => {
                if (model && model.internalModel && model.expression) {
                    model.expression(randomExpression);
                    console.log('播放交互表情:', randomExpression);
                }
            }, 600);
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
    }    // 计算菜单位置 - 直接从鼠标位置向右上角展开
    const menuWidth = 150;
    const menuHeight = 240; // 菜单大致高度
    const offsetX = 0; // 无水平偏移，直接从鼠标位置开始
    const offsetY = 0; // 无垂直偏移，直接从鼠标位置开始
    
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
        border-radius: 6px;
        padding: 4px 0;
        min-width: ${menuWidth}px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        font-family: 'Microsoft YaHei', Arial, sans-serif;        font-size: 13px;
        color: white !important;
        -webkit-app-region: no-drag;
        transform-origin: top left;
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
        document.head.appendChild(style);    }const menuItems = [
        { text: '📝 待办事项', action: () => todoList.showTodoPanel() },
        { text: '📏 调整模型大小', action: () => showResizeSubMenu(x, y) },
        { text: '📌 切换置顶', action: () => toggleAlwaysOnTop() },
        { text: '➖ 最小化', action: () => ipcRenderer.invoke('minimize-app') },
        { text: '❌ 关闭应用', action: () => ipcRenderer.invoke('close-app') }
    ];
    
    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.textContent = item.text;        menuItem.style.cssText = `
            padding: 6px 12px;
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
    if (existingMenu) existingMenu.remove();    // 计算子菜单位置 - 从鼠标位置向右上角展开，减少偏移
    const subMenuWidth = 180;
    const subMenuHeight = 120; // 子菜单大致高度（3个选项）
    const offsetX = 5; // 向右偏移少量，避免重叠
    const offsetY = 0; // 无垂直偏移，直接从鼠标位置开始
    
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
        border-radius: 6px;
        padding: 4px 0;
        min-width: ${subMenuWidth}px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
        z-index: 1001;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        font-size: 13px;        color: white !important;
        -webkit-app-region: no-drag;
        transform-origin: top left;
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
        item.style.cssText = `padding: 6px 16px; cursor: pointer; transition: background 0.2s;`;
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

// 显示随机加载GIF动画
function showLoadingGif() {
    // 随机选择一个GIF
    const gifs = ['./public/assets/IamComing.gif', './public/assets/IamComing2.gif'];
    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
    
    // 记录GIF显示开始时间
    window.gifStartTime = Date.now();
    
    // 创建加载GIF容器
    let loadingGifContainer = document.getElementById('loading-gif-container');
    if (!loadingGifContainer) {
        loadingGifContainer = document.createElement('div');
        loadingGifContainer.id = 'loading-gif-container';
        loadingGifContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        `;
        document.body.appendChild(loadingGifContainer);
    }
    
    // 创建GIF图像
    const gifImg = document.createElement('img');
    gifImg.src = randomGif;
    gifImg.style.cssText = `
        max-width: 300px;
        max-height: 300px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    
    // 添加加载错误处理
    gifImg.onerror = () => {
        console.error('GIF加载失败:', randomGif);
        // 如果GIF加载失败，显示文字提示
        const textDiv = document.createElement('div');
        textDiv.style.cssText = `
            color: white;
            font-size: 18px;
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            text-align: center;
        `;
        textDiv.textContent = '🎭 正在加载Live2D模型...';
        loadingGifContainer.innerHTML = '';
        loadingGifContainer.appendChild(textDiv);
    };
    
    gifImg.onload = () => {
        console.log(`GIF加载成功: ${randomGif}`);
    };
    
    // 清空容器并添加新的GIF
    loadingGifContainer.innerHTML = '';
    loadingGifContainer.appendChild(gifImg);
    
    console.log(`正在显示加载动画: ${randomGif}`);
    
    return loadingGifContainer;
}

// 隐藏加载GIF动画
function hideLoadingGif(onComplete) {
    const loadingGifContainer = document.getElementById('loading-gif-container');
    if (loadingGifContainer) {
        // 计算已经显示的时间
        const elapsedTime = Date.now() - (window.gifStartTime || 0);
        const minDisplayTime = 2400; // 最小显示时间2400ms
        
        // 如果显示时间不足2400ms，则等待剩余时间
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
        
        console.log(`GIF已显示 ${elapsedTime}ms，还需等待 ${remainingTime}ms`);
        
        setTimeout(() => {
            if (loadingGifContainer && loadingGifContainer.parentNode) {
                loadingGifContainer.style.opacity = '1';
                loadingGifContainer.style.transition = 'opacity 0.5s ease-out';
                loadingGifContainer.style.opacity = '0';
                
                setTimeout(() => {
                    if (loadingGifContainer.parentNode) {
                        loadingGifContainer.parentNode.removeChild(loadingGifContainer);
                    }
                    console.log('加载动画已隐藏');
                    
                    // 如果有回调函数，则执行
                    if (typeof onComplete === 'function') {
                        onComplete();
                    }
                }, 500);
            }
        }, remainingTime);
    } else {
        // 如果没有找到容器，直接执行回调
        if (typeof onComplete === 'function') {
            onComplete();
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    init();
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

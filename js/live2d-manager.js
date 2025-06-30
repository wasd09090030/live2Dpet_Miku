/**
 * Live2D 模型管理模块 - 处理模型加载、初始化和管理
 */

class Live2DManager {
    constructor() {
        this.loadingCallbacks = [];
    }

    /**
     * 等待 Cubism Core 加载
     */
    waitForCubismCore() {
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
                }
            }, AppConfig.cubismCoreTimeout);
        });
    }

    /**
     * 初始化 PIXI 应用
     */
    initPIXIApp() {
        // 检查 PIXI 是否已加载
        if (typeof PIXI === 'undefined') {
            throw new Error('PIXI.js 未加载或加载失败');
        }
        
        console.log('PIXI.js 已就绪，开始初始化应用...');
        
        // 获取当前窗口的实际尺寸
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        console.log(`使用窗口尺寸: ${windowWidth}×${windowHeight}`);
        
        AppState.app = new PIXI.Application({
            view: document.getElementById('canvas'),
            width: windowWidth,
            height: windowHeight,
            transparent: true,
            backgroundColor: 0x000000,
            backgroundAlpha: 0,
            clearBeforeRender: true,
            preserveDrawingBuffer: false,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        AppState.stage = AppState.app.stage;
        
        // 暴露 PIXI 到 window
        window.PIXI = PIXI;
        
        console.log('PIXI 应用初始化完成');
    }

    /**
     * 加载 Live2D 模型
     */
    async loadModel() {
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
            AppState.model = await Live2DModel.from(modelUrl);
            console.log('模型加载成功, 宽度:', AppState.model.width, '高度:', AppState.model.height);
            
            // 暴露模型到全局作用域以便调试
            window.model = AppState.model;
            window.app = AppState.app;
            
            // 配置模型
            this.configureModel();
            
            // 添加到舞台
            AppState.stage.addChild(AppState.model);
            
            // 初始隐藏模型，等GIF播放完毕后再显示
            AppState.model.visible = false;
            console.log('模型已添加到舞台但暂时隐藏，等待GIF播放完毕');
            
            // 处理模型显示和动画
            this.handleModelDisplay();
            
            AppState.isModelLoaded = true;
            console.log('Live2D模型加载完成');
            
        } catch (error) {
            console.error('模型加载失败:', error);
            throw error;
        }
    }

    /**
     * 配置模型大小和位置
     */
    configureModel() {
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
        AppState.model.scale.set(selectedPreset.scale);
        AppState.model.x = selectedPreset.x;
        AppState.model.y = selectedPreset.y;
        AppState.model.anchor.set(0.5, 0); // 顶部中心锚点
    }

    /**
     * 处理模型显示
     */
    handleModelDisplay() {
        if (AppState.model.internalModel) {
            console.log('模型内部结构加载完成');
            
            // 使用回调机制确保启动动画在GIF完全隐藏后才播放
            if (window.UIManager) {
                window.UIManager.hideLoadingGif(() => {
                    this.showModelWithAnimation();
                });
            } else {
                // 如果UIManager不可用，直接显示模型
                this.showModelWithAnimation();
            }
        } else {
            console.warn('模型内部结构未加载');
        }
    }

    /**
     * 显示模型并播放动画
     */
    showModelWithAnimation() {
        console.log('GIF已完全隐藏，现在显示模型并开始播放启动动画');
        
        // 先显示canvas画布
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.opacity = '1';
        }
        
        // 显示模型（添加渐入效果）
        AppState.model.visible = true;
        AppState.model.alpha = 0; // 从透明开始
        
        // 模型渐入效果
        const fadeInModel = () => {
            if (AppState.model.alpha < 1) {
                AppState.model.alpha += AppConfig.modelFadeInSpeed;
                requestAnimationFrame(fadeInModel);
            } else {
                AppState.model.alpha = 1;
                // 模型完全显示后播放启动动画
                if (window.AnimationController) {
                    window.AnimationController.playStartupAnimation();
                }
            }
        };
        fadeInModel();
        
        // 启动动画播放3秒后开始待机动画
        setTimeout(() => {
            if (window.AnimationController) {
                window.AnimationController.playIdleAnimation();
            }
        }, 3000);
    }

    /**
     * 强制设置透明背景
     */
    setupTransparentBackground() {
        document.body.style.background = 'transparent';
        document.body.style.backgroundColor = 'transparent';
        document.documentElement.style.background = 'transparent';
        document.documentElement.style.backgroundColor = 'transparent';
    }

    /**
     * 初始化画布显示设置
     */
    setupCanvasDisplay() {
        // 初始隐藏canvas画布，等GIF播放完毕后再显示
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.opacity = '0';
            canvas.style.transition = 'opacity 0.5s ease-in';
        }
    }

    /**
     * 清理模型资源
     */
    cleanup() {
        if (AppState.model) {
            if (AppState.stage && AppState.model.parent) {
                AppState.stage.removeChild(AppState.model);
            }
            AppState.model.destroy();
            AppState.model = null;
        }
        
        if (AppState.app) {
            AppState.app.destroy();
            AppState.app = null;
        }
        
        AppState.stage = null;
        AppState.isModelLoaded = false;
        
        console.log('Live2D模型资源已清理');
    }
}

// 创建全局 Live2D 管理器实例
const live2DManager = new Live2DManager();

// 暴露到全局作用域
window.Live2DManager = live2DManager;

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Live2DManager;
}

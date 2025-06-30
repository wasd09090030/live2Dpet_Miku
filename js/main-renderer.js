/**
 * 主渲染器 - 应用入口和协调各个模块
 */

class MainRenderer {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('开始初始化Live2D应用...');
            
            // 显示随机加载GIF动画
            if (window.UIManager) {
                window.UIManager.showLoadingGif();
            }
            
            // 强制设置透明背景
            window.Live2DManager.setupTransparentBackground();
            
            document.getElementById('loading').textContent = '正在初始化...';
            this.updateStatusBar('⏳ 初始化应用...');
            
            // 等待Live2D Cubism Core加载
            await window.Live2DManager.waitForCubismCore();
            
            // 初始化PIXI应用
            document.getElementById('loading').textContent = '正在初始化PIXI应用...';
            window.Live2DManager.initPIXIApp();
            
            // 设置画布显示
            window.Live2DManager.setupCanvasDisplay();
            
            document.getElementById('loading').textContent = '正在加载Live2D模型...';
            
            // 加载Live2D模型
            await window.Live2DManager.loadModel();
            
            // 设置交互
            this.setupInteraction();
            
            // 隐藏加载提示
            document.getElementById('loading').style.display = 'none';
            
            console.log('Live2D应用初始化完成');
            this.updateStatusBar('🎉 应用就绪 - 右键菜单操作');
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('初始化失败:', error);
            this.handleInitError(error);
        }
    }

    /**
     * 处理初始化错误
     */
    handleInitError(error) {
        document.getElementById('loading').textContent = '加载失败: ' + error.message;
        document.getElementById('loading').style.color = '#ff0000';
        
        // 错误时也要隐藏GIF动画
        if (window.UIManager) {
            window.UIManager.hideLoadingGif();
        }
    }

    /**
     * 设置交互
     */
    setupInteraction() {
        if (window.InteractionManager) {
            window.InteractionManager.setupCanvasInteraction();
        }
    }

    /**
     * 更新状态栏（如果存在）
     */
    updateStatusBar(message) {
        const statusBar = document.getElementById('status-bar');
        if (statusBar) {
            statusBar.textContent = message;
        }
    }

    /**
     * 清理应用资源
     */
    cleanup() {
        console.log('开始清理应用资源...');
        
        // 清理各个模块
        if (window.Live2DManager) {
            window.Live2DManager.cleanup();
        }
        
        if (window.AnimationController) {
            window.AnimationController.cleanup();
        }
        
        if (window.InteractionManager) {
            window.InteractionManager.cleanup();
        }
        
        if (window.UIManager) {
            window.UIManager.cleanup();
        }
        
        if (window.DebugManager) {
            window.DebugManager.cleanup();
        }
        
        this.isInitialized = false;
        console.log('应用资源清理完成');
    }

    /**
     * 重新启动应用
     */
    async restart() {
        this.cleanup();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        await this.init();
    }

    /**
     * 获取应用状态
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            modelLoaded: AppState.isModelLoaded,
            pixiReady: !!AppState.app,
            modelReady: !!AppState.model
        };
    }
}

// 创建全局主渲染器实例
const mainRenderer = new MainRenderer();

// 暴露到全局作用域
window.MainRenderer = mainRenderer;

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，开始初始化应用...');
    mainRenderer.init().catch(error => {
        console.error('应用初始化失败:', error);
    });
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    mainRenderer.cleanup();
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainRenderer;
}

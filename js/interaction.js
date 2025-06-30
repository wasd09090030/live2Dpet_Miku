/**
 * 交互管理模块 - 处理鼠标穿透、交互区域检测和事件处理
 */

class InteractionManager {
    constructor() {
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.setupEventListeners();
    }

    /**
     * 设置鼠标穿透状态
     */
    setMouseTransparent(transparent) {
        if (AppState.lastTransparentState !== transparent) {
            AppState.lastTransparentState = transparent;
            const { ipcRenderer } = require('electron');
            ipcRenderer.invoke('set-mouse-transparent', transparent, { forward: true })
                .then(result => {
                    console.log(`鼠标穿透设置${transparent ? '启用' : '禁用'}:`, result);
                })
                .catch(error => {
                    console.error('设置鼠标穿透失败:', error);
                });
        }
    }

    /**
     * 检查鼠标是否在中心交互区域
     */
    isMouseInInteractionArea(clientX, clientY) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 计算中心区域边界（1/2 width * 1/2 height）
        const centerAreaWidth = windowWidth / 2;
        const centerAreaHeight = windowHeight / 2;
        const centerAreaLeft = (windowWidth - centerAreaWidth) / 2;
        const centerAreaTop = (windowHeight - centerAreaHeight) / 2;
        const centerAreaRight = centerAreaLeft + centerAreaWidth;
        const centerAreaBottom = 2 * centerAreaTop + centerAreaHeight;
        
        return clientX >= centerAreaLeft && 
               clientX <= centerAreaRight && 
               clientY >= centerAreaTop && 
               clientY <= centerAreaBottom;
    }

    /**
     * 处理鼠标位置检测的通用函数
     */
    handleMousePosition(x, y, source = '') {
        const now = Date.now();
        if (now - AppState.lastMouseCheckTime < AppConfig.mouseCheckThrottle) {
            return; // 节流，避免过于频繁的检测
        }
        AppState.lastMouseCheckTime = now;
        
        const isInCenter = this.isMouseInInteractionArea(x, y);
        
        if (isInCenter && !AppState.isMouseInCenter) {
            AppState.isMouseInCenter = true;
            console.log(`鼠标进入中心交互区域，禁用穿透 ${source}`);
            this.setMouseTransparent(false);
        } else if (!isInCenter && AppState.isMouseInCenter) {
            AppState.isMouseInCenter = false;
            console.log(`鼠标离开中心交互区域，启用穿透 ${source}`);
            this.setMouseTransparent(true);
        }
    }

    /**
     * 恢复鼠标跟踪（菜单关闭后调用）
     */
    resumeMouseTracking() {
        console.log('恢复鼠标穿透检测');
        // 强制重新检测当前鼠标位置
        AppState.lastMouseCheckTime = 0;
        // 如果需要，可以触发一次位置检测
    }

    /**
     * 模型点击事件处理
     */
    onModelClick(e) {
        console.log('模型被点击，播放随机动画');
        if (window.AnimationController) {
            window.AnimationController.playRandomMotion();
        }
    }

    /**
     * 模型指针按下事件
     */
    onModelPointerDown(e) {
        this.isDragging = true;
        this.dragOffset.x = e.clientX;
        this.dragOffset.y = e.clientY;
        console.log('开始拖拽模型');
    }

    /**
     * 模型指针移动事件
     */
    onModelPointerMove(e) {
        if (this.isDragging && AppState.model) {
            const deltaX = e.clientX - this.dragOffset.x;
            const deltaY = e.clientY - this.dragOffset.y;
            
            AppState.model.x += deltaX;
            AppState.model.y += deltaY;
            
            this.dragOffset.x = e.clientX;
            this.dragOffset.y = e.clientY;
        }
    }

    /**
     * 模型指针抬起事件
     */
    onModelPointerUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            console.log('结束拖拽模型');
        }
    }

    /**
     * 设置交互事件监听器
     */
    setupEventListeners() {
        const { ipcRenderer } = require('electron');
        
        // 接收主进程发送的全局鼠标位置
        ipcRenderer.on('global-mouse-move', (event, mouseData) => {
            this.handleMousePosition(mouseData.x, mouseData.y, '(全局检测)');
        });

        // 窗口尺寸变化处理 - 重要：这个监听器用于调整模型大小功能
        ipcRenderer.on('resize-model', (event, width, height) => {
            console.log(`接收到窗口尺寸变化: ${width}x${height}`);
            this.handleWindowResize(width, height);
        });

        // 保留原有的 mousemove 监听器作为备用
        document.addEventListener('mousemove', (e) => {
            this.handleMousePosition(e.clientX, e.clientY, '(焦点检测)');
        });
    }

    /**
     * 处理窗口尺寸变化
     */
    handleWindowResize(width, height) {
        console.log(`🔧 处理窗口尺寸变化: ${width}x${height}`);
        
        // 动态调整PIXI画布
        if (AppState.app && AppState.app.renderer) {
            AppState.app.renderer.resize(width, height);
            console.log(`✅ PIXI画布已调整至: ${width}x${height}`);
        } else {
            console.warn('⚠️ PIXI应用或渲染器不可用');
        }
        
        // 动态调整模型缩放和位置
        if (AppState.model) {
            let preset = sizePresets[width] || sizePresets[300];
            AppState.model.scale.set(preset.scale);
            AppState.model.x = preset.x;
            AppState.model.y = preset.y;
            AppState.model.anchor.set(0.5, 0);
            console.log(`✅ 模型已调整: 缩放=${preset.scale}, 位置=(${preset.x}, ${preset.y})`);
        } else {
            console.warn('⚠️ Live2D模型不可用');
        }
    }

    /**
     * 设置canvas交互事件
     */
    setupCanvasInteraction() {
        const canvas = document.getElementById('canvas');
        if (!canvas) return;

        // 鼠标事件
        canvas.addEventListener('mousedown', (e) => this.onModelPointerDown(e));
        canvas.addEventListener('mousemove', (e) => this.onModelPointerMove(e));
        canvas.addEventListener('mouseup', (e) => this.onModelPointerUp(e));
        canvas.addEventListener('click', (e) => this.onModelClick(e));

        // 触摸事件
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onModelPointerDown({ clientX: touch.clientX, clientY: touch.clientY });
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onModelPointerMove({ clientX: touch.clientX, clientY: touch.clientY });
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onModelPointerUp();
        });

        // 右键菜单
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (window.UIManager) {
                window.UIManager.showContextMenu(e.clientX, e.clientY);
            }
        });

        console.log('Canvas交互事件已设置');
    }

    /**
     * 清理交互资源
     */
    cleanup() {
        this.isDragging = false;
        AppState.isMouseInCenter = false;
        AppState.lastTransparentState = null;
        AppState.lastMouseCheckTime = 0;
    }
}

// 创建全局交互管理器实例
const interactionManager = new InteractionManager();

// 暴露到全局作用域
window.InteractionManager = interactionManager;

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractionManager;
}

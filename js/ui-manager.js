/**
 * UI管理模块 - 处理 Toast、菜单、加载界面等 UI 元素
 */

class UIManager {
    constructor() {
        this.activeToasts = new Set();
        this.loadingGifElement = null;
    }

    /**
     * 清除所有活动的Toast提示
     */
    clearActiveToasts() {
        this.activeToasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
        this.activeToasts.clear();
    }

    /**
     * 显示 Toast 提示
     */
    showToast(message, duration = 3000) {
        // 创建Toast元素
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            z-index: 2000;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-width: 80%;
        `;
        
        document.body.appendChild(toast);
        this.activeToasts.add(toast);
        
        // 淡入效果
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });
        
        // 自动移除
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.activeToasts.delete(toast);
            }, 300);
        }, duration);
    }

    /**
     * 显示右键菜单
     */
    showContextMenu(x, y) {
        // 显示菜单时禁用穿透
        console.log('显示右键菜单，禁用穿透');
        if (window.InteractionManager) {
            window.InteractionManager.setMouseTransparent(false);
        }
        
        // 移除现有菜单
        this.removeExistingMenu();
        
        // 计算菜单位置
        const menuWidth = 150;
        const menuX = x;
        const menuY = y;
        
        // 创建菜单
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
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
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            font-size: 13px;
            color: white !important;
            -webkit-app-region: no-drag;
            transform-origin: top left;
            animation: menuSlideInFromTopRight 0.2s ease-out;
        `;
        
        this.addMenuAnimationStyle();
        
        const menuItems = [
            { text: '📝 待办事项', action: () => window.todoList?.showTodoPanel() },
            { text: 'AI聊天', action: () => this.showChatBubble() },
            { text: '调整模型大小', action: () => this.showResizeSubMenu(x, y) },
            { text: '📌 切换置顶', action: () => this.toggleAlwaysOnTop() },
            { text: '➖ 最小化', action: () => require('electron').ipcRenderer.invoke('minimize-app') },
            { text: '❌ 关闭应用', action: () => require('electron').ipcRenderer.invoke('close-app') }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.text;
            menuItem.style.cssText = `
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
                    // 恢复鼠标穿透检测
                    if (window.InteractionManager) {
                        window.InteractionManager.resumeMouseTracking();
                    }
                }
            });
        }, 100);
    }

    /**
     * 显示调整模型大小的子菜单
     */
    showResizeSubMenu(x, y) {
        console.log('显示尺寸调整子菜单，禁用穿透');
        if (window.InteractionManager) {
            window.InteractionManager.setMouseTransparent(false);
        }
        
        this.removeExistingMenu();
        
        const subMenuWidth = 180;
        const subMenuX = x + 5;
        const subMenuY = y;
        
        const subMenu = document.createElement('div');
        subMenu.className = 'context-menu';
        subMenu.style.cssText = `
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
            font-size: 13px;
            color: white !important;
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
            item.style.cssText = `
                padding: 6px 16px;
                cursor: pointer;
                transition: background 0.2s;
            `;
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(100, 149, 237, 0.3)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            item.addEventListener('click', () => {
                // 修复：使用正确的IPC方法名
                require('electron').ipcRenderer.invoke('resize-app-window', size.w, size.h);
                subMenu.remove();
                console.log(`🔧 请求调整窗口大小到: ${size.w}x${size.h}`);
            });
            subMenu.appendChild(item);
        });
        
        document.body.appendChild(subMenu);
        
        setTimeout(() => {
            document.addEventListener('click', function closeSubMenu(e) {
                if (!subMenu.contains(e.target)) {
                    subMenu.remove();
                    document.removeEventListener('click', closeSubMenu);
                    if (window.InteractionManager) {
                        window.InteractionManager.resumeMouseTracking();
                    }
                }
            });
        }, 100);
    }

    /**
     * 切换置顶状态
     */
    async toggleAlwaysOnTop() {
        try {
            const result = await require('electron').ipcRenderer.invoke('toggle-always-on-top');
            const message = result.alwaysOnTop ? '📌 窗口已置顶' : '📌 窗口已取消置顶';
            this.showToast(message);
        } catch (error) {
            console.error('切换置顶状态失败:', error);
            this.showToast('❌ 操作失败');
        }
    }

    /**
     * 显示加载 GIF
     */
    showLoadingGif() {
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
        this.loadingGifElement = loadingGifContainer;
        
        return loadingGifContainer;
    }

    /**
     * 隐藏加载 GIF
     */
    hideLoadingGif(callback) {
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
                        if (typeof callback === 'function') {
                            callback();
                        }
                    }, 500);
                }
            }, remainingTime);
        } else {
            // 如果没有找到容器，直接执行回调
            if (typeof callback === 'function') {
                callback();
            }
        }
    }

    /**
     * 移除现有菜单
     */
    removeExistingMenu() {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    /**
     * 添加菜单动画样式
     */
    addMenuAnimationStyle() {
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
        }
    }

    /**
     * 清理资源
     */
    /**
     * 显示聊天气泡
     */
    showChatBubble() {
        console.log('打开聊天气泡');
        // 确保鼠标不穿透
        if (window.InteractionManager) {
            window.InteractionManager.setMouseTransparent(false);
        }
        
        // 移除现有菜单
        this.removeExistingMenu();
        
        // 显示聊天界面
        if (window.ChatBubble) {
            window.ChatBubble.showChat();
        } else {
            console.error('ChatBubble模块未加载');
            this.showToast('聊天功能暂不可用');
        }
    }

    cleanup() {
        // 清理所有 Toast
        this.activeToasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
        this.activeToasts.clear();
        
        // 清理菜单
        this.removeExistingMenu();
    }
}

// 创建全局 UI 管理器实例
const uiManager = new UIManager();

// 暴露到全局作用域
window.UIManager = uiManager;
window.showToast = (message, duration) => uiManager.showToast(message, duration);

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}

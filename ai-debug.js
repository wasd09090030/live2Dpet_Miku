/**
 * AI 聊天调试工具
 * 用于测试和调试 AI 聊天功能
 */

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initDebugTool, 2000);
});

function initDebugTool() {
    if (!window.AIChat) {
        console.warn('AIChat模块未加载，调试工具无法初始化');
        return;
    }

    console.log('初始化AI聊天调试工具...');

    // 创建调试按钮
    const debugButton = document.createElement('button');
    debugButton.textContent = '🛠️ AI调试';
    debugButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        padding: 5px 10px;
        font-size: 12px;
        cursor: pointer;
        z-index: 9999;
        transition: background 0.2s;
    `;
    
    debugButton.addEventListener('mouseenter', () => {
        debugButton.style.background = 'rgba(50, 50, 50, 0.8)';
    });
    
    debugButton.addEventListener('mouseleave', () => {
        debugButton.style.background = 'rgba(0, 0, 0, 0.6)';
    });
    
    debugButton.addEventListener('click', () => {
        toggleDebugPanel();
    });
    
    document.body.appendChild(debugButton);
    
    // 创建调试面板
    let debugPanel = null;
    
    function toggleDebugPanel() {
        if (debugPanel) {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
            return;
        }
        
        debugPanel = document.createElement('div');
        debugPanel.style.cssText = `
            position: fixed;
            top: 40px;
            right: 10px;
            width: 300px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 10px;
            font-size: 12px;
            z-index: 9998;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        const title = document.createElement('div');
        title.textContent = 'AI聊天调试面板';
        title.style.cssText = `
            font-weight: bold;
            padding-bottom: 5px;
            margin-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        // 配置状态
        const configStatus = document.createElement('div');
        configStatus.style.marginBottom = '10px';
        updateConfigStatus();
        
        // 刷新配置按钮
        const refreshButton = document.createElement('button');
        refreshButton.textContent = '刷新配置';
        refreshButton.style.cssText = `
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 5px 10px;
            margin-right: 5px;
            cursor: pointer;
        `;
        refreshButton.addEventListener('click', async () => {
            try {
                await window.AIChat.loadConfig();
                updateConfigStatus();
                addLogMessage('✅ 配置刷新成功');
            } catch (error) {
                addLogMessage(`❌ 配置刷新失败: ${error.message}`);
            }
        });
        
        // 测试API按钮
        const testButton = document.createElement('button');
        testButton.textContent = '测试API';
        testButton.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 5px 10px;
            cursor: pointer;
        `;
        testButton.addEventListener('click', () => {
            addLogMessage('🔄 发送测试请求...');
            window.AIChat.sendMessage('你好，这是一条测试消息', (response) => {
                addLogMessage(`✅ 收到回复: ${response.length > 50 ? response.substring(0, 50) + '...' : response}`);
            });
        });
        
        // 按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            margin-bottom: 10px;
        `;
        buttonContainer.appendChild(refreshButton);
        buttonContainer.appendChild(testButton);
        
        // 日志区域
        const logArea = document.createElement('div');
        logArea.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            padding: 5px;
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            margin-top: 10px;
        `;
        
        // 组装面板
        debugPanel.appendChild(title);
        debugPanel.appendChild(configStatus);
        debugPanel.appendChild(buttonContainer);
        debugPanel.appendChild(logArea);
        document.body.appendChild(debugPanel);
        
        // 辅助函数：更新配置状态
        function updateConfigStatus() {
            configStatus.innerHTML = '';
            
            const aiChat = window.AIChat;
            const config = aiChat.config;
            
            if (!config) {
                configStatus.innerHTML = '<span style="color: #ff5252;">⚠️ 配置未加载</span>';
                return;
            }
            
            const statusHtml = `
                <div>📝 配置状态: <span style="color: #4CAF50;">已加载</span></div>
                <div>🔌 API端点: ${config.api?.endpoint || '<未设置>'}</div>
                <div>🔑 API密钥: ${config.api?.key ? (config.api.key === 'your_deepseek_api_key_here' ? '<使用默认值>' : '***' + config.api.key.substr(-4)) : '<未设置>'}</div>
                <div>🤖 模型: ${config.api?.model || '<未设置>'}</div>
                <div>👤 角色: ${config.character?.name || '<未设置>'}</div>
            `;
            
            configStatus.innerHTML = statusHtml;
        }
        
        // 辅助函数：添加日志消息
        function addLogMessage(message) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.innerHTML = `<span style="color: #888;">[${timestamp}]</span> ${message}`;
            logArea.appendChild(logEntry);
            logArea.scrollTop = logArea.scrollHeight;
        }
        
        addLogMessage('🔧 调试面板已初始化');
    }

    console.log('AI聊天调试工具初始化完成');
}

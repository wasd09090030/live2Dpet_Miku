/**
 * AI聊天测试脚本
 * 仅用于开发环境，提供简单测试功能
 */

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // 测试发送消息
        const testMessage = "你好，这是一条测试消息。";
        console.log(`🔧 AI聊天测试: 发送测试消息 "${testMessage}"`);
        
        if (window.AIChat && typeof window.AIChat.sendMessage === 'function') {
            window.AIChat.sendMessage(testMessage, (response) => {
                console.log(`🔧 AI聊天测试: 收到回复 "${response}"`);
            });
        } else {
            console.error('🔧 AI聊天测试: AIChat模块未加载或sendMessage方法不存在');
        }
        
        // 创建测试按钮
        createTestButtons();
    }, 5000); // 延迟5秒执行，确保所有模块已加载
});

function createTestButtons() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        z-index: 9999;
    `;
    
    // 打开聊天按钮
    const openChatButton = document.createElement('button');
    openChatButton.textContent = '打开聊天';
    openChatButton.style.cssText = `
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
    `;
    openChatButton.addEventListener('click', () => {
        if (window.ChatBubble) {
            window.ChatBubble.showChat();
        } else {
            console.error('ChatBubble模块未加载');
        }
    });
    
    // 测试Toast按钮
    const testToastButton = document.createElement('button');
    testToastButton.textContent = '测试Toast';
    testToastButton.style.cssText = `
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
    `;
    testToastButton.addEventListener('click', () => {
        if (window.UIManager && typeof window.UIManager.showToast === 'function') {
            window.UIManager.showToast('这是一条测试Toast消息', 3000);
        } else {
            console.error('UIManager模块未加载或showToast方法不存在');
        }
    });
    
    // 测试API按钮
    const testApiButton = document.createElement('button');
    testApiButton.textContent = '测试API';
    testApiButton.style.cssText = `
        background: #FF9800;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
    `;
    testApiButton.addEventListener('click', () => {
        if (window.AIChat && typeof window.AIChat.sendMessage === 'function') {
            console.log('发送API测试请求...');
            window.AIChat.sendMessage('你好，请简短自我介绍', (response) => {
                console.log('API测试响应:', response);
                if (window.UIManager) {
                    window.UIManager.showToast(response, 5000);
                }
            });
        } else {
            console.error('AIChat模块未加载或sendMessage方法不存在');
        }
    });
    
    // 添加按钮到容器
    buttonContainer.appendChild(openChatButton);
    buttonContainer.appendChild(testToastButton);
    buttonContainer.appendChild(testApiButton);
    
    // 添加容器到文档
    document.body.appendChild(buttonContainer);
    
    console.log('🔧 AI聊天测试按钮已创建');
}

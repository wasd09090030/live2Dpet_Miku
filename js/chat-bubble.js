/**
 * 聊天气泡组件 - 显示AI聊天对话界面
 */

class ChatBubble {
    constructor() {
        this.chatContainer = null;
        this.inputContainer = null;
        this.chatHistory = [];
        this.isVisible = false;
        this.isProcessing = false;
        this.typingTimeout = null;
    }

    /**
     * 创建聊天界面
     */
    createChatInterface() {
        // 如果已经存在聊天界面，则显示它
        if (this.chatContainer) {
            this.showChat();
            return;
        }

        // 创建聊天容器
        this.chatContainer = document.createElement('div');
        this.chatContainer.id = 'chat-container';
        this.chatContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 280px;
            max-height: 320px;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 10px;
            display: flex;
            flex-direction: column;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transition: opacity 0.3s;
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            color: white;
            -webkit-app-region: no-drag;
        `;

        // 创建关闭按钮
        const closeButton = document.createElement('div');
        closeButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba(255, 100, 100, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            color: white;
            transition: background 0.2s;
        `;
        closeButton.textContent = '×';
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = 'rgba(255, 60, 60, 0.9)';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'rgba(255, 100, 100, 0.7)';
        });
        closeButton.addEventListener('click', () => {
            this.hideChat();
        });

        // 创建标题
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            margin-bottom: 10px;
            text-align: center;
            font-weight: bold;
            padding: 5px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        `;
        titleBar.textContent = '与 Miku 聊天';

        // 创建聊天内容区域
        const chatContent = document.createElement('div');
        chatContent.className = 'chat-content';
        chatContent.style.cssText = `
            flex-grow: 1;
            overflow-y: auto;
            padding: 5px;
            margin-bottom: 10px;
            max-height: 180px;
            scroll-behavior: smooth;
        `;

        // 设置滚动条样式
        const style = document.createElement('style');
        style.textContent = `
            .chat-content::-webkit-scrollbar {
                width: 5px;
            }
            .chat-content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 5px;
            }
            .chat-content::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 5px;
            }
            .chat-content::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
            }
        `;
        document.head.appendChild(style);

        // 创建输入区域
        this.inputContainer = document.createElement('div');
        this.inputContainer.style.cssText = `
            display: flex;
            margin-top: 5px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 10px;
        `;

        // 创建输入框
        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.placeholder = '输入消息...';
        inputField.style.cssText = `
            flex-grow: 1;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 15px;
            padding: 5px 10px;
            color: white;
            outline: none;
            margin-right: 5px;
        `;
        inputField.addEventListener('focus', () => {
            inputField.style.background = 'rgba(255, 255, 255, 0.25)';
        });
        inputField.addEventListener('blur', () => {
            inputField.style.background = 'rgba(255, 255, 255, 0.15)';
        });
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // 创建发送按钮
        const sendButton = document.createElement('button');
        sendButton.textContent = '发送';
        sendButton.style.cssText = `
            background: rgba(100, 149, 237, 0.7);
            border: none;
            border-radius: 15px;
            padding: 5px 12px;
            color: white;
            cursor: pointer;
            transition: background 0.2s;
        `;
        sendButton.addEventListener('mouseenter', () => {
            sendButton.style.background = 'rgba(100, 149, 237, 0.9)';
        });
        sendButton.addEventListener('mouseleave', () => {
            sendButton.style.background = 'rgba(100, 149, 237, 0.7)';
        });
        sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // 组装界面
        this.inputContainer.appendChild(inputField);
        this.inputContainer.appendChild(sendButton);
        this.chatContainer.appendChild(closeButton);
        this.chatContainer.appendChild(titleBar);
        this.chatContainer.appendChild(chatContent);
        this.chatContainer.appendChild(this.inputContainer);
        document.body.appendChild(this.chatContainer);

        // 淡入显示
        requestAnimationFrame(() => {
            this.chatContainer.style.opacity = '1';
        });

        // 自动聚焦输入框
        setTimeout(() => {
            inputField.focus();
        }, 300);

        // 显示欢迎消息
        this.addBotMessage("你好呀~我是Miku！今天想和我聊些什么呢？");
    }

    /**
     * 显示聊天界面
     */
    showChat() {
        if (!this.chatContainer) {
            this.createChatInterface();
            return;
        }

        this.isVisible = true;
        this.chatContainer.style.display = 'flex';
        requestAnimationFrame(() => {
            this.chatContainer.style.opacity = '1';
        });

        // 自动聚焦输入框
        const inputField = this.inputContainer.querySelector('input');
        if (inputField) {
            setTimeout(() => {
                inputField.focus();
            }, 300);
        }
    }

    /**
     * 隐藏聊天界面
     */
    hideChat() {
        if (!this.chatContainer) return;

        this.isVisible = false;
        this.chatContainer.style.opacity = '0';
        setTimeout(() => {
            this.chatContainer.style.display = 'none';
        }, 300);
    }

    /**
     * 发送消息
     */
    sendMessage() {
        if (this.isProcessing) return;

        const inputField = this.inputContainer.querySelector('input');
        const message = inputField.value.trim();

        if (message) {
            // 添加用户消息到聊天
            this.addUserMessage(message);
            inputField.value = '';

            // 显示处理中状态
            this.isProcessing = true;
            this.showTypingIndicator();

            // 发送到AI聊天处理
            if (window.AIChat) {
                window.AIChat.sendMessage(message, (response) => {
                    // 移除处理中指示器
                    this.removeTypingIndicator();
                    
                    // 添加机器人回复
                    this.addBotMessage(response);
                    this.isProcessing = false;
                });
            } else {
                // 如果AIChat不可用，显示错误
                setTimeout(() => {
                    this.removeTypingIndicator();
                    this.addBotMessage("抱歉，聊天功能暂不可用，请检查AI配置。");
                    this.isProcessing = false;
                }, 1000);
            }
        }
    }

    /**
     * 添加用户消息到聊天
     */
    addUserMessage(message) {
        const chatContent = this.chatContainer.querySelector('.chat-content');
        const messageElement = document.createElement('div');
        messageElement.className = 'user-message';
        messageElement.style.cssText = `
            text-align: right;
            margin: 5px 0;
            padding: 5px 10px;
            background: rgba(100, 149, 237, 0.3);
            border-radius: 10px;
            border-bottom-right-radius: 2px;
            word-wrap: break-word;
            animation: fadeIn 0.3s;
        `;
        messageElement.textContent = message;
        chatContent.appendChild(messageElement);
        chatContent.scrollTop = chatContent.scrollHeight;

        // 添加到历史记录
        this.chatHistory.push({ role: 'user', content: message });
    }

    /**
     * 添加机器人消息到聊天
     */
    addBotMessage(message) {
        const chatContent = this.chatContainer.querySelector('.chat-content');
        const messageElement = document.createElement('div');
        messageElement.className = 'bot-message';
        messageElement.style.cssText = `
            text-align: left;
            margin: 5px 0;
            padding: 5px 10px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            border-bottom-left-radius: 2px;
            word-wrap: break-word;
            animation: fadeIn 0.3s;
        `;
        messageElement.textContent = message;
        chatContent.appendChild(messageElement);
        chatContent.scrollTop = chatContent.scrollHeight;

        // 添加到历史记录
        this.chatHistory.push({ role: 'assistant', content: message });
        
        // 在模型头顶上方显示回复内容的Toast
        if (window.UIManager) {
            window.UIManager.showToast(message, 5000);
        }
    }

    /**
     * 显示正在输入指示器
     */
    showTypingIndicator() {
        const chatContent = this.chatContainer.querySelector('.chat-content');
        
        // 移除现有的输入指示器
        this.removeTypingIndicator();
        
        // 创建新的输入指示器
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.style.cssText = `
            text-align: left;
            margin: 5px 0;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            border-bottom-left-radius: 2px;
            display: inline-block;
        `;
        
        // 创建动画点
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.style.cssText = `
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 3px;
                background: rgba(255, 255, 255, 0.7);
                animation: typingAnimation 1s infinite;
                animation-delay: ${i * 0.3}s;
            `;
            indicator.appendChild(dot);
        }
        
        // 添加动画样式
        if (!document.getElementById('typing-animation-style')) {
            const style = document.createElement('style');
            style.id = 'typing-animation-style';
            style.textContent = `
                @keyframes typingAnimation {
                    0% { transform: translateY(0px); opacity: 0.5; }
                    50% { transform: translateY(-5px); opacity: 1; }
                    100% { transform: translateY(0px); opacity: 0.5; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        chatContent.appendChild(indicator);
        chatContent.scrollTop = chatContent.scrollHeight;
    }

    /**
     * 移除正在输入指示器
     */
    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.chatContainer && this.chatContainer.parentNode) {
            this.chatContainer.parentNode.removeChild(this.chatContainer);
        }
        
        this.chatContainer = null;
        this.inputContainer = null;
        this.isVisible = false;
        this.isProcessing = false;
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
    }
}

// 创建全局实例
const chatBubble = new ChatBubble();

// 暴露到全局作用域
window.ChatBubble = chatBubble;

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatBubble;
}

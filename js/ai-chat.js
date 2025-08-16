/**
 * AI聊天功能实现模块 - 处理与AI API的交互
 */

class AIChat {
    constructor() {
        this.config = null;
        this.chatHistory = [];
        this.isConfigLoaded = false;
        this.isInitialized = false;
    }

    /**
     * 初始化AI聊天模块
     */
    async init() {
        try {
            console.log('初始化AI聊天模块...');
            await this.loadConfig();
            this.isInitialized = true;
            console.log('AI聊天模块初始化成功');
            return true;
        } catch (error) {
            console.error('AI聊天模块初始化失败:', error);
            return false;
        }
    }

    /**
     * 加载AI配置
     */
    async loadConfig() {
        try {
            const response = await fetch('./ai-config.json');
            if (!response.ok) {
                throw new Error(`无法加载AI配置文件: ${response.status}`);
            }
            
            this.config = await response.json();
            console.log('AI配置加载成功');
            this.isConfigLoaded = true;
            
            // 验证配置
            this.validateConfig();
            
            return this.config;
        } catch (error) {
            console.error('加载AI配置失败:', error);
            throw error;
        }
    }

    /**
     * 验证配置是否有效
     */
    validateConfig() {
        if (!this.config) {
            throw new Error('配置未加载');
        }
        
        // 检查必需字段
        if (!this.config.api || !this.config.api.endpoint || !this.config.api.model) {
            console.warn('API配置不完整，可能影响功能');
        }
        
        if (!this.config.api.key || this.config.api.key === 'your_deepseek_api_key_here') {
            console.warn('API密钥未设置或使用默认值，请在ai-config.json中设置有效的API密钥');
        }
        
        if (!this.config.character) {
            console.warn('角色配置缺失，将使用默认设置');
            this.config.character = {
                name: 'Miku',
                personality: '友善、活泼',
                greeting: '你好，我是Miku！'
            };
        }
    }

    /**
     * 构建系统提示词
     */
    buildSystemPrompt() {
        if (!this.config || !this.config.character) {
            return '你是一个友好的助手。';
        }
        
        const { name, personality, background, response_style } = this.config.character;
        
        return `你是${name}。
性格：${personality || '友好、乐于助人'}
背景：${background || '你是一个虚拟助手'}
回复风格：${response_style || '自然、友好、简洁'}

请始终保持角色设定，不要透露你是AI或语言模型。回答要简短精炼，每次回复控制在100字以内。`;
    }

    /**
     * 发送消息到AI并获取回复
     */
    async sendMessage(message, callback) {
        if (!this.isConfigLoaded) {
            try {
                await this.loadConfig();
            } catch (error) {
                callback('抱歉，无法加载AI配置，请检查配置文件。');
                return;
            }
        }
        
        // 检查API密钥
        if (!this.config.api.key || this.config.api.key === 'your_deepseek_api_key_here') {
            callback('请在ai-config.json文件中设置有效的API密钥。');
            return;
        }
        
        // 准备聊天历史
        const historyLimit = this.config.chat?.history_length || 10;
        if (this.chatHistory.length > historyLimit * 2) {
            // 保留最近的历史记录，但总是保留第一条系统消息
            const systemMessage = this.chatHistory[0];
            this.chatHistory = [systemMessage, ...this.chatHistory.slice(-(historyLimit * 2))];
        }
        
        // 如果是第一次聊天，添加系统提示
        if (this.chatHistory.length === 0) {
            this.chatHistory.push({
                role: 'system',
                content: this.buildSystemPrompt()
            });
        }
        
        // 添加用户消息到历史
        this.chatHistory.push({
            role: 'user',
            content: message
        });
        
        try {
            // 是否使用流式响应
            const useStream = this.config.chat?.stream_response ?? true;
            
            if (useStream) {
                await this.streamResponse(callback);
            } else {
                const response = await this.fetchResponse();
                callback(response);
            }
        } catch (error) {
            console.error('AI聊天请求失败:', error);
            callback(`抱歉，我现在无法回应。(错误: ${error.message || '未知错误'})`);
        }
    }

    /**
     * 获取AI回复（非流式）
     */
    async fetchResponse() {
        const { endpoint, key, model, temperature, max_tokens } = this.config.api;
        
        const response = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: model,
                messages: this.chatHistory,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 1000
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API请求失败: ${response.status} - ${error}`);
        }
        
        const data = await response.json();
        const reply = data.choices[0]?.message?.content || '抱歉，我现在无法回应。';
        
        // 添加到聊天历史
        this.chatHistory.push({
            role: 'assistant',
            content: reply
        });
        
        return reply;
    }

    /**
     * 处理流式响应
     */
    async streamResponse(callback) {
        const { endpoint, key, model, temperature, max_tokens } = this.config.api;
        
        try {
            const response = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: this.chatHistory,
                    temperature: temperature || 0.7,
                    max_tokens: max_tokens || 1000,
                    stream: true
                })
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`API请求失败: ${response.status} - ${error}`);
            }
            
            // 读取流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let isFirstChunk = true;
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        
                        // 处理流结束标记
                        if (jsonStr === '[DONE]') continue;
                        
                        try {
                            const jsonData = JSON.parse(jsonStr);
                            const content = jsonData.choices[0]?.delta?.content || '';
                            
                            if (content) {
                                fullResponse += content;
                                
                                // 仅在重要节点更新，减少Toast闪烁
                                // 第一段时调用回调
                                if (isFirstChunk) {
                                    isFirstChunk = false;
                                    // 累积一点内容后再显示
                                    if (fullResponse.length > 5) {
                                        callback(fullResponse);
                                    }
                                } 
                                // 只在句子结束时才更新，避免频繁刷新
                                else if (content.match(/[.。!！?？;；]$/)) {
                                    callback(fullResponse);
                                }
                                // 或者积累了足够多的新内容才更新
                                else if (fullResponse.length % 30 === 0) {
                                    callback(fullResponse);
                                }
                            }
                        } catch (e) {
                            console.error('解析流数据错误:', e, jsonStr);
                        }
                    }
                }
            }
            
            // 完成时确保返回完整响应
            if (fullResponse) {
                callback(fullResponse);
                
                // 添加到聊天历史
                this.chatHistory.push({
                    role: 'assistant',
                    content: fullResponse
                });
            }
            
        } catch (error) {
            console.error('流式响应处理错误:', error);
            callback(`抱歉，我现在无法回应。(错误: ${error.message || '未知错误'})`);
        }
    }

    /**
     * 清空聊天历史
     */
    clearHistory() {
        // 保留系统提示
        const systemPrompt = this.chatHistory.find(msg => msg.role === 'system');
        this.chatHistory = systemPrompt ? [systemPrompt] : [];
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.chatHistory = [];
        console.log('AI聊天资源已清理');
    }
}

// 创建全局AI聊天实例
const aiChat = new AIChat();

// 异步初始化
(async () => {
    try {
        await aiChat.init();
    } catch (error) {
        console.error('AI聊天初始化失败:', error);
    }
})();

// 暴露到全局作用域
window.AIChat = aiChat;

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChat;
}

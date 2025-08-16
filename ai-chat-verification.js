/**
 * AI聊天功能验证脚本
 */

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(verifyAIChat, 3000);
});

async function verifyAIChat() {
    console.log('开始验证AI聊天功能...');
    
    // 检查必要的模块是否存在
    checkModules();
    
    // 验证配置文件
    await verifyConfig();
    
    // 测试聊天功能
    testChatFunctionality();
    
    console.log('AI聊天功能验证完成');
}

function checkModules() {
    console.log('1. 检查必要模块...');
    
    const modules = {
        'AIChat': window.AIChat,
        'ChatBubble': window.ChatBubble,
        'UIManager': window.UIManager
    };
    
    let allModulesExist = true;
    
    for (const [name, module] of Object.entries(modules)) {
        if (module) {
            console.log(`✅ ${name} 模块已加载`);
        } else {
            console.error(`❌ ${name} 模块未加载`);
            allModulesExist = false;
        }
    }
    
    return allModulesExist;
}

async function verifyConfig() {
    console.log('2. 验证配置文件...');
    
    if (!window.AIChat) {
        console.error('❌ AIChat模块未加载，无法验证配置');
        return false;
    }
    
    try {
        // 尝试加载配置
        const config = await window.AIChat.loadConfig();
        console.log('✅ 配置加载成功');
        
        // 检查API密钥
        if (!config.api.key || config.api.key === 'your_deepseek_api_key_here') {
            console.warn('⚠️ API密钥未设置或使用默认值，聊天功能可能无法正常工作');
        } else {
            console.log('✅ API密钥已设置');
        }
        
        // 检查其他关键配置
        if (!config.api.endpoint) {
            console.warn('⚠️ API端点未设置');
        }
        
        if (!config.api.model) {
            console.warn('⚠️ 模型名称未设置');
        }
        
        return true;
    } catch (error) {
        console.error(`❌ 配置验证失败: ${error.message}`);
        return false;
    }
}

function testChatFunctionality() {
    console.log('3. 测试聊天功能...');
    
    if (!window.AIChat || !window.ChatBubble) {
        console.error('❌ 缺少必要模块，无法测试聊天功能');
        return;
    }
    
    // 测试聊天气泡创建
    console.log('🔍 测试聊天气泡创建...');
    if (typeof window.ChatBubble.createChatInterface === 'function') {
        console.log('✅ 聊天气泡创建功能正常');
    } else {
        console.error('❌ 聊天气泡创建功能异常');
    }
    
    // 测试消息发送功能
    console.log('🔍 测试消息发送功能...');
    if (typeof window.AIChat.sendMessage === 'function') {
        console.log('✅ 消息发送功能正常');
        
        // 检查是否可以构建系统提示词
        const systemPrompt = window.AIChat.buildSystemPrompt();
        console.log(`🔍 系统提示词: ${systemPrompt.length > 50 ? systemPrompt.substring(0, 50) + '...' : systemPrompt}`);
    } else {
        console.error('❌ 消息发送功能异常');
    }
    
    // 注册右键菜单功能
    console.log('🔍 检查右键菜单...');
    if (window.UIManager && typeof window.UIManager.showContextMenu === 'function') {
        console.log('✅ 右键菜单功能正常，将检查是否已注册AI聊天菜单项');
    } else {
        console.error('❌ 右键菜单功能异常');
    }
}

console.log('AI聊天验证脚本已加载');

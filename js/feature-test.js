/**
 * 功能验证测试脚本
 * 专门测试GIF动画和模型尺寸调整功能
 */

function testGifFunctionality() {
    console.log('=== 测试GIF动画功能 ===');
    
    if (window.UIManager && typeof window.UIManager.showLoadingGif === 'function') {
        console.log('✅ showLoadingGif 方法存在');
        
        // 测试显示GIF
        try {
            window.UIManager.showLoadingGif();
            console.log('✅ GIF显示功能调用成功');
            
            // 3秒后隐藏GIF
            setTimeout(() => {
                window.UIManager.hideLoadingGif(() => {
                    console.log('✅ GIF隐藏功能调用成功');
                });
            }, 3000);
            
        } catch (error) {
            console.error('❌ GIF功能测试失败:', error);
        }
    } else {
        console.error('❌ showLoadingGif 方法不存在');
    }
}

function testResizeFunctionality() {
    console.log('=== 测试模型尺寸调整功能 ===');
    
    if (window.InteractionManager && typeof window.InteractionManager.handleWindowResize === 'function') {
        console.log('✅ handleWindowResize 方法存在');
        
        // 检查是否有IPC监听器设置
        const { ipcRenderer } = require('electron');
        console.log('✅ Electron IPC可用');
        
        // 模拟尺寸变化测试
        try {
            console.log('📏 模拟测试窗口尺寸调整到 400x500');
            window.InteractionManager.handleWindowResize(400, 500);
            
            setTimeout(() => {
                console.log('📏 模拟测试窗口尺寸调整到 500x600');
                window.InteractionManager.handleWindowResize(500, 600);
            }, 2000);
            
        } catch (error) {
            console.error('❌ 尺寸调整功能测试失败:', error);
        }
    } else {
        console.error('❌ handleWindowResize 方法不存在');
    }
}

function testContextMenu() {
    console.log('=== 测试右键菜单功能 ===');
    
    if (window.UIManager && typeof window.UIManager.showContextMenu === 'function') {
        console.log('✅ showContextMenu 方法存在');
        
        if (typeof window.UIManager.showResizeSubMenu === 'function') {
            console.log('✅ showResizeSubMenu 方法存在');
        } else {
            console.error('❌ showResizeSubMenu 方法不存在');
        }
    } else {
        console.error('❌ showContextMenu 方法不存在');
    }
}

function checkMissingFeatures() {
    console.log('=== 检查缺失功能状态 ===');
    
    const issues = [];
    
    // 检查GIF相关
    if (!window.UIManager || typeof window.UIManager.showLoadingGif !== 'function') {
        issues.push('GIF显示功能缺失');
    }
    
    if (!window.UIManager || typeof window.UIManager.hideLoadingGif !== 'function') {
        issues.push('GIF隐藏功能缺失');
    }
    
    // 检查尺寸调整相关
    if (!window.InteractionManager || typeof window.InteractionManager.handleWindowResize !== 'function') {
        issues.push('窗口尺寸调整处理功能缺失');
    }
    
    // 检查右键菜单
    if (!window.UIManager || typeof window.UIManager.showResizeSubMenu !== 'function') {
        issues.push('尺寸调整子菜单功能缺失');
    }
    
    if (issues.length === 0) {
        console.log('🎉 所有功能检查通过！');
        return true;
    } else {
        console.log('⚠️ 发现以下问题:');
        issues.forEach(issue => console.log(`  - ${issue}`));
        return false;
    }
}

// 综合测试函数
function runFeatureTests() {
    console.log('🧪 开始功能恢复验证测试...\n');
    
    const hasAllFeatures = checkMissingFeatures();
    
    if (hasAllFeatures) {
        console.log('\n📋 开始功能测试...');
        testGifFunctionality();
        
        setTimeout(() => {
            testResizeFunctionality();
        }, 1000);
        
        setTimeout(() => {
            testContextMenu();
        }, 2000);
        
        console.log('\n✅ 所有测试已启动，请观察控制台输出和界面效果');
    } else {
        console.log('\n❌ 功能检查失败，请检查模块加载情况');
    }
}

// 暴露测试函数
window.testGif = testGifFunctionality;
window.testResize = testResizeFunctionality;
window.testContextMenu = testContextMenu;
window.runFeatureTests = runFeatureTests;

// 页面加载完成后延迟自动测试
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🔧 自动运行功能恢复验证...');
        runFeatureTests();
    }, 8000); // 8秒后自动测试，确保应用完全初始化
});

console.log('功能验证测试脚本已加载');
console.log('手动测试命令:');
console.log('  - testGif() - 测试GIF功能');
console.log('  - testResize() - 测试尺寸调整功能');
console.log('  - runFeatureTests() - 运行全部测试');

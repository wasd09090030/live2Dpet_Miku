// 测试脚本 - 在浏览器控制台中运行

// 测试1: 检查Live2D Core是否加载
console.log('Live2D Core状态:', !!window.Live2DCubismCore);

// 测试2: 检查PIXI是否加载
console.log('PIXI状态:', !!window.PIXI);

// 测试3: 检查模型是否加载
console.log('模型加载状态:', !!window.model);

// 测试4: 检查应用状态
console.log('应用状态:', !!window.app);

// 测试5: 手动播放动画（如果模型已加载）
if (window.model && typeof window.playRandomMotion === 'function') {
    console.log('播放测试动画...');
    window.playRandomMotion();
}

// 测试6: 检查可用的动画列表
if (window.model && window.model.internalModel) {
    try {
        const motionGroups = window.model.internalModel.motionManager.motionGroups;
        console.log('可用动画组:', Object.keys(motionGroups));
    } catch (e) {
        console.log('无法获取动画组信息:', e.message);
    }
}

/**
 * 配置文件 - 全局配置和常量定义
 */

// 尺寸预设配置
const sizePresets = {
    300: { w: 300, h: 400, scale: 0.08, x: 150, y: 50 },
    400: { w: 400, h: 500, scale: 0.1, x: 200, y: 60 },
    500: { w: 500, h: 600, scale: 0.12, x: 250, y: 70 }
};

// 全局状态变量
const AppState = {
    app: null,
    model: null,
    stage: null,
    isModelLoaded: false,
    isMouseInCenter: false,
    lastTransparentState: null,
    lastMouseCheckTime: 0,
    idleAnimationInterval: null,
    debugInterval: null,
    isAIResponding: false // 标识AI是否正在回复中
};

// 应用配置
const AppConfig = {
    mouseCheckThrottle: 30, // 鼠标检测节流时间（毫秒）
    idleAnimationInterval: 12000, // 待机动画切换间隔（毫秒）
    debugUpdateInterval: 1000, // 调试信息更新间隔（毫秒）
    loadingGifDuration: 3000, // 加载GIF显示时长（毫秒）
    cubismCoreTimeout: 10000, // Cubism Core加载超时时间（毫秒）
    modelFadeInSpeed: 0.05, // 模型淡入速度
    audioVolume: 0.7 // 语音音量
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sizePresets, AppState, AppConfig };
} else {
    window.sizePresets = sizePresets;
    window.AppState = AppState;
    window.AppConfig = AppConfig;
}

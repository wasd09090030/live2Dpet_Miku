/**
 * 动画控制模块 - 处理 Live2D 模型的各种动画
 */

class AnimationController {
    constructor() {
        this.currentIdleActionIndex = 0;
        this.idleActions = [
            { motion: 'w-normal04-nod', expression: 'face_closeeye_01' },
            { motion: 'w-normal04-forward', expression: 'face_band_smallmouth_01' },
            { motion: 'w-normal04-shakehead', expression: 'face_band_wanawana_01' },
            { motion: 'w-special02-guruguru', expression: 'face_blushed_01' },
            { motion: 'w-pure12-fidget', expression: 'face_idol_trouble_01' },
            { motion: 'w-special15-yurayura', expression: 'face_idol_wink_02' }
        ];
        
        this.interactionMotions = [
            'w-adult01-pose',
            'w-adult02-glad',
            'w-adult01-blushed',
            'w-adult02-blushed',
            'w-adult01-nod',
            'w-adult02-nod',
            'w-happy02-shakehand',
            'w-happy01-shakehand',
            'w-cool01-shakehand',
            'w-cute01-sleep05B',
            'w-cute01-wink04',
            'w-cute11-nbforward'
        ];
        
        this.interactionExpressions = [
            'face_smile_01', 'face_smile_02', 'face_smile_03',
            'face_blushed_01', 'face_idol_smile_01', 'face_idol_blushed_01',
            'face_idol_wink_02', 'face_closeeye_01', 'face_closeeye_02',
            'face_idol_closeeye_01', 'face_idol_wink_01', 'face_idol_wink_02',
            'face_idol_wink_03', 'face_surprise_01'
        ];
        
        this.toastMessages = [
            '嗯哼哼~', '😊 我很开心呢！', '😳 有点害羞...', '😊 脸红红的~',
            '有什么事吗？', '好的好的😖~', '哈喽哈喽！💕', '🥰 最喜欢你了！💕',
            '💕💕💕~', '😴 好困呀，要睡觉了...', '😉 嘿嘿~', '😳 哇哦，怎么了吗？'
        ];
    }

    /**
     * 播放语音文件
     */
    playAudio(audioPath) {
        try {
            const audio = new Audio(audioPath);
            audio.volume = AppConfig.audioVolume;
            audio.play().catch(error => {
                console.warn('播放语音失败:', error);
            });
            console.log('播放语音:', audioPath);
        } catch (error) {
            console.error('创建音频对象失败:', error);
        }
    }

    /**
     * 播放启动欢迎动画
     */
    playStartupAnimation() {
        if (!AppState.model || !AppState.model.internalModel) {
            console.warn('模型或内部结构未准备好，无法播放启动动画');
            return;
        }
        
        try {
            const shakehandMotions = [
                'w-happy11-shakehand', 'w-happy02-shakehand', 'w-happy01-shakehand',
                'w-cool01-shakehand', 'w-adult01-shakehand', 'w-adult-shakehand01-additional'
            ];
            
            const smileExpressions = [
                'face_smile_01', 'face_smile_02', 'face_smile_03',
                'face_smile_04', 'face_smile_05', 'face_smile_06', 'face_smile_07'
            ];
            
            const randomShakehand = shakehandMotions[Math.floor(Math.random() * shakehandMotions.length)];
            const randomSmile = smileExpressions[Math.floor(Math.random() * smileExpressions.length)];
            
            console.log(`🎉 启动欢迎！播放握手动作: ${randomShakehand}`);
            console.log(`😊 启动欢迎！播放微笑表情: ${randomSmile}`);
            
            // 播放握手动作
            if (AppState.model.motion) {
                AppState.model.motion(randomShakehand, 0, 3);
            }
            
            // 延迟播放微笑表情
            setTimeout(() => {
                if (AppState.model && AppState.model.internalModel) {
                    AppState.model.expression(randomSmile);
                    console.log(`表情切换到: ${randomSmile}`);
                }
            }, 1200);
            
            // 显示欢迎提示
            if (window.UIManager) {
                window.UIManager.showToast(`❤️今天也要加油哟！~`);
            }
            
            // 播放早安语音
            this.playAudio('public/assets/goodDay.mp3');
            
            // 恢复正常表情
            setTimeout(() => {
                if (AppState.model && AppState.model.internalModel) {
                    AppState.model.expression('face_normal_01');
                    console.log('恢复到默认表情，准备进入待机状态');
                }
            }, 2500);
            
        } catch (error) {
            console.error('播放启动动画失败:', error);
            this.playFallbackAnimation();
        }
    }

    /**
     * 播放备用动画
     */
    playFallbackAnimation() {
        try {
            if (AppState.model && AppState.model.motion) {
                AppState.model.motion('face_band_smile_01', 0, 2);
                console.log('播放备用欢迎动画');
                if (window.UIManager) {
                    window.UIManager.showToast('🎉 欢迎回来！');
                }
            }
        } catch (fallbackError) {
            console.error('播放备用动画也失败:', fallbackError);
        }
    }

    /**
     * 播放待机动画
     */
    playIdleAnimation() {
        if (!AppState.model || !AppState.model.internalModel) {
            console.warn('模型或内部结构未准备好');
            return;
        }
        
        try {
            const playCurrentIdleAction = () => {
                if (!AppState.model || !AppState.isModelLoaded) return;
                
                const currentAction = this.idleActions[this.currentIdleActionIndex];
                
                try {
                    console.log(`🎭 播放待机动作: ${currentAction.motion}`);
                    console.log(`😊 播放待机表情: ${currentAction.expression}`);
                    
                    // 播放动作
                    if (AppState.model.motion) {
                        AppState.model.motion(currentAction.motion, 0, 2);
                    }
                    
                    // 延迟播放表情
                    setTimeout(() => {
                        if (AppState.model && AppState.model.internalModel && AppState.model.expression) {
                            AppState.model.expression(currentAction.expression);
                            console.log(`表情切换到: ${currentAction.expression}`);
                        }
                    }, 800);
                    
                } catch (error) {
                    console.warn(`播放待机动作失败 ${currentAction.motion}:`, error);
                    this.playFallbackIdleAnimation();
                }
                
                // 移动到下一个动作
                this.currentIdleActionIndex = (this.currentIdleActionIndex + 1) % this.idleActions.length;
            };
            
            // 立即播放第一个动作
            playCurrentIdleAction();
            
            // 定期切换动作
            AppState.idleAnimationInterval = setInterval(() => {
                if (AppState.model && AppState.isModelLoaded) {
                    playCurrentIdleAction();
                } else {
                    this.stopIdleAnimation();
                }
            }, AppConfig.idleAnimationInterval);
            
            console.log(`待机动画循环已启动，每${AppConfig.idleAnimationInterval/1000}秒切换一次动作`);
            
        } catch (error) {
            console.warn('播放待机动画失败:', error);
        }
    }

    /**
     * 播放备用待机动画
     */
    playFallbackIdleAnimation() {
        try {
            if (AppState.model && AppState.model.motion) {
                AppState.model.motion('face_band_normal_01', 0, 1);
                AppState.model.expression('face_normal_01');
                console.log('播放备用待机动画');
            }
        } catch (fallbackError) {
            console.error('播放备用待机动画也失败:', fallbackError);
        }
    }

    /**
     * 停止待机动画
     */
    stopIdleAnimation() {
        if (AppState.idleAnimationInterval) {
            clearInterval(AppState.idleAnimationInterval);
            AppState.idleAnimationInterval = null;
            console.log('待机动画已停止');
        }
    }

    /**
     * 播放随机交互动画
     */
    playRandomMotion() {
        if (!AppState.model || !AppState.isModelLoaded) {
            console.warn('模型未准备好');
            return;
        }
        
        try {
            const randomIndex = Math.floor(Math.random() * this.interactionMotions.length);
            const randomMotion = this.interactionMotions[randomIndex];
            const randomExpression = this.interactionExpressions[Math.floor(Math.random() * this.interactionExpressions.length)];
            const toastMessage = this.toastMessages[randomIndex];
            
            if (AppState.model.motion) {
                AppState.model.motion(randomMotion, 0, 3);
                console.log('播放交互动画:', randomMotion);
                
                // 显示对应的Toast消息
                if (window.UIManager) {
                    window.UIManager.showToast(toastMessage);
                }
                
                // 延迟播放表情
                setTimeout(() => {
                    if (AppState.model && AppState.model.internalModel && AppState.model.expression) {
                        AppState.model.expression(randomExpression);
                        console.log('播放交互表情:', randomExpression);
                    }
                }, 600);
            } else {
                console.warn('模型motion方法不可用');
            }
        } catch (error) {
            console.warn('播放随机动画失败:', error);
        }
    }

    /**
     * 清理动画资源
     */
    cleanup() {
        this.stopIdleAnimation();
        this.currentIdleActionIndex = 0;
    }
}

// 创建全局动画控制器实例
const animationController = new AnimationController();

// 暴露到全局作用域
window.AnimationController = animationController;
window.playRandomMotion = () => animationController.playRandomMotion();
window.playIdleAnimation = () => animationController.playIdleAnimation();
window.playAudio = (audioPath) => animationController.playAudio(audioPath);

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationController;
}

/**
 * TodoList 待办事项管理功能
 * 功能：添加待办事项和对应时间，到时间前5分钟提醒
 */

class TodoList {
    constructor() {
        this.todos = this.loadTodos();
        this.checkInterval = null;
        this.startTimeChecker();
    }

    // 从本地存储加载待办事项
    loadTodos() {
        try {
            const saved = localStorage.getItem('live2d-todos');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('加载待办事项失败:', error);
            return [];
        }
    }

    // 保存待办事项到本地存储
    saveTodos() {
        try {
            localStorage.setItem('live2d-todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('保存待办事项失败:', error);
        }
    }

    // 添加新的待办事项
    addTodo(title, datetime) {
        const todo = {
            id: Date.now(),
            title: title.trim(),
            datetime: datetime,
            completed: false,
            notified: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.push(todo);
        this.saveTodos();
        this.updateTodoDisplay();
        
        // 播放添加成功的动画
        if (typeof playRandomMotion === 'function') {
            playRandomMotion();
        }
        
        if (typeof showToast === 'function') {
            showToast('✅ 待办事项已添加！');
        }
    }

    // 删除待办事项
    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.updateTodoDisplay();
        
        if (typeof showToast === 'function') {
            showToast('🗑️ 待办事项已删除');
        }
    }

    // 切换完成状态
    toggleComplete(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.updateTodoDisplay();
            
            if (todo.completed && typeof playRandomMotion === 'function') {
                playRandomMotion();
            }
            
            if (typeof showToast === 'function') {
                showToast(todo.completed ? '🎉 任务完成！' : '📝 任务重新激活');
            }
        }
    }    // 显示待办事项面板
    showTodoPanel() {
        // 移除现有面板
        const existingPanel = document.querySelector('.todo-panel');
        if (existingPanel) {
            existingPanel.remove();
            const existingOverlay = document.querySelector('.todo-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            return;
        }        // 创建背景遮罩（移除阴影，保持透明）
        const overlay = document.createElement('div');
        overlay.className = 'todo-overlay';
        overlay.onclick = () => this.closeTodoPanel();

        const panel = document.createElement('div');
        panel.className = 'todo-panel';
        panel.innerHTML = `
            <div class="todo-header">
                <h3>📝 待办事项</h3>
                <button class="close-btn" onclick="todoList.closeTodoPanel()">✕</button>
            </div>            <div class="todo-add-form">
                <input type="text" id="todo-title" placeholder="输入待办事项..." maxlength="50">
                <div class="input-error-message" id="title-error"></div>
                <input type="datetime-local" id="todo-datetime">
                <div class="input-error-message" id="datetime-error"></div>
                <button onclick="todoList.handleAddTodo()">添加</button>
            </div>
            <div class="todo-list" id="todo-list-container">
                <!-- 待办事项列表将在这里显示 -->
            </div>
            <div class="todo-stats">
                <span id="todo-stats-text">正在加载...</span>
            </div>        `;

        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        
        // 设置默认时间为当前时间+1小时
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const datetimeInput = document.getElementById('todo-datetime');
        datetimeInput.value = now.toISOString().slice(0, 16);        this.updateTodoDisplay();

        // 聚焦到标题输入框
        setTimeout(() => {
            const titleInput = document.getElementById('todo-title');
            const datetimeInput = document.getElementById('todo-datetime');
            
            titleInput.focus();
            
            // 添加输入事件监听器，用户输入时清除错误提示
            titleInput.addEventListener('input', () => {
                this.clearInputError('todo-title', 'title-error');
            });
            
            datetimeInput.addEventListener('change', () => {
                this.clearInputError('todo-datetime', 'datetime-error');
            });
            
            // 添加回车键快速添加功能
            titleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAddTodo();
                }
            });
        }, 100);
    }    // 关闭待办事项面板
    closeTodoPanel() {
        const panel = document.querySelector('.todo-panel');
        const overlay = document.querySelector('.todo-overlay');
        
        if (panel) {
            panel.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                panel.remove();
                if (overlay) {
                    overlay.remove();
                }
            }, 300);
        } else if (overlay) {
            overlay.remove();
        }
    }

    // 显示输入错误提示
    showInputError(inputId, errorId, message) {
        const input = document.getElementById(inputId);
        const errorDiv = document.getElementById(errorId);
        
        if (input && errorDiv) {
            input.classList.add('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // 3秒后自动清除错误状态
            setTimeout(() => {
                this.clearInputError(inputId, errorId);
            }, 3000);
        }
    }
    
    // 清除输入错误提示
    clearInputError(inputId, errorId) {
        const input = document.getElementById(inputId);
        const errorDiv = document.getElementById(errorId);
        
        if (input) {
            input.classList.remove('error');
        }
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
    }
    
    // 清除所有输入错误提示
    clearAllInputErrors() {
        this.clearInputError('todo-title', 'title-error');
        this.clearInputError('todo-datetime', 'datetime-error');
    }    // 处理添加待办事项
    handleAddTodo() {
        const titleInput = document.getElementById('todo-title');
        const datetimeInput = document.getElementById('todo-datetime');
        
        const title = titleInput.value.trim();
        const datetime = datetimeInput.value;

        // 先清除所有错误提示
        this.clearAllInputErrors();

        let hasError = false;

        if (!title) {
            this.showInputError('todo-title', 'title-error', '❌ 请输入待办事项标题');
            titleInput.focus();
            hasError = true;
        }

        if (!datetime) {
            this.showInputError('todo-datetime', 'datetime-error', '❌ 请选择提醒时间');
            if (!hasError) datetimeInput.focus();
            hasError = true;
        } else {
            // 检查时间是否在未来
            const selectedDate = new Date(datetime);
            const now = new Date();
            if (selectedDate <= now) {
                this.showInputError('todo-datetime', 'datetime-error', '❌ 请选择未来的时间');
                if (!hasError) datetimeInput.focus();
                hasError = true;
            }
        }

        if (hasError) {
            return;
        }

        this.addTodo(title, datetime);
        
        // 清空输入框
        titleInput.value = '';
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1);
        datetimeInput.value = nextHour.toISOString().slice(0, 16);
        titleInput.focus();
    }

    // 更新待办事项显示
    updateTodoDisplay() {
        const container = document.getElementById('todo-list-container');
        const statsText = document.getElementById('todo-stats-text');
        
        if (!container) return;

        if (this.todos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📝 还没有待办事项</p>
                    <p>添加一个开始管理你的时间吧！</p>
                </div>
            `;
            if (statsText) {
                statsText.textContent = '暂无待办事项';
            }
            return;
        }

        // 按时间排序
        const sortedTodos = [...this.todos].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        
        container.innerHTML = sortedTodos.map(todo => {
            const todoDate = new Date(todo.datetime);
            const now = new Date();
            const diffMs = todoDate - now;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            let timeClass = '';
            let timeText = todoDate.toLocaleString('zh-CN');
            
            if (diffHours < 0) {
                timeClass = 'urgent';
                timeText = '⚠️ 已过期 - ' + timeText;
            } else if (diffHours < 1) {
                timeClass = 'urgent';
                const minutes = Math.floor(diffMs / (1000 * 60));
                timeText = `🔥 ${minutes}分钟后 - ` + timeText;
            } else if (diffHours < 24) {
                const hours = Math.floor(diffHours);
                timeText = `⏰ ${hours}小时后 - ` + timeText;
            }

            return `
                <div class="todo-item">
                    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                           onchange="todoList.toggleComplete(${todo.id})">
                    <div class="todo-content">
                        <div class="todo-title ${todo.completed ? 'completed' : ''}">${todo.title}</div>
                        <div class="todo-time ${timeClass}">${timeText}</div>
                    </div>
                    <button class="todo-delete" onclick="todoList.deleteTodo(${todo.id})">删除</button>
                </div>
            `;
        }).join('');        // 更新统计信息
        if (statsText) {
            const total = this.todos.length;
            const completed = this.todos.filter(t => t.completed).length;
            const pending = total - completed;
            statsText.textContent = `总计: ${total} | 已完成: ${completed} | 待完成: ${pending}`;
        }
        
        // 检查是否需要滚动条并添加视觉提示
        setTimeout(() => {
            this.updateScrollIndicators();
        }, 100);
    }
    
    // 更新滚动指示器
    updateScrollIndicators() {
        const container = document.getElementById('todo-list-container');
        if (container) {
            const isScrollable = container.scrollHeight > container.clientHeight;
            if (isScrollable) {
                container.classList.add('scrollable');
            } else {
                container.classList.remove('scrollable');
            }
        }
    }

    // 开始时间检查器
    startTimeChecker() {
        // 每分钟检查一次
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 60000);
        
        // 立即检查一次
        setTimeout(() => {
            this.checkReminders();
        }, 1000);
    }

    // 检查提醒
    checkReminders() {
        const now = new Date();
        
        this.todos.forEach(todo => {
            if (todo.completed || todo.notified) return;
            
            const todoDate = new Date(todo.datetime);
            const diffMs = todoDate - now;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            // 提前5分钟提醒
            if (diffMinutes <= 5 && diffMinutes >= 0) {
                todo.notified = true;
                this.saveTodos();
                
                // 播放提醒动画
                if (typeof playRandomMotion === 'function') {
                    playRandomMotion();
                }
                
                // 显示提醒消息
                if (typeof showToast === 'function') {
                    const message = diffMinutes === 0 ? 
                        `⏰ 现在该做: ${todo.title}` : 
                        `⏰ ${diffMinutes}分钟后: ${todo.title}`;
                    showToast(message);
                }
                
                console.log('待办事项提醒:', todo.title, '剩余分钟:', diffMinutes);
            }
        });
    }

    // 获取即将到来的事项
    getUpcomingTodos(hours = 24) {
        const now = new Date();
        const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
        
        return this.todos.filter(todo => {
            if (todo.completed) return false;
            const todoDate = new Date(todo.datetime);
            return todoDate >= now && todoDate <= future;
        }).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    }

    // 清理过期的已完成事项
    cleanupCompleted() {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const before = this.todos.length;
        this.todos = this.todos.filter(todo => {
            if (!todo.completed) return true;
            const todoDate = new Date(todo.datetime);
            return todoDate >= oneDayAgo;
        });
        
        const removed = before - this.todos.length;
        if (removed > 0) {
            this.saveTodos();
            if (typeof showToast === 'function') {
                showToast(`🧹 已清理 ${removed} 个过期事项`);
            }
        }
    }

    // 停止时间检查器
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// 创建全局实例
window.todoList = new TodoList();

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (window.todoList) {
        window.todoList.destroy();
    }
});

console.log('📝 TodoList 待办事项功能已加载');

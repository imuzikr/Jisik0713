class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setCurrentDate();
        this.bindEvents();
        this.renderTodos();
        this.updateStats();
        this.showEmptyState();
        this.showWelcomeMessage();
    }

    setCurrentDate() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('ko-KR', options);
    }

    bindEvents() {
        // 할일 추가
        document.getElementById('addBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // 필터 버튼
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    async addTodo() {
        const input = document.getElementById('todoInput');
        const priority = document.getElementById('prioritySelect').value;
        const text = input.value.trim();

        if (!text) {
            await Swal.fire({
                icon: 'warning',
                title: '할일을 입력해주세요!',
                text: '할일 내용을 입력한 후 추가해주세요.',
                confirmButtonText: '확인',
                confirmButtonColor: '#667eea'
            });
            input.focus();
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            priority: priority,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        this.showEmptyState();

        input.value = '';
        
        await Swal.fire({
            icon: 'success',
            title: '할일이 추가되었습니다!',
            text: '새로운 할일이 목록에 추가되었습니다.',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }

    async toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date().toISOString() : null;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();

            const message = todo.completed ? '할일을 완료했습니다!' : '할일을 다시 대기중으로 변경했습니다.';
            const icon = todo.completed ? 'success' : 'info';

            await Swal.fire({
                icon: icon,
                title: message,
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        }
    }

    async deleteTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        
        const result = await Swal.fire({
            icon: 'warning',
            title: '할일을 삭제하시겠습니까?',
            text: `"${todo.text}" 할일을 정말로 삭제하시겠습니까?`,
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showEmptyState();
            
            await Swal.fire({
                icon: 'success',
                title: '삭제되었습니다!',
                text: '할일이 성공적으로 삭제되었습니다.',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        }
    }

    async editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const { value: newText } = await Swal.fire({
            title: '할일 수정',
            input: 'text',
            inputLabel: '할일 내용을 수정해주세요',
            inputValue: todo.text,
            inputPlaceholder: '할일을 입력하세요...',
            showCancelButton: true,
            confirmButtonText: '수정',
            cancelButtonText: '취소',
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d',
            inputValidator: (value) => {
                if (!value || value.trim() === '') {
                    return '할일 내용을 입력해주세요!';
                }
            }
        });

        if (newText && newText.trim() !== '') {
            todo.text = newText.trim();
            this.saveTodos();
            this.renderTodos();
            
            await Swal.fire({
                icon: 'success',
                title: '수정되었습니다!',
                text: '할일이 성공적으로 수정되었습니다.',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // 필터 버튼 활성화 상태 업데이트
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTodos();
        this.showEmptyState();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();

        todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            return;
        }

        filteredTodos.forEach(todo => {
            const todoItem = this.createTodoElement(todo);
            todoList.appendChild(todoItem);
        });
    }

    createTodoElement(todo) {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        todoItem.dataset.id = todo.id;

        const priorityText = {
            'high': '높음',
            'medium': '보통',
            'low': '낮음'
        };

        const priorityClass = `priority-${todo.priority}`;
        const priorityIcon = {
            'high': 'fas fa-exclamation-triangle',
            'medium': 'fas fa-minus',
            'low': 'fas fa-arrow-down'
        };

        todoItem.innerHTML = `
            <div class="form-check">
                <input type="checkbox" class="form-check-input todo-checkbox" ${todo.completed ? 'checked' : ''}>
            </div>
            <div class="todo-content">
                <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                <div class="todo-meta">
                    <span class="priority-badge ${priorityClass}">
                        <i class="${priorityIcon[todo.priority]} me-1"></i>
                        ${priorityText[todo.priority]}
                    </span>
                    <span class="text-muted">
                        <i class="fas fa-calendar-plus me-1"></i>
                        ${this.formatDate(todo.createdAt)}
                    </span>
                    ${todo.completed ? `
                        <span class="text-success">
                            <i class="fas fa-check-circle me-1"></i>
                            완료: ${this.formatDate(todo.completedAt)}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="todo-actions">
                <button class="action-btn edit-btn" title="수정" data-bs-toggle="tooltip">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="삭제" data-bs-toggle="tooltip">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // 이벤트 리스너 추가
        const checkbox = todoItem.querySelector('.todo-checkbox');
        const editBtn = todoItem.querySelector('.edit-btn');
        const deleteBtn = todoItem.querySelector('.delete-btn');

        checkbox.addEventListener('change', () => this.toggleTodo(todo.id));
        editBtn.addEventListener('click', () => this.editTodo(todo.id));
        deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

        // Bootstrap tooltip 초기화
        const tooltips = todoItem.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });

        return todoItem;
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        // 헤더 통계
        document.getElementById('totalTasks').textContent = total;
        
        // 카드 통계
        document.getElementById('totalTasksCard').textContent = total;
        document.getElementById('completedTasksCard').textContent = completed;
        document.getElementById('pendingTasksCard').textContent = pending;
    }

    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const todoList = document.getElementById('todoList');
        
        if (this.getFilteredTodos().length === 0) {
            emptyState.style.display = 'block';
            todoList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            todoList.style.display = 'flex';
        }
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return '오늘';
        } else if (diffDays === 2) {
            return '어제';
        } else if (diffDays <= 7) {
            return `${diffDays - 1}일 전`;
        } else {
            return date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async showWelcomeMessage() {
        if (this.todos.length === 0) {
            await Swal.fire({
                icon: 'info',
                title: '할일 관리 앱에 오신 것을 환영합니다!',
                text: '새로운 할일을 추가하고 효율적으로 관리해보세요.',
                confirmButtonText: '시작하기',
                confirmButtonColor: '#667eea',
                showClass: {
                    popup: 'animate__animated animate__fadeInDown'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp'
                }
            });
        }
    }

    // 통계 요약 표시
    async showStatsSummary() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        await Swal.fire({
            title: '할일 통계',
            html: `
                <div class="row text-center">
                    <div class="col-4">
                        <div class="stat-item">
                            <h3 class="text-primary">${total}</h3>
                            <p>전체</p>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="stat-item">
                            <h3 class="text-success">${completed}</h3>
                            <p>완료</p>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="stat-item">
                            <h3 class="text-warning">${pending}</h3>
                            <p>대기</p>
                        </div>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="progress">
                        <div class="progress-bar bg-success" style="width: ${completionRate}%"></div>
                    </div>
                    <small class="text-muted">완료율: ${completionRate}%</small>
                </div>
            `,
            confirmButtonText: '확인',
            confirmButtonColor: '#667eea'
        });
    }
}

// SweetAlert2 설정
Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
});

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const app = new TodoApp();
    
    // 통계 요약 버튼 추가 (옵션)
    const statsBtn = document.createElement('button');
    statsBtn.className = 'btn btn-outline-info position-fixed';
    statsBtn.style.cssText = 'bottom: 20px; right: 20px; z-index: 1000; border-radius: 50%; width: 60px; height: 60px;';
    statsBtn.innerHTML = '<i class="fas fa-chart-bar"></i>';
    statsBtn.title = '통계 보기';
    statsBtn.addEventListener('click', () => app.showStatsSummary());
    document.body.appendChild(statsBtn);
});

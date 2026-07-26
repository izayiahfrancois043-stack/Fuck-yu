// To-Do List Application with Local Storage

class TodoApp {
    constructor() {
        this.todos = [];
        this.filter = 'all';
        this.editingId = null;
        
        this.initializeElements();
        this.loadFromStorage();
        this.attachEventListeners();
        this.updateDate();
        this.render();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todo-input');
        this.addBtn = document.getElementById('add-btn');
        this.todoList = document.getElementById('todo-list');
        this.emptyState = document.getElementById('empty-state');
        this.prioritySelect = document.getElementById('priority-select');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clear-completed');
        this.clearAllBtn = document.getElementById('clear-all');
        this.exportBtn = document.getElementById('export-btn');
        this.importBtn = document.getElementById('import-btn');
        this.importFile = document.getElementById('import-file');
        this.taskCount = document.getElementById('task-count');
        this.statTotal = document.getElementById('stat-total');
        this.statCompleted = document.getElementById('stat-completed');
        this.statRemaining = document.getElementById('stat-remaining');
    }

    attachEventListeners() {
        // Add todo
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Actions
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        this.exportBtn.addEventListener('click', () => this.exportTasks());
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.handleImport(e));
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        const priority = this.prioritySelect.value;

        if (!text) {
            this.todoInput.focus();
            return;
        }

        const todo = {
            id: Date.now(),
            text,
            priority,
            completed: false,
            createdAt: new Date().toLocaleString()
        };

        this.todos.unshift(todo);
        this.saveToStorage();
        this.render();
        this.todoInput.value = '';
        this.todoInput.focus();
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveToStorage();
        this.render();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.showEditModal(todo);
    }

    showEditModal(todo) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Edit Task</h3>
                <input type="text" id="edit-text" value="${this.escapeHtml(todo.text)}" placeholder="Task text...">
                <select id="edit-priority">
                    <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                    <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                    <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>High Priority</option>
                </select>
                <div class="modal-buttons">
                    <button class="btn btn-save" id="modal-save">Save</button>
                    <button class="btn btn-cancel" id="modal-cancel">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const textInput = document.getElementById('edit-text');
        textInput.focus();
        textInput.select();

        document.getElementById('modal-save').addEventListener('click', () => {
            const newText = textInput.value.trim();
            const newPriority = document.getElementById('edit-priority').value;

            if (newText) {
                todo.text = newText;
                todo.priority = newPriority;
                this.saveToStorage();
                this.render();
            }

            modal.remove();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => {
            modal.remove();
        });

        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('modal-save').click();
            }
        });
    }

    setFilter(filter) {
        this.filter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    clearCompleted() {
        const count = this.todos.filter(t => t.completed).length;
        if (count === 0) {
            alert('No completed tasks to clear.');
            return;
        }

        if (confirm(`Clear ${count} completed task(s)?`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveToStorage();
            this.render();
        }
    }

    clearAll() {
        if (this.todos.length === 0) {
            alert('No tasks to clear.');
            return;
        }

        if (confirm('Are you sure? This will delete ALL tasks!')) {
            this.todos = [];
            this.saveToStorage();
            this.render();
        }
    }

    exportTasks() {
        if (this.todos.length === 0) {
            alert('No tasks to export.');
            return;
        }

        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                
                if (!Array.isArray(imported)) {
                    throw new Error('Invalid format');
                }

                const validTodos = imported.filter(todo => 
                    todo.id && todo.text && 
                    ['low', 'medium', 'high'].includes(todo.priority)
                );

                if (validTodos.length === 0) {
                    throw new Error('No valid tasks found');
                }

                if (confirm(`Import ${validTodos.length} task(s)?`)) {
                    const existingIds = new Set(this.todos.map(t => t.id));
                    const newTodos = validTodos.filter(t => !existingIds.has(t.id));
                    
                    this.todos = [...newTodos, ...this.todos];
                    this.saveToStorage();
                    this.render();
                    alert(`Successfully imported ${newTodos.length} task(s)!`);
                }
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);
        
        e.target.value = '';
    }

    getFilteredTodos() {
        switch (this.filter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            case 'high':
                return this.todos.filter(t => t.priority === 'high');
            default:
                return this.todos;
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const remaining = total - completed;

        this.statTotal.textContent = total;
        this.statCompleted.textContent = completed;
        this.statRemaining.textContent = remaining;
    }

    updateDate() {
        const dateElement = document.getElementById('current-date');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        dateElement.textContent = today.toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    render() {
        const filtered = this.getFilteredTodos();
        
        this.emptyState.classList.toggle('hidden', this.todos.length > 0);
        
        const countText = this.filter === 'all' 
            ? `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`
            : `${filtered.length} ${this.filter} task${filtered.length !== 1 ? 's' : ''}`;
        this.taskCount.textContent = countText;

        this.todoList.innerHTML = filtered.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}">
                <input 
                    type="checkbox" 
                    class="checkbox"
                    ${todo.completed ? 'checked' : ''}
                    data-id="${todo.id}"
                    aria-label="Toggle task completion"
                >
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-date">Created: ${todo.createdAt}</div>
                </div>
                <span class="priority-badge ${todo.priority}">${todo.priority}</span>
                <div class="todo-actions">
                    <button class="btn-action-small btn-edit" data-id="${todo.id}">Edit</button>
                    <button class="btn-action-small btn-delete" data-id="${todo.id}">Delete</button>
                </div>
            </li>
        `).join('');

        this.todoList.querySelectorAll('.checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTodo(parseInt(e.target.dataset.id));
            });
        });

        this.todoList.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editTodo(parseInt(btn.dataset.id));
            });
        });

        this.todoList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Delete this task?')) {
                    this.deleteTodo(parseInt(btn.dataset.id));
                }
            });
        });

        this.updateStats();
    }

    saveToStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('todos');
        if (stored) {
            try {
                this.todos = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading from storage:', e);
                this.todos = [];
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
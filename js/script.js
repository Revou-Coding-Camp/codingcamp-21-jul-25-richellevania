class TodoApp {
    constructor() {
        this.taskInput = document.getElementById('taskInput');
        this.dateInput = document.getElementById('dateInput');
        this.addBtn = document.getElementById('addBtn');
        this.deleteAllBtn = document.getElementById('deleteAllBtn');
        this.searchInput = document.getElementById('searchInput');
        this.sortSelect = document.getElementById('sortSelect');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.totalTasksElem = document.getElementById('totalTasks');
        this.completedTasksElem = document.getElementById('completedTasks');
        this.pendingTasksElem = document.getElementById('pendingTasks');
        this.progressBar = document.getElementById('progressBar');
        this.progressPercent = document.getElementById('progressPercent');

        this.tasks = [];
        this.editMode = false;
        this.editTaskId = null;
        this.currentFilter = 'all';
        this.currentSort = 'none';

        this.loadTasks();
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        this.addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        this.deleteAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.deleteAllTasks();
        });

        this.searchInput.addEventListener('input', (e) => {
            this.searchTasks(e.target.value);
        });

        this.sortSelect.addEventListener('change', (e) => {
            this.sortTasks(e.target.value);
        });

        // Delegated click events
        document.addEventListener('click', (e) => {
            // Dropdown hide
            if (!e.target.closest('.dropdown')) {
                const dropdownContent = document.querySelector('.dropdown-content');
                if (dropdownContent) dropdownContent.style.display = 'none';
            }

            // Dropdown item click
            if (e.target.classList.contains('dropdown-item')) {
                const selectedFilter = e.target.dataset.filter;
                this.filterTasks(selectedFilter);
                const dropdownContent = document.querySelector('.dropdown-content');
                if (dropdownContent) dropdownContent.style.display = 'none';
                return;
            }

            // Task action buttons
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const action = actionBtn.getAttribute('data-action');
                const taskId = parseInt(actionBtn.getAttribute('data-id'));
                if (action === 'edit') this.editTask(taskId);
                else if (action === 'delete') this.deleteTask(taskId);
                else if (action === 'toggle') this.toggleComplete(taskId);
            }
        });

        // ESC to cancel edit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editMode) {
                this.resetEditMode();
            }
        });

        // Toggle dropdown
        const dropdownBtn = document.querySelector('.dropdown-btn');
        const dropdownContent = document.querySelector('.dropdown-content');
        if (dropdownBtn && dropdownContent) {
            dropdownBtn.addEventListener('click', () => {
                dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
            });
        }
    }

    resetEditMode() {
        this.editMode = false;
        this.editTaskId = null;
        this.taskInput.value = '';
        this.dateInput.value = '';
        this.addBtn.textContent = '+';
    }

    saveTask() {
        const text = this.taskInput.value.trim();
        const dueDate = this.dateInput.value;
        if (!text || !dueDate) return alert('Isi task dan due date.');

        if (this.editMode) {
            const task = this.tasks.find(t => t.id === this.editTaskId);
            if (task) {
                task.text = text;
                task.dueDate = dueDate;
            }
            this.resetEditMode();
        } else {
            const task = {
                id: Date.now(),
                text,
                dueDate,
                completed: false
            };
            this.tasks.push(task);
        }

        this.taskInput.value = '';
        this.dateInput.value = '';
        this.saveTasks();
        this.applyFiltersAndSort();
    }

    deleteAllTasks() {
        if (confirm('Hapus semua task?')) {
            this.tasks = [];
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.applyFiltersAndSort();
    }

    toggleComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.applyFiltersAndSort();
        }
    }

    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;

        this.editMode = true;
        this.editTaskId = id;
        this.taskInput.value = task.text;
        this.dateInput.value = task.dueDate;
        this.addBtn.innerHTML = '🖉';
        this.taskInput.focus();
    }

    searchTasks(query) {
        query = query.toLowerCase();
        const filtered = this.tasks.filter(task => task.text.toLowerCase().includes(query));
        this.render(filtered);
    }

    filterTasks(type) {
        this.currentFilter = type;
        this.applyFiltersAndSort();
    }

    sortTasks(method) {
        if (method === 'none') return; // Ignore if placeholder selected
        this.currentSort = method;
        this.applyFiltersAndSort();
    }

    applyFiltersAndSort() {
        let filtered = [...this.tasks];
        const today = new Date().toISOString().split('T')[0];

        // Filter
        if (this.currentFilter === 'pending') {
            filtered = filtered.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        } else if (this.currentFilter === 'today') {
            filtered = filtered.filter(t => t.dueDate === today);
        } else if (this.currentFilter === 'overdue') {
            filtered = filtered.filter(t => t.dueDate < today && !t.completed);
        }

        // Sort
        if (this.currentSort === 'date-asc') {
            filtered.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        } else if (this.currentSort === 'date-desc') {
            filtered.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
        } else if (this.currentSort === 'alpha-asc') {
            filtered.sort((a, b) => a.text.localeCompare(b.text));
        } else if (this.currentSort === 'alpha-desc') {
            filtered.sort((a, b) => b.text.localeCompare(a.text));
        } else if (this.currentSort === 'status') {
            filtered.sort((a, b) => a.completed - b.completed);
        }

        this.render(filtered);
    }

    render(data = this.tasks) {
        this.taskList.innerHTML = '';
        if (data.length === 0) {
            this.emptyState.style.display = 'block';
            this.taskList.style.display = 'none';
        } else {
            this.emptyState.style.display = 'none';
            this.taskList.style.display = 'block';

            data.forEach(task => {
                const item = document.createElement('div');
                item.className = `task-item ${task.completed ? 'completed' : ''}`;
                item.innerHTML = `
                    <span class="task-text">${task.text}</span>
                    <span class="task-date">${task.dueDate}</span>
                    <span class="task-status">${task.completed ? 'Completed' : 'Pending'}</span>
                    <div class="task-actions">
                        <button class="action-btn toggle-btn" data-id="${task.id}" data-action="toggle">
                            ${task.completed ? '↺' : '✓'}
                        </button>
                        <button class="action-btn edit-btn" data-id="${task.id}" data-action="edit">✎</button>
                        <button class="action-btn delete-btn" data-id="${task.id}" data-action="delete">🗑</button>
                    </div>
                `;
                this.taskList.appendChild(item);
            });
        }

        this.updateStats();
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        this.totalTasksElem.textContent = total;
        this.completedTasksElem.textContent = completed;
        this.pendingTasksElem.textContent = pending;
        this.progressPercent.textContent = `${percent}%`;
        this.progressBar.style.width = `${percent}%`;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('tasks');
        this.tasks = saved ? JSON.parse(saved) : [];
    }

    
}

document.querySelectorAll('.theme-item').forEach(item => {
    item.addEventListener('click', function() {
        // Remove active from all
        document.querySelectorAll('.theme-item').forEach(i => i.classList.remove('active'));
        // Add active to clicked
        this.classList.add('active');
        // Ganti theme di body
        document.body.className = 'theme-' + this.dataset.theme;
        // Jika container juga perlu diubah:
        document.querySelector('.container').className = 'container theme-' + this.dataset.theme;
    });
});

const themeBtn = document.getElementById('themePaletteBtn');
const themeSidebar = document.getElementById('themeSidebar');

themeBtn.addEventListener('click', function() {
    if (themeSidebar.style.display === 'none' || themeSidebar.style.display === '') {
        themeSidebar.style.display = 'block';
    } else {
        themeSidebar.style.display = 'none';
    }
});

// Optional: klik di luar sidebar untuk menutup
document.addEventListener('click', function(e) {
    if (
        themeSidebar.style.display === 'block' &&
        !themeSidebar.contains(e.target) &&
        e.target !== themeBtn
    ) {
        themeSidebar.style.display = 'none';
    }
});

// Global variable so it can be accessed outside
let todoApp;

document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
});

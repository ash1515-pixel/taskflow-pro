const KEY = 'taskflow-pro-tasks';
const defaultTasks = [
  { id: crypto.randomUUID(), title: 'Prepare client demo', description: 'Draft screen flow for dashboard module', priority: 'high', dueDate: '', status: 'todo', createdAt: Date.now() },
  { id: crypto.randomUUID(), title: 'API schema review', description: 'Check payload consistency with backend team', priority: 'medium', dueDate: '', status: 'inprogress', createdAt: Date.now() },
  { id: crypto.randomUUID(), title: 'Fix mobile padding', description: 'Update spacing in hero and cards', priority: 'low', dueDate: '', status: 'done', createdAt: Date.now() }
];

const load = () => JSON.parse(localStorage.getItem(KEY) || 'null') || defaultTasks;
let tasks = load();

const refs = {
  search: document.getElementById('search'),
  stats: document.getElementById('stats'),
  modal: document.getElementById('taskModal'),
  form: document.getElementById('taskForm'),
  cancelBtn: document.getElementById('cancelBtn'),
  newTaskBtn: document.getElementById('newTaskBtn'),
  lists: {
    todo: document.getElementById('todoList'),
    inprogress: document.getElementById('inprogressList'),
    done: document.getElementById('doneList')
  }
};

function save() {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}

function renderStats(filtered) {
  const total = filtered.length;
  const done = filtered.filter((t) => t.status === 'done').length;
  const high = filtered.filter((t) => t.priority === 'high').length;
  const due = filtered.filter((t) => t.dueDate).length;
  refs.stats.innerHTML = `
    <article class="stat"><div>Total Tasks</div><strong>${total}</strong></article>
    <article class="stat"><div>Completed</div><strong>${done}</strong></article>
    <article class="stat"><div>High Priority</div><strong>${high}</strong></article>
    <article class="stat"><div>With Due Date</div><strong>${due}</strong></article>
  `;
}

function taskTemplate(task) {
  return `
    <article class="task" draggable="true" data-id="${task.id}">
      <strong>${task.title}</strong>
      <p>${task.description || 'No description'}</p>
      <div class="meta">
        <span class="badge ${task.priority}">${task.priority}</span>
        <span>${task.dueDate || 'No due date'}</span>
      </div>
    </article>
  `;
}

function attachDrag() {
  document.querySelectorAll('.task').forEach((node) => {
    node.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', node.dataset.id);
    });
  });
}

function render() {
  const q = refs.search.value.trim().toLowerCase();
  const filtered = tasks.filter((t) =>
    [t.title, t.description, t.priority].join(' ').toLowerCase().includes(q)
  );

  ['todo', 'inprogress', 'done'].forEach((status) => {
    refs.lists[status].innerHTML = filtered
      .filter((t) => t.status === status)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(taskTemplate)
      .join('');
  });

  renderStats(filtered);
  attachDrag();
}

function setupDropZones() {
  document.querySelectorAll('.column').forEach((col) => {
    const status = col.dataset.status;
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('over');
    });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain');
      tasks = tasks.map((t) => (t.id === id ? { ...t, status } : t));
      save();
      render();
    });
  });
}

refs.newTaskBtn.addEventListener('click', () => refs.modal.showModal());
refs.cancelBtn.addEventListener('click', () => refs.modal.close());
refs.search.addEventListener('input', render);
refs.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(refs.form);
  tasks.push({
    id: crypto.randomUUID(),
    title: String(data.get('title') || ''),
    description: String(data.get('description') || ''),
    priority: String(data.get('priority') || 'medium'),
    dueDate: String(data.get('dueDate') || ''),
    status: 'todo',
    createdAt: Date.now()
  });
  refs.form.reset();
  refs.modal.close();
  save();
  render();
});

setupDropZones();
render();
save();

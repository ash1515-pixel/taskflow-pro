const TASK_KEY = 'taskflow-pro-tasks-v3';
const ACTIVITY_KEY = 'taskflow-pro-activity-v2';

const seed = [
  { id: crypto.randomUUID(), title: 'Prepare client demo', description: 'Draft screen flow for dashboard module', priority: 'high', dueDate: '', status: 'todo', createdAt: Date.now() },
  { id: crypto.randomUUID(), title: 'API schema review', description: 'Check payload consistency with backend team', priority: 'medium', dueDate: '', status: 'inprogress', createdAt: Date.now() },
  { id: crypto.randomUUID(), title: 'Fix mobile spacing', description: 'Update spacing in hero and cards', priority: 'low', dueDate: '', status: 'done', createdAt: Date.now() }
];

let tasks = JSON.parse(localStorage.getItem(TASK_KEY) || 'null') || seed;
let activity = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
let dragTaskId = null;

const refs = {
  search: document.getElementById('search'),
  priorityFilter: document.getElementById('priorityFilter'),
  stats: document.getElementById('stats'),
  statusText: document.getElementById('statusText'),
  activityList: document.getElementById('activityList'),
  aiInsights: document.getElementById('aiInsights'),
  modal: document.getElementById('taskModal'),
  modalTitle: document.getElementById('modalTitle'),
  form: document.getElementById('taskForm'),
  cancelBtn: document.getElementById('cancelBtn'),
  newTaskBtn: document.getElementById('newTaskBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importInput: document.getElementById('importInput'),
  autoPrioritizeBtn: document.getElementById('autoPrioritizeBtn'),
  aiPlanBtn: document.getElementById('aiPlanBtn'),
  aiBreakdownBtn: document.getElementById('aiBreakdownBtn'),
  clearDoneBtn: document.getElementById('clearDoneBtn'),
  board: document.getElementById('board'),
  lists: {
    todo: document.getElementById('todoList'),
    inprogress: document.getElementById('inprogressList'),
    done: document.getElementById('doneList')
  }
};

function persist() {
  localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity.slice(0, 20)));
}

function logActivity(text) {
  const time = new Date().toLocaleString();
  activity.unshift(`${time}: ${text}`);
}

function filteredTasks() {
  const query = refs.search.value.trim().toLowerCase();
  const priority = refs.priorityFilter.value;

  return tasks.filter((t) => {
    const queryMatch = [t.title, t.description, t.priority, t.status].join(' ').toLowerCase().includes(query);
    const priorityMatch = priority === 'all' ? true : t.priority === priority;
    return queryMatch && priorityMatch;
  });
}

function renderStats(list) {
  const total = list.length;
  const done = list.filter((t) => t.status === 'done').length;
  const high = list.filter((t) => t.priority === 'high').length;
  const overdue = list.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
  const completion = total ? Math.round((done / total) * 100) : 0;

  refs.stats.innerHTML = `
    <article class="stat"><div>Total</div><strong>${total}</strong></article>
    <article class="stat"><div>Done</div><strong>${done}</strong></article>
    <article class="stat"><div>High Priority</div><strong>${high}</strong></article>
    <article class="stat"><div>Overdue</div><strong>${overdue}</strong></article>
    <article class="stat"><div>Completion</div><strong>${completion}%</strong></article>
  `;
}

function taskTemplate(task) {
  return `
    <article class="task" draggable="true" data-id="${task.id}">
      <div class="task-head">
        <strong>${task.title}</strong>
        <div class="task-actions">
          <button class="small edit" data-action="edit" data-id="${task.id}" type="button">Edit</button>
          <button class="small delete" data-action="delete" data-id="${task.id}" type="button">Delete</button>
        </div>
      </div>
      <p>${task.description || 'No description'}</p>
      <div class="meta">
        <span class="badge ${task.priority}">${task.priority}</span>
        <span>${task.dueDate || 'No due date'}</span>
      </div>
    </article>
  `;
}

function renderActivity() {
  refs.activityList.innerHTML = activity.slice(0, 8).map((a) => `<li>${a}</li>`).join('') || '<li>No activity yet.</li>';
}

function render() {
  const list = filteredTasks();

  ['todo', 'inprogress', 'done'].forEach((status) => {
    refs.lists[status].innerHTML = list
      .filter((t) => t.status === status)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(taskTemplate)
      .join('');
  });

  renderStats(list);
  renderActivity();
  refs.statusText.textContent = `Showing ${list.length} task(s)`;
}

function openModal(task) {
  refs.form.reset();
  if (task) {
    refs.modalTitle.textContent = 'Edit Task';
    refs.form.id.value = task.id;
    refs.form.title.value = task.title;
    refs.form.description.value = task.description;
    refs.form.priority.value = task.priority;
    refs.form.dueDate.value = task.dueDate;
  } else {
    refs.modalTitle.textContent = 'Add Task';
  }
  refs.modal.showModal();
}

function handleBoardClick(event) {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;

  const id = btn.dataset.id;
  if (btn.dataset.action === 'delete') {
    const task = tasks.find((t) => t.id === id);
    tasks = tasks.filter((t) => t.id !== id);
    logActivity(`Deleted task \"${task ? task.title : id}\"`);
    persist();
    render();
    return;
  }

  if (btn.dataset.action === 'edit') {
    const task = tasks.find((t) => t.id === id);
    if (task) openModal(task);
  }
}

function setupDrag() {
  document.addEventListener('dragstart', (event) => {
    const taskNode = event.target.closest('.task');
    if (!taskNode) return;
    dragTaskId = taskNode.dataset.id;
  });

  document.querySelectorAll('.column').forEach((col) => {
    const status = col.dataset.status;

    col.addEventListener('dragover', (event) => {
      event.preventDefault();
      col.classList.add('over');
    });

    col.addEventListener('dragleave', () => col.classList.remove('over'));

    col.addEventListener('drop', (event) => {
      event.preventDefault();
      col.classList.remove('over');
      if (!dragTaskId) return;

      tasks = tasks.map((t) => (t.id === dragTaskId ? { ...t, status } : t));
      const moved = tasks.find((t) => t.id === dragTaskId);
      logActivity(`Moved \"${moved ? moved.title : dragTaskId}\" to ${status}`);
      dragTaskId = null;
      persist();
      render();
    });
  });
}

function autoPrioritize() {
  const now = new Date();
  tasks = tasks.map((t) => {
    const text = `${t.title} ${t.description}`.toLowerCase();
    const dueSoon = t.dueDate && (new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 3;

    if (dueSoon || text.includes('urgent') || text.includes('bug') || text.includes('client')) {
      return { ...t, priority: 'high' };
    }
    if (text.includes('review') || text.includes('api') || text.includes('testing')) {
      return { ...t, priority: 'medium' };
    }
    return { ...t, priority: 'low' };
  });
  logActivity('AI auto-prioritized tasks based on due date and keywords');
  persist();
  render();
}

function createAIPlan() {
  const todo = tasks.filter((t) => t.status === 'todo');
  const inprogress = tasks.filter((t) => t.status === 'inprogress');
  const high = tasks.filter((t) => t.priority === 'high');
  const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');

  const suggestions = [];
  suggestions.push(`Focus slot 1: Resolve ${Math.min(2, high.length)} high-priority task(s) first.`);
  suggestions.push(`Focus slot 2: Move ${Math.min(2, todo.length)} task(s) from To Do to In Progress.`);
  suggestions.push(`WIP balance: Keep in-progress tasks under ${Math.max(2, Math.ceil(inprogress.length / 2) + 1)} items.`);
  if (overdue.length) suggestions.push(`Urgent: ${overdue.length} task(s) are overdue. Reassign or close today.`);
  suggestions.push('Daily routine: 15 minutes planning, 90 minutes deep work, 15 minutes review.');

  refs.aiInsights.innerHTML = suggestions.map((s) => `<li>${s}</li>`).join('');
  logActivity('Generated AI sprint plan');
  persist();
  renderActivity();
}

function breakdownHighPriority() {
  const target = tasks.find((t) => t.priority === 'high' && t.status !== 'done');
  if (!target) {
    refs.aiInsights.innerHTML = '<li>No active high-priority task found for breakdown.</li>';
    return;
  }

  const points = [
    `Clarify acceptance criteria for \"${target.title}\"`,
    'Create implementation checklist with 3 deliverables',
    'Build and test the first deliverable',
    'Run QA pass and edge-case checks',
    'Share update and move task based on completion status'
  ];

  refs.aiInsights.innerHTML = points.map((p) => `<li>${p}</li>`).join('');
  logActivity(`Generated AI task breakdown for \"${target.title}\"`);
  persist();
  renderActivity();
}

refs.newTaskBtn.addEventListener('click', () => openModal());
refs.cancelBtn.addEventListener('click', () => refs.modal.close());
refs.search.addEventListener('input', render);
refs.priorityFilter.addEventListener('change', render);
refs.autoPrioritizeBtn.addEventListener('click', autoPrioritize);
refs.aiPlanBtn.addEventListener('click', createAIPlan);
refs.aiBreakdownBtn.addEventListener('click', breakdownHighPriority);
refs.board.addEventListener('click', handleBoardClick);

refs.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(refs.form);
  const id = String(data.get('id') || '');
  const payload = {
    title: String(data.get('title') || ''),
    description: String(data.get('description') || ''),
    priority: String(data.get('priority') || 'medium'),
    dueDate: String(data.get('dueDate') || '')
  };

  if (id) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, ...payload } : t));
    logActivity(`Updated task \"${payload.title}\"`);
  } else {
    tasks.push({ id: crypto.randomUUID(), ...payload, status: 'todo', createdAt: Date.now() });
    logActivity(`Created task \"${payload.title}\"`);
  }

  refs.modal.close();
  persist();
  render();
});

refs.clearDoneBtn.addEventListener('click', () => {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.status !== 'done');
  logActivity(`Cleared ${before - tasks.length} completed task(s)`);
  persist();
  render();
});

refs.exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'taskflow-pro-backup.json';
  a.click();
  URL.revokeObjectURL(url);
  logActivity('Exported tasks to JSON');
  persist();
  render();
});

refs.importInput.addEventListener('change', async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Invalid format');
    tasks = parsed;
    logActivity(`Imported ${parsed.length} task(s)`);
    persist();
    render();
  } catch (_err) {
    refs.statusText.textContent = 'Import failed: invalid JSON format';
  }
  refs.importInput.value = '';
});

setupDrag();
createAIPlan();
render();
persist();

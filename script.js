(() => {
  "use strict";

  const STORAGE_KEY = "tasks";
  const THEME_KEY = "task-manager-theme";
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const VALID_CATEGORIES = ["Personal", "Study", "Work", "Health", "Other"];

  const elements = {
    taskForm: document.getElementById("taskForm"),
    taskInput: document.getElementById("taskInput"),
    taskCategory: document.getElementById("taskCategory"),
    taskPriority: document.getElementById("taskPriority"),
    taskDueDate: document.getElementById("taskDueDate"),
    formError: document.getElementById("formError"),
    taskList: document.getElementById("taskList"),
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
    filterButtons: [...document.querySelectorAll("[data-filter]")],
    visibleCount: document.getElementById("visibleCount"),
    emptyState: document.getElementById("emptyState"),
    emptyTitle: document.getElementById("emptyTitle"),
    emptyDescription: document.getElementById("emptyDescription"),
    totalCount: document.getElementById("totalCount"),
    pendingCount: document.getElementById("pendingCount"),
    completedCount: document.getElementById("completedCount"),
    progressPercent: document.getElementById("progressPercent"),
    progressMessage: document.getElementById("progressMessage"),
    progressBar: document.getElementById("progressBar"),
    progressFill: document.getElementById("progressFill"),
    clearCompleted: document.getElementById("clearCompleted"),
    editDialog: document.getElementById("editDialog"),
    editForm: document.getElementById("editForm"),
    editTaskId: document.getElementById("editTaskId"),
    editTaskInput: document.getElementById("editTaskInput"),
    editCategory: document.getElementById("editCategory"),
    editPriority: document.getElementById("editPriority"),
    editDueDate: document.getElementById("editDueDate"),
    editError: document.getElementById("editError"),
    cancelEdit: document.getElementById("cancelEdit"),
    closeEdit: document.getElementById("closeEdit"),
    themeToggle: document.getElementById("themeToggle"),
    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toastMessage"),
    undoDelete: document.getElementById("undoDelete"),
    dismissToast: document.getElementById("dismissToast")
  };

  let currentFilter = "all";
  let lastDeletedTask = null;
  let toastTimer = null;
  let undoTimer = null;
  let tasks = loadTasks();

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "task-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function normalizeTask(task) {
    if (!task || typeof task !== "object" || typeof task.text !== "string") return null;
    const text = task.text.trim().slice(0, 160);
    if (!text) return null;

    return {
      id: typeof task.id === "string" && task.id ? task.id : makeId(),
      text,
      done: task.done === true,
      priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
      category: VALID_CATEGORIES.includes(task.category) ? task.category : "Personal",
      dueDate: typeof task.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) ? task.dueDate : "",
      createdAt: Number.isFinite(task.createdAt) ? task.createdAt : Date.now()
    };
  }

  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error("Saved tasks are not an array.");
      return parsed.map(normalizeTask).filter(Boolean);
    } catch (error) {
      console.error("Could not load saved tasks:", error);
      window.setTimeout(() => showToast("Saved task data could not be read. Add a new task to start fresh."), 0);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error("Could not save tasks:", error);
      showToast("Changes are visible, but this browser could not save them.");
      return false;
    }
  }

  function showToast(message, canUndo = false) {
    window.clearTimeout(toastTimer);
    elements.toastMessage.textContent = message;
    elements.undoDelete.hidden = !canUndo;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => hideToast(), canUndo ? 7000 : 3800);
  }

  function hideToast() {
    elements.toast.classList.remove("is-visible");
    window.clearTimeout(toastTimer);
    window.clearTimeout(undoTimer);
    if (lastDeletedTask) {
      lastDeletedTask = null;
    }
    elements.undoDelete.hidden = true;
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString + "T12:00:00");
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function isOverdue(task) {
    if (!task.dueDate || task.done) return false;
    const today = new Date();
    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");
    return task.dueDate < todayKey;
  }

  function createChip(label, className = "") {
    const chip = document.createElement("span");
    chip.className = "meta-chip" + (className ? " " + className : "");
    chip.textContent = label;
    return chip;
  }

  function getVisibleTasks() {
    const query = elements.searchInput.value.trim().toLocaleLowerCase();
    let visible = tasks.filter((task) => {
      if (currentFilter === "completed" && !task.done) return false;
      if (currentFilter === "pending" && task.done) return false;
      const searchable = [task.text, task.category, task.priority].join(" ").toLocaleLowerCase();
      return !query || searchable.includes(query);
    });

    const sort = elements.sortSelect.value;
    visible.sort((a, b) => {
      if (sort === "dueDate") {
        if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate) || b.createdAt - a.createdAt;
      }
      if (sort === "priority") {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.createdAt - a.createdAt;
      }
      if (sort === "alphabetical") return a.text.localeCompare(b.text);
      return b.createdAt - a.createdAt;
    });
    return visible;
  }

  function createTaskElement(task) {
    const item = document.createElement("li");
    item.className = "task-item" + (task.done ? " is-completed" : "");
    item.dataset.taskId = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.done;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", (task.done ? "Mark as to do: " : "Mark completed: ") + task.text);

    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.text;
    content.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.appendChild(createChip(task.category));
    meta.appendChild(createChip(task.priority[0].toUpperCase() + task.priority.slice(1) + " priority", "priority-" + task.priority));

    if (task.dueDate) {
      const due = createChip((isOverdue(task) ? "Overdue · " : "Due · ") + formatDate(task.dueDate), isOverdue(task) ? "due-overdue" : "");
      meta.appendChild(due);
    }
    content.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "action-button";
    editButton.textContent = "Edit";
    editButton.dataset.action = "edit";
    editButton.setAttribute("aria-label", "Edit task: " + task.text);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "action-button delete";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.action = "delete";
    deleteButton.setAttribute("aria-label", "Delete task: " + task.text);

    actions.append(editButton, deleteButton);
    item.append(checkbox, content, actions);
    return item;
  }

  function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.done).length;
    const pending = total - completed;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    elements.totalCount.textContent = String(total);
    elements.pendingCount.textContent = String(pending);
    elements.completedCount.textContent = String(completed);
    elements.progressPercent.textContent = percent + "%";
    elements.progressMessage.textContent = total
      ? completed === total ? "Everything is complete. Nice work!" : pending + " task" + (pending === 1 ? "" : "s") + " left to go."
      : "Every completed task counts.";
    elements.progressFill.style.width = percent + "%";
    elements.progressBar.setAttribute("aria-valuenow", String(percent));
    elements.clearCompleted.disabled = completed === 0;
  }

  function renderTasks() {
    const visible = getVisibleTasks();
    const fragment = document.createDocumentFragment();
    visible.forEach((task) => fragment.appendChild(createTaskElement(task)));
    elements.taskList.replaceChildren(fragment);
    elements.visibleCount.textContent = String(visible.length);
    elements.emptyState.hidden = visible.length > 0;

    if (tasks.length === 0) {
      elements.emptyTitle.textContent = "A fresh start";
      elements.emptyDescription.textContent = "Add your first task above and make today count.";
    } else if (visible.length === 0) {
      elements.emptyTitle.textContent = elements.searchInput.value.trim() ? "No matching tasks" : "Nothing in this view";
      elements.emptyDescription.textContent = elements.searchInput.value.trim()
        ? "Try a different search term or clear your search."
        : "Try another filter or add a new task.";
    }

    elements.filterButtons.forEach((button) => {
      const active = button.dataset.filter === currentFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderStats();
  }

  function addTask(event) {
    event.preventDefault();
    const text = elements.taskInput.value.trim();
    if (!text) {
      showFormError(elements.formError, "Please enter a task name.");
      elements.taskInput.focus();
      return;
    }

    tasks.unshift({
      id: makeId(),
      text,
      done: false,
      category: elements.taskCategory.value,
      priority: elements.taskPriority.value,
      dueDate: elements.taskDueDate.value,
      createdAt: Date.now()
    });

    saveTasks();
    elements.taskForm.reset();
    elements.taskPriority.value = "medium";
    hideFormError(elements.formError);
    currentFilter = "all";
    renderTasks();
    elements.taskInput.focus();
    showToast("Task added successfully.");
  }

  function showFormError(element, message) {
    element.textContent = message;
    element.hidden = false;
  }

  function hideFormError(element) {
    element.textContent = "";
    element.hidden = true;
  }

  function openEditDialog(task) {
    elements.editTaskId.value = task.id;
    elements.editTaskInput.value = task.text;
    elements.editCategory.value = task.category;
    elements.editPriority.value = task.priority;
    elements.editDueDate.value = task.dueDate;
    hideFormError(elements.editError);
    elements.editDialog.showModal();
    elements.editTaskInput.focus();
  }

  function saveEditedTask(event) {
    event.preventDefault();
    const task = tasks.find((item) => item.id === elements.editTaskId.value);
    const text = elements.editTaskInput.value.trim();
    if (!task) {
      hideEditDialog();
      return;
    }
    if (!text) {
      showFormError(elements.editError, "Task name cannot be empty.");
      elements.editTaskInput.focus();
      return;
    }

    task.text = text.slice(0, 160);
    task.category = elements.editCategory.value;
    task.priority = elements.editPriority.value;
    task.dueDate = elements.editDueDate.value;
    saveTasks();
    hideEditDialog();
    renderTasks();
    showToast("Task updated.");
  }

  function hideEditDialog() {
    if (elements.editDialog.open) elements.editDialog.close();
    hideFormError(elements.editError);
  }

  function deleteTask(task) {
    const index = tasks.findIndex((item) => item.id === task.id);
    if (index < 0) return;
    lastDeletedTask = { task: { ...task }, index };
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    showToast("Task deleted.", true);
  }

  function undoDelete() {
    if (!lastDeletedTask) return;
    const { task, index } = lastDeletedTask;
    tasks.splice(Math.min(index, tasks.length), 0, task);
    lastDeletedTask = null;
    saveTasks();
    renderTasks();
    hideToast();
    showToast("Task restored.");
  }

  function clearCompleted() {
    const completedCount = tasks.filter((task) => task.done).length;
    if (!completedCount) return;
    const confirmed = window.confirm("Delete " + completedCount + " completed task" + (completedCount === 1 ? "" : "s") + "? This cannot be undone as a group.");
    if (!confirmed) return;
    tasks = tasks.filter((task) => !task.done);
    saveTasks();
    renderTasks();
    showToast("Completed tasks cleared.");
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    elements.themeToggle.textContent = isDark ? "☀" : "☾";
    elements.themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    elements.themeToggle.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch (error) {
      console.warn("Theme preference could not be saved:", error);
    }
  }

  function initializeTheme() {
    let theme = "light";
    try {
      theme = localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch (error) {
      console.warn("Theme preference could not be loaded:", error);
    }
    applyTheme(theme);
  }

  elements.taskForm.addEventListener("submit", addTask);
  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      renderTasks();
    });
  });
  elements.searchInput.addEventListener("input", renderTasks);
  elements.sortSelect.addEventListener("change", renderTasks);

  elements.taskList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = button.closest("[data-task-id]");
    if (!item) return;
    const task = tasks.find((candidate) => candidate.id === item.dataset.taskId);
    if (!task) return;

    if (button.dataset.action === "edit") openEditDialog(task);
    if (button.dataset.action === "delete") deleteTask(task);
  });

  elements.taskList.addEventListener("change", (event) => {
    if (!event.target.matches('input[data-action="toggle"]')) return;
    const item = event.target.closest("[data-task-id]");
    const task = item && tasks.find((candidate) => candidate.id === item.dataset.taskId);
    if (!task) return;
    task.done = event.target.checked;
    saveTasks();
    renderTasks();
    showToast(task.done ? "Task marked as completed." : "Task moved back to to do.");
  });

  elements.editForm.addEventListener("submit", saveEditedTask);
  elements.cancelEdit.addEventListener("click", hideEditDialog);
  elements.closeEdit.addEventListener("click", hideEditDialog);
  elements.editDialog.addEventListener("click", (event) => {
    if (event.target === elements.editDialog) hideEditDialog();
  });
  elements.clearCompleted.addEventListener("click", clearCompleted);
  elements.themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
  elements.undoDelete.addEventListener("click", undoDelete);
  elements.dismissToast.addEventListener("click", hideToast);

  initializeTheme();
  renderTasks();
})();
# Task Manager Pro

A responsive, browser-based task manager built with HTML, CSS, and vanilla JavaScript. It helps you organize tasks by category, priority, and due date while keeping a clear view of your progress.

## Features

- Create, edit, and delete tasks.
- Mark tasks complete or move them back to to-do.
- Search by task name, category, or priority.
- Filter all, to-do, and completed tasks.
- Sort by recently added, due date, priority, or task name.
- Set categories: Personal, Study, Work, Health, and Other.
- Set low, medium, or high priority.
- Add due dates and identify overdue tasks.
- View total, pending, completed, and completion percentage.
- Undo the most recent task deletion.
- Clear completed tasks after confirmation.
- Switch between light and dark themes.
- Responsive layout and keyboard-accessible controls.
- Save tasks and theme preference in browser localStorage.
- Load and normalize tasks saved by the earlier version of this project.

## Tech stack

- HTML5
- CSS3 (responsive layout, CSS custom properties, light/dark theme)
- Vanilla JavaScript (DOM APIs, events, arrays, objects, JSON, localStorage)

No framework, package installation, backend, or database is required.

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

For local development, you can also use the Live Server extension in Visual Studio Code.

## Data and privacy

Tasks are stored in the current browser's localStorage. They are not uploaded to a server and do not automatically sync across browsers or devices. Clearing browser site data may remove saved tasks. This version does not provide user accounts, cloud backup, or cross-device synchronization.

## Project structure

```text
task-manager/
├── index.html   # App structure and accessible controls
├── style.css    # Responsive styling and theme tokens
├── script.js    # Task state, rendering, filtering, sorting, and storage
└── README.md    # Project documentation
```

## Manual test checklist

- [ ] Add a normal task and verify it appears in the list.
- [ ] Submit whitespace-only input and verify no task is created.
- [ ] Edit a task name, category, priority, and due date.
- [ ] Cancel editing and verify the task is unchanged.
- [ ] Toggle a task completed and back to to-do.
- [ ] Verify All, To do, and Completed filters.
- [ ] Search by task name and category.
- [ ] Sort by due date, priority, and alphabetical order.
- [ ] Delete a task and use Undo before the notification disappears.
- [ ] Clear completed tasks and cancel/confirm the prompt.
- [ ] Refresh the page and verify tasks and theme persist.
- [ ] Test narrow mobile widths and keyboard-only navigation.
- [ ] Verify a task with a past due date is shown as overdue.

## Known limitations

- Data is local to the browser and is not synchronized.
- Browser storage can be cleared or unavailable; the app reports storage failures.
- The application has no account system or server-side database.
- Automated browser tests and a full accessibility audit have not yet been run.

## Future improvements

Potential next steps include automated tests, export/import, recurring tasks, reminders, and optional cloud synchronization with authentication.

document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const newTodoInput = document.getElementById('new-todo-item');
    const todoList = document.getElementById('todo-list');
    const errorMessage = document.getElementById('error-message');
    const noTasksMessage = document.getElementById('no-tasks-message');
    let todos = []; // Array to store todo objects: { id: Date.now(), text: 'Task', completed: false }

    // --- Helper Functions ---

    function showErrorMessage(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('error-hidden');
        newTodoInput.setAttribute('aria-invalid', 'true'); // Indicate invalid input
        newTodoInput.focus(); // Set focus back to input for correction
    }

    function hideErrorMessage() {
        errorMessage.classList.add('error-hidden');
        newTodoInput.removeAttribute('aria-invalid');
    }

    function updateNoTasksMessage() {
        if (todos.length === 0) {
            noTasksMessage.style.display = 'block';
        } else {
            noTasksMessage.style.display = 'none';
        }
    }

    // --- Render Function ---
    function renderTodos() {
        todoList.innerHTML = ''; // Clear existing list items

        if (todos.length === 0) {
            updateNoTasksMessage();
            return;
        }

        todos.forEach(todo => {
            const listItem = document.createElement('li');
            listItem.setAttribute('id', `todo-item-${todo.id}`);
            listItem.classList.add('todo-item');
            if (todo.completed) {
                listItem.classList.add('completed');
            }

            // Screen reader announcement for new tasks
            // For existing tasks after render, we don't need this, but good for adding
            // For a production app, you'd manage live region updates more precisely.
            if (todo.isNew) { // A temporary flag to indicate a new item just added
                listItem.setAttribute('role', 'status'); // Announce status change
                listItem.setAttribute('aria-live', 'polite');
                delete todo.isNew; // Remove the flag after it's rendered
            }


            const todoTextSpan = document.createElement('span');
            todoTextSpan.classList.add('todo-item-text');
            todoTextSpan.textContent = todo.text;
            if (todo.completed) {
                todoTextSpan.classList.add('completed');
                // For screen readers, explicit text might be better than just strikethrough
                todoTextSpan.setAttribute('aria-label', `Completed task: ${todo.text}`);
            } else {
                 todoTextSpan.setAttribute('aria-label', `Task: ${todo.text}`);
            }


            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('actions');

            const completeButton = document.createElement('button');
            completeButton.classList.add('complete-btn');
            completeButton.textContent = todo.completed ? 'Undo' : 'Complete';
            completeButton.setAttribute('aria-label', todo.completed ? `Mark ${todo.text} as incomplete` : `Mark ${todo.text} as complete`);
            completeButton.addEventListener('click', () => toggleComplete(todo.id));

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-btn');
            deleteButton.textContent = 'Delete';
            deleteButton.setAttribute('aria-label', `Delete task: ${todo.text}`);
            deleteButton.addEventListener('click', () => deleteTodo(todo.id));

            actionsDiv.append(completeButton, deleteButton);
            listItem.append(todoTextSpan, actionsDiv);
            todoList.append(listItem);
        });

        updateNoTasksMessage();
    }

    // --- Event Handlers and Logic ---

    todoForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const newTodoText = newTodoInput.value.trim();

        if (newTodoText === '') {
            showErrorMessage('Please enter a task before adding.');
            return;
        }

        hideErrorMessage(); // Hide error if user types after an error

        const newTodo = {
            id: Date.now(),
            text: newTodoText,
            completed: false,
            isNew: true // Flag to potentially trigger an aria-live announcement
        };
        todos.push(newTodo);
        newTodoInput.value = ''; // Clear input field
        renderTodos();
        newTodoInput.focus(); // Return focus to input for adding another item

        // Announce the new task being added using aria-live (handled in renderTodos)
        // For more complex apps, you might use a dedicated live region for this.
    });

    function toggleComplete(id) {
        const todoIndex = todos.findIndex(todo => todo.id === id);
        if (todoIndex > -1) {
            todos[todoIndex].completed = !todos[todoIndex].completed;
            renderTodos();
            // Announce status change for screen readers after re-rendering
            const updatedTodo = todos[todoIndex];
            const statusMessage = updatedTodo.completed ? `${updatedTodo.text} marked as complete.` : `${updatedTodo.text} marked as incomplete.`;
            announceToScreenReader(statusMessage, 'polite');
        }
    }

    function deleteTodo(id) {
        const todoToDelete = todos.find(todo => todo.id === id);
        if (confirm(`Are you sure you want to delete "${todoToDelete.text}"?`)) {
            todos = todos.filter(todo => todo.id !== id);
            renderTodos();
            announceToScreenReader(`${todoToDelete.text} deleted.`, 'assertive');
            newTodoInput.focus(); // Return focus to input after deletion
        }
    }

    // A generic function to announce messages to screen readers
    // In a real app, you might have a hidden aria-live region for this
    function announceToScreenReader(message, politeness = 'polite') {
        const liveRegion = document.getElementById('screen-reader-announcer');
        if (!liveRegion) {
            const newLiveRegion = document.createElement('div');
            newLiveRegion.id = 'screen-reader-announcer';
            newLiveRegion.classList.add('sr-only');
            document.body.appendChild(newLiveRegion);
            liveRegion = newLiveRegion;
        }
        liveRegion.setAttribute('aria-live', politeness);
        liveRegion.textContent = message;
        // Clear after a short delay to ensure it re-announces if same message appears
        setTimeout(() => liveRegion.textContent = '', 500);
    }


    // --- Initial Render on Load ---
    updateNoTasksMessage(); // Ensure initial message is correct
    // In a real app, you'd load todos from local storage here
    renderTodos();
});
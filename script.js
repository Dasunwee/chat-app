const socket = io();
const form = document.getElementById('message-form');
const input = document.getElementById('message-input');
const messages = document.getElementById('messages');
const usersList = document.getElementById('users-list');
const userCount = document.getElementById('user-count');

// Prompt for username
const username = prompt('Enter your name:') || `User${Math.floor(Math.random() * 1000)}`;
socket.emit('new user', username);

// Display system message
function addSystemMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message system';
    messageElement.innerHTML = `<em>${text}</em>`;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
}

// Display chat message
function addChatMessage(data, isSent = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    
    messageElement.innerHTML = `
        <div class="message-info">
            ${!isSent ? `<strong>${data.user}</strong>` : ''}
            <span>${data.time}</span>
        </div>
        <div class="message-text">${data.text}</div>
    `;
    
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
}

// Update user list
function updateUserList(users) {
    usersList.innerHTML = '';
    userCount.textContent = users.length;
    
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="user-status"></span>
            ${user} ${user === username ? '(You)' : ''}
        `;
        usersList.appendChild(li);
    });
}

// Update just the message submission part:
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value.trim()) {
        // Only emit to server - don't display locally yet
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

// Socket events
socket.on('user joined', (username) => {
    addSystemMessage(`${username} joined the chat`);
});

socket.on('user left', (username) => {
    addSystemMessage(`${username} left the chat`);
});

socket.on('update users', (users) => {
    updateUserList(users);
});

// Let the server echo handle the display
socket.on('chat message', (data) => {
    addChatMessage(data, data.user === username); // Only display once
});
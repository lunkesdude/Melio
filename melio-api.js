// ============================================
// MELIO API — Подключение к серверу
// ============================================

const SERVER_URL = 'https://melio-backend.vercel.app';

// Socket.io подключение
let socket = null;
let currentUser = null;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

function initMelioAPI() {
    socket = io(SERVER_URL);
    
    socket.on('connect', () => {
        console.log('✅ Melio: Подключились к серверу!');
        
        const session = JSON.parse(localStorage.getItem('melio_session') || '{}');
        if (session.userId) {
            socket.emit('auth', session.userId);
            currentUser = session.userId;
        }
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Melio: Отключились от сервера');
    });
    
    socket.on('connect_error', (err) => {
        console.error('⚠️ Melio: Ошибка подключения:', err.message);
    });
    
    return socket;
}

// ============================================
// АВТОРИЗАЦИЯ
// ============================================

const MelioAuth = {
    async register({ name, username, password }) {
        const response = await fetch(`${SERVER_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка регистрации');
        }
        
        localStorage.setItem('melio_session', JSON.stringify({
            userId: data.user.id,
            loggedIn: true
        }));
        
        currentUser = data.user.id;
        
        if (socket && socket.connected) {
            socket.emit('auth', data.user.id);
        }
        
        return { success: true, user: data.user };
    },
    
    async login({ nameOrUsername, password }) {
        const response = await fetch(`${SERVER_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nameOrUsername, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Неверные данные');
        }
        
        localStorage.setItem('melio_session', JSON.stringify({
            userId: data.user.id,
            loggedIn: true
        }));
        
        currentUser = data.user.id;
        
        if (socket && socket.connected) {
            socket.emit('auth', data.user.id);
        }
        
        return { success: true, user: data.user };
    },
    
    logout() {
        localStorage.removeItem('melio_session');
        currentUser = null;
        if (socket) {
            socket.disconnect();
        }
    },
    
    getSession() {
        return JSON.parse(localStorage.getItem('melio_session') || '{}');
    },
    
    isLoggedIn() {
        const session = this.getSession();
        return session.loggedIn === true;
    }
};

// ============================================
// СООБЩЕНИЯ
// ============================================

const MelioChat = {
    send(text, chatId = 'main') {
        if (!socket || !socket.connected) {
            console.error('❌ Нет подключения к серверу');
            return false;
        }
        
        socket.emit('send_message', { chatId, text });
        return true;
    },
    
    typing(chatId = 'main') {
        if (socket && socket.connected) {
            socket.emit('typing', { chatId });
        }
    },
    
    onMessage(callback) {
        if (socket) {
            socket.on('new_message', callback);
        }
    },
    
    onHistory(callback) {
        if (socket) {
            socket.on('messages_history', callback);
        }
    },
    
    onTyping(callback) {
        if (socket) {
            socket.on('user_typing', callback);
        }
    }
};

// ============================================
// ПОЛЬЗОВАТЕЛИ
// ============================================

const MelioUsers = {
    async getAll() {
        const response = await fetch(`${SERVER_URL}/api/users`);
        return await response.json();
    },
    
    onUserOnline(callback) {
        if (socket) {
            socket.on('user_online', callback);
        }
    },
    
    onUserOffline(callback) {
        if (socket) {
            socket.on('user_offline', callback);
        }
    }
};

// ============================================
// ЭКСПОРТ
// ============================================

const Melio = {
    init: initMelioAPI,
    auth: MelioAuth,
    chat: MelioChat,
    users: MelioUsers,
    getSocket: () => socket,
    getCurrentUser: () => currentUser
};

console.log('💎 Melio API загружен');

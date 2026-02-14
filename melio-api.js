// ============================================
// MELIO API — Подключение к серверу
// ============================================

const SERVER_URL = 'https://ТВОЯ_ССЫЛКА.onrender.com'; // ← Замени на свою!

// Socket.io подключение
let socket = null;
let currentUser = null;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

function initMelioAPI() {
    // Подключаемся к серверу
    socket = io(SERVER_URL);
    
    socket.on('connect', () => {
        console.log('✅ Melio: Подключились к серверу!');
        
        // Авторизуемся если есть сессия
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
        console.log('⚠️ Melio: Ошибка подключения:', err.message);
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
        
        // Сохраняем сессию
        localStorage.setItem('melio_session', JSON.stringify({
            userId: data.user.id,
            loggedIn: true
        }));
        
        currentUser = data.user.id;
        
        // Авторизуемся через сокет
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
        

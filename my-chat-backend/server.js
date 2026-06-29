const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Stone Simulator Chat Server is running');
});

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ server });

// Хранилище активных пользователей: id -> { ws, username }
const users = new Map();

wss.on('connection', (ws) => {
    const userId = Math.random().toString(36).substring(2, 9);
    let currentUsername = 'Аноним';
    
    // Сразу записываем пользователя
    users.set(userId, { ws, username: currentUsername });

    // Функция для отправки списка всех онлайн-игроков
    function broadcastUserList() {
        const list = Array.from(users.entries()).map(([id, u]) => ({ id, username: u.username }));
        const packet = JSON.stringify({ type: 'user_list', users: list });
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) client.send(packet);
        });
    }

    // Отправляем игроку его личный ID
    ws.send(JSON.stringify({ type: 'init', yourId: userId }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            // 1. Обновление профиля/ника
            if (data.type === 'set_profile') {
                currentUsername = data.username || 'Аноним';
                if (users.has(userId)) {
                    users.get(userId).username = currentUsername;
                }
                broadcastUserList();
            }

            // 2. Глобальное сообщение
            if (data.type === 'global') {
                const packet = JSON.stringify({ type: 'global', fromId: userId, username: currentUsername, text: data.text });
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) client.send(packet);
                });
            }

            // 3. Личное сообщение (ЛС)
            if (data.type === 'private') {
                const target = users.get(data.targetId);
                const packet = JSON.stringify({ 
                    type: 'private', 
                    fromId: userId, 
                    targetId: data.targetId,
                    username: currentUsername, 
                    text: data.text 
                });
                
                // Отправляем получателю
                if (target && target.ws.readyState === WebSocket.OPEN) {
                    target.ws.send(packet);
                }
                // Отправляем себе (автору), чтобы отобразилось в окне
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(packet);
                }
            }

        } catch (e) {
            console.error('Ошибка обработки сообщения:', e);
        }
    });

    ws.on('close', () => {
        users.delete(userId);
        broadcastUserList();
    });
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

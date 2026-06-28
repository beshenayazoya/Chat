const WebSocket = require('ws');

// Порт задается хостингом автоматически или используется 8080 локально
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`Сервер запущен на порту ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Новый пользователь подключился');

    ws.on('message', (message) => {
        console.log(`Получено: ${message}`);
        
        // Пересылаем сообщение ВСЕМ подключенным клиентам
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log('Пользователь отключился');
    });
});
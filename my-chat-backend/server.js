const http = require('http');
const WebSocket = require('ws');

// Создаем стандартный HTTP сервер, который требует Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running');
});

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Новый пользователь подключился');

    ws.on('message', (message) => {
        console.log(`Получено: ${message}`);
        // Пересылаем сообщение всем
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => console.log('Пользователь отключился'));
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

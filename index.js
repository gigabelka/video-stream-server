const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const path = require('path');
const { Server } = require("socket.io");
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;
const fps = 1;
let updtTime = 1000;
let timer = null;
let motion = false;

const autoUpdate = () => {
    io.emit('image', 'data');

    clearTimeout(timer);
    timer = setTimeout(autoUpdate, updtTime / fps);
};
autoUpdate();

// io.on('connection', (socket) => {
//     socket.on('image', data => {
//         io.emit('image', data);
//     });
//     socket.on('motion', data => {
//         io.emit('chat message', data);
//     });
// });

app.use('/', express.static(__dirname + '/static'));
// app.get('/', (req, res) => {

// });

httpServer.listen(PORT, () => console.log(`HTTP server listening at http://localhost:${PORT}`));

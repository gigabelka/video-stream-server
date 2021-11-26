const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

// // array of connected websocket clients
// let connectedClients = [];

// wsServer.on('connection', (ws, req) => {
//     console.log('Connected');
//     // add new connected client
//     connectedClients.push(ws);
//     // listen for messages from the streamer, the clients will not send anything so we don't need to filter
//     ws.on('message', data => {
//         // send the base64 encoded frame to each connected ws
//         connectedClients.forEach((ws, i) => {
//             if (ws.readyState === ws.OPEN) { // check if it is still connected
//                 ws.send(data); // send
//             } else { // if it's not connected remove from the array of connected ws
//                 connectedClients.splice(i, 1);
//             }
//         });
//     });
// });

// app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, '/index.html')));
// app.get('/', (req, res) => {

// });
app.use('/', express.static(__dirname + '/static'));
// app.get('/streamer', (req, res) => res.sendFile(path.resolve(__dirname, '/streamer.html')));
httpServer.listen(PORT, () => console.log(`HTTP server listening at http://localhost:${PORT}`));

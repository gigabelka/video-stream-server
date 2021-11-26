const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const path = require('path');
const { Server } = require("socket.io");
const io = new Server(httpServer);
const mjpegDecoder = require('mjpeg-decoder');

const PORT = process.env.PORT || 3000;
const streamURL = 'http://192.168.0.11/motion/live/1';
let updtTime = 1000;
let timer = null;
let motion = false;
let frame = null;

const getFrame = async function (interval) {
    const decoder = new mjpegDecoder(streamURL, { interval: interval });

    decoder.on('frame', (frm, seq) => {
        frame = frm;
        const image = frm.toString('base64');
        io.emit('image', image);
    });

    decoder.on('abort', (reason, err) => {
        console.log('decoder aborted for %s', reason, err);
    });

    decoder.start();
};

app.use('/', express.static(__dirname + '/static'));
// app.get('/', (req, res) => {});

httpServer.listen(PORT, () => {
    console.log(`HTTP server listening at http://localhost:${PORT}`)
    getFrame(updtTime);
});

const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const path = require('path');
const { Server } = require("socket.io");
const io = new Server(httpServer);
const mjpegDecoder = require('mjpeg-decoder');

const PORT = 3000;
const streamURL = 'http://192.168.0.11/motion/live/1';
let updtTime = 1000;
let motion = false;
let frame = null;
const decoder = new mjpegDecoder(streamURL, { interval: updtTime });

const getFrame = async function () {
    decoder.on('frame', (frm, seq) => {
        frame = frm;
        const image = frm.toString('base64');
        io.emit('image', image);
    });

    decoder.on('abort', (reason, err) => {
        console.log('decoder aborted for %s', reason, err);
    });

    decoder.start();
    // decoder.stop();
};

app.use('/', express.static(__dirname + '/static'));
// app.get('/', (req, res) => {});

httpServer.listen(PORT, () => {
    console.log(`HTTP server listening at http://localhost:${PORT}`)
    getFrame();
});

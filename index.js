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
let sleepTime = 60000;
let moveTime = 100;
let motion = false;
let frame = null;
let decoder = new mjpegDecoder(streamURL, { interval: sleepTime });

const getFrame = async function () {
    decoder.on('frame', (frm, seq) => {
        frame = frm;
        const image = frm.toString('base64');
        io.emit('image', image);

        if(motion){
            io.emit('motion', true);
        } else {
            io.emit('motion', false);
        }
    });

    decoder.on('abort', (reason, err) => {
        if (motion){
            decoder = new mjpegDecoder(streamURL, { interval: moveTime });
            console.log('motion');
        } else {
            decoder = new mjpegDecoder(streamURL, { interval: sleepTime });
            console.log('no motion');
        }
        getFrame();
    });

    decoder.start();
    // decoder.stop();
};

app.use('/', express.static(__dirname + '/static'));
app.get('/motion', (req, res) => {
    if(req.query.move == 'yes'){
        motion = true;
        decoder.stop();
    } else {
        motion = false;
        decoder.stop();
    }
});

httpServer.listen(PORT, () => {
    console.log(`HTTP server listening at http://localhost:${PORT}`)
    getFrame();
});

// http://localhost:3000/motion?move=yes(no)

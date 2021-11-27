const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(httpServer);
const mjpegDecoder = require('mjpeg-decoder');
const TelegramBot = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const token = require('./myPassword').token; // require('./password').token
const chatId = require('./myPassword').chatId; // require('./password').chatId

const port = 3000; // http server port
const streamURL = 'http://192.168.0.11/motion/live/1'; // external url video stream
const sleepTime = 60000; // time without motion
const moveTime = 100; // time with motion
const telebotTime = 10000; // TelegramBot time update foto
const bot = new TelegramBot(token, {polling: true});

let motion = false;
let frame = null;
let timer = null;
let decoder = new mjpegDecoder(streamURL, { interval: sleepTime });

const autoUpdate = () => {
    bot.sendPhoto(chatId, frame, {caption: dayjs().format('HH:mm:ss') });
    clearTimeout(timer);
    timer = setTimeout(autoUpdate, telebotTime);
};

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
            console.log('motion');
            decoder = new mjpegDecoder(streamURL, { interval: moveTime });
            autoUpdate();
        } else {
            console.log('no motion');
            decoder = new mjpegDecoder(streamURL, { interval: sleepTime });
            clearTimeout(timer);
        }
        getFrame();
    });

    decoder.start();
};

app.use('/', express.static(__dirname + '/static'));
app.get('/motion', (req, res) => {
    if(req.query.move == 'yes'){
        motion = true;
        decoder.stop();
        res.send(true);
    } else {
        motion = false;
        decoder.stop();
        res.send(false);
    }
});

httpServer.listen(port, () => {
    console.log(`HTTP server listening at http://localhost:${port}`)
    getFrame();
});

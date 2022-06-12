const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(httpServer);
const mjpegDecoder = require('mjpeg-decoder');
const TelegramBot = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const token = require('./myPassword').token; // require('./password').token
const chatIds = require('./myPassword').chatIds; // require('./password').chatIds
const os = require('os');
const fs = require('fs');
const internetAvailable = require("internet-available");

const port = 3000; // http server port
const streamURL = 'http://192.168.0.4:8000/camera/mjpeg'; // external url video stream
const sleepTime = 10000; // frametime without motion
const moveTime = 100; // frametime with motion
const telebotTime = 10000; // TelegramBot frametime update foto
const bot = new TelegramBot(token, {polling: true});
const myIP = os.networkInterfaces() && 
    os.networkInterfaces().Ethernet && 
    os.networkInterfaces().Ethernet[1] &&
    os.networkInterfaces().Ethernet[1].address ? 
    os.networkInterfaces().Ethernet[1].address : 'none';

let motion = false;
let frame = null;
let timer = null;
let decoder = new mjpegDecoder(streamURL, { interval: sleepTime });
let isInternet = true;
let lostPolling = false;

const autoUpdate = () => {
    if(!lostPolling && isInternet){
        chatIds.forEach(chatId => {
            bot.sendPhoto(chatId, frame, {caption: dayjs().format('HH:mm:ss') });
        });
    }
    clearTimeout(timer);
    timer = setTimeout(autoUpdate, telebotTime);
};

const autoUpdateInternetAvailable = () => {
    internetAvailable({
        timeout: 5000,
        retries: 5
    }).then(() => {
        // console.log("Internet available");
        isInternet = true;
    }).catch(() => {
        // console.log("No internet");
        isInternet = false;
    });

    if (isInternet && lostPolling) {
        bot.startPolling({
            restart: true,
        });
        lostPolling = false;
    }

    if(!isInternet && !lostPolling){
        bot.stopPolling({
            cancel: true,
            reason: 'Lost leader status'
        });
        lostPolling = true;
    } 

    setTimeout(autoUpdateInternetAvailable, 5000);
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
            decoder = new mjpegDecoder(streamURL, { interval: moveTime });

            autoUpdate();
        } else {
            decoder = new mjpegDecoder(streamURL, { interval: sleepTime });
            clearTimeout(timer);
        }
        getFrame();
    });

    decoder.start();
};

bot.on('message', msg => {
    chatIds.forEach(chatId => {
        if(chatId == msg.chat.id){
            const camFolder = './cam/';

            if(msg.text == '/start'){
                bot.sendMessage(chatId, '/getdirs Показать папки\n/getphoto Показать фото', {
                    reply_markup: {
                      resize_keyboard: true,
                      keyboard: [['/getdirs', '/getphoto']],
                    }
                });
            };

            if(msg.text == '/getdirs'){
                fs.readdirSync(camFolder).forEach(dir => {
                    bot.sendMessage(chatId, `/cam_${dir}`);
                });
            };

            if(msg.text == '/getphoto'){
                bot.sendPhoto(chatId, frame, {caption: dayjs().format('HH:mm:ss') });
            };

            const SplitMsg = msg.text.split('_');

            if(SplitMsg.length == 2 && SplitMsg[0] == '/cam'){
                fs.readdirSync(`${camFolder}/${SplitMsg[1]}`).forEach(file => {
                    const {size} = fs.statSync(`./cam/${SplitMsg[1]}/${file}`);
                    bot.sendMessage(chatId, `/cam_${SplitMsg[1]}_${file} (${(size / 1024 / 1024).toFixed(2)} Mb)`);
                });
            } else if (SplitMsg.length == 3 && SplitMsg[0] == '/cam'){
                bot.sendVideo(chatId, `./cam/${SplitMsg[1]}/${SplitMsg[2]}.mp4`);
            };
        }
    });
});

app.use(cors({ origin: '*'}));

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
    console.log(`server start at http://localhost:${port} http://${myIP}:${port}`);
    getFrame();
});

autoUpdateInternetAvailable();

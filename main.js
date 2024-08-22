process.on('uncaughtException', console.error);
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
require('events').EventEmitter.defaultMaxListeners = 500;
const { Baileys, InvCloud } = require('./system/baileys.js');
const { Jadibot } = new (require('./system/jadibot.js'));
const { groupAdd, groupRemove } = new (require('./system/groups'));
const func = require('./system/functions');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

/* additional config */
require('./config');

/* database setting */
global.jadibot = {};

// Capture the start time
const startTime = Date.now();

function getUptime() {
    const uptimeMs = Date.now() - startTime;
    const seconds = Math.floor((uptimeMs / 1000) % 60);
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
    const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Log uptime every 5 minutes
setInterval(() => {
    console.log(`Uptime: ${getUptime()}`);
}, 5 * 60 * 1000);

// On restart or crash, log the last uptime
process.on('exit', () => {
    console.log(`Bot stopped. Last uptime: ${getUptime()}`);
});

const socket = new Baileys({
    pairing: {
        ...global.pairing
    },
    session: 'session',
    online: true,
    version: [2, 2413, 51],
    browser: ['Windows', 'Chrome', '20.0.04']
});

/* starting to connect */
socket.on('connect', async res => {
    if (res && typeof res === 'object' && res.message) func.logFile(res.message, 'connect');
});

/* print error */
socket.on('error', async error => {
    console.log(chalk.redBright.bold(error.message));
    if (error && typeof error === 'object' && error.message) func.logFile(error.message, 'error');
});

/* bot is connected */
socket.on('ready', async (mecha) => {
    /* auto restart if ram usage is over */
    const ramCheck = setInterval(async () => {
        var ramUsage = process.memoryUsage().rss;
        if (ramUsage >= (global.max_ram * 1000000000)) {
            clearInterval(ramCheck);
            await global.database.save(global.db);
            console.info(`RAM telah mencapai ${global.max_ram} GB, Sistem merestart bot secara otomatis.`);
            process.send('reset');
        }
    }, 60 * 1000);

    /* create temp directory if doesn't exists */
    if (!fs.existsSync('./sampah')) fs.mkdirSync('./sampah');

    /* create jadibot session directory if doesn't exists */
    if (!fs.existsSync('./jadibot')) fs.mkdirSync('./jadibot');

    /* additional events */
    require('./system/events.js')(mecha);

    /* clear temp folder every 10 minutes */
    setInterval(async () => {
        try {
            const tmpFiles = fs.readdirSync('./sampah');
            if (tmpFiles.length > 10) {
                tmpFiles.filter(v => !v.endsWith('.file')).map(v => fs.unlinkSync('./sampah/' + v));
            }

            const TIME = 1000 * 60 * 60;
            const filename = [];
            const files = await fs.readdirSync('./session');
            for (const file of files) {
                if (file != 'creds.json') filename.push(path.join('./session', file));
            }

            await Promise.allSettled(filename.map(async (file) => {
                const stat = await fs.statSync(file);
                if (stat.isFile() && (Date.now() - stat.mtimeMs >= TIME)) {
                    if (platform() === 'win32') {
                        let fileHandle;
                        try {
                            fileHandle = await fs.openSync(file, 'r+');
                        } catch (e) {} finally {
                            await fileHandle.close();
                        }
                    }
                    await fs.unlinkSync(file);
                }
            }));
        } catch {}
    }, 60 * 1000 * 10);

    /* save database every 30 seconds */
    setInterval(async () => {
        if (global.db) await global.database.save(global.db);
    }, 30_000);

    for (let x of global.db.jadibot) {
        if (x.status && global.db.users[x.number] && global.db.users[x.number].jadibot && fs.existsSync(`${x.session}/creds.json`) && typeof global.jadibot[x.number] == 'undefined') await Jadibot({
            mecha: mecha,
            number: x.number,
            state: true
        });
    }
});

/* print all message object */
socket.on('message', async extra => {
    const { m, store } = extra;
    InvCloud(store);
    require('./handler')(socket.mecha, extra);
    if (global.db.setting[m.bot].autoread && m.chat === 'status@broadcast') {
        if (m.message?.protocolMessage) return;
        await socket.mecha.readMessages([m.key]);
        if (m.broadcast) {
            if (!fs.existsSync('./database/story.json')) fs.writeFileSync('./database/story.json', JSON.stringify([], null, 2));
            let story = JSON.parse(fs.readFileSync('./database/story.json'));
            story.push({
                mtype: m.mtype,
                pushname: m.pushname,
                sender: m.sender,
                caption: m.budy,
                msg: {
                    key: m.key,
                    message: m.message
                }
            });
            fs.writeFileSync('./database/story.json', JSON.stringify(story, null, 2));
        }
    }
});

/* print deleted message object */
socket.on('message.delete', extra => {
    if (!extra || !extra.delete || !extra.origin || extra.origin.fromMe || extra.origin.isBot || !extra.origin.sender) return;
    if (!extra.delete) return;
    if (extra.origin.isGc && global.db.groups[extra.origin.chat] && global.db.groups[extra.origin.chat].antidelete) return socket.mecha.copyNForward(extra.origin.chat, extra.delete, false, {
        quoted: extra.delete,
        ephemeralExpiration: extra.origin.expiration || 86400
    });
});

/* AFK detector */
// socket.on('presence.update', extra => console.log(extra));

/* Anti Call Auto Reject */
socket.on('caller', extra => {
    require('./system/anticall')(socket.mecha, extra);
});

socket.on('group.add', async extra => groupAdd(socket.mecha, extra));
socket.on('group.remove', extra => groupRemove(socket.mecha, extra));
// socket.on('group.promote', extra => console.log(extra));
// socket.on('group.demote', extra => console.log(extra));

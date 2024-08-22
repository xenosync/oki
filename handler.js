require('./config');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const func = require('./system/functions.js');
const YT = new (require('./lib/youtube'));
const except = [
  'register.js',
  'unregister.js',
  'owner.js',
  'rules.js',
  'donate.js',
  'buyprem.js',
  'sewabot.js',
  'harga.js',
  'suit.js',
  'tictactoe.js',
  'werewolf.js',
  'sticker.js',
  'menu.js',
  'menfes.js',
  'script.js',
  'jadibot.js',
  'listbot.js',
  'stopbot.js',
  'delsesibot.js'
];
module.exports = async (mecha, extra) => {
  const { store, m, plugins, commands, events } = extra;
  if (Object.keys(global.jadibot).includes(m.sender) && !m.user.jadibot) return false;   // agar bot utama tidak direspon saat user jadibot
  try {
    const d = new Date;
    const week = d.toLocaleDateString('id', { weekday: 'long' });
    const time = moment().tz('Asia/Jakarta').format('HH:mm:ss');
    const calender = d.toLocaleDateString('id', { day: 'numeric', month: 'long', year: 'numeric' });
    const users = global.db.users[m.sender];
    const groups = global.db.groups[m.chat];
    const setting = global.db.setting[m.bot];
    if (!users || (m.isGc && !groups)) return;
    require('./system/console')(mecha, m, setting, true); /* true = print all message, false = print only cmd message */
    const packname = setting.packname?.replace('+week', week).replace('+date', calender).replace('+time', time).replace('+name', users.name);
    const author = setting.author?.replace('+week', week).replace('+date', calender).replace('+time', time).replace('+name', users.name);
    const isBanned = users.banned;
    const isPrem = users.premium;
    const quoted = m.quoted ? m.quoted : m;
    const mime = quoted.mime;
    const froms = m.quoted ? m.quoted.sender : m.text ? (m.text.replace(/[^0-9]/g, '') ? m.text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : false) : false;
    const fkon = { key: { fromMe: false, participant: `${m.sender.split('@')[0]}@s.whatsapp.net`, ...(m.chat ? { remoteJid: '0@s.whatsapp.net' } : {}) }, message: { contactMessage: { displayName: `${m.pushname}`, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:${m.pushname}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` } } };
    if (setting.maintenance && !m.isDevs) return;
    if (m.isGc && groups.antibot && m.isBot && m.isBotAdmin && !m.isOwner && !m.isDevs && !isPrem && !m.isAdmin && !m.fromMe) {
      await mecha.reply(m.chat, '乂  *B O T - D E T E C T E D*\n\nYou are detected as a bot, sorry I will kick you.', m, { expiration: m.expiration }).then(() => mecha.groupParticipantsUpdate(m.chat, [m.sender], 'remove'));
    }
    if (m.isBot) return;
    if (m.isGc && users && users.afk > 0 && m.mtype !== 'reactionMessage' && !groups.mute) {
      let alasan = `${users.alasan ? users.alasan : 'No reason'}`;
      let waktu = `${func.afkTime(new Date - users.afk)}`;
      mecha.sendMessageModify(m.chat, `*Alasan :* ${alasan}\n*Selama :* ${waktu}`, m, { largeThumb: false, title: m.pushname, body: 'telah kembali dari AFK', thumbnail: await func.fetchBuffer(setting.cover), url: 'https://vcard-suryadev.vercel.app/' });
      users.afk = 0;
      users.alasan = '';
    }
    if (m.isGc && !m.fromMe) {
      let member = groups.member.find(v => v.jid == m.sender);
      let now = Date.now();      
      if (!member) { /* add member to database member */
        groups.member.push({ jid: m.sender, lastseen: now, toxic: 0, chat: 0 });
      } else {
        member.lastseen = now;
        member.chat += 1;
      }
    }
    let matcher = func.matcher(m.command, commands).filter(v => v.accuracy >= 60);
    if (m.isPrefix && !commands.includes(m.command) && !['batu', 'gunting', 'kertas'].includes(m.command) && matcher.length > 0 && !setting.self) {
      if ((m.isPc || (m.isGc && !groups.mute)) && !users.banned) return mecha.sendMessage(m.chat, { text: `Command tidak ditemukan, mungkin maksud kamu :\n\n${matcher.map(v => '➠ *' + m.prefix + v.string + '* (' + v.accuracy + '%)').join('\n')}` }, { quoted: m, ephemeralExpiration: m.expiration });
    }
    for (let name in events) {
      let event = events[name].run;
      if (!event) continue;
      let basename = path.basename(name);
      if (event.main) {
        if (m.isPc && global.blocks.some(no => m.sender.startsWith(no))) return mecha.updateBlockStatus(m.sender, 'block');
        if (!['_antihidetag.js', '_antilink.js', '_stickerwarn.js', '_antispam.js', '_antitoxic.js', '_antiviewonce.js', '_antivirtex.js', '_antiedited.js', '_automatically.js', '_response.js', '_expiration.js'].includes(basename) && users && users.banned && !users.premium && !m.isOwner && !m.isDevs) continue;
        if (!['_antihidetag.js', '_antilink.js', '_stickerwarn.js', '_antispam.js', '_antitoxic.js', '_antiviewonce.js', '_antivirtex.js', '_antiedited.js', '_automatically.js', '_response.js', '_expiration.js'].includes(basename) && groups && groups.mute && !users.premium && !m.isAdmin && !m.isOwner && !m.isDevs) continue;
        if (event.devs && !m.isDevs) continue;
        if (event.owner && !m.isOwner) continue;
        if (event.group && !m.isGc) continue;
        if (event.limit && users.limit < 1) continue;
        if (event.botAdmin && !m.isBotAdmin) continue;
        if (event.admin && !m.isAdmin) continue;
        if (event.private && m.isGc) continue;
        event.main(m, { func, mecha, plugins, commands, events, store, users, groups, setting, week, time, calender, packname, author, isBanned, isPrem, quoted, mime, froms, fkon, errorMessage, downloadMp3, YT }).catch((err) => {
          if (func.checkError(err)) return;
          console.error(err);
          mecha.sendMessage(global.owner[0], { text: '───「 *SYSTEM-ERROR* 」───\n\n' + func.jsonFormat(err) }, { quoted: m, ephemeralExpiration: m.expiration });
        });
      }
    }
    if (m.budy && m.prefix && m.command && commands.includes(m.command)) {
      const iscommands = Object.fromEntries(Object.entries(plugins).filter(([name, prop]) => prop.run?.usage));
      if ((m.isPc || (m.isGc && !groups.mute)) && setting.blockcmd.includes(m.command) && !setting.self && !m.isOwner && !m.isDevs) return m.reply(mess.block.system);
      for (let name in iscommands) {
        let plugin = iscommands[name].run;
        if (!plugin) continue;
        let basename = path.basename(name);
        if (plugin.async) {
          let usage = plugin?.usage instanceof Array ? plugin?.usage.includes(m.command) : plugin?.usage instanceof String ? plugin?.usage == m.command : false;
          let hidden = plugin?.hidden instanceof Array ? plugin?.hidden.includes(m.command) : plugin?.hidden instanceof String ? plugin?.hidden == m.command : false;
          if (!usage && !hidden) continue;
          if (m.chat.endsWith('broadcast') || /pollUpdate/.test(m.mtype)) continue;
          if (m.isPc && global.blocks.some(no => m.sender.startsWith(no))) return mecha.updateBlockStatus(m.sender, 'block');
          if (setting.self && !m.fromMe && !m.isOwner && !m.isDevs) return;
          if (m.isGc && groups.mute && !m.isAdmin && !isPrem && !m.isOwner && !m.isDevs) return;
          if (!['me.js', 'owner.js'].includes(basename) && users.banned && !m.isOwner && !m.isDevs) return m.reply(`Maaf kamu sedang di banned.\nBerakhir: *${users.expired.banned === 'PERMANENT' ? 'PERMANENT' : func.toTime(users.expired.banned - Date.now())}*`);
          if (setting.blockcmd.includes(basename.replace(/\.js/, '')) && !m.isOwner && !m.isDevs) return m.reply(global.mess.block.owner);
          if (setting.verify && !users.register && typeof global.db.register[m.sender] == 'undefined' && !except.includes(basename) && !m.isOwner && !m.isDevs) {
            return await m.reply(`Nomor kamu belum terverifikasi, kirim *${m.prefix}register*${m.isGc ? '\tdi private chat' : ''} untuk verifikasi.`);
          }
          if (setting.gconly && m.isPc && !except.includes(basename) && !isPrem && !m.fromMe && !m.isOwner && !m.isDevs) {
            return await mecha.reply(m.chat, global.mess.gconly, func.fstatus('System Notification'));
          }
          if (plugin.restrict && !m.isOwner && !m.isDevs && !isPrem && m.text && new RegExp('\\b' + setting.toxic.join('\\b|\\b') + '\\b').test(m.text.toLowerCase())) {
            mecha.reply(m.chat, `Anda melanggar *Syarat & Ketentuan* penggunaan bot dengan menggunakan kata kunci yang masuk daftar hitam, sebagai hukuman atas pelanggaran Anda, Anda dilarang menggunakan bot selama ${((setting.timer / 1000) / 60)} menit.`, m, { expiration: m.expiration }).then(() => {
              users.banned = true;
              users.expired.banned = Date.now() + setting.timer;
            });
            continue;
          }
          if (plugin.devs && !m.isDevs) {
            mecha.reply(m.chat, global.mess.devs, m, { expiration: m.expiration });
            continue;
          }
          if (plugin.owner && !m.isOwner) {
            mecha.reply(m.chat, global.mess.owner, m, { expiration: m.expiration });
            continue;
          }
          if (plugin.premium && !isPrem && !m.isOwner && !m.isDevs) {
            mecha.reply(m.chat, global.mess.premium, m, { expiration: m.expiration });
            continue;
          }
          if (plugin.register && !m.isGc && !users.register) {
            return await mecha.reply(m.chat, `Nomor kamu belum terverifikasi, kirim *${m.prefix}register*${m.isGc ? '\tdi private chat' : ''} untuk verifikasi.`);
            continue;
          }
          if (plugin.limit && users.limit < 1) {
            return mecha.reply(m.chat, global.mess.limit, m, { expiration: m.expiration });
            continue;
          }
          if (plugin.limit && users.limit > 0) {
            let limit = plugin.limit.constructor.name == 'Boolean' ? 1 : plugin.limit;
            if (users.limit >= limit) {
              users.limit -= limit;
            } else {
              mecha.reply(m.chat, `Limit anda tidak cukup karena fitur ini menggunakan ${limit} limit.`);
              continue;
            }
          }
          if (plugin.group && !m.isGc) {
            mecha.reply(m.chat, global.mess.group, m, { expiration: m.expiration });
            continue;
          } else if (plugin.botAdmin && !m.isBotAdmin) {
            mecha.reply(m.chat, global.mess.botAdmin, m, { expiration: m.expiration });
            continue;
          } else if (plugin.admin && !m.isAdmin && !m.isOwner && !m.isDevs) {
            mecha.reply(m.chat, global.mess.admin, m, { expiration: m.expiration });
            continue;
          }
          if (plugin.private && m.isGc) {
            mecha.reply(m.chat, global.mess.private, m, { expiration: m.expiration });
            continue;
          }
          if (commands.includes(m.command)) {
            if (plugin.usage && plugin.usage.includes(m.command)) {
              func.addcommand(m.command);
            } else if (plugin.hidden && plugin.hidden.includes(m.command)) {
              for (let cmds of plugin.usage) {
                func.addcommand(cmds);
              }
            }
          }
          await plugin.async(m, { func, mecha, plugins, commands, events, store, users, groups, setting, week, time, calender, packname, author, isBanned, isPrem, quoted, mime, froms, fkon, errorMessage, downloadMp3, YT }).catch(async (err) => {
            if (func.checkError(err)) return;
            if (m.sender != global.owner[0]) await mecha.sendMessage(m.chat, { text: 'Maaf ada yang error :(\nLaporan error telah dikirim ke developer otomatis untuk diperbaiki.' }, { quoted: m, ephemeralExpiration: m.expiration });
            return mecha.sendMessage(global.owner[0], { text: `───「 *SYSTEM ERROR* 」───\n\n${func.jsonFormat(err)}` }, { quoted: m, ephemeralExpiration: m.expiration }).then(() => {
              if (setting.autoblockcmd && !setting.blockcmd.includes(m.command)) {
                mecha.sendMessage(m.chat, { text: 'Command tersebut telah di block oleh system karena terjadi error.' }, { quoted: m, ephemeralExpiration: m.expiration });
                setting.blockcmd.push(m.command);
              }
            });
          });
        }
      }
    }
  } catch (err) {
    if (func.checkError(err)) return;
    console.error(err);
    if (!m.fromMe) return mecha.sendMessage(global.owner[0], { text: 'mecha-bot encountered an error :' + func.jsonFormat(err) }, { quoted: m, ephemeralExpiration: m.expiration });
  }
};
function errorMessage(text = '') {
  return mecha.sendMessage(global.owner[0], { text: '───「 *SYSTEM-ERROR* 」───\n\n' + func.jsonFormat(text) }, { quoted: m, ephemeralExpiration: m.expiration });
}
async function downloadMp3(url) {
  try {
    let result = await YT.getmp3(url);
    if (!result.status) return m.reply(result.message);
    await mecha.sendMessage(m.chat, {
      [setting.typefile]: {
        url: result.audio,
      },
      mimetype: 'audio/mpeg',
      fileName: result.title + '.mp3',
      contextInfo: {
        externalAdReply: {
          title: result.title,
          body: global.header,
          thumbnail: await mecha.resize(result.thumb, 300, 175),
          thumbnailUrl: result.thumb,
          mediaType: 2,
          mediaUrl: result.url,
          sourceUrl: result.url,
        },
      },
    }, { quoted: m, ephemeralExpiration: m.expiration });
  } catch (e) {
    return errorMessage(e);
  }
}
func.reloadFile(__filename);
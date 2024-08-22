// nomor owner ubah nomor lu
global.owner = '6285651915144@s.whatsapp.net' // 62882003321562
// nama owner ubah nama lu
global.ownerName = 'Oki'
// nomor pengembang yang bisa akses fitur saveplugin, delplugin, getplugin dan eval
global.developer = [
'62895415497664',
'6285702691440',
'6285700408187',
'6285651915144'
// jangan asal add nomor, nanti bisa curi kode bot
].map(number => number.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
// nama bot lu
global.botName = 'Oki'
// fake pada beberapa fitur
global.fake = 'Copyright © 2024'
// header pada beberapa fitur
global.header = `Oki v${require('./package.json').version} (Beta)`
// footer pada beberapa fitur
global.footer = 'Simple Bot'
// jeda anti spam / detik
global.cooldown = 1
// ram maksimal untuk auto restart / gb
global.max_ram = 3
// blacklist nomor dengan kode negara tersebut
global.blocks = ['91', '92', '212']
// multi prefix default
global.prefixes = /^[°•π÷×¶∆£¢€¥®™+✓_=|/~!?@#%^&.©^]/i
// setting id channel (cara ambil: invite bot menjadi admin channel lalu balas pesan undangan dengan perintah .getnewsletter
global.newsletter = '120363318258324731@newsletter'
// qris url di beberapa fitur seperti donate, buyprem dan sewabot
global.qrisUrl = 'https://telegra.ph/file/080cbdedf32c6c84ff435.jpg'
// audio url yang ada di menu
global.audioUrl = 'https://cdn.filestackcontent.com/2r7cSUozTQ2tTS15NfFj'
// setting pairing code
global.pairing = {
status: true, // ubah false jika ingin menggunakan qr
number: '6285651915144' // ubah jadi nomor bot lu
}
// apikey fitur quickchat
global.quoteApi = 'https://bot.lyo.su/quote/generate'
// url database mongodb (daftar di https://www.mongodb.com/)
global.mongoUrl = '';
// setting message
global.mess = {
wait: 'Processed . . .',
ok: 'Successfully.',
limit: 'Anda telah mencapai limit dan akan disetel ulang pada pukul 00.00\n\n> untuk mendapatkan limit tak terbatas, tingkatkan ke paket premium.',
premium: 'This feature only for premium user.',
jadibot: 'This feature only for jadibot user.',
owner: 'This feature is only for owners.',
devs: 'This feature is only for developers.',
group: 'This feature will only work in groups.',
private: 'Use this feature in private chat.',
admin: 'This feature only for group admin.',
botAdmin: 'This feature will work when I become an admin',
gconly: 'Bot hanya dapat digunakan di dalam grup.',
bot: 'This feature can only be accessed by bots',
wrong: 'Wrong format!',
error: {
url: 'URL is Invalid!', 
api: 'Sorry an error occurred!'
},
block: {
owner: `This feature is being blocked by owner!`,
system: `This feature is being blocked by system because an error occurred!`
},
query: 'Enter search text',
search: 'Searching . . .',
scrap: 'Scrapping . . .',
wrongFormat: 'Incorrect format, please look at the menu again',
game: 'Bermain game di obrolan pribadi hanya untuk pengguna premium, tingkatkan ke paket premium hanya Rp. 20.000 selama 1 bulan.'
}

// menghapus cache setelah update
require('./system/functions.js').reloadFile(__filename);
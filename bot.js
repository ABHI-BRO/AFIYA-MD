const {
  default: makeWASocket,
  Browsers,
  makeInMemoryStore,
  useMultiFileAuthState,
} = require("@adiwajshing/baileys");
const fs = require("fs");
const { serialize } = require("./lib/serialize");
const { Message, Image, Sticker } = require("./lib/Base");
const pino = require("pino");
const express = require("express");
const app = express();
const port = process.env.PORT || 8000;
const path = require("path");
const Config = require('./config');
const events = require("./lib/event");
const got = require("got");
const config = require("./config");
const { PluginDB } = require("./lib/database/plugins");
const Greetings = require("./lib/Greetings");
const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

require("events").EventEmitter.defaultMaxListeners = 500;


fs.readdirSync("./lib/database/").forEach((plugin) => {
  if (path.extname(plugin).toLowerCase() == ".js") {
    require("./lib/database/" + plugin);
  }
});

const aes256 = require('aes256');
let plaintext = Config.SESSION_ID.replaceAll("inrl~", "");
let key = 'k!t';
let decryptedPlainText = aes256.decrypt(key, plaintext);
  async function md(){
   let {body} = await got(`https://inrl-web.vercel.app/api/session?id=${decryptedPlainText}`)
  let result = JSON.parse(body).result[0].data;
fs.writeFileSync("./lib/auth_info_baileys/creds.json" , result);
   }
  md();

async function ToxicLeo() {
  console.log("Syncing Database");
  await config.DATABASE.sync();

const { state, saveCreds } = await useMultiFileAuthState(
    "./lib/auth_info_baileys/",
    pino({ level: "silent" })
  )
  let conn = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: true,
    generateHighQualityLinkPreview: true,
    browser: Browsers.macOS("Desktop"),
    fireInitQueries: false,
    shouldSyncHistoryMessage: false,
    downloadHistory: false,
    syncFullHistory: false,
  });
    
  store.bind(conn.ev);
  //store.readFromFile("./database/store.json");
  setInterval(() => {
    store.writeToFile("./database/store.json");
  }, 30 * 60 * 1000);

 conn.ev.on("creds.update", saveCreds);

  conn.ev.on("connection.update", async (s) => {
    const { connection, lastDisconnect } = s;
    if (connection === "connecting") {
      console.log("Toxic Leo MD");
      console.log(" ♻ Afiya Connecting to WhatsApp... Please Wait. ");
    }

    if (
      connection === "close" &&
      lastDisconnect &&
      lastDisconnect.error &&
      lastDisconnect.error.output.statusCode != 401
    ) {
      console.log(lastDisconnect.error.output.payload);
      Xasena();
    }

    if (connection === "open") {
      console.log(" Login Successful! ✓ ");
      console.log(" ❗Installing External Plugins... ");

      let plugins = await PluginDB.findAll();
      plugins.map(async (plugin) => {
        if (!fs.existsSync("./plugin/" + plugin.dataValues.name + ".js")) {
          console.log(plugin.dataValues.name);
          var response = await got(plugin.dataValues.url);
          if (response.statusCode == 200) {
            fs.writeFileSync(
              "./plugin/" + plugin.dataValues.name + ".js",
              response.body
            );
            require("./plugin/" + plugin.dataValues.name + ".js");
          }
        }
      });

      console.log(" Installing Plugins... ");

      fs.readdirSync("./plugin").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() == ".js") {
          require("./plugin/" + plugin);
        }
      });
      console.log(" Plugins Installed! ");
      let str = `\`\`\` *ᴀғɪʏᴀ ᴍᴅ sᴛᴀʀᴛᴇᴅ* \nversion : ${
        require("./package.json").version
      }\nTotal Plugins : ${events.commands.length}\nMode: ${
        config.WORK_TYPE
      }\`\`\``;
      conn.sendMessage(conn.user.id, { text: str });
      try {
        conn.ev.on("group-participants.update", async (data) => {
          Greetings(data, conn);
        });
        conn.ev.on("messages.upsert", async (m) => {
          if (m.type !== "notify") return;
          let ms = m.messages[0];
          let msg = await serialize(JSON.parse(JSON.stringify(ms)), conn);
          if (!msg.message) return;
          let text_msg = msg.body;
          if (text_msg && config.LOGS)
            console.log(
              `At : ${
                msg.from.endsWith("@g.us")
                  ? (await conn.groupMetadata(msg.from)).subject
                  : msg.from
              }\nFrom : ${msg.sender}\nMessage:${text_msg}`
            );

          events.commands.map(async (command) => {
            if (
              command.fromMe &&
              !config.SUDO.split(",").includes(
                msg.sender.split("@")[0] || !msg.isSelf
              )
            )
              return;
            let comman;
            if (text_msg) {
              comman = text_msg.trim().split(/ +/)[0];
              msg.prefix = new RegExp(config.HANDLERS).test(text_msg)
                ? text_msg.split("").shift()
                : ",";
            }
            if (command.pattern && command.pattern.test(comman)) {
              var match;
              try {
                match = text_msg.replace(new RegExp(comman, "i"), "").trim();
              } catch {
                match = false;
              }
              whats = new Message(conn, msg, ms);
              command.function(whats, match, msg, conn);
            } else if (text_msg && command.on === "text") {
              whats = new Message(conn, msg, ms);
              command.function(whats, text_msg, msg, conn, m);
            } else if (
              (command.on === "image" || command.on === "photo") &&
              msg.type === "imageMessage"
            ) {
              whats = new Image(conn, msg, ms);
              command.function(whats, text_msg, msg, conn, m, ms);
            } else if (
              command.on === "sticker" &&
              msg.type === "stickerMessage"
            ) {
              whats = new Sticker(conn, msg, ms);
              command.function(whats, msg, conn, m, ms);
            }
          });
        });
      } catch (e) {
        console.log(e + "\n\n\n\n\n" + JSON.stringify(msg));
      }
    }
  });
  process.on("uncaughtException", (err) => {
    let error = err.message;
    // conn.sendMessage(conn.user.id, { text: error });
    console.log(err);
  });
}
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.listen(port, () => console.log(`Inrl Server listening on port http://localhost:${port}`));
setTimeout(() => {
  ToxicLeo();
}, 7000);

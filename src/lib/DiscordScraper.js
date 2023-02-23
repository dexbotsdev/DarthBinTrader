import WS from "ws";
import logger from "./logger.js";
import { processMessageA } from "./processor_darth.js";
import { processMessageB } from "./processor_bin.js";

class DiscordScraper {
    constructor(eventEmitter,config) {
        this.token;
        this.url = "wss://gateway-us-east1-b.discord.gg/?encoding=json"
        this.ws;
        this.interval; 
        this.ping = 0;
        this.lastheat = 0
        this.e=eventEmitter;
        this.channelIdA= config.channelIdA
        this.channelIdB= config.channelIdB
    }

    async connect(token) {
        this.token = token;

        this.ws = new WS(this.url);

        this.ws.on("open", async () => {
            this.ws.send(JSON.stringify(
                {
                  "op": 2,
                  "d": {
                    "token": this.token,
                    "capabilities": 4093,
                    "properties": {
                      "os": "Mac OS X",
                      "browser": "Chrome",
                      "device": "",
                      "system_locale": "en-GB",
                      "browser_user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
                      "browser_version": "109.0.0.0",
                      "os_version": "10.15.7",
                      "referrer": "https://accounts.spotify.com/",
                      "referring_domain": "accounts.spotify.com",
                      "referrer_current": "",
                      "referring_domain_current": "",
                      "release_channel": "stable",
                      "client_build_number": 175117,
                      "client_event_source": null,
                      "design_id": 0
                    },
                    "presence": {
                      "status": "online",
                    },
                    "compress": false,
                  }
                }))
        })

        this.ws.on("message", async (msg) => {
            try {
                const payload = JSON.parse(msg.toString())
                const { t: event, s, op, d } = payload
                 let heartbeat_interval;
                if(d !== null) heartbeat_interval = d.heartbeat_interval
                switch (op) {
                    case 10:
                        this.interval = this.heartbeat(heartbeat_interval)
                        break; 
                    case 11:
                      this.ping = this.lastheat - Date.now() 
                      break;
                }
                 switch(event){
                    case 'MESSAGE_CREATE':
                        if(d.channel_id === this.channelIdA){
                            logger.docs('Recd')
                            const takePosition = processMessageA(d);
                           if(takePosition !== 'Not A Signal')this.e.emit('tradeSignal',takePosition);
                         } else if(d.channel_id === this.channelIdB){
                            logger.docs('Recd')
                            const takePosition = processMessageB(d);
                           if(takePosition !== 'Not A Signal')this.e.emit('tradeSignal',takePosition);
                         }
                         
                }   
            } catch (e) {
                 console.log(e)
            }   
        })
    }

    heartbeat(ms = 1) {
        return setInterval(() => {
            this.ws.send(JSON.stringify({
                op: 1,
                d: null
            }))
            this.lastheat = Date.now()
        }, ms)
    }
 
}


export default DiscordScraper;
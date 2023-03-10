import DiscordScraper from "./src/lib/DiscordScraper.js"
import BinTrader from "./src/lib/BinTrader.js"
import pkg from "emitter";
import fs from 'fs'
import logger from "./src/lib/logger.js";
import TradeCleaner from "./src/lib/TradeCleaner.js";

const {EventEmitter} = pkg; 
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(1);
let config=null; 
async function start() {
    fs.readFile('./client.config.json', 'utf8', async (error, data) => {
        if(error){
           console.log(error);
           return;
        }
        config= JSON.parse(data); 
        let ds = new DiscordScraper(eventEmitter,config);  
        let ts = new BinTrader(config);
        let tc=new TradeCleaner(config);

        ds.connect(config.discordToken);

        const accountCheck = await ts.verifyAccount();
        if(!accountCheck){
            logger.error('API Keys Invalid or Account Not Found');
            process.exit(0);
        }
        
        eventEmitter.on('newListener', (event, listener) => {
            logger.info(`Added Binance Darth Server ${event.toUpperCase()} listener.`);
          });

        eventEmitter.on('tradeSignal', async (tradeSignal) => {
            logger.info('Recieved ');
            console.log(tradeSignal);
            logger.info('Open New Market Trade for Signal for SYMBOL - '+ tradeSignal.tokenSymbol)
            const openTrades = await ts.getOpenTrades(tradeSignal);
            console.log(openTrades);

             await ts.tradeEnterSignal(tradeSignal,config);
            // await tc.autoCancelAfterTime(tradeSignal.tokenSymbol);

            
        });  


        eventEmitter.on('Disconnected', (message) => {
            logger.info('Disconnected -- need to restart '+message.toUpperCase());
            eventEmitter.removeAllListeners();
            start();

           });
        
    }) 
 } 

start();


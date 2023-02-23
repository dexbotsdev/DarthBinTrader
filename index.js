import DiscordScraper from "./src/lib/DiscordScraper.js"
import DarthBinTrader from "./src/lib/DarthBinTrader.js"
import { EventEmitter } from "emitter";
import fs from 'fs'
import logger from "./src/lib/logger.js";
import TradeCleaner from "./src/lib/TradeCleaner.js";

const eventEmitter = new EventEmitter();
let config=null; 
async function start() {
    fs.readFile('./config.json', 'utf8', async (error, data) => {
        if(error){
           console.log(error);
           return;
        }
        config= JSON.parse(data); 
        let ds = new DiscordScraper(eventEmitter,config);  
        let ts = new DarthBinTrader(config);
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

            logger.info('Open New Market Trade for Signal for SYMBOL - '+ tradeSignal.tokenSymbol)
             
            await ts.tradeEnterSignal(tradeSignal,config);
            await tc.autoCancelAfterTime(tradeSignal.tokenSymbol);

            
        });  
        
    }) 
 } 

start();


import DiscordScraper from "./src/lib/DiscordScraper.js"
import EventEmitter from "events";
import fs from 'fs'

const eventEmitter = new EventEmitter();
let config=null;

fs.readFile('./config.json', 'utf8', (error, data) => {
    if(error){
       console.log(error);
       return;
    }
    config= JSON.parse(data);

    let ds = new DiscordScraper(eventEmitter);  
    ds.connect(config.discordToken)

    console.log(JSON.parse(data));

})
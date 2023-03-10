import BinTrader from "./src/lib/BinTrader.js"
import fs from 'fs'
let config=null; 

async function start() {
    fs.readFile('./config.json', 'utf8', async (error, data) => {
        if(error){
           console.log(error);
           return;
        }
        config= JSON.parse(data); 
        let ts = new BinTrader(config);

        ts.getOpenTrades().then((resp)=>{
            let i=0;

            resp.map((item)=>{
                console.log(i++ +":"+item.symbol+":"+ new Date(item.updateTime).toUTCString()+":"+ new Date(item.time).toUTCString())
                console.log(item)
            })
        })
        
    }) 
 } 

start();

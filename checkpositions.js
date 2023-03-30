import BinTrader from "./src/lib/BinTrader.js"
import fs from 'fs'
let config=null; 

async function start() {
    fs.readFile('./client.d.json', 'utf8', async (error, data) => {
        if(error){
           console.log(error);
           return;
        }
        config= JSON.parse(data); 
        let ts = new BinTrader(config);

        ts.getOpenTrades().then((resp)=>{
            let i=0;
             resp.map((item)=>{
                console.log(i++ +":"+item.symbol+":"+item.status+":"+item.origType+":"+ new Date(item.updateTime).toString())
 
               // if(item.status==='NEW') ts.bin.futuresCountdownCancelAll( item.symbol, 1000 )
            })
        })
 
        
    }) 
 } 

start();

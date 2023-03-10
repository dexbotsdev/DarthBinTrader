import Binance from "node-binance-api";
//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

import { processMessageB } from "./src/lib/processor_bin.js";
const getQ=(str)=>{

 const s = str.split("");
 let i=0;
 let reach=false;
 let t='';
 for(var n=0;n<s.length;n++){
    if((s[n]==='0' || s[n]==='.') ){ t+='';}
    else {
        t=t+''+s[n]; 
    }
        

 }
 return t;
}

const binance= new Binance();

const xrpd= await binance.futuresExchangeInfo(); 
const xrp = xrpd.symbols.filter((item)=>item.baseAsset=='DOT');

//console.log(xrp[0])

//console.log(6.085/(10**xrp[0].pricePrecision))

//console.log(await binance.futuresQuote('DOTUSDT')); 

//console.log( "Entry: 24719.8:white_check_mark: - 24699.8:white_check_mark: - NOW AT CURRENT MARKET PRICE".replace(/[^\d.-]/g, ''));
//console.log( "Entry: 7.251✅ - 7.359 - 7.467  - NOW AT CURRENT MARKET PRICE WITH LOW SIZE".replace(/[^\d.-]/g, ''));
//console.log( "Entry: 1.247 - 1.266 - 1.285 - NOW AT CURRENT MARKET PRICE WITH LOW SIZE".replace(/[^\d.-]/g, ''));

console.log(processMessageB({content:"> ⚡️⚡️ #ROSE/USDT ⚡️⚡️"+
"> Exchanges: Binance Futures"+'\n'+
"> Signal Type: Regular (Long)"+'\n'+
"> Leverage: Cross (20X)"+'\n'+
"> Entry Targets:"+'\n'+
"> 0.06472"+'\n'+
"> Take-Profit Targets:"+'\n'+
"> 1) 0.065691"+'\n'+
"> 2) 0.066338"+'\n'+
"> 3) 0.066985"+'\n'+
"> 4) 0.067956"+'\n'+
"> 5) 0.068603"+'\n'+
"> 6) 0.069574"+'\n'+
"> 7) 🚀🚀🚀"+'\n'+
"> Stop Targets:"+'\n'+
"> 5-10%"+'\n'+
"<@&1056233193377894480>", author:{username:"Bin"}}))
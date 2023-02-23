import Binance from "node-binance-api";

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

console.log(xrp[0])

console.log(6.085/(10**xrp[0].pricePrecision))

console.log(await binance.futuresQuote('DOTUSDT')); 

console.log( "Entry: 24719.8:white_check_mark: - 24699.8:white_check_mark: - NOW AT CURRENT MARKET PRICE".replace(/[^\d.-]/g, ''));
console.log( "Entry: 7.251✅ - 7.359 - 7.467  - NOW AT CURRENT MARKET PRICE WITH LOW SIZE".replace(/[^\d.-]/g, ''));
console.log( "Entry: 1.247 - 1.266 - 1.285 - NOW AT CURRENT MARKET PRICE WITH LOW SIZE".replace(/[^\d.-]/g, ''));
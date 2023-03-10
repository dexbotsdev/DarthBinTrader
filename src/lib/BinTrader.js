import Binance from "node-binance-api";
import logger from "./logger.js";

class BinTrader {
  constructor(config) {
    this.bin = new Binance().options({
      APIKEY: config.apiKey,
      APISECRET: config.secretKey, 
      hedgeMode: false,
      'family': 4,
    });
    this.investAmount = config.fundsPerTrade;
    this.tpLimits = config.numberOfTakeProfits;
    this.stopLoss = config.stopLoss;
    this.trailingStopLoss = config.trailingStopLoss;
    this.leverage = config.leverage;
    this.closePositionAfterXMinutes = config.closePositionAfterXMinutes;
    this.maximumNumberOfOpenPositions = config.maximumNumberOfOpenPositions;
    this.entryType = config.entryType;
    this.cancelTrade = config.cancelTrade;
    this.duplicate = [];

    logger.docs('Client Connected to Binance ');

  }

  futuresTime = async () => {
    return await this.bin.futuresTime();
  }
  f


  futuresAccount = async () => {
    return await this.bin.futuresAccount();
  }

  verifyAccount = async () => {
    const account = await this.futuresAccount();
    logger.docs('Veifying Account ', account.code);
    if (Number(account.code) < 0) return false;
    else return true;
  }

  getBalance = async (currency) => {
    let bal;
    const balance = await this.bin.futuresBalance();
    const keys = Object.keys(balance);
    keys.map((value) => {
      if (balance[value].asset === currency) {
        bal = parseFloat(balance[value].balance);
      }
    });

    return bal;
  };

  PNL = async (coin) => {
    let income = await this.bin.futuresIncome();
    let letestPnl;
    Object.keys(income).map(value => {
      if (income[value].symbol === coin && income[value].incomeType === "REALIZED_PNL") {
        letestPnl = income[value]
      }
    })
    return letestPnl
  }

  getPriceMean = (entry, pricePrecision) => {

    if ((pricePrecision - entry.toString().length) === 1) {
      return Number('0.' + entry + '0');
    }
    else if (entry.toString().indexOf('.') > 0) return entry;
    else return entry;

  }

  takeProfitOrder = async (side, symbol, quantity, takeProfitPrice) => {
    return this.bin.futuresOrder(side === 'LONG' ? 'SELL' : 'BUY', symbol, quantity, false, {
      type: "TAKE_PROFIT_MARKET",
      closePosition: true,
      stopPrice: takeProfitPrice,
      quantity: quantity,
      workingType: "CONTRACT_PRICE",
    });
  }


  stopLossOrder = async (side, symbol, quantity, takeProfitPrice) => {
    return this.bin.futuresOrder(side === 'LONG' ? 'SELL' : 'BUY', symbol, quantity, false, {
      type: "STOP_MARKET",
      closePosition: true,
      stopPrice: takeProfitPrice,
      quantity: quantity,
      workingType: "CONTRACT_PRICE",
    });
  }

  takeProfitLimits = (takeProfits, entryPrice, quotePrice)=>{

    const newTps =[];

    takeProfits.forEach(element => {
          const ntp = quotePrice * element/entryPrice;
          newTps.push(ntp);
    });

    return newTps;

  }

  tradeEnterSignal = async (tradeSignal, config) => {

    if (this.duplicate.includes(tradeSignal.tokenSymbol+":"+tradeSignal+entryRange+":"+tradeSignal.side) ) {
      logger.info('Signal has been Traded already so omitting')
      return;
    } else {

      this.duplicate.push(tradeSignal.tokenSymbol+":"+tradeSignal+entryRange+":"+tradeSignal.side) 
  


    logger.info('Setting Leverage for the Trade '+ config.leverage)

    console.log(tradeSignal)
    let coin = tradeSignal.tokenSymbol;
    await this.bin.futuresLeverage(coin, config.leverage);

    await this.bin.futuresMarginType(coin, "ISOLATED");



    let balance = await this.getBalance("USDT");

    if (balance < config.fundsPerTrade) {
      //if (balance < 0) {
      logger.error('Not Enough USDT Balance in account ')
    } else {

      let signalQuote = await this.bin.futuresQuote(tradeSignal.tokenSymbol);
      const symbols = await this.bin.futuresExchangeInfo();
      const symbol = symbols.symbols.filter((item) => item.symbol === coin)[0];


      if (tradeSignal.side === 'LONG') {
        let entrys = tradeSignal.entryRange;
        let qttyPerTrade = (config.leverage * config.fundsPerTrade / signalQuote.askPrice);
        //console.log(config.leverage* config.fundsPerTrade);
        //console.log(config.leverage* config.fundsPerTrade/ signalQuote.askPrice);
        // console.log((config.leverage * config.fundsPerTrade / signalQuote.askPrice) / entrys.length);
        //console.log('qttyPerTrade.toFixed(symbol.quantityPrecision)='+qttyPerTrade.toFixed(symbol.quantityPrecision));
        let newTps = takeProfitLimits(tradeSignal.takeProfit,tradeSignal.entryRange,signalQuote.askPrice);

           logger.info('Placing Limit Order  at ' + qttyPerTrade.toFixed(symbol.quantityPrecision) + ":" + signalQuote.askPrice);
          try {
            await this.bin.futuresBuy(coin, qttyPerTrade.toFixed(symbol.quantityPrecision), Number(signalQuote.askPrice).toFixed(symbol.pricePrecision));
          } catch (error) {
            console.log(error)

          }
 

       

        let takeProfits = tradeSignal.takeProfit.length > config.numberOfTakeProfits ? config.numberOfTakeProfits : newTps.length;
        let qttyPerSell = qttyPerTrade  / takeProfits;
        for (var s = 0; s < takeProfits; s++) {
          logger.info('Placing Take Profit Orders ' + qttyPerSell.toFixed(symbol.quantityPrecision) +":"+newTps[s]);
          try {

            await this.takeProfitOrder(tradeSignal.side, coin, qttyPerSell.toFixed(symbol.quantityPrecision), newTps[s]);
          } catch (error) {
            console.log(error)

          }
        }


        try {

          const slPrice  = signalQuote.bidPrice *(1 - this.stopLoss/100);
          logger.info('Placing StopLoss Order @ 7% '+slPrice);

          await this.stopLossOrder(tradeSignal.side, coin, qttyPerSell.toFixed(symbol.quantityPrecision), slPrice.toFixed(symbol.pricePrecision));

        } catch (error) {
          console.log(error)

        }
      }
      else if (tradeSignal.side === 'SHORT') {
        let entrys = tradeSignal.entryRange;
        let qttyPerTrade = (config.leverage * config.fundsPerTrade / signalQuote.askPrice) ;
        // console.log(config.leverage* config.fundsPerTrade);
        // console.log(config.leverage* config.fundsPerTrade/ signalQuote.bidPrice);
        // console.log((config.leverage * config.fundsPerTrade / signalQuote.askPrice) / entrys.length);
        // console.log('qttyPerTrade.toFixed(symbol.quantityPrecision)='+qttyPerTrade.toFixed(symbol.quantityPrecision));
        let newTps = this.takeProfitLimits(tradeSignal.takeProfit,tradeSignal.entryRange,signalQuote.bidPrice);

           logger.info('Placing Limit Order  at ' + qttyPerTrade.toFixed(symbol.quantityPrecision) + ":" + signalQuote.askPrice);

          try {


            await this.bin.futuresBuy(coin, qttyPerTrade.toFixed(symbol.quantityPrecision), Number(signalQuote.askPrice).toFixed(symbol.pricePrecision));

          } catch (error) {
            console.log(error)

          } 
        let takeProfits = tradeSignal.takeProfit.length > config.numberOfTakeProfits ? config.numberOfTakeProfits : newTps.length;
        let qttyPerSell = qttyPerTrade  / takeProfits;
        for (var s = 0; s < takeProfits; s++) {
          logger.info('Placing Take Profit Orders ' + qttyPerSell.toFixed(symbol.quantityPrecision) +":"+ newTps[s]);
          try {


            await this.takeProfitOrder(tradeSignal.side, coin, qttyPerSell.toFixed(symbol.quantityPrecision), newTps[s]);

          } catch (error) {
            console.log(error)
          }
        }

        logger.info('Placing StopLoss Order');
        try {

          const slPrice  = signalQuote.askPrice* (1 + this.stopLoss/100);
          logger.info('Placing StopLoss Order @ 7% '+slPrice);          
          await this.stopLossOrder(tradeSignal.side, coin, qttyPerSell.toFixed(symbol.quantityPrecision), slPrice.toFixed(symbol.pricePrecision));
        } catch (error) {
          console.log(error)

        }

      }

    }
  }


  }


  getOpenTrades = async (tradeSignal)=>{ 
    const openTrades = await this.bin.futuresAllOrders();  
    return openTrades;
  }

}

export default BinTrader;
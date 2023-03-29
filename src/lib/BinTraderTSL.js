import Binance from "node-binance-api";
import logger from "./logger.js";
import Logger from "@ptkdev/logger";

class BinTraderTSL {
  constructor(config) {
    this.bin = new Binance().options({
      APIKEY: config.apiKey,
      APISECRET: config.secretKey,
      hedgeMode: false,
      'family': 4,
      'reconnect': true
    });
    this.investAmount = config.fundsPerTrade;
    this.tpLimits = config.numberOfTakeProfits;
    this.stopLoss = config.stopLoss;
    this.trailingStopLoss = config.trailingStopLoss;
    this.tslTrigger = config.tslTrigger;
    this.leverage = config.leverage;
    this.closePositionAfterXMinutes = config.closePositionAfterXMinutes;
    this.maximumNumberOfOpenPositions = config.maximumNumberOfOpenPositions;
    this.entryType = config.entryType;
    this.cancelTrade = config.cancelTrade;
    this.duplicate = [];

    logger.docs('Client Connected to Binance ');

  }


  async checkHedgeMode() {
    await this.bin.futuresPositionSideDual().then(data => {
      if (!data.dualSidePosition) {
        console.log('not in hedge mode');
        changeHedgeMode();
      }
      else {
        console.log('in hedge mode');
      }
    }).catch((err) => console.log(err));
  }

  async changeHedgeMode() {
    await this.bin.futuresChangePositionSideDual(true).then(data => {
      console.log(data);
    }).catch((err) => console.log(err));
  }

  futuresTime = async () => {
    return await this.bin.futuresTime();
  }



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

    console.log(balance);
    keys.map((value) => {
      if (balance[value].asset === currency) {
        bal = parseFloat(balance[value].availableBalance);
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
      stopPrice: takeProfitPrice
    });
  }


  stopLossOrder = async (side, symbol, quantity, slPrice) => {
    return this.bin.futuresOrder(side === 'LONG' ? 'SELL' : 'BUY', symbol, quantity, false, {
      type: "STOP_MARKET",
      stopPrice: slPrice
    });

  }

  takeProfitLimits = (takeProfits, entryPrice, quotePrice, pricePrecision) => {

    const newTps = [];

    takeProfits.forEach(element => {
      const ntp = Number(quotePrice * element / entryPrice).toFixed(pricePrecision - 1);
      newTps.push(ntp);
    });

    return newTps;

  }

  tradeEnterSignal = async (tradeSignal, config) => {

    let orderData = {
      orderData: 0,
      tpOrderData: [],
      slOrderData: 0
    }
    let tpRange = [];
    let binance = this.bin;
    let qttyPerSell;
    let trailingStopLoss = this.trailingStopLoss;

    if (this.duplicate.includes(tradeSignal.tokenSymbol + ":" + tradeSignal.entryRange + ":" + tradeSignal.side)) {
      logger.info('Signal has been Traded already so omitting')
      return;
    } else {

      this.duplicate.push(tradeSignal.tokenSymbol + ":" + tradeSignal.entryRange + ":" + tradeSignal.side)



      logger.info('Setting Leverage for the Trade ' + config.leverage)

      console.log(tradeSignal)
      let coin = tradeSignal.tokenSymbol;
      await this.bin.futuresLeverage(coin, 50);

      await this.bin.futuresMarginType(coin, "ISOLATED");



      let balance = await this.getBalance("USDT");

      if (balance < 0) {
        //if (balance < 0) {
        logger.error('Not Enough USDT Balance in account ')
      } else {

        let signalQuote = await this.bin.futuresQuote(tradeSignal.tokenSymbol);
        const symbols = await this.bin.futuresExchangeInfo();
        const symbol = symbols.symbols.filter((item) => item.symbol === coin)[0];


        console.log(tradeSignal);

        if (tradeSignal.side === 'LONG') {
          let entrys = tradeSignal.entryRange;
          let qttyPerTrade = 0.75 * (config.leverage * config.fundsPerTrade / signalQuote.askPrice);
          console.log(config.leverage * config.fundsPerTrade);
          console.log(config.leverage * config.fundsPerTrade / signalQuote.askPrice);
          console.log('qttyPerTrade.toFixed(symbol.quantityPrecision)=' + qttyPerTrade.toFixed(symbol.quantityPrecision));
          let newTps = this.takeProfitLimits(tradeSignal.takeProfit, tradeSignal.entryRange, signalQuote.askPrice, symbol.pricePrecision);
          tpRange = newTps;
          console.log(tpRange);
          logger.info('Placing Market Order  at ' + qttyPerTrade.toFixed(symbol.quantityPrecision) + ":" + Number(signalQuote.askPrice).toFixed(symbol.pricePrecision));
          try {
           // orderData.orderData = await this.bin.futuresOrder(tradeSignal.side === 'LONG' ? 'SELL' : 'BUY', coin, qttyPerTrade.toFixed(symbol.quantityPrecision), Number(signalQuote.askPrice).toFixed(symbol.pricePrecision - 1));
            orderData.orderData = await this.bin.futuresBuy(coin, qttyPerTrade.toFixed(symbol.quantityPrecision), Number(signalQuote.askPrice).toFixed(symbol.pricePrecision - 1));

            console.log(orderData.orderData);

          } catch (error) {
            console.log(error)
          }




          let takeProfits = tradeSignal.takeProfit.length > config.numberOfTakeProfits ? config.numberOfTakeProfits : newTps.length;
            qttyPerSell = qttyPerTrade / takeProfits;
          for (var s = 0; s < takeProfits; s++) {
            logger.info('Placing Take Profit Orders ' + qttyPerSell.toFixed(symbol.quantityPrecision) + ":" + newTps[s]);
            try {

              orderData.tpOrderData[s] = await this.takeProfitOrder(tradeSignal.side, coin, qttyPerSell.toFixed(symbol.quantityPrecision), newTps[s]);

              console.log(orderData.tpOrderData);

            } catch (error) {
              console.log(error)

            }
          }


          try {

            const slPrice = signalQuote.bidPrice * (1 - this.stopLoss / 100);
            logger.info('Placing StopLoss Order @ 7% ' + slPrice.toFixed(symbol.pricePrecision));

            orderData.slOrderData = await this.stopLossOrder(tradeSignal.side, coin, qttyPerSell.toFixed(symbol.quantityPrecision), slPrice.toFixed(symbol.pricePrecision - 1));
            console.log(orderData.slOrderData);

          } catch (error) {
            console.log(error)

          }
        }
        else if (tradeSignal.side === 'SHORT') {
          let entrys = tradeSignal.entryRange;
          let qttyPerTrade = (config.leverage * config.fundsPerTrade / signalQuote.askPrice);
          // console.log(config.leverage* config.fundsPerTrade);
          // console.log(config.leverage* config.fundsPerTrade/ signalQuote.bidPrice);
          // console.log((config.leverage * config.fundsPerTrade / signalQuote.askPrice) / entrys.length);
          // console.log('qttyPerTrade.toFixed(symbol.quantityPrecision)='+qttyPerTrade.toFixed(symbol.quantityPrecision));
          let newTps = this.takeProfitLimits(tradeSignal.takeProfit, tradeSignal.entryRange, signalQuote.bidPrice, symbol.pricePrecision);

          logger.info('Placing Limit Order  at ' + qttyPerTrade.toFixed(symbol.quantityPrecision) + ":" + signalQuote.askPrice);

          try {


            orderData.orderData = await this.bin.futuresSell(coin, qttyPerTrade.toFixed(symbol.quantityPrecision), Number(signalQuote.askPrice).toFixed(symbol.pricePrecision));

          } catch (error) {
            console.log(error)

          }
          let takeProfits = tradeSignal.takeProfit.length > config.numberOfTakeProfits ? config.numberOfTakeProfits : newTps.length;
            qttyPerSell = qttyPerTrade / takeProfits;
          for (var s = 0; s < takeProfits; s++) {
            logger.info('Placing Take Profit Orders ' + qttyPerSell.toFixed(symbol.quantityPrecision) + ":" + newTps[s]);
            try {


              orderData.tpOrderData = await this.takeProfitOrder(tradeSignal.side, coin, qttyPerSell.toFixed(symbol.quantityPrecision), newTps[s]);

            } catch (error) {
              console.log(error)
            }
          }

          logger.info('Placing StopLoss Order');
          try {

            const slPrice = signalQuote.askPrice * (1 + this.stopLoss / 100);
            logger.info('Placing StopLoss Order @ 7% ' + slPrice);
            orderData.slOrderData = await this.stopLossOrder(tradeSignal.side, coin, qttyPerSell.toFixed(symbol.quantityPrecision), slPrice.toFixed(symbol.pricePrecision));
          } catch (error) {
            console.log(error)

          }

        }
        
        const stplOld = Number(orderData.slOrderData.stopPrice);
        const tps = tpRange;
        let tslCalc = 0;
        let newTsl = 0;
        this.bin.futuresMiniTickerStream(tradeSignal.tokenSymbol, function (data) {

          const currPrice = Number(data.close);


          logger.info(currPrice +":" +":"+orderData.slOrderData.side+":"+newTsl +":"+ tslCalc +":"+stplOld+":"+tps[0]);


          tps.forEach((item) => {


            if (orderData.slOrderData.side === 'BUY' && Number(item) > currPrice) {

              logger.info(' Changing tsl BUY ');


              tslCalc = currPrice * (1 +  trailingStopLoss / 100);
              newTsl = tslCalc > stplOld ? tslCalc : stplOld;
            } else if (orderData.slOrderData.side === 'SELL' && Number(item) < currPrice) {

              logger.info(' Changing tsl SELL ');

              tslCalc = currPrice * (1 -  trailingStopLoss / 100);
              newTsl = tslCalc < stplOld ? tslCalc : stplOld;
            }
            
          })

          if(newTsl !=0 && newTsl!= stplOld){
            logger.info(newTsl +":"+ tslCalc +":"+stplOld);  
            logger.info("Now Will Be Cancelling Order Id "+orderData.slOrderData.orderId);
            binance.futuresCancel(orderData.slOrderData.symbol, { orderId: orderData.slOrderData.orderId }).then(orderDataX => {
  
               console.log(orderDataX);
  
            });
            logger.info("Placing new STPL ORde ");
  
           const newOrder =  binance.futuresOrder(orderData.slOrderData.side , orderData.slOrderData.symbol,
              qttyPerSell.toFixed(symbol.quantityPrecision), false, {
              type: "STOP_MARKET",
              stopPrice: newTsl.toFixed(symbol.pricePrecision)
            }).then(orderDataX => {
  
              orderData.slOrderData = orderDataX
              console.log(orderDataX);
  
            }).catch((error)=>{
              logger.error(error);
            })
          }

        
        });
      }

    }
  }




  getOpenTrades = async (tradeSignal) => {
    const openTrades = await this.bin.futuresAllOrders();
    return openTrades;
  }




}

export default BinTraderTSL;
import Binance from "node-binance-api";
 
class TradeCleaner {
    constructor(config) {
    this.bin = new Binance().options({
        APIKEY: config.apiKey,
        APISECRET: config.secretKey,
        test: config.testnet,
        hedgeMode: false
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
      this.listenKey='';
      this.closePositiontime=0; 
    }
   

    autoCancelAfterTime = async(symbol)=>{

        return setInterval(async () => {
            await this.bin.futuresCountdownCancelAll( symbol, this.cancelTrade*60*1000 )

        }, 30000)

      }
 
  
  }
  
  export default TradeCleaner;
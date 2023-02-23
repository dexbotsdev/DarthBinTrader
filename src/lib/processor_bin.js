const regexA = /\w+[a-zA-Z0-9_]\/USDT/ig;
const sideRegex = /(?:LONG)|(?:SHORT)/gi;

const entryStart = "Entry"

const entryEnd = "NOW"
const entryEnd2 = "SPLIT";
const stopLossRegex = /[^SL:\ ]+/gi

const tpRegex = /[^*\) ]+['\n']/mg

let m;

export const processMessageB = (d) => {
    const mesg = d.content
    const result = {
        userName: d.author.username,
        tokenSymbol: '',
        enterAtCmp: false,
        entryMax: 0,
        entryMin: 0,
        side: '', //LONG/SHORT
        stopLoss: 0,
        takeProfit: [],
    }

    try {
        const symbol = mesg.match(regexA)[0];
        if (!symbol.endsWith('USDT')) return 'Not A Signal';

        const data =  mesg.split("\n");

        console.log(data[data.indexOf('Entry Targets:')+1]);

        const entryRange = [data[data.indexOf('Entry Targets:')+1]];
        const cmpFlag = isCMPEnabled(mesg);

        result.tokenSymbol = symbol.replace('/','');
        result.enterAtCmp = cmpFlag;
        result.side = getSide(mesg);
         result.entryRange=entryRange;
        result.takeProfit = getTPLevels(mesg)
        result.stopLoss = getStopLoss(mesg)


    } catch (error) {
         return 'Not A Signal';
    }

    
    return result;
}


const getEntryPrice = (mesg) => {

    const lines = mesg.split("\n");
 
    let entryRange=[];
    
    try{
        for(var i=0;i<lines.length;i++){
        
            if(lines[i].indexOf(entryStart) !== -1)
            {
                 const str = JSON.stringify(lines[i]);
                const numArray = (str.replace(/[^\d.-]/g, '')).split('-'); 
                for(var k=0;k<numArray.length;k++){
                    if(!isNaN(numArray[k]) && Number(numArray[k])>0)entryRange.push(Number(numArray[k]));
                }
            }
        }
    }catch(error){
        console.log(error)
    }
     
    return entryRange;
}


const isCMPEnabled = (mesg) => {

    return mesg.indexOf("NOW AT CURRENT MARKET PRICE") > 0 || mesg.indexOf("NOW AT CMP") > 0
}


const getSide = (mesg) => {

    if (mesg.match(sideRegex)[0].toLowerCase() === 'long') return 'LONG';
    else return 'SHORT'

}

const getStopLoss = (mesg) => {

    const start = mesg.split("\n");
      return start[start.length-1].split('-')[0];
}

const getTPLevels = (mesg) => {

    const tpLevels = [];

    const tpLevelMatch = mesg.match(tpRegex);

    for (var i = 0; i < tpLevelMatch.length; i++) {
        const lastOne = i

        const lastonestartsAt = mesg.indexOf(lastOne + ")") + 3;
        const lastLineSt = mesg.substring(lastonestartsAt);
        const lastLineInd = lastLineSt.indexOf('\n')
        const lastOneData = lastLineSt.substring(0, lastLineInd);
        if (!isNaN(lastOneData))
            tpLevels.push(lastOneData);
    }
    return tpLevels;

}
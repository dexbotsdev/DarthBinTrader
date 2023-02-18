const regexA = /\w+[a-zA-Z0-9_]\/USDT/ig;
const sideRegex = /(?:LONG)|(?:SHORT)/gi;

const entryStart = "Entry"

const entryEnd = "NOW"
const entryEnd2 = "SPLIT";
const stopLossRegex = /[^SL:\ ]+/gi

const tpRegex = /[^*\) ]+['\n']/mg

let m;

export const processMessage = (d) => {
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

        const entryRange = getEntryPrice(mesg);
        const cmpFlag = isCMPEnabled(mesg);

        result.tokenSymbol = symbol;
        result.enterAtCmp = cmpFlag;
        result.side = getSide(mesg);
        const range = entryRange.split("-")
        if (range[0].trim() > range[range.length - 1].trim()) {
            result.entryMin = range[range.length - 1].trim()
            result.entryMax = range[0].trim()
        }
        else { 
            result.entryMin = range[range.length - 1].trim()
            result.entryMax = range[0].trim()
        } 
        result.takeProfit = getTPLevels(mesg)
        result.stopLoss = getStopLoss(mesg)


    } catch (error) {
         return 'Not A Signal';
    }


    return result;
}


const getEntryPrice = (mesg) => {

    let start = '0';
    if (mesg.indexOf(entryEnd) > 0)
        start = mesg.substring(mesg.indexOf(entryStart) + 6, mesg.indexOf(entryEnd) - 2);
    else
        start = mesg.substring(mesg.indexOf(entryStart) + 6, mesg.indexOf("TakeProfit"));
 

    const entryRange = start;
    if (!isNaN(entryRange)) console.log('Entry is single nuber');
 
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

    const start = mesg.indexOf("SL:") + 3;
    const extract = mesg.substring(start, start + 10);
     return extract.split(" ")[1];
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
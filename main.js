"use strict";

// ----------------------------------------------------------------------------

const ccxt = require("ccxt");
const Telegraf = require("telegraf");
const moment = require("moment");
const log = require("ololog");
const exchange = new ccxt.bitfinex2({
  timeout: 60000,
  enableRateLimit: true
});
const bot = new Telegraf("946212834:AAEnS2PyJ_baisJlJeHium3Bg195bpVfhRU");

bot.start(ctx => ctx.reply("Welcome"));
bot.help(ctx => ctx.reply("Send me a sticker"));

(async () => {
  const coins = [
    "BTC/USD",
    "ETH/USD",
    "LTC/USD",
    "XRP/USD",
    "BCH/USD",
    "EOS/USD",
    "NEO/USD",
    "XMR/USD",
    "ZEC/USD"
  ];

  try {
    const tickers = await exchange.fetchTickers();

    coins.forEach(function(item) {
      setInterval(getVolume, 15000, item, tickers);
    });
  } catch (e) {
    log.dim("--------------------------------------------------------");
    log(e.constructor.name, e.message);
    log.dim("--------------------------------------------------------");
    log.dim(exchange.last_http_response);
    log.error("Failed.");
  }
})();

async function getVolume(coin, tickers) {
  let sell_volume = 0;
  let buy_volume = 0;
  // console.log("base volume - " + tickers[coin].baseVolume);
  const avrgVolume = tickers[coin].baseVolume / 288;
  const candles = await exchange.fetchOHLCV(coin, "5m");
  const last_ohlcv = candles[candles.length - 1];
  const trades = await exchange.fetchTrades(coin, last_ohlcv[0], 500);

  if (last_ohlcv[5] > 3 * avrgVolume) {
    trades.forEach(function(value) {
      if (value.timestamp >= last_ohlcv[0]) {
        value.side === "sell"
          ? (sell_volume += value.amount)
          : (buy_volume += value.amount);
      }
    });
    console.log(last_ohlcv[2]);
    console.log(candles[candles.length - 2][4]);
    const price_change = (last_ohlcv[2] * 100) / candles[candles.length - 2][4];
    const volume_diff = (last_ohlcv[5] * 100) / avrgVolume;
    const reply =
      coin +
      "\n  Volume: " +
      last_ohlcv[5] +
      "\n  Volume diff: " +
      volume_diff +
      " %  \n  Sell volume: " +
      sell_volume +
      "\n  Buy volume: " +
      buy_volume +
      "\n  Price change: " +
      (price_change - 100) +
      " %";
    bot.telegram.sendMessage(-316496113, reply);

    console.log("Asset: " + coin);
    console.log("Sell volume: " + sell_volume);
    console.log("Buy volume: " + buy_volume);
    console.log("Volume is: " + last_ohlcv[5]);

    const date = moment(last_ohlcv[0]);
    console.log("Date is: " + date);
  }
}
bot.startPolling();

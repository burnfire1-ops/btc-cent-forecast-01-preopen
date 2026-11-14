// btc-cent-forecast-01 — forecast the BTC/USDC close 240 minutes ahead.
// Model: pull the last price 40% toward the 24-hour (1440-minute) mean.
// Node 22 stdlib only. Deterministic: no clock, no randomness, no network.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename, extname } from "node:path";

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? "/input";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const MEAN_WINDOW = 1440; // one day of 1-minute closes
const PULL = 0.40; // fraction of the gap to the 24h mean to close
const MIN_PRICE = 0.00001;
const MAX_PRICE = 9999999.99999;

function forecast(prices: number[]): number {
  // 0.40 is the backtest peak: the 66-checkpoint sweep bottomed out at
  // pull 0.40 ($392.32) and was already worse at 0.50 ($401.10).
  if (prices.length === 0) {
    throw new Error("empty prices");
  }
  const last = prices[prices.length - 1];
  const window = prices.slice(Math.max(0, prices.length - MEAN_WINDOW));
  let sum = 0;
  for (const p of window) {
    sum += p;
  }
  const mean24 = sum / window.length;
  const guess = last + PULL * (mean24 - last);
  const clamped = Math.min(MAX_PRICE, Math.max(MIN_PRICE, guess));
  return Math.round(clamped * 1e5) / 1e5;
}

function main(): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = readdirSync(INPUT_DIR)
    .filter((f) => extname(f) === ".in")
    .sort();
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(INPUT_DIR, file), "utf8"));
    const market = data.markets[0];
    const price = forecast(market.prices);
    const out = { forecasts: [{ case: data.case, price }] };
    const outName = basename(file, ".in") + ".out";
    writeFileSync(join(OUTPUT_DIR, outName), JSON.stringify(out) + "\n");
  }
}

main();

# btc-cent-forecast-01

## Task

Each case file holds one market, BTC/USDC, with 4,320 one-minute closing prices covering the last 72 hours up to a checkpoint. The program must forecast the BTC close 240 minutes after that checkpoint and write a single price guess per case. Scoring is the mean absolute error in cents across all cases, so the guess should be a good point forecast of where the price will actually land, and every guess has to be a finite positive number rounded to five decimals.

## Model

The score is absolute error, so the optimal point forecast is the median of the future price distribution, not the mean. Persistence, guessing that the price stays where it is, is a decent median, but BTC mean-reverts over a four-hour horizon. The model therefore pulls the last price 40% of the way toward the 24-hour mean (the average of the last 1,440 closes, or of all closes when fewer are available): guess = last + 0.40 * (mean24 - last), then clamped to [0.00001, 9999999.99999] and rounded to 5 decimals. Trend extrapolation was tested and rejected; it makes the forecast worse.

## Backtest

Coordinator backtest over 66 internal checkpoints across the six practice cases, each forecasting 240 minutes ahead, mean absolute error in dollars:

| Method | Mean abs error |
| --- | --- |
| Persistence (guess = last price) | $409.50 |
| Mean reversion, pull 0.05 | $405.31 |
| Mean reversion, pull 0.10 | $401.11 |
| Mean reversion, pull 0.15 | $397.51 |
| Mean reversion, pull 0.20 | $396.47 |
| Mean reversion, pull 0.30 | $394.40 |
| **Mean reversion, pull 0.40 (this entry)** | **$392.32** |
| Mean reversion, pull 0.50 | $401.10 |
| Mean reversion, pull 0.60 | $433.42 |
| Trend extrapolation (damped slope, any window) | $422–$576 |

The 40% pull is the best of the sweep, about 4.2% better than persistence, and the error rises again on either side of it, so 0.40 is the chosen setting. The practice answers are sealed server-side, so this backtest was run by the coordinator over its own internal checkpoints rather than against the practice case answers. Trend variants are worse than persistence across the board and are not used.

## How to run

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts
```

Node 22 standard library only, deterministic, no network access. Each `<id>.in` in the input directory produces a `<id>.out` containing `{"forecasts":[{"case":"<id>","price":<number>}]}`.

## License

MIT.

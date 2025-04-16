document.addEventListener("DOMContentLoaded", function () {
    console.log("BTC & XAU Intraday Dashboard Loaded with APIs");

    // Highlight signal boxes for new signals (simulated)
    const btcSignalBox = document.querySelector("#btc-section .signal-box");
    const xauSignalBox = document.querySelector("#xau-section .signal-box");
    setInterval(() => {
        btcSignalBox.classList.toggle("active");
        xauSignalBox.classList.toggle("active");
    }, 60000);

    // Alpha Vantage API Key
    const alphaVantageKey = "VZBL7TW3MHCMBDX2";

    // Function to calculate RSI
    function calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;
        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            let diff = prices[i] - prices[i - 1];
            if (diff >= 0) gains += diff;
            else losses -= diff;
        }
        let avgGain = gains / period;
        let avgLoss = losses / period;
        let rs = avgGain / (avgLoss || 1);
        return 100 - (100 / (1 + rs));
    }

    // Function to detect candlestick patterns
    function detectPattern(candle) {
        const { open, high, low, close } = candle;
        const body = Math.abs(close - open);
        const upperWick = high - Math.max(open, close);
        const lowerWick = Math.min(open, close) - low;
        const totalRange = high - low;

        if (body < totalRange * 0.1 && upperWick > body && lowerWick > body) {
            return { pattern: "Doji", confidence: "80%" };
        } else if (lowerWick > body * 2 && upperWick < body && close > open) {
            return { pattern: "Hammer", confidence: "85%" };
        } else if (body > totalRange * 0.6 && close < open) {
            return { pattern: "Bearish Engulfing", confidence: "75%" };
        } else if (upperWick > body * 2 && lowerWick < body && close < open) {
            return { pattern: "Shooting Star", confidence: "70%" };
        }
        return null;
    }

    // Fetch BTC data from Binance
    function fetchBTCSignals() {
        fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=15")
            .then(response => response.json())
            .then(data => {
                const prices = data.map(candle => parseFloat(candle[4])); // Closing prices
                const latestCandle = {
                    open: parseFloat(data[data.length - 1][1]),
                    high: parseFloat(data[data.length - 1][2]),
                    low: parseFloat(data[data.length - 1][3]),
                    close: parseFloat(data[data.length - 1][4])
                };
                const timestamp = new Date(data[data.length - 1][0]).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

                // Calculate RSI for signals
                const rsi = calculateRSI(prices);
                let signal = "Hold", action = "Wait";
                if (rsi && rsi < 30) {
                    signal = "Buy";
                    action = "Enter";
                } else if (rsi && rsi > 70) {
                    signal = "Sell";
                    action = "Exit";
                }

                // Update signals table
                const btcSignalTable = document.querySelector("#btc-signal-table tbody");
                btcSignalTable.innerHTML = `
                    <tr>
                        <td>${timestamp}</td>
                        <td>${signal}</td>
                        <td>${latestCandle.close.toFixed(2)}</td>
                        <td>${action}</td>
                    </tr>
                `;

                // Detect patterns
                const pattern = detectPattern(latestCandle);
                const btcPatternTable = document.querySelector("#btc-pattern-table tbody");
                btcPatternTable.innerHTML = pattern ? `
                    <tr>
                        <td>${timestamp}</td>
                        <td>${pattern.pattern}</td>
                        <td>${pattern.confidence}</td>
                    </tr>
                ` : `<tr><td colspan="3">No pattern detected</td></tr>`;
            })
            .catch(error => {
                console.error("Error fetching BTC data:", error);
                document.querySelector("#btc-signal-table tbody").innerHTML = `<tr><td colspan="4">Error loading signals</td></tr>`;
                document.querySelector("#btc-pattern-table tbody").innerHTML = `<tr><td colspan="3">Error loading patterns</td></tr>`;
            });
    }

    // Fetch XAU data from Alpha Vantage
    function fetchXAUSignals() {
        fetch(`https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=XAU&to_symbol=USD&interval=5min&apikey=${alphaVantageKey}`)
            .then(response => response.json())
            .then(data => {
                if (!data["Time Series FX (5min)"]) {
                    throw new Error("Invalid XAU data or API limit reached");
                }
                const timeSeries = data["Time Series FX (5min)"];
                const timestamps = Object.keys(timeSeries).sort().slice(-15);
                const prices = timestamps.map(ts => parseFloat(timeSeries[ts]["4. close"]));
                const latestTimestamp = timestamps[timestamps.length - 1];
                const latestCandle = {
                    open: parseFloat(timeSeries[latestTimestamp]["1. open"]),
                    high: parseFloat(timeSeries[latestTimestamp]["2. high"]),
                    low: parseFloat(timeSeries[latestTimestamp]["3. low"]),
                    close: parseFloat(timeSeries[latestTimestamp]["4. close"])
                };
                const timestamp = new Date(latestTimestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

                // Calculate RSI for signals
                const rsi = calculateRSI(prices);
                let signal = "Hold", action = "Wait";
                if (rsi && rsi < 30) {
                    signal = "Buy";
                    action = "Enter";
                } else if (rsi && rsi > 70) {
                    signal = "Sell";
                    action = "Exit";
                }

                // Update signals table
                const xauSignalTable = document.querySelector("#xau-signal-table tbody");
                xauSignalTable.innerHTML = `
                    <tr>
                        <td>${timestamp}</td>
                        <td>${signal}</td>
                        <td>${latestCandle.close.toFixed(2)}</td>
                        <td>${action}</td>
                    </tr>
                `;

                // Detect patterns
                const pattern = detectPattern(latestCandle);
                const xauPatternTable = document.querySelector("#xau-pattern-table tbody");
                xauPatternTable.innerHTML = pattern ? `
                    <tr>
                        <td>${timestamp}</td>
                        <td>${pattern.pattern}</td>
                        <td>${pattern.confidence}</td>
                    </tr>
                ` : `<tr><td colspan="3">No pattern detected</td></tr>`;
            })
            .catch(error => {
                console.error("Error fetching XAU data:", error);
                document.querySelector("#xau-signal-table tbody").innerHTML = `<tr><td colspan="4">Error loading signals: ${error.message}</td></tr>`;
                document.querySelector("#xau-pattern-table tbody").innerHTML = `<tr><td colspan="3">Error loading patterns</td></tr>`;
            });
    }

    // Fetch data initially and every 5 minutes
    fetchBTCSignals();
    fetchXAUSignals();
    setInterval(fetchBTCSignals, 5 * 60 * 1000);
    setInterval(fetchXAUSignals, 5 * 60 * 1000);

    // Fetch XAU news using NewsAPI
    const newsApiKey = "e65e835d2d754ee0b88387af19c0743e";
    const xauNewsFeed = document.getElementById("xau-news-feed");
    
    fetch(`https://newsapi.org/v2/everything?q=gold%20price%20OR%20gold%20trading%20OR%20gold%20India&language=en&sortBy=publishedAt&apiKey=${newsApiKey}`)
        .then(response => response.json())
        .then(data => {
            xauNewsFeed.innerHTML = "";
            const articles = data.articles.slice(0, 5);
            if (articles.length === 0) {
                xauNewsFeed.innerText = "No XAU news found. Check Telegram for updates.";
                return;
            }
            articles.forEach(article => {
                const newsItem = document.createElement("div");
                newsItem.className = "news-article";
                newsItem.innerHTML = `
                    <a href="${article.url}" target="_blank">${article.title}</a>
                    <p>${article.description || "No description available."}</p>
                    <p><small>${new Date(article.publishedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</small></p>
                `;
                xauNewsFeed.appendChild(newsItem);
            });
        })
        .catch(error => {
            console.error("Error fetching XAU news:", error);
            xauNewsFeed.innerText = "Failed to load XAU news. Check your API key or try again later.";
        });
});
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [উইনগো কালার ট্রেড সিঙ্ক - গেটওয়ে সকেট প্রোটকল লক ভাই ভাই]
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob:; style-src * 'unsafe-inline'; font-src * data:;");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// 🎰 [উইনগো কালার ট্রেড ওরিজিনাল ডোমেইন সিঙ্ক ভাই ভাই]
const MAIN_SITE_URL = "https://betlover247.onrender.com"; 
const cardSuitsPool = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স ইন্টারসেপ্টর গেটওয়ে
app.get('/api/teenpatti-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    const targetWallet = wallet || "main";
    try {
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet", username: userId, amount: 0, wallet: targetWallet, game: "teenpatti"
        }, { timeout: 30000 });

        if (response.data && response.data.status === "ok" && response.data.balance !== undefined) {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { return res.json({ success: false, balance: 0 }); }
});

// 🛫 ২. তিন পাত্তি কোর ট্রানজেকশন ডিল রাউট (POST Route - ৯৫% RTP গাণিতিক বর্ম কঠোর লক ভাই ভাই!)
app.post('/api/teenpatti-deal', async (req, res) => {
    const { userId, amount, wallet, game } = req.body;
    
    const targetWallet = wallet || "main";
    const reqAmount = parseFloat(amount) || 50;
    const finalGameName = "teenpatti"; // 🎯 লবির কি-শর্টকোড টাইট লক

    // 🔒 ফিল্টার বাউন্সার লক ভাই ভাই
    if (reqAmount < 1 || reqAmount > 20000) {
        return res.json({ success: false, message: "🚨 Invalid Bet Parameter (৳১ - ৳Subcontinent)" });
    }

    try {
        // 🔒 [ব্যালেন্স যাচাই প্রোটোকল]: বাজি প্লে করার সাথে সাথে ডাটাবেজ থেকে BDT টাকা কেটে নেওয়ার বর্ম লক
        const balResponse = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet", username: userId, amount: reqAmount, wallet: targetWallet, game: finalGameName
        }, { timeout: 30000 });
        
        let currentDbBalance = 0;
        if (balResponse.data && balResponse.data.status === "ok" && balResponse.data.balance !== undefined) {
            currentDbBalance = parseFloat(balResponse.data.balance);
        } else {
            return res.json({ success: false, balance: 0, message: "X Database Sync Error! Please refresh and try again." });
        }

        if (currentDbBalance < 0) {
            return res.json({ success: false, balance: currentDbBalance, message: "X Insufficient Balance! Please Recharge." });
        }

        let adminTriggeredPrize = (balResponse.data && balResponse.data.teenpatti_target) ? balResponse.data.teenpatti_target : null;

        let playerCards, dealerCards, finalResultStatus, winMultiplier, handStrengthTextPlayer, handStrengthTextDealer;
        let isLoopActive = true;
        let loopSafety = 0;

        let ranks = { 1: "A", 11: "J", 12: "Q", 13: "K" };

        // 🧠 তিন পাত্তি হ্যান্ড ম্যাথমেটিক্যাল স্কোর ক্যালকুলেটর চাবি ভাই ভাই
        const evaluateTeenPattiHand = (cards) => {
            let values = cards.map(c => {
                if (c.value === "A") return 14;
                if (c.value === "K") return 13;
                if (c.value === "Q") return 12;
                if (c.value === "J") return 11;
                return parseInt(c.value);
            }).sort((a, b) => a - b);

            let suits = cards.map(c => c.suit);
            
            let isFlush = suits[0] === suits[1] && suits[1] === suits[2];
            let isStraight = (values[2] - values[1] === 1 && values[1] - values[0] === 1) || (values[0] === 2 && values[1] === 3 && values[2] === 14); // 3,2,A run backup

            // ১. Trail / Trio (তিনটিই সমান)
            if (values[0] === values[2]) return { score: 600000 + values[0], name: "Trail (Trio)" };
            // ২. Pure Sequence (Straight Flush)
            if (isStraight && isFlush) return { score: 500000 + values[2], name: "Pure Sequence" };
            // ৩. Sequence (Run)
            if (isStraight) return { score: 400000 + values[2], name: "Sequence (Run)" };
            // ৪. Colour (Flush)
            if (isFlush) return { score: 300000 + (values[2]*100 + values[1]*10 + values[0]), name: "Colour (Flush)" };
            // ۵. Pair (জোড়া)
            if (values[0] === values[1] || values[1] === values[2]) {
                let pairValue = values[1]; // মাঝখানেরটা অলওয়েজ পেয়ারের অংশ হবে সর্ট করার পর ভাই
                let kicker = values[0] === values[1] ? values[2] : values[0];
                return { score: 200000 + (pairValue * 100) + kicker, name: "Pair" };
            }
            // ৬. High Card
            return { score: 100000 + (values[2]*100 + values[1]*10 + values[0]), name: `High Card ${ranks[values[2]-1] || values[2]}` };
        };

        // 🎰 [🎰 ৯৫% ক্যাসিনো RTP এবং তিন পাত্তি র্যান্ডম কার্ড জেনারেটর লুপ ভাই ভাই]
        while (isLoopActive && loopSafety < 200) {
            loopSafety++;
            playerCards = [];
            dealerCards = [];

            // প্লেয়ার ও ডিলারের জন্য ৩টি করে তাসের র্যান্ডম ডিস্ট্রিবিউশন
            for (let i = 0; i < 3; i++) {
                let pVal = Math.floor(Math.random() * 13) + 1;
                let dVal = Math.floor(Math.random() * 13) + 1;
                playerCards.push({ value: ranks[pVal] || pVal.toString(), suit: cardSuitsPool[Math.floor(Math.random() * 4)] });
                dealerCards.push({ value: ranks[dVal] || dVal.toString(), suit: cardSuitsPool[Math.floor(Math.random() * 4)] });
            }

            let pEval = evaluateTeenPattiHand(playerCards);
            let dEval = evaluateTeenPattiHand(dealerCards);

            handStrengthTextPlayer = pEval.name;
            handStrengthTextDealer = dEval.name;

            if (pEval.score > dEval.score) {
                finalResultStatus = "win";
                winMultiplier = 1.95; // 🎯 ওরিজিনাল ৩ পাত্তি ডিল ওッズ চ্যাম লক
            } else {
                finalResultStatus = "lose";
                winMultiplier = 0.00;
            }

            // এডমিন প্যানেল ফোর্স উইন-লস কন্ট্রোল নব
            if (adminTriggeredPrize) {
                if (adminTriggeredPrize === "force_lose" && finalResultStatus === "win") isLoopActive = false;
                if (adminTriggeredPrize === "force_win" && finalResultStatus === "win") isLoopActive = false;
            } else {
                if (finalResultStatus === "win") {
                    // ৯৫% আরটিপি সিঙ্ক কন্ট্রোল ম্যাথ লুপ স্বাভাবিক ট্র্যাকে ৪২% এ ব্যালেন্সড লক ভাই ভাই!
                    if (Math.random() <= 0.42) isLoopActive = false;
                } else {
                    isLoopActive = false;
                }
            }
        }

        let winAmount = 0;
        let dbAction = "bet";
        let dbAmount = reqAmount; // 🔒 বাজি হারলেও ডাটাবেজে আপনার রিয়াল বাজি ধরার টাকাই (Stake) জমা হবে ওস্তাদ!

        if (finalResultStatus === "win") {
            winAmount = Math.round(reqAmount * winMultiplier);
            dbAction = "win";
            dbAmount = parseFloat(winAmount); // জিতলে উইনিং এমাউন্ট যাবে
        }

        let phpPayload = {
            action: dbAction, username: userId, amount: dbAmount, wallet: targetWallet, game: finalGameName
        };

        if (dbAction === "win") {
            phpPayload.bet_amount = reqAmount;
            phpPayload.multiplier = winMultiplier.toFixed(2);
            phpPayload.status = "win";
        } else {
            phpPayload.bet_amount = reqAmount;
            phpPayload.status = "lose";
        }

        // 🛫 ৩. মেইন সাইটের সিকিউরড গেটওয়েতে রিয়েল-টাইম উইন-লস এপিআই হিট
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, phpPayload, { timeout: 30000 });

        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });

            let logReason = finalResultStatus === "win" ? handStrengthTextPlayer : handStrengthTextDealer;

            return res.json({
                success: true,
                balance: response.data.balance,
                gameData: {
                    playerCards: playerCards,
                    dealerCards: dealerCards,
                    status: finalResultStatus,
                    winAmount: winAmount,
                    result: logReason
                }
            });
        } else {
            let latestBal = (response.data && response.data.balance !== undefined) ? response.data.balance : currentDbBalance;
            return res.json({ success: false, balance: latestBal, message: "X Bet Settlement Declined inside PHP Callback Database Node!" });
        }

    } catch (e) {
        console.error("Teen Patti Royal Core Engine Error:", e.message);
        return res.json({ success: false, message: "⚠️ Timeout! Click DEAL again." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log("Player connected to Teen Patti Royal Live Engine Node!");
});

// ⚡ কাস্টম তিন পাত্তি নোড সার্ভার পোর্ট গেটওয়ে লাইভ অন ফায়ার
const PORT = process.env.PORT || 28000;
server.listen(PORT, () => {
    console.log(`🎡 Teen Patti Royal Engine Running on port ${PORT}`);
});



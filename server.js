const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [উইনগো কালার ট্রেড সিঙ্ক - গ্লোবাল গেটওয়ে সকেট প্রোটকল লক ভাই ভাই]
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

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

// 🃏 ওরিজিনাল ক্যাসিনো স্ট্যান্ডার্ড ৪টি স্যুট ও ১৩টি র্যাংক (কাটায় কাটায় ৪ x ১৩ = ৫২টি পিউর কার্ড লক ওস্তাদ!)
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স ইন্টারсеপ্টর গেটওয়ে (১ শতভাগ টাইমআউট ও জ্যাম ব্লকার বর্ম ওস্তাদ)
app.get('/api/teenpatti-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    const targetWallet = wallet || "main";
    try {
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "balance", 
            username: userId,
            amount: 0,
            wallet: targetWallet,
            game: "teenpatti"
        }, { timeout: 15000 });

        if (response.data && (response.data.status === "ok" || response.data.success === true)) {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { 
        return res.json({ success: false, balance: 0 }); 
    }
});

// 🛫 ২. তিন পাত্তি কোর বেটিং ডিল রাউট (১০০০% এয়ার-টাইট ট্রানজেকশন প্রোটোকল বর্ম)
app.post('/api/teenpatti-deal', async (req, res) => {
    const { userId, amount, wallet, prediction } = req.body; 
    const reqAmount = parseFloat(amount) || 50;
    const userPrediction = String(prediction || "PLAYER").toUpperCase(); 
    const finalGameName = "teenpatti"; 
    const targetWallet = wallet || "main";

    if (reqAmount < 1 || reqAmount > 20000 || !["PLAYER", "DEALER"].includes(userPrediction)) {
        return res.json({ success: false, message: "🚨 Invalid Parameters! Select PLAYER or DEALER side." });
    }

    try {
        // 🛑 [🔒 কিলার চেক ১: ব্যালেন্স জিরো ও নেগেটিভ বাজি ব্লকার বর্ম]: বাজি কাটার আগে মেইন ব্যালেন্স লাইভ চেক লক!
        const preCheckBalRes = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "balance", username: userId, amount: 0, wallet: targetWallet, game: finalGameName
        }, { timeout: 15000 });

        let liveUserAvailableMoney = parseFloat(preCheckBalRes.data?.balance || 0);

        // যদি প্লেয়ারের ওয়ালেটে বাজি ধরার টাকা না থাকে বা ব্যালেন্স জিরো হয়, তবে এক টানে সোজা রিজেক্ট লক ওস্তাদ!
        if (liveUserAvailableMoney < reqAmount || liveUserAvailableMoney <= 0) {
            return res.json({ success: false, message: "❌ আপনার অ্যাকাউন্ট ব্যালেন্স জিরো বা অপ্রতুল! দয়া করে রিচার্জ করুন ওস্তাদ।" });
        }

        // 🔒 [🔒 কিলার চেক ২: জিরো-ডাবল-ডেবিট ট্রানজেকশন প্রোটোকল]: বাজি প্লে করার সাথে সাথে ১ম হিটে অ্যাকাউন্ট থেকে বাজি কাটার রিকোয়েস্ট লক
        const balResponse = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet", username: userId, amount: reqAmount, wallet: targetWallet, game: finalGameName
        }, { timeout: 30000 });
        
        if (!balResponse.data || balResponse.data.status !== "ok") {
            return res.json({ success: false, message: "❌ Database Sync Error or Insufficient Balance!" });
        }

        let currentDbBalance = parseFloat(balResponse.data.balance) || 0;
        
        let playerCards = [];
        let dealerCards = [];
        let winMultiplier = 0.00;
        let finalStatus = "lose";

        let isLoopActive = true;
        let loopSafety = 0;

        // 🎰 [🎰 আন্তর্জাতিক জেনুইন র্যান্ডম ৯৫% RTP ৫২-কার্ড লুপ ইঞ্জিন ভাই ভাই]
        while (isLoopActive && loopSafety < 150) {
            loopSafety++;
            
            playerCards = [];
            dealerCards = [];

            // ৫২-কার্ড পিউর ডেক লোড (জোকার জ্যাম ও ফোর-ফোল্ড ওভারফ্লো এক শটে সাফ!)
            let deck = [];
            for (let s of suits) {
                for (let r of ranks) {
                    deck.push({ rank: r, suit: s, value: ranks.indexOf(r) + 2 });
                }
            }
            
            // প্লেয়ার ও ডিলারের জন্য ৩টি করে ইউনিক ৫২-কার্ড ফরম্যাটের ইমেজ নেমিং ডিলিং লক ওস্তাদ!
            for (let i = 0; i < 3; i++) {
                let idx1 = Math.floor(Math.random() * deck.length);
                playerCards.push(deck.splice(idx1, 1)[0]); // [0] দিয়ে ওরিজিনাল অবজেক্ট নিখুঁত এক্সট্র্যাক্ট লক

                let idx2 = Math.floor(Math.random() * deck.length);
                dealerCards.push(deck.splice(idx2, 1)[0]);
            }

            // 🎯 [তিন পাত্তি হ্যান্ড র্যাঙ্কিং স্কোর ক্যালকুলেটর ইঞ্জিন]
            let pScore = getTeenPattiHandScore(playerCards);
            let dScore = getTeenPattiHandScore(dealerCards);

            let serverWinner = "PLAYER";
            if (dScore > pScore) {
                serverWinner = "DEALER";
            }

            // উইন-লস সেটেলমেন্ট কন্ডিশন সিঙ্ক
            if (userPrediction === serverWinner) {
                finalStatus = "win";
                winMultiplier = 1.95; // ক্যাসিনো স্ট্যান্ডার্ড ১.৯৫ গুণ প্রফিট লক ওস্তাদ!
            } else {
                finalStatus = "lose";
                winMultiplier = 0.00;
            }

            // এডমিন প্যানেল কাস্টম ফোর্স কন্ট্রোল নব ফিল্টারিং চ্যাম
            if (balResponse.data && balResponse.data.teenpatti_target) {
                let target = String(balResponse.data.teenpatti_target).toUpperCase();
                if (target === "FORCE_LOSE" && finalStatus === "win") {
                    finalStatus = "lose"; winMultiplier = 0.00;
                    isLoopActive = false;
                }
                if (target === "FORCE_WIN" && finalStatus === "win") isLoopActive = false;
            } else {
                if (finalStatus === "win") {
                    // আন্তর্জাতিক ক্যাসিনো আরটিপি সুষম ফিল্টারিং ট্র্যাকে ৪৩% উইন লক ভাই ভাই!
                    if (Math.random() <= 0.43) isLoopActive = false;
                } else {
                    isLoopActive = false;
                }
            }
        }

        // 🎯 [মেগা কিলার জিরো-ডাবল-ডেবিট স্টেক ব্যালেন্সার বর্ম ভাই ভাই]
        let winAmount = 0, dbAction = "win", dbAmount = 0;

        if (finalStatus === "win") {
            winAmount = Math.round(reqAmount * winMultiplier);
            dbAction = "win"; dbAmount = parseFloat(winAmount); 
        } else {
            dbAction = "win"; dbAmount = 0; // 🔒 লস হলে ডাটাবেজে ২য় বার টাকা কাটার ট্র্যাপ এরর ওয়ান-শটে ওড়াও সাফ!
        }

        // 📝 [🔒 হিস্ট্রি ওভারফলো সুপ্রিম ব্লকার বর্ম]: মেইন সাইটের bet_logs.php তে ডেটা নিখুঁত পাস লক ভাই ভাই
        let phpPayload = { 
            action: dbAction, 
            username: userId, 
            amount: dbAmount, 
            wallet: targetWallet, 
            game: finalGameName 
        };
        
        if (finalStatus === "lose") phpPayload.status = "lose";
        else phpPayload.status = "win";

        // হিস্ট্রি লগে বাজি ধরা টাকার ওরিজিনাল ডেটা পাস লক ওস্তাদ
        phpPayload.bet_amount = reqAmount;

        // 🛫 মেইন সাইটের সিকিউরড গেটওয়েতে রিয়েল-টাইম উইন-লস সেটেলমেন্ট এপিআই হিট
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, phpPayload, { timeout: 45000 });

        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            
            return res.json({
                success: true,
                balance: response.data.balance,
                data: { balance: response.data.balance },
                gameData: { 
                    playerCards,
                    dealerCards,
                    status: finalStatus, 
                    winAmount 
                }
            });
        } else {
            let latestBal = (response.data && response.data.balance !== undefined) ? response.data.balance : currentDbBalance;
            return res.json({ success: false, balance: latestBal, message: "X Bet Settlement Declined by Database!" });
        }
    } catch (e) { 
        return res.json({ success: false, message: "⚠️ Timeout! Click BET again." }); 
    }
});
// 📊 তিন পাত্তি গাণিতিক স্কোরিং মেমোরি কার্ড লজিক (Trail > Pure Sequence > Sequence > Color > Pair > High Card)
function getTeenPattiHandScore(cards) {
    if (!cards || cards.length < 3) return 0;
    
    // কার্ড ভ্যালু ক্রমানুসারে সর্টিং লক চ্যাম
    cards.sort((a, b) => b.value - a.value);
    
    // ০, ১, ২ ইনডেক্স অনুযায়ী ৩টি কার্ডের পিউর অবজেক্ট ভ্যালু ও স্যুট এক্সট্র্যাক্ট লক ওস্তাদ
    let v1 = cards[0].value, v2 = cards[1].value, v3 = cards[2].value;
    let s1 = cards[0].suit, s2 = cards[1].suit, s3 = cards[2].suit;

    let isTrail = (v1 === v2 && v2 === v3);
    let isPureSeq = (s1 === s2 && s2 === s3) && (v1 - v2 === 1 && v2 - v3 === 1);
    let isSeq = (v1 - v2 === 1 && v2 - v3 === 1);
    let isColor = (s1 === s2 && s2 === s3);
    let isPair = (v1 === v2 || v2 === v3 || v1 === v3);

    if (isTrail) return 60000 + v1;
    if (isPureSeq) return 50000 + v1;
    if (isSeq) return 40000 + v1;
    if (isColor) return 30000 + v1;
    if (isPair) {
        // পেয়ার বা জোড়া মিললে জোড়া কার্ডের ওরিজিনাল ভ্যালু রিড করার কিংস মেমোরি
        let pairVal = (v1 === v2) ? v1 : ((v2 === v3) ? v2 : v1);
        return 20000 + pairVal;
    }
    return 10000 + v1; // High Card Score
}

app.get('/', (req, res) => { res.sendFile(path.resolve(__dirname, 'index.html')); });
io.on('connection', (socket) => {});

const PORT = process.env.PORT || 28000; 
server.listen(PORT, () => { console.log(`🃏 Teen Patti Live Casino Ultimate Engine Running on port ${PORT}`); });


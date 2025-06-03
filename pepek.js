require('dotenv').config();
const { ethers } = require('ethers');
const prompt = require('prompt-sync')({ sigint: true });

const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    bold: '\x1b[1m',
    bright: '\x1b[1m',
    magenta: '\x1b[35m',
    purple: '\x1b[35m'
};

const logger = {
    info: (msg) => console.log(`${colors.green}[✓] ${msg}${colors.reset}`),
    wallet: (msg) => console.log(`${colors.white}[◨ ] ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}[!] ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}[✕] ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}[✓] ${msg}${colors.reset}`),
    loading: (msg) => console.log(`${colors.cyan}[↺] ${msg}${colors.reset}`),
    step: (msg) => console.log(`${colors.white}[➤] ${msg}${colors.reset}`),
    trade: (msg) => console.log(`${colors.magenta}[↭] ${msg}${colors.reset}`),
    profit: (msg) => console.log(`${colors.green}[$] ${msg}${colors.reset}`),
    token: (msg) => console.log(`${colors.cyan}[◊] ${msg}${colors.reset}`),
    rainai: (msg) => console.log(`${colors.yellow}[⇩] ${msg}${colors.reset}`),
    rainpump: (msg) => console.log(`${colors.purple}[⇧] ${msg}${colors.reset}`),
    banner: () => {
        console.log(`${colors.blue}${colors.bold}`);
        console.log('██████╗░███████╗███╗░░░███╗██████╗░███████╗██╗░░██╗  ██╗░░░░░░█████╗░██╗░░██╗░█████╗░████████╗');
        console.log('██╔══██╗██╔════╝████╗░████║██╔══██╗██╔════╝██║░██╔╝  ██║░░░░░██╔══██╗██║░░██║██╔══██╗╚══██╔══╝');
        console.log('██████╔╝█████╗░░██╔████╔██║██████╔╝█████╗░░█████═╝░  ██║░░░░░███████║███████║███████║░░░██║░░░');
        console.log('██╔═══╝░██╔══╝░░██║╚██╔╝██║██╔═══╝░██╔══╝░░██╔═██╗░  ██║░░░░░██╔══██║██╔══██║██╔══██║░░░██║░░░');
        console.log('██║░░░░░███████╗██║░╚═╝░██║██║░░░░░███████╗██║░╚██╗  ███████╗██║░░██║██║░░██║██║░░██║░░░██║░░░');
        console.log('╚═╝░░░░░╚══════╝╚═╝░░░░░╚═╝╚═╝░░░░░╚══════╝╚═╝░░╚═╝  ╚══════╝╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░░╚═╝░░░╚═╝░░░');
        console.log(`${colors.reset}\n`);
    }
};

class PempekMultiTokenBot {
    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider('https://carrot.megaeth.com/rpc');
        this.routerAddress = '0x6CeFC3Bf9813693AAccD59cffcA3B0b2e54b0545';
        this.wethAddress = '0x4eb2bd7bee16f38b1f4a0a5796fffd028b6040e9';
        this.wallets = [];
        
        this.routerABI = [
            "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
            "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
            "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
        ];
        
        this.tokenABI = [
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ];
        
        this.rainAITokens = {
            'MON': { address: '0x38674AbF0d8e1EF4Dbf737A37f15217c8cdBC454', name: 'Monet' },
            'GTE': { address: '0x768B22Fc580d05fbdFeFcFD7E462163832Faca52', name: 'GTE' },
            'BUNNZ': { address: '0x53c751EAECb2cD8C7Cb13a88d0A244A875Eb459D', name: 'BAD BUNNZ' },
            'MND': { address: '0x29E8a4c5c2577795C562c44024D43251Da6CE2F9', name: 'MONAD' },
            'SERA': { address: '0x4A01fDDDBa69d418c952D543ce25af0c79769299', name: 'Seraphine' },
            'MEGBOT': { address: '0xD703B1e1795858f5D01DB74CF95984C44dcC931A', name: 'MEGAETH ROBOT' },
            'RABG': { address: '0xbA8F08e31b74838438B40061A54ab707e737C8dC', name: 'Rabbit Grin' },
            'CHAA': { address: '0xE3B335A89F44d1De5032E794956087E4367dD786', name: 'Challenge' },
            'MW': { address: '0xe1f2Fc6776C4b349bEA7421550c7F34C10F6c788', name: 'MEGAWAWAK' },
            'NITY': { address: '0x53C1C18499D539558F05385e13984b7071D00f29', name: 'SERENITY' }
        };
        
        this.rainPumpTokens = {
            'FAFEL': { address: '0x0ae816dA8B3688A9AB8a3DDB50eF28a59C64eaaA', name: 'FAFEL', status: 'graduated' },
            'MEGA': { address: '0x2503847B90d182B50dE0641c4415481E26C1DfA5', name: 'MEGA', status: 'graduated' },
            'TELKOMSEL': { address: '0xf4f5Dfc74d9F9a8E66990B17CE150E5d7d5D6C55', name: 'TELKOMSEL', status: 'graduated' },
            'shark': { address: '0xB38506ae171105c01d2552545660D3A18d1806d5', name: 'shark', status: 'graduated' },
            'Rucand': { address: '0x8d3F212EA3acadC42D1a9E3D95fd1D3519DF6104', name: 'Rucand', status: 'graduated' },
            'EnsoXMegaEt': { address: '0xA2AdB026F6eDBA4e4bd243E3D97BDEAf44F952Dd', name: 'Enso X MegaEt', status: 'graduated' },
            'CEMANIMEME': { address: '0xd6383fCba8d03e4446fe1A9A4892ad74FD9D0F08', name: 'CEMANIMEME', status: 'graduated' },
            'BOCCHI': { address: '0xfD169F4F821a1816B2De94E8D14020B07Cbe7a0E', name: 'BOCCHI', status: 'graduated' },
            'DrunkSanta': { address: '0x9fe65DB57E70a138E1Ec6084F57CE8979961685e', name: 'Drunk santa', status: 'graduated' },
            'IS': { address: '0x6Ab872dCe59e97E637747DB36cA108662c1D37FA', name: 'IS', status: 'graduated' }
        };
        
        this.currentPlatform = null;
        this.currentTokens = null;
    }
    
    async loadWallets() {
        logger.banner();
        logger.info('Load 10 wallet from .env');
        
        for (let i = 1; i <= 10; i++) {
            const privateKey = process.env[`PRIVATE_KEY_${i}`];
            if (privateKey && privateKey !== '') {
                const wallet = new ethers.Wallet(privateKey, this.provider);
                this.wallets.push(wallet);
                
                const balance = await wallet.getBalance();
                const ethBalance = ethers.utils.formatEther(balance);
                
                logger.wallet(`Wallet ${wallet.address}`);
                logger.info(`  ETH: ${ethBalance} ETH\n`);
            }
        }
        
        return this.wallets.length;
    }
    
    showPlatformSelection() {
        console.log('=== Monggo mas ===');
        logger.rainai('1. rain ai');
        logger.rainpump('2. rain pump');
        
        const choice = prompt('seng endi? (1-2): ');
        
        if (choice === '1') {
            this.currentPlatform = 'rainai';
            this.currentTokens = this.rainAITokens;
            logger.rainai('RAINAI PLATFORM SELECTED');
            this.showRainAITokens();
        } else if (choice === '2') {
            this.currentPlatform = 'rainpump';
            this.currentTokens = this.rainPumpTokens;
            logger.rainpump('RAIN PUMP PLATFORM SELECTED');
            this.showRainPumpTokens();
        } else {
            logger.error('Invalid choice! Please select 1 or 2');
            this.showPlatformSelection();
        }
    }
    
    showRainAITokens() {
        logger.rainai('AVAILABLE RAINAI TOKENS (TOP 10):');
        logger.info('GRADUATED TOKENS (100% - Ready for DEX):');
        
        Object.entries(this.rainAITokens).forEach(([symbol, token]) => {
            logger.step(`${symbol.padEnd(8)} - ${token.name}`);
        });
        
        this.showTradingOptions();
    }
    
    showRainPumpTokens() {
        logger.rainpump('AVAILABLE RAIN PUMP TOKENS (TOP 10):');
        logger.info('🎯 GRADUATED TOKENS (100% - Ready for DEX):');
        
        Object.entries(this.rainPumpTokens).forEach(([symbol, token]) => {
            logger.step(`${symbol.padEnd(15)} - ${token.name}`);
        });
        
        this.showTradingOptions();
    }
    
    showTradingOptions() {
        const platformEmoji = this.currentPlatform === 'rainai' ? '⇩' : '⇧';
        const platformLogger = this.currentPlatform === 'rainai' ? logger.rainai : logger.rainpump;
        
        platformLogger(`\n${platformEmoji} TRADING OPTIONS:`);
        logger.step('1. Quick Scalp (1 min hold, 100% sell ALL BALANCE)');
        logger.step('2. Medium Hold (10 min hold, 50% sell)');
        logger.step('3. Whale Trading (0.1 ETH per trade × 10 tokens)');
        
        const tradingChoice = prompt('pilih strategi (1-3): ');
        
        if (tradingChoice === '1') {
            this.executeQuickScalp();
        } else if (tradingChoice === '2') {
            this.executeMediumHold();
        } else if (tradingChoice === '3') {
            this.executeWhaleTrading();
        } else {
            logger.error('Invalid choice! Please select 1-3');
            this.showTradingOptions();
        }
    }
    
    async executeQuickScalp() {
        const allTokens = Object.keys(this.currentTokens);
        const platformLogger = this.currentPlatform === 'rainai' ? logger.rainai : logger.rainpump;
        const platformEmoji = this.currentPlatform === 'rainai' ? '⇩' : '⇧';
        
        platformLogger(`\n${platformEmoji} QUICK SCALP STRATEGY STARTED`);
        logger.step(`Trading ALL 10 tokens: ${allTokens.join(', ')}`);
        logger.trade('Buy amount: 0.001 ETH per token per wallet');
        logger.profit(`Total buy volume: ${0.001 * allTokens.length * this.wallets.length} ETH`);
        logger.step('Strategy: Buy ALL → Wait 1 min → Sell ALL BALANCE');
        
        await this.executeStrategy({
            tokens: allTokens,
            buyAmount: 0.001,
            sellPercentage: 100,
            waitTimeMinutes: 1,
            sellAllBalance: true
        });
    }
    
    async executeMediumHold() {
        const topTokens = Object.keys(this.currentTokens).slice(0, 5);
        const platformLogger = this.currentPlatform === 'rainai' ? logger.rainai : logger.rainpump;
        const platformEmoji = this.currentPlatform === 'rainai' ? '⇩' : '⇧';
        
        platformLogger(`\n${platformEmoji} MEDIUM HOLD STRATEGY STARTED`);
        logger.step(`Trading TOP 5 tokens: ${topTokens.join(', ')}`);
        logger.trade('Buy amount: 0.005 ETH per token per wallet');
        logger.profit(`Total buy volume: ${0.005 * topTokens.length * this.wallets.length} ETH`);
        logger.step('Strategy: Buy TOP 5 → Wait 10 min → Sell 50% balance');
        
        await this.executeStrategy({
            tokens: topTokens,
            buyAmount: 0.005,
            sellPercentage: 50,
            waitTimeMinutes: 10,
            sellAllBalance: false
        });
    }
    
    async executeWhaleTrading() {
        const allTokens = Object.keys(this.currentTokens);
        const platformLogger = this.currentPlatform === 'rainai' ? logger.rainai : logger.rainpump;
        const platformEmoji = this.currentPlatform === 'rainai' ? '⇩' : '⇧';
        
        platformLogger(`\n${platformEmoji} WHALE TRADING STRATEGY STARTED`);
        logger.step(`WHALE trading ALL 10 tokens: ${allTokens.join(', ')}`);
        logger.trade('Buy amount: 0.1 ETH per token per wallet');
        logger.profit(`MASSIVE volume: ${0.1 * allTokens.length * this.wallets.length} ETH total!`);
        logger.step('Strategy: WHALE BUY ALL → Wait 3 min → Sell ALL BALANCE');
        
        await this.executeStrategy({
            tokens: allTokens,
            buyAmount: 0.1,
            sellPercentage: 100,
            waitTimeMinutes: 3,
            sellAllBalance: true
        });
    }
    
    async executeStrategy(config) {
        const { tokens, buyAmount, sellPercentage, waitTimeMinutes, sellAllBalance } = config;
        const results = { bought: {}, sold: {}, totalProfit: 0, failedTrades: 0 };
        const platformEmoji = this.currentPlatform === 'rainai' ? '⇩' : '⇧';
        
        // PHASE 1: BUYING ALL TOKENS
        logger.loading(`PHASE 1: BUYING ${tokens.length} ${platformEmoji} TOKENS`);
        for (const tokenSymbol of tokens) {
            logger.token(`BUYING ${tokenSymbol} with all ${this.wallets.length} wallets`);
            results.bought[tokenSymbol] = [];
            
            for (let i = 0; i < this.wallets.length; i++) {
                const wallet = this.wallets[i];
                logger.wallet(`Wallet ${i + 1} buying ${buyAmount} ETH of ${tokenSymbol}`);
                
                try {
                    const buyResult = await this.executeBuy(wallet, tokenSymbol, buyAmount);
                    results.bought[tokenSymbol].push(buyResult);
                    
                    if (buyResult.success) {
                        logger.success(`Bought: ${buyResult.tokensGained.toFixed(4)} ${tokenSymbol}`);
                    } else {
                        logger.error(`Buy failed: ${buyResult.error}`);
                        results.failedTrades++;
                    }
                } catch (error) {
                    results.failedTrades++;
                    let cleanError = this.cleanErrorMessage(error.message);
                    logger.error(`Wallet ${i + 1} error: ${cleanError}`);
                    results.bought[tokenSymbol].push({ success: false, error: cleanError, tokensGained: 0 });
                }
                
                await this.sleep(2000);
            }
        }
        
        // WAITING PERIOD
        logger.warn(`WAITING ${waitTimeMinutes} MINUTES BEFORE SELLING...`);
        await this.sleep(waitTimeMinutes * 60 * 1000);
        
        // PHASE 2: SELLING ALL TOKENS (ALL BALANCE!)
        logger.loading(`PHASE 2: SELLING ALL ${tokens.length} ${platformEmoji} TOKENS`);
        logger.warn(`${sellAllBalance ? 'SELLING ALL BALANCE' : `SELLING ${sellPercentage}% BALANCE`} FROM ALL WALLETS`);
        
        for (const tokenSymbol of tokens) {
            logger.token(`SELLING ALL ${tokenSymbol} from all wallets`);
            results.sold[tokenSymbol] = [];
            
            for (let i = 0; i < this.wallets.length; i++) {
                const wallet = this.wallets[i];
                
                logger.wallet(`Wallet ${i + 1} selling ${sellAllBalance ? 'ALL BALANCE' : sellPercentage + '%'} of ${tokenSymbol}`);
                
                try {
                    const sellResult = await this.executeSell(wallet, tokenSymbol, sellPercentage, sellAllBalance);
                    results.sold[tokenSymbol].push(sellResult);
                    
                    if (sellResult.success) {
                        const profit = sellResult.ethReceived - buyAmount;
                        results.totalProfit += profit;
                        logger.success(`Sold: ${sellResult.tokensSold.toFixed(4)} ${tokenSymbol} → ${sellResult.ethReceived.toFixed(6)} ETH`);
                        logger.profit(`Profit: ${profit.toFixed(6)} ETH`);
                    } else {
                        logger.error(`Sell failed: ${sellResult.error}`);
                        results.failedTrades++;
                    }
                } catch (error) {
                    results.failedTrades++;
                    let cleanError = this.cleanErrorMessage(error.message);
                    logger.error(`Wallet ${i + 1} sell error: ${cleanError}`);
                    results.sold[tokenSymbol].push({ success: false, error: cleanError, ethReceived: 0 });
                }
                
                await this.sleep(2000);
            }
        }
        
        this.printSummary(results, tokens);
    }
    
    cleanErrorMessage(errorMessage) {
        if (errorMessage.includes('insufficient funds') || 
            errorMessage.includes('INSUFFICIENT_FUNDS') ||
            errorMessage.includes('insufficient balance')) {
            return 'Insufficient balance';
        } else if (errorMessage.includes('gas') && errorMessage.includes('intrinsic')) {
            return 'Insufficient gas fee';
        } else if (errorMessage.includes('slippage') || errorMessage.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
            return 'Slippage too high';
        } else if (errorMessage.includes('TRANSFER_FROM_FAILED')) {
            return 'Token transfer failed';
        } else if (errorMessage.includes('EXPIRED')) {
            return 'Transaction expired';
        } else {
            return errorMessage.split('\n')[0].substring(0, 50);
        }
    }
    
    async executeBuy(wallet, tokenSymbol, ethAmount) {
        const tokenInfo = this.currentTokens[tokenSymbol];
        if (!tokenInfo) {
            throw new Error(`Token ${tokenSymbol} not found in ${this.currentPlatform} tokens`);
        }
        
        const router = new ethers.Contract(this.routerAddress, this.routerABI, wallet);
        const tokenContract = new ethers.Contract(tokenInfo.address, this.tokenABI, wallet);
        const balanceBefore = await tokenContract.balanceOf(wallet.address);
        const path = [this.wethAddress, tokenInfo.address];
        const deadline = Math.floor(Date.now() / 1000) + 1800;
        const value = ethers.utils.parseEther(ethAmount.toString());
        
        const tx = await router.swapExactETHForTokens(
            0,
            path,
            wallet.address,
            deadline,
            {
                value: value,
                gasLimit: 378039,
                gasPrice: ethers.utils.parseUnits('0.0012', 'gwei')
            }
        );
        
        logger.loading(`${tokenSymbol} transaction submitted: ${tx.hash}`);
        
        const receipt = await tx.wait();
        logger.success(`${tokenSymbol} trade confirmed!`);
        logger.step(`Block: ${receipt.blockNumber}`);
        logger.step(`Gas Used: ${receipt.gasUsed}`);
        logger.step(`Events: ${receipt.logs.length}`);
        
        const balanceAfter = await tokenContract.balanceOf(wallet.address);
        const tokensGained = parseFloat(ethers.utils.formatEther(balanceAfter.sub(balanceBefore)));
        
        return {
            success: true,
            tokensGained: tokensGained,
            txHash: tx.hash,
            gasUsed: receipt.gasUsed.toString()
        };
    }
    
    async executeSell(wallet, tokenSymbol, sellPercentage, sellAllBalance = false) {
        const tokenInfo = this.currentTokens[tokenSymbol];
        const router = new ethers.Contract(this.routerAddress, this.routerABI, wallet);
        const tokenContract = new ethers.Contract(tokenInfo.address, this.tokenABI, wallet);
        const totalTokenBalance = await tokenContract.balanceOf(wallet.address);
        
        let sellAmount;
        if (sellAllBalance) {
            sellAmount = totalTokenBalance;
            logger.step(`Selling ALL ${ethers.utils.formatEther(totalTokenBalance)} ${tokenSymbol} balance`);
        } else {
            sellAmount = totalTokenBalance.mul(sellPercentage).div(100);
            logger.step(`Selling ${sellPercentage}% of ${ethers.utils.formatEther(totalTokenBalance)} ${tokenSymbol} balance`);
        }
        
        if (sellAmount.eq(0)) {
            return { success: false, error: 'No tokens to sell', tokensSold: 0, ethReceived: 0 };
        }
        
        // Check and approve if needed
        const allowance = await tokenContract.allowance(wallet.address, this.routerAddress);
        if (allowance.lt(sellAmount)) {
            logger.loading(`Approving ${tokenSymbol} for router...`);
            const approveTx = await tokenContract.approve(this.routerAddress, ethers.constants.MaxUint256);
            await approveTx.wait();
            logger.success(`${tokenSymbol} approved`);
        }
        
        const ethBefore = await wallet.getBalance();
        const path = [tokenInfo.address, this.wethAddress];
        const deadline = Math.floor(Date.now() / 1000) + 1800;
        
        const tx = await router.swapExactTokensForETH(
            sellAmount,
            0,
            path,
            wallet.address,
            deadline,
            {
                gasLimit: 378039,
                gasPrice: ethers.utils.parseUnits('0.0012', 'gwei')
            }
        );
        
        logger.loading(`${tokenSymbol} sell transaction submitted: ${tx.hash}`);
        
        const receipt = await tx.wait();
        logger.success(`${tokenSymbol} sell confirmed!`);
        
        const ethAfter = await wallet.getBalance();
        const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice || ethers.utils.parseUnits('0.0012', 'gwei'));
        const ethReceived = parseFloat(ethers.utils.formatEther(ethAfter.add(gasUsed).sub(ethBefore)));
        const tokensSold = parseFloat(ethers.utils.formatEther(sellAmount));
        
        return {
            success: true,
            tokensSold: tokensSold,
            ethReceived: ethReceived,
            txHash: tx.hash,
            gasUsed: receipt.gasUsed.toString()
        };
    }
    
    printSummary(results, tokens) {
        const platformEmoji = this.currentPlatform === 'rainai' ? '⇩' : '⇧';
        const platformName = this.currentPlatform === 'rainai' ? 'RAINAI' : 'RAIN PUMP';
        const platformLogger = this.currentPlatform === 'rainai' ? logger.rainai : logger.rainpump;
        
        platformLogger(`\n${platformEmoji} ${platformName} TRADING SUMMARY`);
        logger.step(`Total trades: ${tokens.length * this.wallets.length * 2} (buy + sell)`);
        logger.step(`Failed trades: ${results.failedTrades}`);
        logger.profit(`Total profit: ${results.totalProfit.toFixed(6)} ETH`);
        logger.success(`Average profit per successful trade: ${(results.totalProfit / (tokens.length * this.wallets.length - results.failedTrades)).toFixed(6)} ETH`);
        
        logger.token(`${platformName} TOKEN BREAKDOWN:`);
        for (const [token, buyData] of Object.entries(results.bought)) {
            const successfulBuys = buyData.filter(b => b.success).length;
            const totalTokensBought = buyData.reduce((sum, b) => sum + b.tokensGained, 0);
            
            logger.info(`${token}: ${successfulBuys}/${this.wallets.length} successful buys, ${totalTokensBought.toFixed(4)} tokens bought`);
        }
        
        console.log('\n=== Monggo mas ===');
        const continueChoice = prompt('Mau lanjut trading? (y/n): ');
        
        if (continueChoice.toLowerCase() === 'y') {
            this.showPlatformSelection();
        } else {
            logger.success('Trading session completed! Terima kasih sudah menggunakan Pempek Bot!');
            process.exit(0);
        }
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function main() {
    const pempekBot = new PempekMultiTokenBot();
    
    try {
        const walletCount = await pempekBot.loadWallets();
        
        if (walletCount === 0) {
            logger.error('No wallets found! Please check your .env file');
            process.exit(1);
        }
        
        pempekBot.showPlatformSelection();
        
    } catch (error) {
        logger.error(`Bot error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PempekMultiTokenBot;
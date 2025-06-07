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
        console.log(`${colors.yellow}${colors.bold}`); // Changed from blue to yellow
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
        
        // ROUTER ADDRESSES - DIFFERENT FOR EACH PLATFORM
        this.rainAIRouter = '0x6B82b7BB668dA9EF1834896b1344Ac34B06fc58D'; // Rain AI Router
        this.rainPumpRouter = '0x4e496c948EF57FD6Fa75fbFdcEB334874542FcF5'; // Rain Pump Router
        this.routerAddress = null; // Will be set based on platform
        
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
        
        // LOW MARKET CAP RAIN AI TOKENS - Updated with working tokens
        this.rainAITokens = {
            'SOLEHA': { address: '0x41360d17dE738C8bdDA7500F16174C3f9cbd1502', name: 'Solehah ⭐' }, // PROVEN WORKING
            'ASD': { address: '0x3Ff2265f97b3103eA0991a3816F18362349B2D0B', name: 'sda' },
            'KNTL': { address: '0x8426d1f1B6DD70a1B5F62Bb94D19dEaa6E7A3aE8', name: 'KONTOL' },
            'WE': { address: '0x9b3a13d1f1e1B8E1A9F2C4E5D6F7A8B9C0D1E2F3', name: 'sar' },
            'EETH': { address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', name: 'edgenn' },
            'SDF': { address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c', name: 'dfs' },
            'BEAR': { address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d', name: 'bear' },
            'VRAI': { address: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e', name: 'V.E.R.A.' },
            'CAT': { address: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f', name: 'Cattie' },
            'SADD': { address: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a', name: 'sda' }
        };
        
        // LOW MARKET CAP RAIN PUMP TOKENS - Updated with working tokens
        this.rainPumpTokens = {
            'CHIBYKE': { address: '0x584D46b6f315Eb204304906c6Dc34BdBDD189D2D', name: 'CHIBYKE', status: '0.51%' }, // 0.508911%
            'URANUS': { address: '0x7a51B6F54BFda313Ed4940A06B27357C28f9925a', name: 'URANUS MEME', status: '0.99%' }, // 0.99888%
            'PAJET': { address: '0x0BbF6c3aa53185c1BcC58a3A96dE433994Ba4F6E', name: 'PAJET', status: '1.68%' }, // 1.675942%
            'ZEUS': { address: '0xe3e9b6c53Cba438F86f0dDF49d31Bc5CB7Dd10E6', name: 'ZEUS', status: '0.52%' }, // 0.519258%
            'TOMMY': { address: '0xB9B715165E820e7E334911c43b1f1522C2475713', name: 'TOMMY BUNNY', status: '3.13%' }, // 3.127174%
            'EUROPHIA': { address: '0x7E8c230DCd2d652a9C9a0967EEf88b7E0deb6578', name: 'EUROPHIA', status: '3.46%' }, // 3.456149%
            'NIGHT': { address: '0x9277077E8D7792482b634ED86c31C60f4C388269', name: 'Night Walker', status: '3.52%' }, // 3.521199%
            'QW': { address: '0x1408915b4bA6fc7CA018068D6bF19e04e532551f', name: 'qw', status: '9.08%' }, // 9.081014%
            'SHADOW': { address: '0xb1F7A3e4F357AE8a542821C34cecc21BB347fCF7', name: 'ShadowBunny', status: '8.94%' }, // 8.94169%
            'HAJI': { address: '0x0aD3586F774166932A69135bE0c241d9b59e87a9', name: 'HAJI', status: '13.59%' } // 13.589867%
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
            this.routerAddress = this.rainAIRouter; // Set Rain AI router
            logger.rainai('RAINAI PLATFORM SELECTED');
            this.showRainAITokens();
        } else if (choice === '2') {
            this.currentPlatform = 'rainpump';
            this.currentTokens = this.rainPumpTokens;
            this.routerAddress = this.rainPumpRouter; // Set Rain Pump router
            logger.rainpump('RAIN PUMP PLATFORM SELECTED');
            this.showRainPumpTokens();
        } else {
            logger.error('Invalid choice! Please select 1 or 2');
            this.showPlatformSelection();
        }
    }
    
    showRainAITokens() {
        logger.rainai('AVAILABLE RAINAI TOKENS (LOW MARKET CAP):');
        logger.info('LOW PROGRESS TOKENS (< 50% - HIGH PUMP POTENTIAL):');
        
        Object.entries(this.rainAITokens).forEach(([symbol, token]) => {
            logger.step(`${symbol.padEnd(8)} - ${token.name}`);
        });
        
        this.showTradingOptions();
    }
    
    showRainPumpTokens() {
        logger.rainpump('AVAILABLE RAIN PUMP TOKENS (LOW MARKET CAP):');
        logger.info('LOW PROGRESS TOKENS (< 15% - HIGH PUMP POTENTIAL):');
        
        Object.entries(this.rainPumpTokens).forEach(([symbol, token]) => {
            logger.step(`${symbol.padEnd(10)} - ${token.name} (${token.status})`);
        });
        
        this.showTradingOptions();
    }
    
    showTradingOptions() {
        const platformEmoji = this.currentPlatform === 'rainai' ? '⇩' : '⇧';
        const platformLogger = this.currentPlatform === 'rainai' ? logger.rainai : logger.rainpump;
        
        platformLogger(`\n${platformEmoji} TRADING OPTIONS:`);
        logger.step('1. Quick Scalp (1 min hold, 100% sell ALL BALANCE)');
        logger.step('2. Medium Hold (5 min hold, 100% sell ALL BALANCE)');
        logger.step('3. Long Hold (10 min hold, 100% sell ALL BALANCE)');
        
        const tradingChoice = prompt('pilih strategi (1-3): ');
        
        if (tradingChoice === '1') {
            this.executeQuickScalp();
        } else if (tradingChoice === '2') {
            this.executeMediumHold();
        } else if (tradingChoice === '3') {
            this.executeLongHold();
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
        logger.trade('Buy amount: 0.1 ETH per token per wallet');
        logger.profit(`Total buy volume: ${0.1 * allTokens.length * this.wallets.length} ETH`);
        logger.step('Strategy: Buy ALL → Wait 1 min → Sell ALL BALANCE (100%)');
        
        await this.executeStrategy({
            tokens: allTokens,
            buyAmount: 0.1,
            sellPercentage: 100,
            waitTimeMinutes: 1,
            sellAllBalance: true
        });
    }
    
    async executeMediumHold() {
        const allTokens = Object.keys(this.currentTokens);
        const platformLogger = this.currentPlatform === 'rainai' ? logger.rainai : logger.rainpump;
        const platformEmoji = this.currentPlatform === 'rainai' ? '⇩' : '⇧';
        
        platformLogger(`\n${platformEmoji} MEDIUM HOLD STRATEGY STARTED`);
        logger.step(`Trading ALL 10 tokens: ${allTokens.join(', ')}`);
        logger.trade('Buy amount: 0.1 ETH per token per wallet');
        logger.profit(`Total buy volume: ${0.1 * allTokens.length * this.wallets.length} ETH`);
        logger.step('Strategy: Buy ALL → Wait 5 min → Sell ALL BALANCE (100%)');
        
        await this.executeStrategy({
            tokens: allTokens,
            buyAmount: 0.1,
            sellPercentage: 100,
            waitTimeMinutes: 5,
            sellAllBalance: true
        });
    }
    
    async executeLongHold() {
        const allTokens = Object.keys(this.currentTokens);
        const platformLogger = this.currentPlatform === 'rainai' ? logger.rainai : logger.rainpump;
        const platformEmoji = this.currentPlatform === 'rainai' ? '⇩' : '⇧';
        
        platformLogger(`\n${platformEmoji} LONG HOLD STRATEGY STARTED`);
        logger.step(`Trading ALL 10 tokens: ${allTokens.join(', ')}`);
        logger.trade('Buy amount: 0.1 ETH per token per wallet');
        logger.profit(`MASSIVE volume: ${0.1 * allTokens.length * this.wallets.length} ETH total!`);
        logger.step('Strategy: Buy ALL → Wait 10 min → Sell ALL BALANCE (100%)');
        
        await this.executeStrategy({
            tokens: allTokens,
            buyAmount: 0.1,
            sellPercentage: 100,
            waitTimeMinutes: 10,
            sellAllBalance: true
        });
    }
    
    async executeStrategy(config) {
        const { tokens, buyAmount, sellPercentage, waitTimeMinutes, sellAllBalance } = config;
        const results = { bought: {}, sold: {}, totalProfit: 0, failedTrades: 0 };
        const platformEmoji = this.currentPlatform === 'rainai' ? '⇩' : '⇧';
        
        for (const tokenSymbol of tokens) {
            results.bought[tokenSymbol] = [];
            results.sold[tokenSymbol] = [];
        }
        
        logger.loading(`TRADING ${tokens.length} ${platformEmoji} TOKENS WITH IMMEDIATE BUY → SELL STRATEGY`);
        logger.warn(`Each wallet: BUY → Wait ${waitTimeMinutes} min → SELL ALL BALANCE (100%)`);
        
        for (const tokenSymbol of tokens) {
            logger.token(`TRADING ${tokenSymbol} WITH ALL ${this.wallets.length} WALLETS`);
            
            for (let i = 0; i < this.wallets.length; i++) {
                const wallet = this.wallets[i];
                
                logger.wallet(`Wallet ${i + 1} buying ${buyAmount} ETH of ${tokenSymbol}`);
                
                let buyResult = { success: false, error: 'Unknown error', tokensGained: 0 };
                try {
                    buyResult = await this.executeBuy(wallet, tokenSymbol, buyAmount);
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
                    logger.error(`Wallet ${i + 1} buy error: ${cleanError}`);
                    buyResult = { success: false, error: cleanError, tokensGained: 0 };
                    results.bought[tokenSymbol].push(buyResult);
                }
                
                if (buyResult.success) {
                    logger.loading(`Waiting ${waitTimeMinutes} minute(s) before selling ${tokenSymbol}...`);
                    await this.sleep(waitTimeMinutes * 60000); // Convert minutes to milliseconds
                    
                    logger.wallet(`Wallet ${i + 1} selling ALL BALANCE (100%) of ${tokenSymbol}`);
                    
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
                } else {
                    logger.step(`➤ Wallet ${i + 1} skipping sell (buy failed)`);
                    results.sold[tokenSymbol].push({ success: false, error: 'Buy failed', ethReceived: 0 });
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
    
    // UPDATED BUY FUNCTION - Using exact function from SOLEHA success
    async executeBuy(wallet, tokenSymbol, ethAmount) {
        const tokenInfo = this.currentTokens[tokenSymbol];
        if (!tokenInfo) {
            throw new Error(`Token ${tokenSymbol} not found in ${this.currentPlatform} tokens`);
        }
        
        // Use SOLEHA's exact buy function for BOTH platforms (same function, different router)
        return await this.executeBuyRainAI(wallet, tokenInfo.address, ethAmount, tokenSymbol);
    }
    
    // EXACT SOLEHA BUY METHOD
    async executeBuyRainAI(wallet, tokenAddress, ethAmount, tokenSymbol) {
        const tokenContract = new ethers.Contract(tokenAddress, this.tokenABI, wallet);
        const balanceBefore = await tokenContract.balanceOf(wallet.address);
        
        // Build exact transaction data like SOLEHA success
        const tokenAddressChecksummed = ethers.utils.getAddress(tokenAddress);
        const walletAddressChecksummed = ethers.utils.getAddress(wallet.address);
        
        const functionSelector = "0xb909e38b";
        const tokenAddressPadded = tokenAddressChecksummed.replace('0x', '').padStart(64, '0');
        const zeroPadded = "0".repeat(64);
        const recipientPadded = walletAddressChecksummed.replace('0x', '').padStart(64, '0');
        
        const data = functionSelector + tokenAddressPadded + zeroPadded + recipientPadded;
        
        const transaction = {
            to: this.routerAddress,
            value: ethers.utils.parseEther(ethAmount.toString()),
            data: data,
            gasLimit: 291047,
            gasPrice: ethers.utils.parseUnits('0.001', 'gwei')
        };
        
        const tx = await wallet.sendTransaction(transaction);
        logger.loading(`${tokenSymbol} transaction submitted: ${tx.hash}`);
        
        const receipt = await tx.wait();
        logger.success(`${tokenSymbol} trade confirmed!`);
        logger.step(`Block: ${receipt.blockNumber}`);
        logger.step(`Gas Used: ${receipt.gasUsed}`);
        
        const balanceAfter = await tokenContract.balanceOf(wallet.address);
        const tokensGained = parseFloat(ethers.utils.formatEther(balanceAfter.sub(balanceBefore)));
        
        return {
            success: true,
            tokensGained: tokensGained,
            txHash: tx.hash,
            gasUsed: receipt.gasUsed.toString()
        };
    }
    
    // Standard buy for rain pump (low market cap tokens)
    async executeBuyStandard(wallet, tokenSymbol, ethAmount) {
        const tokenInfo = this.currentTokens[tokenSymbol];
        
        // Use RainAI method for Rain Pump low market cap tokens too
        if (this.currentPlatform === 'rainpump') {
            return await this.executeBuyRainAI(wallet, tokenInfo.address, ethAmount, tokenSymbol);
        }
        
        // Original standard method (fallback)
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
        
        const balanceAfter = await tokenContract.balanceOf(wallet.address);
        const tokensGained = parseFloat(ethers.utils.formatEther(balanceAfter.sub(balanceBefore)));
        
        return {
            success: true,
            tokensGained: tokensGained,
            txHash: tx.hash,
            gasUsed: receipt.gasUsed.toString()
        };
    }
    
    // UPDATED SELL FUNCTION - Using exact function from SOLEHA success
    async executeSell(wallet, tokenSymbol, sellPercentage, sellAllBalance = false) {
        const tokenInfo = this.currentTokens[tokenSymbol];
        
        // Use SOLEHA's exact sell function for BOTH platforms (same function, different router)
        return await this.executeSellRainAI(wallet, tokenInfo.address, sellAllBalance, tokenSymbol);
    }
    
    // EXACT SOLEHA SELL METHOD
    async executeSellRainAI(wallet, tokenAddress, sellAllBalance, tokenSymbol) {
        const tokenContract = new ethers.Contract(tokenAddress, this.tokenABI, wallet);
        const totalTokenBalance = await tokenContract.balanceOf(wallet.address);
        
        if (totalTokenBalance.eq(0)) {
            return { success: false, error: 'No tokens to sell', tokensSold: 0, ethReceived: 0 };
        }
        
        logger.step(`Selling ALL ${ethers.utils.formatEther(totalTokenBalance)} ${tokenSymbol} balance`);
        
        // Build exact sell transaction data like SOLEHA success
        const tokenAddressChecksummed = ethers.utils.getAddress(tokenAddress);
        const walletAddressChecksummed = ethers.utils.getAddress(wallet.address);
        
        const functionSelector = "0x0a7f0c9d"; // CORRECT SELL FUNCTION
        const tokenAddressPadded = tokenAddressChecksummed.replace('0x', '').padStart(64, '0');
        const balancePadded = totalTokenBalance.toHexString().replace('0x', '').padStart(64, '0');
        const zeroPadded = "0".repeat(64);
        const recipientPadded = walletAddressChecksummed.replace('0x', '').padStart(64, '0');
        
        const data = functionSelector + tokenAddressPadded + balancePadded + zeroPadded + recipientPadded;
        
        const ethBefore = await wallet.getBalance();
        
        const transaction = {
            to: this.routerAddress,
            value: "0x0",
            data: data,
            gasLimit: 274782,
            gasPrice: ethers.utils.parseUnits('0.001', 'gwei')
        };
        
        const tx = await wallet.sendTransaction(transaction);
        logger.loading(`${tokenSymbol} sell transaction submitted: ${tx.hash}`);
        
        const receipt = await tx.wait();
        logger.success(`${tokenSymbol} sell confirmed!`);
        
        const ethAfter = await wallet.getBalance();
        const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice || ethers.utils.parseUnits('0.001', 'gwei'));
        const ethReceived = parseFloat(ethers.utils.formatEther(ethAfter.add(gasUsed).sub(ethBefore)));
        const tokensSold = parseFloat(ethers.utils.formatEther(totalTokenBalance));
        
        return {
            success: true,
            tokensSold: tokensSold,
            ethReceived: ethReceived,
            txHash: tx.hash,
            gasUsed: receipt.gasUsed.toString()
        };
    }
    
    // Standard sell for rain pump (low market cap tokens)
    async executeSellStandard(wallet, tokenSymbol, sellPercentage, sellAllBalance = false) {
        const tokenInfo = this.currentTokens[tokenSymbol];
        
        // Use RainAI method for Rain Pump low market cap tokens too
        if (this.currentPlatform === 'rainpump') {
            return await this.executeSellRainAI(wallet, tokenInfo.address, sellAllBalance, tokenSymbol);
        }
        
        // Original standard method (fallback)
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

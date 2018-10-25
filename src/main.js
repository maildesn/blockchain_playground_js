const { BlockChain, Transaction } = require('./blockchain');
const { Wallet } = require('./wallet');

// Generate Wallets
const wallet = new Wallet();
const wallet2 = new Wallet();

const blockChain = new BlockChain();

// Wallet -> Wallet2 => 100
// Wallet -> Wallet2 => 50
// Wallet2 -> Wallet => 50

// Wallet: 0 - 100 - 50 + 50 = -100
// Wallet2: 0 + 100 + 50 - 50 = 100

const transactionOne = new Transaction(wallet.publicKey, wallet2.publicKey, 100);
transactionOne.signTransaction(wallet.keyPair);

blockChain.addTransaction(transactionOne);

blockChain.minePendingTransactions();

const transactionTwo = new Transaction(wallet.publicKey, wallet2.publicKey, 50);
transactionTwo.signTransaction(wallet.keyPair);

blockChain.addTransaction(transactionTwo);

blockChain.minePendingTransactions();


const transactionThree = new Transaction(wallet2.publicKey, wallet.publicKey, 50);
transactionThree.signTransaction(wallet2.keyPair);

blockChain.addTransaction(transactionThree);

blockChain.minePendingTransactions();

console.log('');

console.log(`Wallet1 Ballance : ${blockChain.getBalanceOfAddress(wallet.publicKey)}`);
console.log(`Wallet2 Ballance : ${blockChain.getBalanceOfAddress(wallet2.publicKey)}`);

console.log('');


//blockChain.chain[1].transactions[0].amount = 10;

console.log('BlockChain valid?', blockChain.isChainValid() ? 'Yes' : 'No');


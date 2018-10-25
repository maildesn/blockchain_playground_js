const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;

const ec = new EC('secp256k1');

class Block {

    /**
     * 
     * @param {Date} timestamp 
     * @param {Transaction[]} transactions 
     * @param {string} previousHash 
     */
    constructor(timestamp, transactions, previousHash = '') {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    /**
     * Retorna o conteúdo do bloco em forma de Hash no formato SHA256
     * 
     * @returns {string}
     */
    calculateHash() {
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    /**
     * Inicia a mineração do bloco. Esse método muda o nonce até que o hash inicie com um numero definido de zeros. (dificuldade)
     * 
     * @param {number} difficulty
     * 
     */
    mineBlock(difficulty) {

        while(this.hash.substring(0, difficulty) !== this._createDifficultyString(difficulty)) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log(`Block Mined: ${this.hash}` );
    }

    /**
     * Valida todas as transações dentro do block. Retorna TRUE se OK, FALSE se não.
     */
    hasValidTransactions() {
        for(const tx of this.transactions) {
            if(!tx.isValid()) {
                return false;
            }
        }
        return true;
    }

    _createDifficultyString(difficulty) {
        return Array(difficulty+1).join('0');
    }
}

class Transaction {

    /**
     * 
     * @param {string} fromAddress 
     * @param {string} toAddress 
     * @param {number} amount 
     */
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
        this.signature = null;
    }

    /**
     * Retorna o hash da transação em formato SHA256
     */
    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp).toString();
    }

    /**
     * Assina a transação com a chave passada (objeto chave usando o metodo Eliptico de encriptacao que contem a chave privada).
     * A assinatura é guardada dentro da Transaction e depois guardada no blockchain
     * 
     * @param {string} signingKey
     */
    signTransaction(signingKey) {

        if(signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('Endereço da chave passada é diferente do endereço do remetente da transação');
        }

        // Calcula o hash da transação , assina com o a chave passada e guarda no objeto

        const hashTransaction = this.calculateHash();
        const sig = signingKey.sign(hashTransaction, 'base64');

        this.signature = sig.toDER('hex');

    }

    /**
     * Verifica se a assinatura da transacao e valida (Transacao nao alterada).
     * Usa o fromAddress como chave publica.
     */
    isValid() {

        // Assume que se o fromAddress for nulo essa e uma transacao de recompensa por mineracao
        if(this.fromAddress === null) {
            return true;
        }

        if(!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction.');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);

    }


}

class BlockChain {

    constructor() {

        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    /**
     * @returns {Block}
     */
    createGenesisBlock() {
        return new Block(new Date(), [], '0'); /* Timestamp, transactions, hash*/ 
    }

    getLatestBlock() {
        return this.chain[this.chain.length-1];
    }

    /**
     * Processa todas as transações pendentes, cola-as em um Block, e inicia a Mineração. 
     * Também adiciona uma transação para enviar a recompensa de mineracao para o endereco dado.
     * 
     * @param (string) miningRewardAddress
     */
    minePendingTransactions(miningRewardAddress){

        const rewardTransaction = new Transaction(null, miningRewardAddress, this.miningReward);

        this.pendingTransactions.push(rewardTransaction);

        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);

        this.pendingTransactions = [];
    }

    /**
     * Adiciona nova Transaction na lista de transacoes pendentes (a serem adicionadas na proxima vez que a mineracao ocorrer).
     * Verifica tambem se a Transaction esta devidamente assinada
     * 
     * @param {Transaction} transaction 
     */
    addTransaction(transaction) {

        if(!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address.');
        }

        if(!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain.');
        }

        this.pendingTransactions.push(transaction);

    }

    /**
     * Retorna saldo do endereco passado.
     * 
     * @param {string} address 
     */
    getBalanceOfAddress(address) {

        let balance = 0;

        for(const block of this.chain) {
            
            for(const trans of block.transactions) {
                
                if(trans.fromAddress === address) 
                {
                    balance -= trans.amount;
                }

                if(trans.toAddress === address) {
                    balance += trans.amount;
                }


            }
        }

        return balance;

    }

    /**
     * Itera sobre todos os Blocks da chain e verifica se as referencias de hash em cada bloco batem com os hashs dos blocos.
     * Tambem verifica as transacoes assinadas dentro dos blocos.
     */
    isChainValid() {

       
        // Verifica os blocos (menos o genesis) para ver se as referencias de hash batem

        for(let i = 1; i < this.chain.length; i++) {

            const currentBlock = this.chain[i];
            const prevBlock = this.chain[i-1];

            if(!currentBlock.hasValidTransactions()) {
                return false;
            }

            if(currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if(currentBlock.previousHash !== prevBlock.calculateHash()) {
                return false;
            }
        }

        return true;
    }

}

module.exports.BlockChain = BlockChain;
module.exports.Transaction = Transaction;
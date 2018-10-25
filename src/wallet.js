const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Wallet {

    constructor(){ 

        this.keyPair = ec.genKeyPair();
        this.publicKey = this.keyPair.getPublic('hex'); 
        this.privateKey = this.keyPair.getPrivate('hex'); 

    }

}

module.exports.Wallet = Wallet;
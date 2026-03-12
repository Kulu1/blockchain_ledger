const { time } = require("console");
const crypto =  require("crypto")

class Block{
    constructor(index, timestamp, transactions, previousHash = ""){
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash(){
        return crypto.createHash("sha256").update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).digest("hex")

    }

    mineBlock(dificulty){
        const target = "0".repeat(dificulty)

        while(this.hash.substring(0, dificulty) != target){
            this.nonce++;
            this.hash = this.calculateHash();

        }

        console.log(`Block  Mined : ${this.hash}`)
    }
}

class Blockchain{
    constructor(){
        this.chain  = [this.createGenesisBlock()]
        this.dificulty = 4;
        this.pendingTransactions = [];
        this.MiningReward = 100
    }

    createGenesisBlock(){
        return  new Block(0, new Date().toISOString(), [], "0");
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1]
    }

    addTransaction(transaction){
        const {sender, receiver, amount} = transaction

        if (!sender || !receiver || amount == null){
            throw new Error("Transaction must include sender, receiver and amount")
        }

        if (typeof amount !== "number" || amount <= 0 ){
            throw new Error("Trasaction amount must be a positive number")
        } 

        this.pendingTransactions.push(transaction)

    }

    minePendingTransactions(minerAddress){
        if (!minerAddress){
            throw new Error("Miner Address is required")
        }

        const block = new Block(this.chain.length, new Date().toISOString(), this.pendingTransactions, this.getLatestBlock().hash);

        block.mineBlock(this.dificulty)
        this.chain.push(block);

        this.pendingTransactions = [
            {
            sender: "SYSTEM",
            receiver: minerAddress,
            amount: this.MiningReward
            }
        ];
        return block
    }

    getBalanceOfAddress(address){
        let balance = 0

        for(const block of this.chain){
            for (const tx of block.transactions){
                if( tx.sender === address){
                    balance -= tx.amount;
                }
                if (tx.receiver === address){
                    balance +=  tx.amount
                }
            }
        }
        return balance
    }

    isChainValid(){
        for (let  i =  1; i < this.chain.length;  i++){
            const currentBlock = this.chain[i]
            const previousBlock = this.chain[i - 1]

            if (currentBlock.hash !==currentBlock.calculateHash()){
                return{  
                    valid: false,
                    message: `Block ${currentBlock.index} is invalid`
                }
            }

            if (currentBlock.previousHash !== previousBlock.hash){
                return {
                    valid : false,
                    message: `Block ${currentBlock.index} previous hash do not  match `
                }
            }

            if (currentBlock.hash.substring(0, this.dificulty) !==  "0".repeat(this.dificulty)){
                return{
                    valid: false,
                    message: `Block ${currentBlock.index} does  not satisfy proof-of-work`
                }
            }
        }
        return{
            valid:  true,
            message: "Blockchain is valid"
        }
    }
}


module.exports = {Block, Blockchain}


const express = require("express")
const {Blockchain} = require("./blockchain")
const cors = require("cors")


const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

const  myBlockchain = new Blockchain()

app.get("/", (req, res) => {
  res.json({
    message: "Simple Blockchain API is running"
  });
});

app.get("/chain", (req, res) => {
  res.json({
    length: myBlockchain.chain.length,
    chain: myBlockchain.chain
  });
});

app.get("/pending", (req, res) => {
  res.json({
    pendingTransactions: myBlockchain.pendingTransactions
  });
});

app.post("/transactions", (req, res) => {
  try {
    const { sender, receiver, amount } = req.body;

    myBlockchain.addTransaction({
      sender,
      receiver,
      amount: Number(amount)
    });

    res.status(201).json({
      message: "Transaction added successfully",
      pendingTransactions: myBlockchain.pendingTransactions
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.post("/mine", (req, res) => {
  try {
    const { minerAddress } = req.body;

    const minedBlock = myBlockchain.minePendingTransactions(minerAddress);

    res.json({
      message: "Block mined successfully",
      block: minedBlock,
      rewardNote:
        "Mining reward has been added to pending transactions and will appear in the next mined block."
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.get("/validate", (req, res) => {
  const result = myBlockchain.isChainValid();

  res.json(result);
});

app.get("/balance/:address", (req, res) => {
  const address = req.params.address;
  const balance = myBlockchain.getBalanceOfAddress(address);

  res.json({
    address,
    balance
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
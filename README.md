# home_task
This is home task challenge

# How to deploy this contract?

- Deploy the contracts to the local network(hardhat)
npx hardhat run scripts/deploy.js

- Deploy the contracts to the other testnet
First, you can configure network with hardhat.config.js
Second, you can input "npx hardhat run scripts/deploy.js --network "Network Name such as sepolia, rinkeby, ropsten"

# How to test the contracts?
npx hardhat test

# My oppinion for contract security
Contract owner should not be able to close the auction, I think.
If contract owner don't close the auction, users can not receive the NFT or refund.
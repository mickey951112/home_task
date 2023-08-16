/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");

const SEPOLIA_PRIVATE_KEY="";
module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: `https://rpc.sepolia.org`,
      accounts: [SEPOLIA_PRIVATE_KEY]
    }
  }
};

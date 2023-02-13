require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle")
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.5.0" },
      { version: "0.6.6" },
      { version: "0.8.17" },
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://bsc-dataseed.binance.org",
      },
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ],
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org",
      chainId: 56,
    }
  },
};

require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle")

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.17" },
      { version: "0.5.5" },
      { version: "0.6.6" }
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/-JpgacjGuwQHqtPHa4lvzEAREszI91XC",
      },
    },
    testnet: {
      url: "https://eth-goerli.g.alchemy.com/v2/WMJfa6zUkPguDYRdFCS4iVYi18c0w7v3",
      chainId: 5,
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ],
    },
    mainnet: {
      url: "https://eth-mainnet.g.alchemy.com/v2/-JpgacjGuwQHqtPHa4lvzEAREszI91XC",
      chainId: 1,
      accounts: [
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
      ]
    }
  },
};

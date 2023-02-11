const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts w/ the acct: ", deployer.address)
  console.log("Acct balance: ", (await deployer.getBalance()).toString())

  // get smart contract
  const Token = await ethers.getContractFactory("UniswapSushiFlash")
  const token = await Token.deploy()  // deploy smart contract

  console.log("Token address: ", token.address)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("main broken: ", err)
    process.exit(1)
  })
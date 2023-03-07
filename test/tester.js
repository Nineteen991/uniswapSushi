const { expect, assert } = require('chai')
const { ethers } = require('hardhat')

const { impersonateFundErc20 } = require('../utils/utilities')

const { 
  abi 
} = require('../artifacts/contracts/interfaces/IERC20.sol/IERC20.json')
require('dotenv').config()

const provider = waffle.provider

describe("FlashSwap Contract", () => {
  let FLASHSWAP,
    BORROW_AMOUNT,
    FUND_AMOUNT,
    initialFundingHuman,
    txArbitrage

  const DECIMALS = 18

  const PANCAKE_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"
  const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
  const APE_FACTORY = "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6"
  const APE_ROUTER = "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7"

  const BUSD_WHALE = "0xf977814e90da44bfa03b6295a0616a897441acec"
  const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
  const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
  const CAKE = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
  const CROX = "0x2c094F5A7D1146BB93850f629501eB749f6Ed491"
  const FROYO = "0xe369fec23380f9F14ffD07a1DC4b7c1a9fdD81c9"

  const BASE_TOKEN_ADDRESS = BUSD

  const tokenBase = new ethers.Contract(BASE_TOKEN_ADDRESS, abi, provider)

  beforeEach(async () => {
    // Get owner as signer
    [owner] = await ethers.getSigners()

    // Ensure that the whale has a balance
    const whale_balance = await provider.getBalance(BUSD_WHALE)
    console.log("Our Balance: ", ethers.utils.formatUnits(whale_balance, 18))
    expect(whale_balance).not.equal("0")

    // Deploy smart contract
    const FlashSwap = await ethers.getContractFactory("BSCFlash")
    FLASHSWAP = await FlashSwap.deploy()
    await FLASHSWAP.deployed()

    // Configure our borrowing
    const borrowAmountHuman = "1"
    BORROW_AMOUNT = ethers.utils.parseUnits(borrowAmountHuman, DECIMALS)

    // Configure funding (only needed for testing)
    initialFundingHuman = "100"
    FUND_AMOUNT = ethers.utils.parseUnits(initialFundingHuman, DECIMALS)

    // Fund our contract (only needed for testing)
    await impersonateFundErc20(
      tokenBase,
      BUSD_WHALE,
      FLASHSWAP.address,
      initialFundingHuman,
      DECIMALS
    )
  })

  describe("Arbitrage Execution", () => {
    it("Ensures the contract is funded", async () => {
      const flashSwapBalance = await FLASHSWAP.getBalanceOfToken(
        BASE_TOKEN_ADDRESS
      )

      const flashSwapBalanceHuman = ethers.utils.formatUnits(
        flashSwapBalance,
        DECIMALS
      )
      expect(Number(flashSwapBalanceHuman)).equal(Number(initialFundingHuman))
    })

    it("Executes the arbitrage", async () => {
      txArbitrage = await FLASHSWAP.startArbitrage(
        BASE_TOKEN_ADDRESS,
        BORROW_AMOUNT,
        BUSD,
        CAKE,
        PANCAKE_FACTORY,
        APE_FACTORY,
        PANCAKE_ROUTER,
        APE_ROUTER,
      )
      assert(txArbitrage)

      // Print Balances
      const contractBalanceBUSD = await FLASHSWAP.getBalanceOfToken(BUSD)
      const formattedBalBUSD = Number(
        ethers.utils.formatUnits(contractBalanceBUSD, DECIMALS)
      )
      console.log("Balance of BUSD: ", formattedBalBUSD)

      const contractBalanceCAKE = await FLASHSWAP.getBalanceOfToken(CAKE)
      const formattedBalCAKE = Number(
        ethers.utils.formatUnits(contractBalanceCAKE, DECIMALS)
      )
      console.log("Balance of CAKE: ", formattedBalCAKE)
    })
  })
})


// binance
// npx hardhat run --network testnet scripts/deploy.js
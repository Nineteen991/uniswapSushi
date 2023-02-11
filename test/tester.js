const { expect, assert } = require('chai')
const { ethers } = require('hardhat')

const { impersonateFundErc20 } = require('../utils/utilities')

const { 
  abi 
} = require('../artifacts/contracts/interfaces/IERC20.sol/IERC20.json')
require('dotenv').config()

// Use fork of ethereum mainnet
const provider = waffle.provider

describe("FlashSwap Contract", () => {
  let FLASHSWAP,
    BORROW_AMOUNT,
    FUND_AMOUNT,
    initialFundingHuman,
    txArbitrage

  const DECIMALS = 6

  const UNISWAP_FACTORY = 
    "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
  const UNISWAP_ROUTER = 
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
  const SUSHI_FACTORY =    
    "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac"
  const SUSHI_ROUTER = 
    "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
  const USDC_WHALE = "0x7713974908be4bed47172370115e8b1219f4a5f0"
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA"
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  const ENJ = "0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c"

  const BASE_TOKEN_ADDRESS = USDC

  const tokenBase = new ethers.Contract(BASE_TOKEN_ADDRESS, abi, provider)

  beforeEach(async () => {
    // Get owner as signer
    [owner] = await ethers.getSigners()

    // Ensure that the whale has a balance
    const whale_balance = await provider.getBalance(USDC_WHALE)
    console.log("Our Balance: ", ethers.utils.formatUnits(whale_balance, 18))
    expect(whale_balance).not.equal("0")

    // Deploy smart contract
    const FlashSwap = await ethers.getContractFactory("UniswapSushiFlash")
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
      USDC_WHALE,
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
        USDC,
        WETH,
        UNISWAP_FACTORY,
        SUSHI_FACTORY,
        UNISWAP_ROUTER,
        SUSHI_ROUTER,
      )
      assert(txArbitrage)

      // Print Balances
      const contractBalanceUSDC = await FLASHSWAP.getBalanceOfToken(USDC)
      const formattedBalUSDC = Number(
        ethers.utils.formatUnits(contractBalanceUSDC, DECIMALS)
      )
      console.log("Balance of USDC: ", formattedBalUSDC)

      const contractBalanceLINK = await FLASHSWAP.getBalanceOfToken(WETH)
      const formattedBalLINK = Number(
        ethers.utils.formatUnits(contractBalanceLINK, DECIMALS)
      )
      console.log("Balance of LINK: ", formattedBalLINK)
    })

    it("Provides GAS output", async () => {
      const txReceipt = await provider.getTransactionReceipt(txArbitrage.hash)
      const effGasPrice = txReceipt.effectiveGasPrice
      const txGasUsed = txReceipt.gasUsed
      const gasUsedETH = effGasPrice * txGasUsed

      console.log(
        "Total Gas USD: ", 
        ethers.utils.formatEther(gasUsedETH.toString()) * 3  // exchange rate
      )
      expect(gasUsedETH).not.equal(0)
    })
  })
})

// ethereum testnet
// npx hardhat run scripts/deploy.js --network testnet

// binance
// npx hardhat run --network testnet scripts/deploy.js


// {
//   gasLimit: 6000000,
//   gasPrice: ethers.utils.parseUnits("5.5", "gwei"),
// },
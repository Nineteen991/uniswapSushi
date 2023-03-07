// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

import "hardhat/console.sol";

// Uniswap & PancakeSwap interface & library imports
import "./libraries/UniswapV2Library.sol";
import "./libraries/SafeERC20.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IPancakeFactory.sol";
import "./interfaces/IPancakeRouter01.sol";
import "./interfaces/IPancakeRouter02.sol";
import "./interfaces/IUniswapV2Pair.sol";

contract BSCFlash {
  using SafeERC20 for IERC20;

  // Trade Struct to store token addresses
  struct TokenAddresses {
    address tokenA;
    address tokenB;
    address factoryA;
    address factoryB;
    address routerA;
    address routerB;
  }
  mapping(address => TokenAddresses) public addr;

  // Token Addresses
  address private constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
  address private constant BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
  address private constant CAKE = 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82;

  // Trade Variables
  uint256 private deadline = block.timestamp + 1 days;
  uint256 private constant MAX_INT = 
    115792089237316195423570985008687907853269984665640564039457584007913129639935;

  // Fund smart contract
  function fundContract(
    address _owner,
    address _token,
    uint256 _amount
  ) public {
    IERC20(_token).transferFrom(_owner, address(this), _amount);
  }

  // Allows public view of balance for contract
  function getBalanceOfToken(address _address) public view returns (uint256) {
    return IERC20(_address).balanceOf(address(this));
  }

  function placeTrade(
    address _fromToken,
    address _toToken,
    uint256 _amountIn,
    address factory,
    address router
  ) private returns (uint256) {
    address pair = IPancakeFactory(factory).getPair(
      _fromToken, 
      _toToken
    );
    console.log('da pair 67: ', pair);
    require(pair != address(0), "Pool does not exist or huge price impact");

    // Calculate Amount Out
    address[] memory path = new address[](2);
    path[0] = _fromToken;
    path[1] = _toToken;

    uint256 amountToBeTraded = IPancakeRouter01(router).getAmountsOut(
      _amountIn,
      path
    )[1];
console.log('amount to be traded: ', amountToBeTraded);
    // Perform Arbitrage - Swap for another token
    uint256 amountReceived = IPancakeRouter01(router)
      .swapExactTokensForTokens(
        _amountIn,
        amountToBeTraded,  // amountOutMin
        path,
        address(this),  // address to
        deadline
      )[1];
      console.log('amountRecieved: ', amountReceived);
    require(amountReceived > 0, "Tx Aborted: Trade returned 0");

    return amountReceived;
  }

  function checkProfitability(uint256 _moneyOwed, uint256 _moneyGained)
    private pure returns (bool)
  {
    return _moneyGained > _moneyOwed;
  }

  // Start Arbitrage
  function startArbitrage(
    address _tokenBorrow, 
    uint256 _amount, 
    address _inputTokenA, 
    address _inputTokenB,
    address _factoryA,
    address _factoryB,
    address _routerA,
    address _routerB
  ) external {
    // Save address data to addr mapping
    addr[msg.sender] = TokenAddresses (
      _inputTokenA,
      _inputTokenB,
      _factoryA,
      _factoryB,
      _routerA,
      _routerB
    );

    IERC20(addr[msg.sender].tokenA)
      .safeApprove(addr[msg.sender].routerA, MAX_INT);
    IERC20(addr[msg.sender].tokenB)
      .safeApprove(addr[msg.sender].routerA, MAX_INT);

    IERC20(addr[msg.sender].tokenB)
      .safeApprove(addr[msg.sender].routerB, MAX_INT);
    IERC20(addr[msg.sender].tokenA)
      .safeApprove(addr[msg.sender].routerB, MAX_INT);

    // Assign a dummy pool if needed
    address dummyToken;
    if (_tokenBorrow != WBNB) {
      IERC20(WBNB).safeApprove(addr[msg.sender].routerA, MAX_INT);
      IERC20(WBNB).safeApprove(addr[msg.sender].routerB, MAX_INT);
      dummyToken = WBNB;
    } else {
      IERC20(BUSD).safeApprove(addr[msg.sender].routerA, MAX_INT);
      IERC20(BUSD).safeApprove(addr[msg.sender].routerB, MAX_INT);
      dummyToken = BUSD;
    }
console.log('dummy: ', dummyToken);
    // Get the pool address for the token pair
    address pair = IPancakeFactory(addr[msg.sender].factoryA).getPair(
      _tokenBorrow,
      dummyToken
    );
    console.log('da pair 149: ', pair);

    require(pair != address(0), "Pool does not exist or huge price impact");

    address token0 = IUniswapV2Pair(pair).token0();
    address token1 = IUniswapV2Pair(pair).token1();
    uint256 amount0Out = _tokenBorrow == token0 ? _amount : 0;
    uint256 amount1Out = _tokenBorrow == token1 ? _amount : 0;
console.log('token0: ', token0);
console.log('token1: ', token1);
console.log('mout0: ', amount0Out);
console.log('amount1: ', amount1Out);
    // Passing data as bytes so that the 'swap' fn knows it's a flashloan
    bytes memory data = abi.encode(_tokenBorrow, _amount, msg.sender);

    // Execute the initial swap to get the loan
    IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), data);
  }

  function pancakeCall(
    address _sender,
    uint256 _amount0,
    uint256 _amount1,
    bytes calldata _data
  ) external {
    // Decode data for calc the repayment
    (address tokenBorrow, uint256 amount, address myAddress) = abi.decode(
      _data,
      (address, uint256, address)
    );

    // Ensure this request came from the contract
    address token0 = IUniswapV2Pair(msg.sender).token0();
    address token1 = IUniswapV2Pair(msg.sender).token1();

    address pair = IPancakeFactory(addr[myAddress].factoryA).getPair(
      token0,
      token1
    );
    console.log('da pair 185: ', pair);
    
    require(msg.sender == pair, "The sender needs to match the pair");
    require(_sender == address(this), "Sender should match this contract");

    // Calculate the amount to repay at the end
    uint256 fee = ((amount * 3) / 997) + 1;
    uint256 amountToRepay = amount + fee;

    uint256 loanAmount = _amount0 > 0 ? _amount0 : _amount1;

    // Place trades
    uint256 trade1Acquired = placeTrade(
      addr[myAddress].tokenA,
      addr[myAddress].tokenB,
      loanAmount,
      addr[myAddress].factoryA,
      addr[myAddress].routerB
    );
    uint256 trade2Acquired = placeTrade(
      addr[myAddress].tokenB,
      addr[myAddress].tokenA,
      trade1Acquired,
      addr[myAddress].factoryB,
      addr[myAddress].routerB
    );

    // Check Profitability
    bool profCheck = checkProfitability(amountToRepay, trade2Acquired);
    require(profCheck, "Arbitrage not profitable");

    // Pay Myself
    IERC20 otherToken = IERC20(addr[myAddress].tokenA);
    otherToken.transfer(myAddress, trade2Acquired - amountToRepay);

    // Pay Loan Back
    IERC20(tokenBorrow).transfer(pair, amountToRepay);
  }
}
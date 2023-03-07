This is an arbitrage flashbot that runs on the PancakeSwap & ApeSwap dex's.

It takes a token, exchanges it for another on PancakeSwap, then converts it
back to the orignal token on ApeSwap. Pocketing the difference in prices
on the 2 exchanges.

There's also a fail safe. If the swap isn't going to be profitable, the
swap will fail, with no tokens exchanged saving you money.

When you call the test in HardHat, it then prompts the solidity contract to make the swap.

This is built using solidity, javascript, & HardHat.
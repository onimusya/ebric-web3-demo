"use strict";

var appSettings = {

    blockExplorerTxPath: 'https://bscscan.com/tx/',

    chainId: 56, // Mainnet = 1, Ropsten = 3, Rinkeby = 4, Kovan = 42, Goerli = 5, 56 = BSC, BscTest = 97
    networkName: 'BSC',
    chainCurrency: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.ninicoin.io/',
    //rpcUrl: 'https://speedy-nodes-nyc.moralis.io/35ce15502ff782df9d28fe7b/bsc/mainnet',
    
    BusdAddress: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    UsdtAddress: '0x55d398326f99059fF775485246999027B3197955',

    BngtAddress: '0x8Ec6Df71D4d98c5aFf5214E4f680920FeDF32A43',
    
    TokenSaleContractAddress: '0xe173F82731F6f0A2926906835F277466D0075918',
    TokenLockContractAddress: '0x04E4b4956a81e72Aae1CeaaF1e95cC41A49cf7f7',

    TokenSaleContractAbi: window.TokenSaleContractAbi,
    TokenLockContractAbi: window.TokenLockContractAbi,
    
    Erc20Abi: window.Erc20Abi,
    totalSaleSupplyRaw: '250000000000000000000000',
    saleRound: 0,
    bgntInfo: {
        symbol: "BNGT",
        decimals: 9,
        image: 'http://bunnygirlnft.com/img/favicon.png'
    },

}

window.web3AppSettings = appSettings;
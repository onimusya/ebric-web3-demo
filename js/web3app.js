"use strict";

var app = (function ($) {
    const Web3Modal = window.Web3Modal.default;
    const WalletConnectProvider = window.WalletConnectProvider.default;
    const evmChains = window.evmChains;
    
    // Private variables
    // Web3modal instance
    let web3Modal;
    
    // Chosen wallet provider given by the dialog window
    let provider;
    
    // Address of the selected account
    let selectedAccount;
    
    let walletConnectionStatus = false;

    let _settings = null;
    let _provider = null;
    let _web3 = null;
    let _web3Local = null;  // When wallet is not connected, can use this web3Local to retrieve on chain data
    let _selectedAccount = null;
    let _chainData = null;
    
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                rpc: {
                    56: "https://bsc-dataseed.binance.org/",    // BSC
                    97: "https://data-seed-prebsc-1-s1.binance.org:8545/",   // BSC Testnet
                    43113: "https://api.avax-test.network/ext/bc/C/rpc",   // Avalanche Fuji Testnet
                    43114: "https://api.avax.network/ext/bc/C/rpc", // Avalanche C-Chain Mainnet
                },
            }
        },
        //torus: {
        //    package: Torus
        //},        
    
    }

    // Cookies Functions
    let createCookie = function (name, value, daysToExpire) {
        let date = new Date();
        let expireDate = "";
        let sValue = encodeURIComponent(value);

        if (daysToExpire > 0) {
            date.setTime(date.getTime()+(daysToExpire*24*60*60*1000));
            expireDate = date.toGMTString();
        }
        
        let cookieData = name + "=" + sValue + "; expires=" + expireDate;
        console.log(`[web3app][createCookie] Cookie:`, cookieData);

        document.cookie = cookieData
    }

    let getCookie = function (cookieName) {
        var name = cookieName + "=";
        var allCookieArray = document.cookie.split(';');

        for(var i=0; i<allCookieArray.length; i++) {
            var temp = allCookieArray[i].trim();
            if (temp.indexOf(name)==0)
                return temp.substring(name.length,temp.length);
        }
        return "";
    }

    // Connect Wallet Function
    let connectWallet = async function () {
        if (!walletConnectionStatus) {
            
            // Open Web3Modal            
            try {
                _provider = await web3Modal.connect();

            } catch(e) {
                console.log("[web3app][connectWallet] Error: Could not get a wallet connection", e);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Could not get a wallet connection',
                    customClass: {
                        confirmButton: 'custom-btn',
                    },
                })                
                return false;

            }
            
            console.log(`[web3app][connectWalletClick] Provider:`, _provider);

            _web3 = new Web3(_provider);

            let nChainId = await _web3.eth.getChainId();
            console.log(`[web3app][connectWalletClick] Chain Id:`, nChainId);

            //_chainData = evmChains.getChain(nChainId);
            //console.log(`[web3app][connectWalletClick] Chain Data:`, _chainData);

            if (nChainId != _settings.chainId) {
    
                let isError = true;
                let result = null;

                if(_provider.isMetaMask){
                        try {
                            console.log(`[web3app][connectWalletClick] Trigger metamask to switch chain.`);
                            result = await _provider.request({
                                method: 'wallet_switchEthereumChain',
                                params: [{chainId: '0x'+_settings.chainId.toString(16)}],
                            });

                            if (result != null) {
                                Swal.fire({
                                    icon: 'error',
                                    text: `Something went wrong, please refresh the page`,
                                    customClass: {
                                        confirmButton: 'custom-btn',
                                    },
                                });                                
                            } else {
                                isError = false;
                            }
                            
                        } catch (err) {

                            if (err.code == 4902) {
                                console.log(`[web3app][connectWalletClick] Adding chain to metamask.`);

                                try{
                                    result = await _provider.request({
                                        method: 'wallet_addEthereumChain',
                                        params: [
                                            {
                                                chainName:_settings.networkName, 
                                                chainId: '0x'+_settings.chainId.toString(16),
                                                rpcUrls: [_settings.rpcUrl],
                                                blockExplorerUrls: [_settings.blockExplorerPath],
                                                nativeCurrency: {
                                                    name: _settings.chainCurrency,
                                                    symbol: _settings.chainCurrency,
                                                    decimals: 18
                                                }
                                            }
                                        ],
                                    });
                                    
                                    if (result != null) {
                                        Swal.fire({
                                            icon: 'error',
                                            text: `Something went wrong, please refresh the page`,
                                            customClass: {
                                                confirmButton: 'custom-btn',
                                            },
                                        });                                
                                    } else {
                                        isError = false;
                                    }
        

                                } catch (err) {
                                    Swal.fire({
                                        icon: 'error',
                                        text: err.message,
                                        customClass: {
                                            confirmButton: 'custom-btn',
                                        },
                                    });
                                }

                            } else {
                                Swal.fire({
                                    icon: 'error',
                                    text: err.message,
                                    customClass: {
                                        confirmButton: 'custom-btn',
                                    },
                                });

                            }
                        }

                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Warning: Wrong Network!',
                        text: `You choose the wrong network, please connect to ${_settings.networkName} chain.`,
                        customClass: {
                            confirmButton: 'custom-btn',
                        },
                    });
    
                }
    
                if (isError) {
                    if (_provider.close) {
                        console.log(`[web3app][connectWalletClick] Close provider.`);
                        await _provider.close();
                        await web3Modal.clearCacheProvider();
                        _provider = null;
                    }
                    _selectedAccount = null;
                    walletConnectionStatus = false;
                    $("#connect-wallet").html("Connect Wallet");
                    return false;
                }
            }

            let aAccounts = await _web3.eth.getAccounts();
            console.log(`[web3app][connectWalletClick] Accounts:`, aAccounts);

            if (aAccounts.length == 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Warning: No account!',
                    text: `No account is selected.`,
                    customClass: {
                        confirmButton: 'custom-btn',
                    },
                })
    
                if (_provider.close) {
                    console.log(`[web3app][connectWalletClick] Close provider.`);
                    await _provider.close();
                    await web3Modal.clearCacheProvider();
                    _provider = null;
                }
                _selectedAccount = null;
                walletConnectionStatus = false;
                $("#connect-wallet").html("Connect Wallet");
                return false;

            }

            _provider.on("accountsChanged", accountChanged);
            _provider.on("chainChanged", chainChanged);

            _selectedAccount = aAccounts[0];
            walletConnectionStatus = true;

            let sShortAccountAddress = _selectedAccount.substring(0,6) + "..." + _selectedAccount.substring(38,42);
            $("#connect-wallet").html(sShortAccountAddress);

            var web3EventWalletConnected = new Event('web3EventWalletConnected');
            document.dispatchEvent(web3EventWalletConnected);
            console.log('[web3app][connectWalletClick] dispatched web3EventWalletConnected');

            return true;

        } else {
            return false;
        }
    }
    // Event functions
    let accountChanged = async function (accounts) {
        console.log(`[web3app][accountsChanged] accounts:`, accounts);
        _selectedAccount = accounts[0];
        let sShortAccountAddress = _selectedAccount.substring(0,6) + "..." + _selectedAccount.substring(38,42);
        $(".connect-wallet").html(sShortAccountAddress);
        window.location.reload();
    }

    let chainChanged = async function (chainId) {
        let nChainId = parseInt(chainId);
        console.log(`[web3app][chainChanged] chainId:`, nChainId);

        if (walletConnectionStatus) {
            if (nChainId != _settings.chainId) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Warning: Wrong Network!',
                    text: `You choose the wrong network, please connect to ${_settings.networkName} chain.`,
                    customClass: {
                        confirmButton: 'custom-btn',
                    },
                });

                if (_provider.close) {
                    console.log(`[web3app][chainChanged] Close provider.`);
                    await _provider.close();
                    await web3Modal.clearCacheProvider();
                    _provider = null;
                }
                _selectedAccount = null;
                walletConnectionStatus = false;
                $("#connect-wallet").html("Connect Wallet");
                var web3EventWalletDisconnected = new Event('web3EventWalletDisconnected');
                document.dispatchEvent(web3EventWalletDisconnected);
    
                return;
            }
            
            // Correct chain
            //_chainData = evmChains.getChain(nChainId);
            //console.log(`[web3app][chainChanged] Chain Data:`, _chainData);
    
            let aAccounts = await _web3.eth.getAccounts();
            console.log(`[web3app][chainChanged] Accounts:`, aAccounts);
    
            _selectedAccount = aAccounts[0];
            walletConnectionStatus = true;
    
            let sShortAccountAddress = _selectedAccount.substring(0,6) + "..." + _selectedAccount.substring(38,42);
            $("#connect-wallet").html(sShortAccountAddress);
        }
    }

    let connectWalletClick = async function (e) {
        console.log(`[web3app][connectWalletClick] Wallet connection status:`, walletConnectionStatus);
    
        if (!walletConnectionStatus) {

            let result = await connectWallet();

            if(!result){
                var web3EventWalletConnectError = new Event('web3EventWalletConnectError');
                document.dispatchEvent(web3EventWalletConnectError);
                console.log('[web3app][connectWalletClick] dispatched web3EventWalletConnectError');
            } else {
                console.log(`[web3app][connectWalletClick] Success connect wallet and set status to cookie.`);
                createCookie("wallet_connection_status", "1");
            }

        } else {

            console.log(`[web3app][connectWalletClick] Disconnect wallet.`);
            walletConnectionStatus = false;
            createCookie("wallet_connection_status", "");

            if (_provider.close) {
                console.log(`[web3app][connectWalletClick] Close provider.`);
                await _provider.close();
                await web3Modal.clearCacheProvider();
                _provider = null;
            }
            $("#connect-wallet").html("Connect Wallet");
            _selectedAccount = null;

            if (_provider.removeListener) {
                console.log(`[web3app][connectWalletClick] Remove provider listener.`);
                _provider.removeListener("accountsChanged", accountChanged);
                _provider.removeListener("chainChanged", chainChanged);    
            }

            var web3EventWalletDisconnected = new Event('web3EventWalletDisconnected');
            document.dispatchEvent(web3EventWalletDisconnected);

        }
    }

    return {
        init: function (settings) {
            console.log("[web3app][init] Initializing...");
            console.log("[web3app][init] WalletConnectProvider:", WalletConnectProvider);
            //console.log("[web3app][init] window.web3 is", window.web3, "window.ethereum is", window.ethereum);
            console.log("[web3app][init] Settings:", settings);
        
            _settings = settings;

            let sWalletConnectionStatus = getCookie("wallet_connection_status");
            console.log("[web3app][init] Cookie (Wallet Connection Status):", sWalletConnectionStatus);

            if (sWalletConnectionStatus == "1") {
                web3Modal = new Web3Modal({
                    disableInjectedProvider: false,
                    cacheProvider: true, // optional
                    providerOptions, // required                
                });
    
            } else {
                web3Modal = new Web3Modal({
                    disableInjectedProvider: false,
                    cacheProvider: true, // optional
                    providerOptions, // required                
                });
    
                web3Modal.clearCachedProvider();
    
            }
            
            console.log("[web3app][init] Web3Modal instance:", web3Modal);

            _web3Local = new Web3(new Web3.providers.HttpProvider(_settings.rpcUrl));
            console.log("[web3app][init] Web3Local instance:", _web3Local);

            // Bind some DOM events
            $(document).on("click", "#connect-wallet", connectWalletClick);            

            if ((sWalletConnectionStatus != "") && (sWalletConnectionStatus == "1")) {
                // Already connected before, will reconnect wallet
                connectWallet().then(function (result) {
                    console.log("[web3app][init] Connect wallet result:", result);
                    if (!result) {
                        createCookie("wallet_connection_status", "");
                        var web3EventWalletConnectError = new Event('web3EventWalletConnectError');
                        document.dispatchEvent(web3EventWalletConnectError);        
                        console.log('[web3app][init] dispatched web3EventWalletConnectError');
                    }
                });
            }

            let web3InitDone = new Event('web3InitDone');
            document.dispatchEvent(web3InitDone);

        },

        getWalletConnectionStatus: function () {
            return walletConnectionStatus;
        },

        // Retrieve the web3 object
        getWeb3: function () {
            return _web3;
        },

        getWeb3Local: function () {
            return _web3Local;
        },

        getSelectedAccount: function () {
            return _selectedAccount;
        },

        connectWallet: function () {
            connectWalletClick();
        },

        personalSign: async function(message, from) {
            let method = "personal_sign";
            
            if (!walletConnectionStatus) {
                return false;
            }

            let result = await _provider.request(
                {
                    method: method,
                    params: [
                        message, 
                        from
                    ]
                }
            )

            return result;

        },

        recoverSign: function (message, signature) {
            return _web3.eth.accounts.recover(message, signature);
        }

    }
})($);

window.web3App = app;

$(document).ready(function () {
    
    app.init(window.web3AppSettings);

});

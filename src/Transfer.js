import { ethers } from "ethers";

import { useEffect, useRef, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import ERC20_ABI from './ABIS/token.json'
import BRIDGE_ABI from './ABIS/bridge.json'
import './Transfer.css'
import { useCrossChainConfig } from "./hooks/useCrossChainConfig";
import useGasPrice from "./hooks/useGasPrice";


function Transfer() {
  const [targetToken, setTargetToken] = useState('');
  const [targetChain, setTargetChain] = useState('');
  const [gasPrice, setGasPrice] = useState('0');
  const refToken = useRef(null);
  const refTargetChain = useRef(null);
  const refAmount = useRef(null);

  const [crosschainState, setCrosschainState] = useState([]);
  const [listChains, setListChains] = useState([]);
  const [listTokens, setListTokens] = useState([]);
  const [currentChainConfig, setCurrentChainConfig] = useState({});

  const { chainId, account } = useWeb3React();
  const config = useCrossChainConfig();
  let gasPricePromise = useGasPrice;

  useEffect(() => {
    if (!crosschainState.length) {
      config
        .then(res => setCrosschainState(res))
    }
  }, [config])

  useEffect(() => {
    if (crosschainState && chainId) {
      const currConfig = crosschainState?.find(cs => cs.networkId === chainId)

      if (currConfig) {
        setCurrentChainConfig(currConfig)
      }
      const chains = []
      crosschainState.map(cs => {
        if (cs.networkId !== chainId) {
          const item = { id: cs.chainId, name: cs.name }
          chains.push(item);
        }
      })
      if (chains.length) {
        setListChains(chains)
      }
    }

  }, [crosschainState, chainId])


  useEffect(() => {
    gasPricePromise(currentChainConfig.chainId)
      .then(gp => {
        console.log(`gp`, gp)
        setGasPrice(gp)
      })
  }, [gasPricePromise, currentChainConfig])


  const formToken = (e) => {
    e.preventDefault();
    setTargetToken(e.target.value);
  }

  const formChain = (e) => {
    e.preventDefault();
    setTargetChain(e.target.value)
    const targetChainConfig = crosschainState.find(chain => chain.chainId == e.target.value)
    const bridgeableTokens = []
    if (targetChainConfig) {
      currentChainConfig.tokens.map(token => {
        // if (currentChainConfig.tokens.some(currToken => currToken.resourceId === token.resourceId)) {
        if (token?.allowedChainsToTransfer) {
          token.allowedChainsToTransfer.some(chain => chain == e.target.value) && bridgeableTokens.push(token)
        } else {
          targetChainConfig.tokens.some(targToken => targToken.resourceId === token.resourceId) && bridgeableTokens.push(token)
        }
      })
      if (bridgeableTokens.length) {
        setListTokens(bridgeableTokens)
      }
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = currentChainConfig.tokens.find(token => token.resourceId === refToken.current.value)
    await sendDeposits(refToken.current.value, token.address, refTargetChain.current.value, refAmount.current.value)
  }


  const sendDeposits = async (resourceId, tokenAddress, toChainId, amountToSend) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const balance = await tokenContract.balanceOf(account);
    //  console.log(`Balance: ${balance}`)
    const amount = ethers.utils.parseEther(amountToSend);
    // const amount = balance;
    const allowance = await tokenContract.allowance(account, currentChainConfig.erc20HandlerAddress);
    console.log("🚀 ~ file: Transfer.js ~ line 130 ~ sendDeposits ~ allowance", allowance)
    if (allowance.lt(amount)) {
      const approveAmountMaxUint = String(ethers.constants.MaxUint256)

      const tx = await tokenContract.approve(currentChainConfig.erc20HandlerAddress, approveAmountMaxUint, { gasPrice });
      if (!tx) {
        return
      }
      await tx.wait()
      alert(`Approve tx ${currentChainConfig.blockExplorer}/tx/${tx.hash}`);
    }
    const bridgeContract = new ethers.Contract(currentChainConfig.bridgeAddress, BRIDGE_ABI.abi, signer);
    const recipient = account;
    console.log(recipient);
    console.log(String(gasPrice))
    const data = '0x' +
      ethers.utils.hexZeroPad(ethers.BigNumber.from(amount).toHexString(), 32).substr(2) +    // Deposit Amount        (32 bytes)
      ethers.utils.hexZeroPad(ethers.utils.hexlify((recipient.length - 2) / 2), 32).substr(2) +    // len(recipientAddress) (32 bytes)
      recipient.substr(2);                    // recipientAddress      (?? bytes)

    const fee = await bridgeContract._fees(toChainId);

    const txBridge = await bridgeContract.deposit(toChainId, resourceId, data, '0x00', { value: fee, gasPrice });
    if (!txBridge) {
      return
    }
    await txBridge.wait()
    alert(`Transfer tx ${currentChainConfig.blockExplorer}/tx/${txBridge.hash}`);
  }

  return (
    <>
      <form className="wrappedForm" onSubmit={handleSubmit}>
        {chainId && <div className="from">
          <label> from {currentChainConfig?.name}

          </label>
        </div>}
        <div className="to">
          <select value={targetChain} ref={refTargetChain} onChange={formChain}
            name="targetChain"
          >
            {chainId && listChains.map((item, ind) => {
              return (<option key={ind} value={item.id}>{item.name}</option>)
            })}

          </select>
        </div>

        {listTokens?.length > 0 && <div className="token">
          <select value={targetToken} ref={refToken} onChange={formToken}
            name="targetToken"
          >
            {listTokens?.map((token, ind) => {
              return (<option key={ind} value={token.resourceId}  >{token.name}</option>)
            })}

          </select>
        </div>}
        {targetToken !== '' && <div className="amount">
          <label>Enter amount:
            <input ref={refAmount}
              type="string"
            />
          </label>
        </div>}
        <input type="submit" className="submitBtn" />
      </form >
    </>

  )
}

export default Transfer;

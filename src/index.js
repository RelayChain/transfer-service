import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Transfer from './Transfer';
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { Web3Provider } from "@ethersproject/providers";

const supportedChainIds = [
  1,
  3,
  4,
  5,
  42,
  43113,
  43114,
  97,
  56,
  1287,
  80001,
  137,
  128,
  1285,
  250,
  336,
  4689,
  1666600000,
  25,
  66,
  62621,
  1088
]

const injected = new InjectedConnector({
  supportedChainIds: supportedChainIds,
});

const getLibrary = (provider, connector) => {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};
const Connector = () => {

  const web3 = useWeb3React();

  const handleConnect = () => {
    try {
      web3.activate(injected, undefined, true);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    handleConnect()
  }, [])

  return (
    <div>
      <p>
        <span>Status: {web3.active ? `"🟢" ${web3.account}` : web3.error ? `"🔴" Not connected` : "🟠"}</span>
      </p>
      <Transfer />
    </div>
  );
};


ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <Connector />

    </Web3ReactProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

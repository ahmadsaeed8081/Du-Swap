import React,{useState} from 'react'
import { useWeb3Modal } from "@web3modal/react";

import { useAccount, useContractReads, useContractWrite } from "wagmi";
const Header = () => {
  const { open, close } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  return (
    <>
      <div className="header">
        <div className="wrapper app-width">
          <div className="ls">
            <img src="../images/logo.png" className="header-logo"></img>
          </div>
          <div className="rs">
            {/* <button className="connect-btn" type="button">
              Connect Wallet
            </button> */}
            <button className="connect-btn" type="button" onClick={() => open()}> {isConnected
            ? address.slice(0, 5) + "..." + address.slice(38, 42)
            : "Connect Wallet"}</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;

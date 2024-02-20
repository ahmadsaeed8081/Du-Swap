import { useState,useEffect, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  ArrowIcon,
  LinkIcon,
  ChatIcon,
  ArrowRightIcon,
} from "../Icons/Index.js";
import moment from "moment";
import Decimal from 'decimal.js';



import { CopyToClipboard } from "react-copy-to-clipboard";
import {PiCopySimpleFill} from 'react-icons/pi';
import { useLocation } from 'react-router-dom';
import Loader from "../components/Loader";

import { cont_address,cont_abi,token_abi,usdt_Address,du_Address } from "../components/config";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Web3 from "web3";
import {useNetwork,  useSwitchNetwork } from 'wagmi'

import { useAccount, useDisconnect } from 'wagmi'
import { useContractReads,useContractRead ,useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'


const currencyList = [
  { label: "USDT", value: "usdt", icon: "/images/usd-T.png",address:usdt_Address },
  { label: "DU", value: "du", icon: "/images/du.png", address:du_Address },
];

const Home = () => {
  const [pay, setPay] = useState(0);
  const [receive, setReceive] = useState(0);
  const [activePayCurrency, setActivePayCurrency] = useState(currencyList[0]);
  const [activeReceiveCurrency, setActiveReceiveCurrency] = useState(
    currencyList[1]
  );


  const [withdrawAmount, set_withdrawAmount] = useState(0);
  const [ref_add, set_ref] = useState("0x0000000000000000000000000000000000000000");

  const [referralEarning, set_referralEarning] = useState(0);
  const [totalOrders, set_totalOrders] = useState(0);
  const [Directs, set_Directs] = useState(0);

  const [usdt_balance, set_usdt_balance] = useState(0);
  const [du_balance, set_du_balance] = useState(0);

  const [Minimum_withdraw, set_Minimum_withdraw] = useState(0);
  const [Du_price_in_usdt, set_Du_price_in_usdt] = useState(0);

  

  const [orderHistory, set_orderHistory] = useState([]);
  const [owner, set_owner] = useState(0);

  const [fee, set_fee] = useState(0);
  const [swap_fee, set_swap_fee] = useState(0);

  const [Expected_tokens, set_Expected_tokens] = useState(0);
 
  const [loader, setLoader] = useState(false);


  const notify = () => toast("Referral is Copied Successfully!");
  const { address, isConnecting ,isConnected,isDisconnected} = useAccount()

  const { chain } = useNetwork()

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const temp_address = params.get("ref");



  const CHAIN_ID = "80001";
  const CHAIN_ID1 = "0x89";

  useEffect(() => {
    if(isConnected)
    {
      get_Data();

    }
    if(temp_address!=null)
    {
      set_ref(temp_address)

    }
  },[address]);

  const {
    data: du_to_usdt_swapResult,
    isLoading: isLoading_du_to_usdt_swap,
    isSuccess: du_to_usdt_swapSuccess,
    write: du_to_usdt,
  } = useContractWrite({
    address: cont_address,
    abi: cont_abi,
    functionName: 'du_to_usdt',
    args: [Convert_To_Wei(pay),ref_add],
    onSuccess(data) {
      get_Data();
      console.log('Success', data)
    },
  });


  const {
    data: usdt_to_du_swapResult,
    isLoading: isLoading_usdt_to_du_swap,
    isSuccess: usdt_to_du_swapSuccess,
    write: usdt_to_du,
  } = useContractWrite({
    address: cont_address,
    abi: cont_abi,
    functionName: 'usdt_to_du',
    args: [Convert_To_Wei(pay),ref_add],
    onSuccess(data) {
      get_Data();
      console.log('Success', data)
    },
  });


  const {
    data: withdraw_Result,
    isLoading: withdraw_isLoading,
    isSuccess: withdraw_Success,
    write: withdraw_refEarning,
  } = useContractWrite({
    address: cont_address,
    abi: cont_abi,
    functionName: 'withdraw_refEarning',
    onSuccess(data) {
      get_Data();
      console.log('Success', data)
    },
  });

  

  const { config: usdtConfig } = usePrepareContractWrite({
    address: usdt_Address,
    abi: token_abi,
    functionName: "approve",
    args: [cont_address,Convert_To_Wei((pay?(pay):("0")))],
  });
  
  const { config: DUConfig } = usePrepareContractWrite({
    address: du_Address,
    abi: token_abi,
    functionName: "approve",
    args: [cont_address,Convert_To_Wei((pay?(pay):("0")))],
  });






  const {
    data: data_token,
    isLoading: isLoading_token,
    isSuccess: isSuccess_token,
    write: approval_token,
    } = useContractWrite(DUConfig);
    


    const {
      data: data_usdt,
      isLoading: isLoading_usdt,
      isSuccess: isSuccess_usdt,
      write: usdt_approval,
    } = useContractWrite(usdtConfig);







    const {switchNetwork:swap_switch_usdt } =
useSwitchNetwork({
  chainId: CHAIN_ID,
  // throwForSwitchChainNotSupported: true,
  onSuccess(){

    usdt_approval?.();
  }

  

})
const {switchNetwork:swap_switch_du } =
useSwitchNetwork({
  chainId: CHAIN_ID,
  onSuccess(){

    approval_token?.();
  }

  

})

const {switchNetwork:withdraw_switch } =
useSwitchNetwork({
  chainId: CHAIN_ID,
  onSuccess(){

    withdraw_refEarning?.();
  }

  

})




const waitForTransaction_buy = useWaitForTransaction({
  hash: data_usdt?.hash,
  onSuccess(data) {
    usdt_to_du?.();
    console.log("Success", data);
  },
});
const waitForTransaction_sell = useWaitForTransaction({
  hash: data_token?.hash,
  onSuccess(data) {
    du_to_usdt?.();
    console.log("Success", data);
  },
});




const count = (time) => {
  const now = new Date(time*1000);

  const t=moment(now).format('D MMM YYYY');
  return t;
  
};





  async function get_Data(){
    // setLoader(true)
    const web3= new Web3(new Web3.providers.HttpProvider("https://polygon-mumbai.g.alchemy.com/v2/Xr86iyHzmF6-yzBAqV5rd_PW7ds7QKlh"));
    setLoader(true)

              
   const balance =await  web3.eth.getBalance(address)
    const contract=new web3.eth.Contract(cont_abi,cont_address);
    const usdt_contract=new web3.eth.Contract(token_abi,usdt_Address);
    const Du_contract=new web3.eth.Contract(token_abi,du_Address);



    let usdt_Balance = await usdt_contract.methods.balanceOf(address).call();    
    let Du_Balance = await Du_contract.methods.balanceOf(address).call();  
    
    let Minimum_withdraw_limit = await contract.methods.Minimum_withdraw_limit().call();  

    let Du_price_in_usdt = await contract.methods.Du_price_in_usdt().call();  

    
    let owner = await contract.methods.owner().call();  
    let swap_fee = await contract.methods.fee().call();  

    let user = await contract.methods.user(address).call();  

    let orderHistory = await contract.methods.get_userSwaps().call({from : address});  


    set_swap_fee(Convert_To_eth(swap_fee))
    set_referralEarning(user[4])
    set_totalOrders(user[0])
    set_Directs(user[3])
    set_usdt_balance(usdt_Balance)
    set_du_balance(Du_Balance)
    set_Minimum_withdraw(Minimum_withdraw_limit)
    set_Du_price_in_usdt(Du_price_in_usdt)
    set_orderHistory(orderHistory)
    set_owner(owner)
    setLoader(false)

  }

  function Convert_To_eth(val) {
    const web3= new Web3(new Web3.providers.HttpProvider("https://polygon.meowrpc.com"));
  
    val = web3.utils.fromWei(val.toString(), "ether");
    return val;
  }

  function Convert_To_Wei(val) {
    const web3= new Web3(new Web3.providers.HttpProvider("https://polygon.meowrpc.com"));
  
    val = web3.utils.toWei(val.toString(), "ether");
    return val;
  }
  
  function onSend_expected_reciving(value) 
  {
    if(value==0)
    return
    if((activeReceiveCurrency.label == "USDT" && activePayCurrency.label =="DU")  )
    {

      let price = Number(Du_price_in_usdt)/10**18
     let dec_price= new Decimal(price);
     value=new Decimal(value)
      let temp=dec_price.times(value);
      setReceive(temp);

     let dec_temp= new Decimal(Number(temp))
     let dec_fees=new Decimal(Number(swap_fee))
     let fees=dec_temp.times(dec_fees)
      const result = fees.div(100);
      set_fee(Number(result))
      set_Expected_tokens(Number(temp)  - (Number(result.toDecimalPlaces(2))))

    }
    else if(activeReceiveCurrency.label == "Du" ||activePayCurrency.label == "USDT")
    {

      // let temp=(value/((Number(Du_price_in_usdt))/10**18));

      let price = Number(Du_price_in_usdt)/10**18
      let dec_price= new Decimal(price);
      value=new Decimal(value)
       let temp=value.div(dec_price);

      setReceive(temp);

      let dec_temp= new Decimal(Number(temp))
      let dec_fees=new Decimal(Number(swap_fee))
      let fees=dec_temp.times(dec_fees)
       const result = fees.div(100);
       set_fee(Number(result))

       set_Expected_tokens(Number(temp)  - (Number(result.toDecimalPlaces(2))))

    }
    
  }
  
  
  function onRecieve_expected_reciving(value) 
  {
    if(value==0)
    return
    if((activeReceiveCurrency.label == "USDT" && activePayCurrency.label =="DU")  )
    {
      let price = Number(Du_price_in_usdt)/10**18
      let dec_price= new Decimal(price);
      value=new Decimal(value)
       let temp=value.div(dec_price);

      setPay(temp);

      let dec_temp= new Decimal(Number(temp))
      let dec_fees=new Decimal(Number(swap_fee))
      let fees=dec_temp.times(dec_fees)
       const result = fees.div(100);
       set_fee(Number(result))

       set_Expected_tokens(Number(temp)  - (Number(result.toDecimalPlaces(2))))
    
    }
    else if(activeReceiveCurrency.label == "Du" ||activePayCurrency.label == "USDT")
    {
      let price = Number(Du_price_in_usdt)/10**18
      let dec_price= new Decimal(price);
      value=new Decimal(value)
       let temp=dec_price.times(value);
       setPay(temp);
 
      let dec_temp= new Decimal(Number(temp))
      let dec_fees=new Decimal(Number(swap_fee))
      let fees=dec_temp.times(dec_fees)
       const result = fees.div(100);
       set_fee(Number(result))
       set_Expected_tokens(Number(temp)  - (Number(result.toDecimalPlaces(2))))
    }
  }
  

  function withdraw(value) 
  {
    if(isDisconnected)
    {
      alert("Kindly connect your wallet");
      return;
    }
    if(Number(referralEarning)/10**18 < Number(Minimum_withdraw)/10**18)
    {
      alert("You can't withdraw less than "+Number(Minimum_withdraw)/10**18 +" Du");
      return;
    }

    if(CHAIN_ID!=chain.id)
    {
      withdraw_switch?.();
    }
    else{
      withdraw_refEarning?.()
    }
  }
  
  function swap()
  {
    if(isDisconnected)
    {
      alert("Kindly connect your wallet");
      return;
    }
    if(pay=="" || pay=="0")
    {
      alert("Kidly write the amount");
      return;
    }
    if(activePayCurrency.label==activeReceiveCurrency.label)
    {
      alert("wrong pair");
      return;
    }
  

      if(activePayCurrency.label =="DU")
      {
        if(Number(du_balance)< Number(Convert_To_Wei(pay)))
        {
          alert("You don't have enough du");
          return;
        }
  
        if(CHAIN_ID!=chain.id)
        {
          swap_switch_du?.();
        }
        else{
          approval_token?.()
        }
  
      }
      else if(activePayCurrency.label =="USDT")
      {
        console.log("object usdt");
        if(Number(usdt_balance)< Number(pay)*10**18)
        {
          alert("You don't have enough USDT");
          return;
        }
  
        if(CHAIN_ID!=chain.id)
        {
          console.log("object swit");
  
          swap_switch_usdt?.();
        }
        else{
          usdt_approval?.();
        }
      } 
  
  
      // token to token
    
  
  }

  return (
    <>
      <div className="home">
        <div className="container app-width">
          <div className="home-ls">
            <div className="ls_circle"></div>
            <div
              className="swap_card"
              style={{ backgroundImage: `url(/images/swap-bg.png)` }}
            >
              <h1>Swap</h1>
              <div className="field-control">
                <div className="field">
                  <h2 className="label">You pay</h2>
                  <input
                    type="number"
                    className="input"
                    value={pay}
                    onChange={(e) => {setPay(e.target.value);onSend_expected_reciving(e.target.value)}}
                  ></input>
                </div>
                <Menu as="div" className="swap-menu">
                  <Menu.Button className="btn">
                    {activePayCurrency.label}
                    <img
                      src={activePayCurrency.icon}
                      className={`icon ${activePayCurrency.value}`}
                    ></img>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="items">
                      {currencyList.map((item) => (
                        <Menu.Item key={item.name}>
                          <button
                            className={`item ${item.icon} ${activePayCurrency.value === item.value
                              ? "active"
                              : ""
                              }`}
                            onClick={() => {setActivePayCurrency(item);
                            
                            if(item.value=="usdt"){
                              setActiveReceiveCurrency(currencyList[1]);
                              setPay(0)
                              setReceive(0)

                            }
                            else if(item.value=="du"){
                              setActiveReceiveCurrency(currencyList[0]);
                              setPay(0)
                              setReceive(0)


                            }
                          }}
                          >
                            <span className="lbl">{item.label}</span>
                            <img
                              src={item.icon}
                              alt={item.label}
                              className="icon"
                            />
                          </button>
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
              <div className="arrowDown">
                <ArrowIcon />
              </div>
              <div className="field-control">
                <div className="field">
                  <h2 className="label">You Receive</h2>
                  <input
                    type="number"
                    className="input"
                    value={receive}
                    onChange={(e) => {setReceive(e.target.value);onRecieve_expected_reciving(e.target.value)}}
                  ></input>
                </div>
                <Menu as="div" className="swap-menu">
                  <Menu.Button className="btn">
                    {activeReceiveCurrency.label}
                    <img
                      src={activeReceiveCurrency.icon}
                      className={`icon ${activeReceiveCurrency.value}`}
                    ></img>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="items">
                      {currencyList.map((item) => (
                        <Menu.Item key={item.name}>
                          <button
                            className={`item ${item.value} ${activeReceiveCurrency.value === item.value
                              ? "active"
                              : ""
                              }`}
                            onClick={() => {setActiveReceiveCurrency(item);
                            
                              if(item.value=="usdt"){
                                setActivePayCurrency(currencyList[1]);
                                setPay(0)
                                setReceive(0)
                              }
                              else if(item.value=="du"){
                                setActivePayCurrency(currencyList[0]);
                                setPay(0)
                                setReceive(0)
                              }}}
                          >
                            <span className="lbl">{item.label}</span>
                            <img
                              src={item.icon}
                              alt={item.label}
                              className="icon"
                            />
                          </button>
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
              <div className="ded-text">
                <div className="ded_ls">Fee ( 1% )</div>
                <div className="amount-num">
                  <div className="input-add">{fee}</div>
                  <div className="input-name">{activeReceiveCurrency.label}</div>
                </div>
              </div>
              <div className="exp-text">
                <div className="exp_ls">Expected Token</div>
                <div className="amount-num">
                  <div className="input-add">{Expected_tokens}</div>
                  <span className="input-name">{activeReceiveCurrency.label}</span>
                </div>
              </div>
              <button type="submit" className="swap-btn" onClick={swap}>
                Swap
              </button>
            </div>
          </div>
          {/* home-rs */}
          <div className="home-rs">
            <div className="rs_circle"></div>
            <div className="payment-box">
              <div className="tol_invest">
                <h1 className="invest">Total Orders</h1>
                <div className="total-num">{Number(totalOrders)}</div>
              </div>
              <div className="tol_Ear">
                <h1 className="earning">Total Earning</h1>
                <div className="btn-box">
                  <div className="total-num">{Number(referralEarning)/10**18} DU</div>
                  <button className="btn-withdraw" onClick={withdraw}>Withdraw</button>
                </div>
              </div>
              <div className="tol_Bal">
                <h1 className="balance">Total Directs</h1>
                <div className="total-num">{Number(Directs)}</div>
              </div>
              <div className="tol_Ref">
                <h1 className="referr">Total Referrals</h1>
                <div className="total-num">{Number(Directs)}</div>
              </div>
            </div>
            <div className="link-box">
              <div className="text">
                <h1 className="link-name">My Link</h1>
                <div className="link_icon">
                <CopyToClipboard text={`${window.location.origin}/?ref=${address}`} >
                        <button className="copy-icon flex items-center justify-center" >
                          <PiCopySimpleFill color='white' className=' text-2xl'  onClick={notify}/>
                        </button>

                </CopyToClipboard>  
                  {/* <LinkIcon /> */}
                </div>
              </div>
              <div className="url">{window.location.origin}/?ref={address?address.slice(0,4)+"...."+address.slice(38,42):"kindly connect"}

              </div>
            </div>
            {/* chat_box */}
            <div
              className="analysis"
              style={{ backgroundImage: `url(/images/swap-bg.png)` }}
            >
              <div className="last_time">Last 24 Hours Swap</div>
              <div className="analysis-bar">
                <ChatIcon />
              </div>
              <div className="analysis-filed">
                <div className="ls-Analy">
                  <img src="/images/du.png" className="du-image" />
                  <h1 className="du">DU</h1>
                  <div className="arrow-right">
                    <ArrowIcon />
                  </div>
                  <img src="/images/usd-T.png" className="ls-usdImage" />
                  <div className="usdt">USDT</div>
                </div>
                <div className="rs-Analy">
                  <img src="/images/usd-T.png" className="rs-image" />
                  <div className="chat-usdt-rs">USDT</div>
                  <div className="arrow-right">
                    <ArrowIcon />
                  </div>
                </div>
              </div>
              <div className="Rp">
                <div className="ls-rp">300000</div>
                <div className="ArrowLeftRight ">
                  <ArrowRightIcon />
                </div>
                <div className="rs-rp">300000</div>
              </div>
            </div>
          </div>
        </div>
        {/* swap_history */}
        <div className="history">
          <div className="blur-circle"></div>
          <div className="wrapper app-width">
            <div className="heading-name">Swap History</div>
            <div className="table">
              <di className="table-content">
                <div className="table-head">
                  <div className="row title sr-no">Sr.No</div>
                  <div className="row title">Order No</div>
                  <div className="row title">IN Amount</div>
                  <div className="row title">OUT Amount</div>
                  <div className="row title">Place Time</div>
                  <div className="row title">Decision Time</div>
                  <div className="row title">Status</div>
                </div>
                <div className="table-lists">
                  {orderHistory.map((item,index) => (
                    <div className="list">
                      <div className="row label">{index}</div>
                      <div className="row label">0xdu{Number(item[1])}</div>
                      <div className="row label">{Convert_To_eth(item[4])} {Number(item[2])==du_Address ? ("DU"):("USDT") }</div>
                      <div className="row label">{Number(item[5])/10**18}  {Number(item[3])==du_Address ? ("DU"):("USDT") }</div>
                      <div className="row label">{count(Number(item[6]))}</div>
                      <div className="row label">{Number(item[7])==0?(""):(count(Number(item[7])))}</div>
                      <div className="row label">{Number(item[8])==0 ? ("pending"):(Number(item[8])==1 ? ("Approve"):(Number(item[8])==2 ? ("Decline"):(null))) }</div>

                    </div>
                  ))}
                </div>
              </di>
            </div>
          </div>
        </div>
        <ToastContainer/>
        {loader && <Loader />}

      </div>
    </>
  );
};

export default Home;

import Header from "./components/Header";
import Home from "./Pages/Home";
import "./css/style.scss";
import { Route, Routes } from "react-router-dom";

import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { bsc} from 'wagmi/chains'
function App() {


  const chains = [bsc]
const projectId = 'f385bf4e147a499aee6b6c2f17ded944'

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])
// const { chains, publicClient } = configureChains(
//   [polygonMumbai],
//   [alchemyProvider({ apiKey: 'Xr86iyHzmF6-yzBAqV5rd_PW7ds7QKlh' })],
// )
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)



  return (
  <>
    <WagmiConfig config={wagmiConfig}>

    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
    </WagmiConfig>

    <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
  </>

  );
}

export default App;

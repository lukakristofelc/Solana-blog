/* app/src/App.js */
import './App.css';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import idl from './solana_blog.json';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Objava } from './Components/ObjavaComponent/ObjavaComponent'
require('@solana/wallet-adapter-react-ui/styles.css');

const wallets = [ new PhantomWalletAdapter() ]
const { SystemProgram, Keypair } = web3;
const programID = new PublicKey(idl.metadata.address);

function App() {
  const [dataList, setDataList] = useState([]);
  const [input, setInput] = useState('');
  const wallet = useWallet()

  async function connectContract() {
    const network = "http://127.0.0.1:8899";

    const connection = new Connection(network, "processed");
    const provider = new AnchorProvider(connection, wallet, "processed");
    const contract = new Program(idl, programID, provider);
    
    return contract;
  }

  async function getPosts() { 
    const contract = await connectContract();
    const objave = await contract.account.objava.all();
    setDataList(orderPosts(objave));
  }

  const orderPosts = (posts) => {
    return posts.slice().sort((a, b) => b.account.timestamp - a.account.timestamp)
  }

  async function updatePosts() {
    if (!input) return;

    const contract = await connectContract();
    const novaObjava = Keypair.generate();

    await contract.methods.objaviObjavo(input)
      .accounts({
        objava: novaObjava.publicKey,
        avtor: contract.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([novaObjava])
      .rpc();

    setInput('');
    getPosts();
  }

  useEffect(()=>{
    getPosts();
  }, [])

  if (!wallet.connected) 
  {
    return (
      <div>
        <h1 style={{textAlign: 'center'}}>SOLANA BLOGCHAIN</h1>
        <p style={{textAlign: 'center'}}>Please connect your Phantom Wallet to continue:</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop:'20px' }}>
          <WalletMultiButton />
        </div>
      </div>
    )
  } 
  else 
  {
    return (
      <div className="App">
        <div>
          {
            (
              <div className='nova-objava'>
                <h1>SOLANA BLOGCHAIN</h1>
                <textarea 
                  type="text"
                  placeholder="Vnesi novo objavo"
                  onChange={e => setInput(e.target.value)}
                  value={input}
                  rows="8" cols="50"
                />
                <br/>
                <button onClick={updatePosts}>OBJAVI</button>
              </div>
            )
          }
          {
            dataList.map(objava => 
            <Objava avtor={objava.account.avtor.toBase58()} 
                    vsebina={objava.account.vsebina} 
                    timestamp={new Date(objava.account.timestamp * 1000).toLocaleString()} />)
          }
        </div>
      </div>
    );
  }
}

const AppWithWalletProvider = () => (
  <ConnectionProvider>
    <WalletProvider wallets={wallets}>
      <WalletModalProvider>
        <App/>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithWalletProvider;  
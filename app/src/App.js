/* app/src/App.js */
import './App.css';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import idl from './idl.json';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
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

  async function getProvider() {
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, "processed");

    const provider = new AnchorProvider(connection, wallet, "processed");
    return provider;
  }

  async function initialize() {    
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    try {      
      const accounts = await program.account.objava.all();
      setDataList(orderPosts(accounts));
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  const orderPosts = (accounts) => {
    return accounts.slice().sort((a, b) => b.account.timestamp - a.account.timestamp)
  }

  async function update() {
    if (!input) return
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    const newObjava = Keypair.generate();

    await program.methods.objaviObjavo(input)
      .accounts({
        objava: newObjava.publicKey,
        avtor: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([newObjava])
      .rpc();

    const accounts = await program.account.objava.all();
    setDataList(orderPosts(accounts));
    setInput('');
  }

  useEffect(()=>{
    initialize();
  }, [])

  if (!wallet.connected) 
  {
    return (
      <div>
        <h1 style={{textAlign: 'center'}}>SOLANA BLOG</h1>
        <p style={{textAlign: 'center'}}>Please connect your solana wallet to continue:</p>
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
                <h1>SOLANA BLOG</h1>
                <textarea 
                  type="text"
                  placeholder="Vnesi novo objavo"
                  onChange={e => setInput(e.target.value)}
                  value={input}
                  rows="8" cols="50"
                />
                <br/>
                <button onClick={update}>OBJAVI</button>
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

const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;  
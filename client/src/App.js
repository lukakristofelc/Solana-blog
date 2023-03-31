import './App.css';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import idl from './solana_blog.json';
import SwitcherComponent from './Components/SwitcherComponent/SwitcherComponent';
import { ModeratorAddress } from './config.js'
import * as anchor from '@project-serum/anchor';

const { SystemProgram, Keypair } = web3;
const programID = new PublicKey(idl.metadata.address);

function App() {
  const [currentUser, setCurrentUser] = useState('');
  const [isMod, setIsMod] = useState();
  const [showTextarea, setShowTextArea] = useState();
  const [newUsername, setNewUsername] = useState('');
  const [username, setUsername] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(undefined); 
  const [isConnected, setConnected] = useState(false);
  const [contract, setContract] = useState([]);

  const connectWallet = async () => {
    if (window.solana) {
      setSelectedWallet(window.solana);
    } else {
      console.log('Phantom not available, get it from here, https://phantom.app/');
    }
  }

  useEffect(() => {
    if (selectedWallet) {
      selectedWallet.connect();
      
      selectedWallet.on('connect', () => {
          setConnected(true);
          connectContract();
      });

      selectedWallet.on('disconnect', () => {
          setConnected(false);
      });
      
      return () => {
          selectedWallet.disconnect();
      };
    }
  }, [selectedWallet])

  async function connectContract() {
    const network = "http://127.0.0.1:8899";
    
    const connection = new Connection(network, "processed");
    const provider = new AnchorProvider(connection, selectedWallet, "processed");
    const contract = new Program(idl, programID, provider);

    const userExists = await doesUserExist(contract);
    setShowTextArea(!userExists);
    setContract(contract);
  }

  async function createUser() {
    if(!newUsername) return;

    const newUser = Keypair.generate();

    const [newUsersFriendRequests, _] = await PublicKey.findProgramAddress(
      [
          anchor.utils.bytes.utf8.encode('friends'),
          newUser.publicKey.toBuffer(),
      ],
      contract.programId
    )

    const isMod = JSON.stringify(ModeratorAddress) === JSON.stringify(contract.provider.wallet.publicKey);

    await contract.methods.createUser(newUsername, contract.provider.wallet.publicKey, isMod)
      .accounts({
        user: newUser.publicKey,
        friends: newUsersFriendRequests,
        author: contract.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([newUser])
      .rpc();

    setIsMod(isMod);
    setCurrentUser(newUser.publicKey);
    setUsername(newUsername);
    setNewUsername('');
    setShowTextArea(false);
  }

  const doesUserExist = async (contract) => {
    let userExists = false;
    const accounts = await contract.account.user.all();

    accounts.forEach(user => {
      if(JSON.stringify(user.account.creator) === JSON.stringify(selectedWallet.publicKey)) {
        userExists = true;
        setCurrentUser(user.publicKey);
        setUsername(user.account.name);
        setIsMod(user.account.isMod);
      }
    });
    return userExists;
  }

  if (currentUser === '')
  {
    return (<div>
              <div className='header'>
                <h1>SOLANA BLOGCHAIN</h1>
              </div>
              <div>
                { showTextarea ? <div className='sign-up-panel'>
                                    <p style={{textAlign: 'center'}}>Please pick a username:</p> <br />
                                    <textarea
                                      id='username' 
                                      type="text"
                                      placeholder="Username"
                                      onChange={e => setNewUsername(e.target.value)}
                                      rows="8" cols="50"
                                    /> 
                                    <button onClick={createUser}>SIGN UP</button> 
                                  </div> : 
                                  <div>
                                    <p style={{textAlign: 'center'}}>Please connect your Phantom Wallet to continue:</p>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop:'20px' }}>
                                    <button onClick={connectWallet}>CONNECT WALLET</button>
                                    </div>
                                  </div>}
              </div>
            </div>)
  }
  else
  {
    return (
      <div>
        <SwitcherComponent key={currentUser} currentUser={currentUser} isMod={isMod} contract={contract} Keypair={Keypair} username={username}/>
      </div>
    )
  }
}

export default App;
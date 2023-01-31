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
  const [username, setUsername] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(undefined); 
  const [isConnected, setConnected] = useState(false);
  const [contract, setContract] = useState([]);
  const [posts, setPosts] = useState([]);

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
          console.log('Connected to wallet ' + selectedWallet.publicKey.toBase58());
          console.log('selected wallet', selectedWallet);
      });

      selectedWallet.on('disconnect', () => {
          setConnected(false);
          console.log('Disconnected from wallet');
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
    if(!username) return;

    const newUser = Keypair.generate();

    const [newUsersFriendRequests, _] = await PublicKey.findProgramAddress(
      [
          anchor.utils.bytes.utf8.encode('friends'),
          newUser.publicKey.toBuffer(),
      ],
      contract.programId
  )

    await contract.methods.createUser(username, contract.provider.wallet.publicKey, true)
      .accounts({
        user: newUser.publicKey,
        friends: newUsersFriendRequests,
        author: contract.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([newUser])
      .rpc();

    setIsMod(contract.provider.wallet.publicKey === ModeratorAddress.toLowerCase());
    setCurrentUser(newUser.publicKey);
    setUsername('');
    setShowTextArea(false);
  }

  const doesUserExist = async (contract) => {
    let userExists = false;
    const accounts = await contract.account.user.all();

    accounts.forEach(element => {
      if(JSON.stringify(element.account.creator) === JSON.stringify(selectedWallet.publicKey)) {
        userExists = true;
        setCurrentUser(element.publicKey);
        setIsMod(contract.provider.wallet.publicKey === ModeratorAddress.toLowerCase());
      }
    });
    return userExists;
  }

  const getPosts = async () => {
    try {
        const fetchedPosts = await contract.account.post.all();
        setPosts(orderPosts(fetchedPosts));
    } catch (e) {
        console.log(e);
    }
  }

  const orderPosts = (accounts) => {
    return accounts.slice().sort((a, b) => b['account']['timestamp'] - a['account']['timestamp']);
  }

  useEffect(() => {
    getPosts();
  }, [contract]);

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
                                      onChange={e => setUsername(e.target.value)}
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
        <SwitcherComponent key={posts} currentUser={currentUser} isMod={isMod} contract={contract} Keypair={Keypair} posts={posts} getPosts={getPosts}/>
      </div>
    )
  }
}

export default App;
import './App.css';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import idl from './solana_blog.json';
import { Objava } from './Components/ObjavaComponent/ObjavaComponent'

const { SystemProgram, Keypair } = web3;
const programID = new PublicKey(idl.metadata.address);

function App() {
  const [dataList, setDataList] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [input, setInput] = useState('');

  const [showTextarea, setShowTextArea] = useState();
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

  useEffect(() => {
    getPosts();
  }, [contract]);
  
  async function connectContract() {
    const network = "http://127.0.0.1:8899";
    
    const connection = new Connection(network, "processed");
    const provider = new AnchorProvider(connection, selectedWallet, "processed");
    const contract = new Program(idl, programID, provider);

    const userExists = await doesUserExist(contract);
    setShowTextArea(!userExists);
    setContract(contract);
  }

  const getPosts = async () => {
    const objave = await contract.account.post.all();
    console.log(objave);
    setDataList(orderPosts(objave));
  }

  const orderPosts = (posts) => {
    return posts.slice().sort((a, b) => b.account.timestamp - a.account.timestamp)
  }

  async function createUser() {
    if(!username) return;

    const newUser = Keypair.generate();

    await contract.methods.createUser(username, contract.provider.wallet.publicKey, true)
      .accounts({
        user: newUser.publicKey,
        author: contract.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([newUser])
      .rpc();

    setCurrentUser(newUser.publicKey);
    setUsername('');
    setShowTextArea(false);
  }

  const addPost = async () => {
    if (!input) return;
    
    const novaObjava = Keypair.generate();

    try {
      console.log(currentUser);
      await contract.methods.addPost(input)
        .accounts({
          post: novaObjava.publicKey,
          user: currentUser,
          author: contract.provider.wallet.publicKey,
        })
        .signers([novaObjava])
        .rpc();
    } catch (e) {
      console.log(e);
    }

    setInput('');
    await getPosts();
  }

  const doesUserExist = async (contract) => {
    let userExists = false;
    const accounts = await contract.account.user.all();

    accounts.forEach(element => {
      if(JSON.stringify(element.account.creator) === JSON.stringify(selectedWallet.publicKey)) {
        userExists = true;
        setCurrentUser(element.publicKey);
      }
    });
    return userExists;
  }

  if (!isConnected) 
  {
    return (
      <div>
        <h1 style={{textAlign: 'center'}}>SOLANA BLOGCHAIN</h1>
        <p style={{textAlign: 'center'}}>Please connect your Phantom Wallet to continue:</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop:'20px' }}>
          <button onClick={connectWallet}>CONNECT WALLET</button>
        </div>
      </div>
    )
  } 
  else if(showTextarea)
  {
    return (
      <div className='sign-up-panel'>
        <p style={{textAlign: 'center'}}>Please pick a username:</p> <br />
        <textarea
          id='username' 
          type="text"
          placeholder="Username"
          onChange={e => setUsername(e.target.value)}
          rows="8" cols="50"
        /> 
        <button onClick={createUser}>SIGN UP</button> 
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
                <button onClick={addPost}>OBJAVI</button>
              </div>
            )
          }
          {
            dataList.map(objava => 
            <Objava author={objava.account.author.toBase58()} 
                    pubkey={objava.publicKey}
                    content={objava.account.content} 
                    timestamp={new Date(objava.account.timestamp * 1000).toLocaleString()}
                    contract = {contract} 
                    username = {objava.account.username}
                    getPosts = {getPosts}
                    />)
          }
        </div>
      </div>
    );
  }
}

export default App;  
import { useEffect, useState } from 'react';
import './FeedComponent.css';
import PostComponent from '../PostComponent/PostComponent';

export default function FeedComponent(props) {

    let currentUser = props.currentUser;
    let contract = props.contract;
    let isMod = props.isMod;
    let Keypair = props.Keypair;

    const [username, setUsername] = useState('');
    const [foreignAddress, setForeignAddress] = useState('');
    const [input, setInput] = useState('');
    const [posts, setPosts] = useState([]);

    const addPost = async () => {
        if (!input) return;

        const novaObjava = Keypair.generate();
    
        try {
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

    const getPosts = async () => {
      try {
          const fetchedPosts = await contract.account.post.all();
          setPosts(orderPosts(fetchedPosts));
      } catch (e) {
          console.log(e);
      }
    }

    const orderPosts = (posts) => {
        return posts.slice().sort((a, b) => b['account']['timestamp'] - a['account']['timestamp']);
    }

    useEffect(() => {
      getPosts();
    }, [])

    return( 
        <div>
            <textarea 
                type="text"
                placeholder="Insert new post"
                onChange={e => setInput(e.target.value)}
                value={input}
                rows="8" cols="50"
            />
            <br/>
            <button onClick={addPost}>POST</button> <br/>
            {
            posts.map(objava =>
                <PostComponent      key={objava['publicKey']}
                                    author={objava['account']['username']}
                                    authorKey={objava['account']['author']}
                                    pubkey={objava['publicKey']}
                                    content={objava['account']['content'] } 
                                    timestamp={new Date(objava['account']['timestamp'] * 1000).toLocaleString()}
                                    setProfileView={props.setProfileView}
                                    setForeignAddress={setForeignAddress}
                                    setUsername={setUsername}
                                    isMod={isMod}
                                    contract={contract}
                                    currentUser={currentUser}
                                    isProfile={false}
                                    getPosts={getPosts}
                />)
            }
        </div>)
}
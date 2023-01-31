import { useEffect, useState } from 'react';
import * as anchor from '@project-serum/anchor';
import './ForeignProfileComponent.css';
import PostComponent from '../PostComponent/PostComponent';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
//import { FriendRequest } from '../FriendRequestComponent/FriendRequestComponent';

const { SystemProgram, Keypair } = web3;

export default function ForeignProfileComponent(props) {

    let currentUser = props.currentUser;
    let username = props.username;
    let foreignAddress = props.foreignAddress;
    let contract = props.contract;
    let isMod = props.isMod;
    let posts = props.posts;

    const [messageContent, setMessageContent] = useState('');
    const [isFriend, setIsFriend] = useState(false);
    const [friends, setFriends] = useState([]);
    const [requestSent, setRequestSent] = useState(false);
    const [requestSentCurrentUser, setRequestSentCurrentUser] = useState(false);

    /*async removeFriend() {
        try {    
            const user = await this.contract.removeFriend(this.foreignAddress);
            this.setState({isFriend: false});
        } catch(e) {
            console.log(e);
        }
    }

    */

    const sendFriendRequest = async () => {
        try {
            const [newFriendRequest] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('friends'),
                    foreignAddress.toBuffer(),
                ],
                contract.programId
            )

            await contract.methods.sendFriendRequest()
                .accounts({
                    friends: newFriendRequest,
                    requester: currentUser,
                    author: contract.provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId
                })
                .rpc();
        } catch (e) {
            console.log(e);
        }
    }
    
    /*
    async requestSent() {
        try {
            const requests = await this.contract.getFriendRequests(this.foreignAddress);
            const requestSent = requests.filter(request => request['pubkey'].toLowerCase() === this.currentUser.toLowerCase()).length === 1;

            const requestsCurrentUser = await this.contract.getFriendRequests(this.currentUser);
            const requestSentCurrentUser = requestsCurrentUser.filter(request => request['pubkey'].toLowerCase() === this.foreignAddress.toLowerCase()).length === 1;
            this.setState({
                requestSent: requestSent,
                requestSentCurrentUser: requestSentCurrentUser
            })
        } catch (e) {
            console.log(e);
        }
    }

    async getFriends() {
        try {
            const user = await this.contract.getUser(this.foreignAddress);
            this.setState({friends: user['friends']});
        } catch (error) {
            console.log(error);            
        }
    }

    async isFriend() {
        try {
            const user = await this.contract.getUser(this.foreignAddress);
            const isFriend = user['friends'].filter(friend => friend['pubkey'].toLowerCase() === this.currentUser.toLowerCase()).length === 1;
            this.setState({isFriend: isFriend});
        } catch (error) {
            console.log(error);            
        }
    }*/

    const filterPosts = () => {
        posts = posts.filter(post => JSON.stringify(post['account']['author']) === JSON.stringify(foreignAddress));
    }
    filterPosts();

    return (
        <div className='profile'>
            <div className='profile-info'>
                <div className='user-info'>
                    <h2>{username}</h2>
                    <h2>{JSON.stringify(foreignAddress)}</h2>
                </div>
                
                    <div className='friend-requests'>
                        <button onClick={sendFriendRequest}>SEND FRIEND REQUEST</button>
                    </div>
            </div>
            {posts.length === 0 ?
                <div className='no-posts'> 
                    <h2 id='posts-title'>POSTS</h2> 
                    <p>{username} has no posts to display.</p> 
                </div> : 
                <div className='posts'>
                    <h2>POSTS</h2>
                    {
                    posts.map(objava =>
                        <PostComponent    key={objava['publicKey']}
                                            author={objava['account']['username']}
                                            authorKey={objava['account']['author']}
                                            pubkey={objava['publicKey']}
                                            content={objava['account']['content'] } 
                                            timestamp={new Date(objava['account']['timestamp'] * 1000).toLocaleString()}
                                            contract={contract}
                                            currentUser={currentUser}
                                            isProfile={true}
                        />)
                    }
                </div>
            }
        </div>)
}
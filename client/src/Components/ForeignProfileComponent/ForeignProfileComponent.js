import { useEffect, useState } from 'react';
import * as anchor from '@project-serum/anchor';
import './ForeignProfileComponent.css';
import PostComponent from '../PostComponent/PostComponent';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import FriendRequest from '../FriendRequestComponent/FriendRequestComponent';

const { SystemProgram, Keypair } = web3;

export default function ForeignProfileComponent(props) {

    let currentUser = props.currentUser;
    let username = props.username;
    let foreignAddress = props.foreignAddress;
    let contract = props.contract;
    let isMod = props.isMod;
    let posts = props.posts;
    let getPosts = props.getPosts;

    const [messageContent, setMessageContent] = useState('');
    const [isFriend, setIsFriend] = useState(false);
    const [friends, setFriends] = useState([]);
    const [requestSent, setRequestSent] = useState(false);
    const [requestSentCurrentUser, setRequestSentCurrentUser] = useState(false);

    const removeFriend = async () => {
        try {    

            const [friends1] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('friends'),
                    currentUser.toBuffer(),
                ],
                contract.programId
            )

            let [friends2] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('friends'),
                    foreignAddress.toBuffer(),
                ],
                contract.programId
            )

            await contract.methods.removeFriend()
                .accounts({
                    friends1: friends1,
                    friends2: friends2,
                    formerFriend1: currentUser,
                    formerFriend2: foreignAddress,
                    author: contract.provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId
                })
                .rpc();

            setIsFriend(false);
        } catch(e) {
            console.log(e);
        }
    }

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
    
    
    const getFriendsInfo = async () => {
        try {
            const [friends1] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('friends'),
                    currentUser.toBuffer(),
                ],
                contract.programId
            )

            let [friends2] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('friends'),
                    foreignAddress.toBuffer(),
                ],
                contract.programId
            )

            const friendInfoCurrentUser = await contract.account.friends.fetch(friends1);
            const requestSentCurrentUser = friendInfoCurrentUser['requests'].filter(request => JSON.stringify(request) === JSON.stringify(foreignAddress)).length === 1;

            const friendInfo = await contract.account.friends.fetch(friends2);
            const requestSent = friendInfo['requests'].filter(request => JSON.stringify(request) === JSON.stringify(currentUser)).length === 1;
            const isFriend = friendInfo['friends'].filter(friend => JSON.stringify(friend) === JSON.stringify(currentUser)).length === 1;

            let friends = [];

            for (const friend of friendInfo['friends']) {
                const user = await contract.account.user.fetch(friend);
                friends.push({
                    name: user.name,
                    address: friend
                });
            }

            setFriends(friends);
            setRequestSent(requestSent);
            setRequestSentCurrentUser(requestSentCurrentUser);
            setIsFriend(isFriend);
        } catch (e) {
            console.log(e);
        }
    }

    /*

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
            
            this.setState({isFriend: isFriend});
        } catch (error) {
            console.log(error);            
        }
    }*/

    const filterPosts = () => {
        posts = posts.filter(post => JSON.stringify(post['account']['author']) === JSON.stringify(foreignAddress));
    }
    filterPosts();

    useEffect(() => {
        getFriendsInfo();
    })

    console.log(friends);
    return (
        <div className='profile'>
            <div className='profile-info'>
                <div className='user-info'>
                    <h2>{username}</h2>
                    <h2>{JSON.stringify(foreignAddress).substring(1, JSON.stringify(currentUser).length-1)}</h2>
                    {
                        isFriend ? <button onClick={removeFriend}>REMOVE FRIEND</button> : <div />
                    }
                </div>
                {isFriend ?
                        <div className='friend-requests'>
                            <h2>FRIENDS</h2>
                            { friends.length > 0 ?
                                friends.map(friend => 
                                    <button onClick={() => props.setProfileView(friend['address'], friend['name'])} key={friend['address']}>{friend['name']}</button>
                                ) : <p id='no-friends'>You don't have any friends.</p>
                            }
                        </div> : 
                    <div className='friend-requests'>
                        {
                            requestSentCurrentUser ?
                                <div>
                                    <h2>You have a pending friend request from {username}</h2>
                                    <FriendRequest  foreignProfile={true} 
                                                    contract={contract} 
                                                    name={username} 
                                                    address={foreignAddress}
                                                    currentUser={currentUser}
                                    />
                                </div> : !requestSent ?
                                <div>
                                    <h2>You need to be friends with {username} to see their friends.</h2>
                                    <button onClick={(sendFriendRequest)}>SEND FRIEND REQUEST</button>
                                </div> : 
                                <div>
                                    <h2>Friend request has been sent.</h2>
                                </div>
                        }
                    </div>
                }
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
                        <PostComponent      key={objava['publicKey']}
                                            author={objava['account']['username']}
                                            authorKey={objava['account']['author']}
                                            pubkey={objava['publicKey']}
                                            content={objava['account']['content'] } 
                                            timestamp={new Date(objava['account']['timestamp'] * 1000).toLocaleString()}
                                            contract={contract}
                                            currentUser={currentUser}
                                            isProfile={true}
                                            getPosts={getPosts}
                        />)
                    }
                </div>
            }
        </div>)
}
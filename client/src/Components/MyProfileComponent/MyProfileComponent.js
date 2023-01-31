import { Component, useEffect, useState } from 'react';
import './MyProfileComponent.css';
import PostComponent from '../PostComponent/PostComponent';
import * as anchor from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import FriendRequest from '../FriendRequestComponent/FriendRequestComponent';

export default function MyProfileComponent(props) {

    let currentUser = props.currentUser;
    let contract = props.contract;
    let posts = props.posts;
    let setProfileView = props.setProfileView;

    const [username, setUsername] = useState('');
    const [friendRequests, setrFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);

    const getFriendsData = async () => {
        try {
            const requests = [];
            const friends = [];

            const [friendsAddress] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('friends'),
                    currentUser.toBuffer(),
                ],
                contract.programId
            )

            const friendsData = await contract.account.friends.fetch(friendsAddress);

            for (const friendRequest of friendsData['requests']) {
                const user = await contract.account.user.fetch(friendRequest);
                requests.push({
                    name: user.name,
                    address: friendRequest
                });
            }

            for (const friend of friendsData['friends']) {
                const user = await contract.account.user.fetch(friend);
                friends.push({
                    name: user.name,
                    address: friend
                });
            }

            setrFriendRequests(requests);
            setFriends(friends);
        } catch (e) {
            console.log(e);
        }
    }

    const filterPosts = () => {
        posts = posts.filter(post => JSON.stringify(post['account']['author']) === JSON.stringify(currentUser));
    }

    filterPosts();

    useEffect(() => {
        getFriendsData();
    }, []);

    return (
        <div className='profile'>
            <div className='profile-info'>
                <div className='user-info'>
                    <h2>{JSON.stringify(currentUser)}</h2>
                </div>
                <div className='friend-requests'>
                    <h2>FRIEND REQUESTS</h2>
                    { friendRequests.length > 0 ?
                        friendRequests.map(friendRequest => 
                            <FriendRequest  key={friendRequest['address']}
                                            contract={contract} 
                                            name={friendRequest['name']} 
                                            address={friendRequest['address']}
                                            setForeignProfileView={props.setProfileView}
                                            currentUser={currentUser}
                                            foreignProfile={false}
                            />) : <p id='no-friends'>You don't have any friend requests at this moment.</p>
                    }
                </div>
                <div className='friend-requests'>
                    <h2>FRIENDS</h2>
                    { friends.length > 0 ?
                        friends.map(friend => 
                            <button onClick={() => props.setProfileView(friend['address'], friend['name'])} key={friend['address']}>{friend['name']}</button>
                        ) : <p id='no-friends'>You don't have any friends.</p>
                    }
                </div>   
            </div>
            {posts.length === 0 ?
                <div className='no-posts'> 
                    <h2 id='posts-title'>POSTS</h2> 
                    <p>You have no posts to display.</p> 
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
                        />)
                    }
                </div>
            }
        </div>)
}
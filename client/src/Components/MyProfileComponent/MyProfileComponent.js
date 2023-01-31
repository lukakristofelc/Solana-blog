import { Component, useEffect, useState } from 'react';
import './MyProfileComponent.css';
import PostComponent from '../PostComponent/PostComponent';
import * as anchor from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import FriendRequest from '../FriendRequestComponent/FriendRequestComponent';

export default function MyProfileComponent(props) {

    let currentUser = props.currentUser;
    let contract = props.contract;
    let setProfileView = props.setProfileView;
    let isMod = props.isMod;
    let username = props.username;

    const [friendRequests, setFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [posts, setPosts] = useState([]);

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

            setFriendRequests(requests);
            setFriends(friends);
        } catch (e) {
            console.log(e);
        }
    }

    const getPosts = async () => {
        try {
            const fetchedPosts = await contract.account.post.all();
            setPosts(filterPosts(orderPosts(fetchedPosts)));
        } catch (e) {
            console.log(e);
        }
    }

    const orderPosts = (posts) => {
        return posts.slice().sort((a, b) => b['account']['timestamp'] - a['account']['timestamp']);
    }

    const filterPosts = (posts) => {
        return posts.filter(post => JSON.stringify(post['account']['author']) === JSON.stringify(currentUser));
    }

    useEffect(() => {
        getFriendsData();
    }, [friendRequests, friends]);

    useEffect(() => {
        getPosts();
    }, [])

    console.log(posts);

    return (
        <div className='profile'>
            <div className='profile-info'>
                <div className='user-info'>
                    <h2>{username}</h2>
                    <h2>{JSON.stringify(currentUser).substring(1, JSON.stringify(currentUser).length-1)}</h2>
                </div>
                <div className='friend-requests'>
                    <h2>FRIEND REQUESTS</h2>
                    { friendRequests.length > 0 ?
                        friendRequests.map(friendRequest => 
                            <FriendRequest  key={friendRequest['address']}
                                            contract={contract} 
                                            name={friendRequest['name']} 
                                            address={friendRequest['address']}
                                            setProfileView={setProfileView}
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
                                            isMod={isMod}
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
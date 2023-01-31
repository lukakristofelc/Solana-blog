import { useEffect, useState } from 'react';
import './ChatListComponent.css';
import ChatComponent from '../ChatComponent/ChatComponent';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

export default function ChatListComponent(props) {

    let currentUser = props.currentUser;
    let contract = props.contract;
    
    const [friends, setFriends] = useState([]);
    const [currentChatAddress, setCurrentChatAddress] = useState('');
    const [name, setName] = useState('');
          
    const getFriendsData = async () => {
        try {
            const friends = [];

            const [friendsAddress] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('friends'),
                    currentUser.toBuffer(),
                ],
                contract.programId
            )

            const friendsData = await contract.account.friends.fetch(friendsAddress);

            for (const friend of friendsData['friends']) {
                const user = await contract.account.user.fetch(friend);
                friends.push({
                    name: user.name,
                    address: friend
                });
            }

            setFriends(friends);
        } catch (e) {
            console.log(e);
        }
    }

    useEffect(() => {
        getFriendsData();
    }, [])

    if (friends.length == 0)
    {
        return(
            <div className='chat-selection'>
                <div className='chat-list'>
                    <h2>You need friends in order to message them.</h2>
                </div>
            </div>
        );
    }
    else
    {
        return(
        <div className='chat-selection'>
            <div className='chat-list'>
                <h2>SELECT A FRIEND</h2>
                {friends.map(friend => <button key={friend['publicKey']} onClick={() => setCurrentChatAddress({currentChatAddress: friend['address'], name: friend['name']})}>{friend['name']}</button>)}
            </div>
            {currentChatAddress != "" ? 
                <ChatComponent
                    setProfileView={props.setProfileView}
                    currentUser={currentUser}
                    key={currentChatAddress} 
                    contract={contract} 
                    currentChatAddress={currentChatAddress}
                    closeChat={() => setCurrentChatAddress('')}
                /> : <div />}
        </div>
        )
    }
}
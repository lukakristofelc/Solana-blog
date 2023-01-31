import { useState, useEffect } from 'react';
import './ChatComponent.css';
import { PublicKey } from '@solana/web3.js';
import { web3, BN } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
const { SystemProgram } = web3;

export default function ChatComponent(props) {
    
    let contract = props.contract;
    let closeChat = props.closeChat;
    let currentUser = props.currentUser;
    let name = props.name;
    let currentChatAddress = props.currentChatAddress.currentChatAddress;

    const [chat, setChat] = useState([]);
    const [chatAccount, setChatAccount] = useState([]);
    const [input, setInput] = useState('');

    const [currentUsername, setCurrentUsername] = useState('');
    const [chatterUsername, setChatterUsername] = useState('');

    const sendMessage = async () => {
        if(input == "") {
            alert("Cannot send empty message");
            return;
        }

        try {
            const [messageAddress] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('message'),
                    chatAccount.chatAddress.toBuffer(),
                    new BN(chatAccount.messageCount).toArrayLike(Buffer, "be", 8),
                ],
                contract.programId
            )

            await contract.methods.sendMessage(input)
                .accounts({
                    message: messageAddress,
                    chat: chatAccount.chatAddress,
                    from: currentUser,
                    to: currentChatAddress,
                    author: contract.provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId
                })
                .rpc();
            getChatAccount();
            setInput('');
        } catch (error) {
            console.log(error);
        }
    }

    const getMessages = async () => {
        let messages = [];

        for (let i = 0; i < chatAccount.messageCount; i++)
        {
            const [messageAddress] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('message'),
                    chatAccount.chatAddress.toBuffer(),
                    new BN(i).toArrayLike(Buffer, "be", 8),
                ],
                contract.programId
            )
            let message = await contract.account.message.fetch(messageAddress);
            messages.push(message);
        }
        
        let reversedChat = [... messages].reverse();
        setChat(reversedChat);
    }

    const getChatAccount = async() => {
        try {
            let user1 = currentChatAddress;
            let user2 = currentUser;
            
            if (user2 < user1)
            {
                let swap = user1;
                user1 = user2;
                user2 = swap;
            }

            const [chatAddress] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('chat'),
                    user1.toBuffer(),
                    user2.toBuffer(),
                ],
                contract.programId
            )

            let chat = await contract.provider.connection.getAccountInfo(chatAddress);

            const currentUsername = await contract.account.user.fetch(currentUser);
            const chatterUsername = await contract.account.user.fetch(currentChatAddress);

            console.log(currentUsername)

            setCurrentUsername(currentUsername.name);
            setChatterUsername(chatterUsername.name);
            
            if (chat === null)
            {
                await contract.methods.createChat()
                .accounts({
                    chat: chatAddress,
                    user1: user1,
                    user2: user2,
                    author: contract.provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId
                })
                .rpc();
            }
            
            chat = await contract.account.chat.fetch(chatAddress);
            setChatAccount(chat);
        } catch (error) {
            console.log(error);
        }
    }

    const getUsername = (from) => {
        if (JSON.stringify(currentUser) === JSON.stringify(from))
        {
            return currentUsername;
        }
        else
        {
            return chatterUsername;
        }
    }

    useEffect(() => {
        getChatAccount();
    }, []);

    useEffect(() => {
        getMessages();
    }, [chatAccount]);

    return(
        <div className='composer'>
            <div className="close-button">
                <button onClick={() => props.setProfileView(currentChatAddress, name)}>VISIT PROFILE</button>
                <button onClick={closeChat}>CLOSE CHAT</button>
            </div>
            <div className="message-composer">
                <div className="messages">
                    {chat.map(message => <p key={message['timestamp']}><span id='sender_name'>{getUsername(message['from'])+": "}</span><br/>{message['content']}</p>)}
                </div>  
                <textarea 
                        type="text"
                        id='message_input'
                        placeholder="Insert new message"
                        onChange={e => setInput(e.target.value)}
                        value={input}
                        rows="8" cols="50"
                    />
                <button id='message_send' onClick={sendMessage}>SEND</button>
            </div>
        </div>
    )
    
}
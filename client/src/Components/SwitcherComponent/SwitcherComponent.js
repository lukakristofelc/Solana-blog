import { useState, useEffect } from 'react';
import './SwitcherComponent.css';
import FeedComponent from '../FeedComponent/FeedComponent';
import ChatListComponent from '../ChatListComponent/ChatListComponent';
import MyProfileComponent from '../MyProfileComponent/MyProfileComponent';
import ForeignProfileComponent from '../ForeignProfileComponent/ForeignProfileComponent';

export default function SwitcherComponent(props) {
    
        let currentUser = props.currentUser;
        let isMod = props.isMod;
        let contract = props.contract;
        let Keypair = props.Keypair;
        let posts = props.posts;
        let getPosts = props.getPosts;

        const [view, setView] = useState('F');
        const [profileData, setProfileData] = useState({});

    const setFeedView = () => {
        setView('F');
    }

    const setMessageView = () => {
        setView('M');
    }

    const setMyProfileView = () => {
        setView('P');
    }

    const setProfileView = (foreignAddress, username) => {
        if (JSON.stringify(foreignAddress) === JSON.stringify(currentUser))
        {
            setMyProfileView();
            return;
        }

        const profileData = {
            foreignAddress: foreignAddress,
            username: username
        }

        setView('FP');
        setProfileData(profileData);
    }

    /*async getFriendRequests() {
        try {
            const friendRequests = await this.contract.getFriendRequests(this.currentUser);
            this.setState({numOfFriendRequests: friendRequests.length});
        } catch (e) {
            console.log(e);
        }
    }*/

    //this.getFriendRequests();
    return (
        <div>
            <div className='header'>
                <h1>SOLANA BLOGCHAIN</h1>
                <div className="buttons">
                    <button onClick={setFeedView}>FEED</button>
                    <button onClick={setMessageView}>MESSAGES</button>
                    <button onClick={setMyProfileView}>MY PROFILE</button>
                </div>
            </div>
            {   view === 'F' ? <FeedComponent currentUser={currentUser} contract={contract} setMessageView={setMessageView} setProfileView={setProfileView} isMod={isMod} Keypair={Keypair} posts={posts} getPosts={getPosts}/> :
                view === 'M' ? <ChatListComponent setProfileView={setProfileView} currentUser={currentUser} contract={contract}/> :
                view === 'P' ? <MyProfileComponent  currentUser={currentUser} contract={contract} setProfileView={setProfileView} posts={posts} /> :
                view === 'FP' ? <ForeignProfileComponent key={profileData.foreignAddress} setProfileView={setProfileView} foreignAddress={profileData.foreignAddress} username={profileData.username} currentUser={currentUser} contract={contract} posts={posts} isMod={isMod} /> : <div/>
            }
        </div>
    )
}
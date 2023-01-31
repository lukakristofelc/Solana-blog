import React, { Component } from 'react';
import './FriendRequestComponent.css';
import * as anchor from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
const { SystemProgram, Keypair } = web3;

export default function FriendRequest(props) {

    let contract = props.contract;
    let name = props.name;
    let address = props.address;
    let foreignProfile = props.foreignProfile;
    let currentUser = props.currentUser;

    const goToProfile = () => {
        props.setProfileView(address, name);
    }

    const acceptRequest = async () => {
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
                    address.toBuffer(),
                ],
                contract.programId
            )

            await contract.methods.handleFriendRequest(true)
                .accounts({
                    friends1: friends1,
                    friends2: friends2,
                    requester: address,
                    potentialFriend: currentUser, 
                    author: contract.provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId
                })
                .rpc();
                
        } catch (e) {
            console.log(e);
        }
    }

    const declineRequest = async () => {
        try {
            const [friends] = await PublicKey.findProgramAddress(
                [
                    anchor.utils.bytes.utf8.encode('friends'),
                    currentUser.toBuffer(),
                ],
                contract.programId
            )

            await contract.methods.handleFriendRequest(false)
                .accounts({
                    friends: friends,
                    requester: address,
                    author: contract.provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId
                })
                .rpc();
        } catch (e) {
            console.log(e);
        }
    }


    return (
        <div>
            {!foreignProfile ? <button onClick={goToProfile}>{name}</button> : <div/>}
            <button onClick={acceptRequest}>ACCEPT</button>
            <button onClick={declineRequest}>DECILNE</button>
        </div>
    )
}
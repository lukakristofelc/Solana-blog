import React, { Component } from 'react';
import './PostComponent.css';

export default function PostComponent(props) {

  let author = props.author;
  let authorKey = props.authorKey;
  let content = props.content;
  let timestamp = props.timestamp;
  let isMod = props.isMod;
  let contract = props.contract;
  let currentUser = props.currentUser;
  let isProfile = props.isProfile;
  let pubkey = props.pubkey;
  let getPosts = props.getPosts;

  const deletePost = async () => {
    await contract.methods.deletePost()
      .accounts({
        post: pubkey,
        author: contract.provider.wallet.publicKey,
      })
      .rpc();
      await getPosts();
  }

  const showProfile = () => {
    props.setProfileView(authorKey, author);
    props.setForeignAddress(authorKey);
    props.setUsername(author);
  }

  return (
    <div className='objava'>
    <div className="objava-content">
      {!isProfile ? <button className='author' onClick={showProfile}>{author}</button> : <div/>}
      <div className='vsebina'>{content}</div>
      <div className='timestamp'>{timestamp}</div>
      {isMod ? <button onClick={deletePost}>DELETE</button> : JSON.stringify(authorKey) === JSON.stringify(currentUser) ? <button onClick={deletePost}>DELETE</button> : <div/>}
    </div>
  </div>
  )
}
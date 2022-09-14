import { Connection, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider } from '@project-serum/anchor';

import idl from './idl.json';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { Component } from 'react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

const programID = new PublicKey(idl.metadata.address);

function InitWorkspace(wallet) {
    const connection = new Connection('http://127.0.0.1:8899');
    const provider = new AnchorProvider(connection, wallet);
    const program = new Program(idl, programID, provider);

    return {
        wallet,
        connection,
        provider,
        program
    }
}
export class Workspace extends Component {

    constructor(wallet)
    {
        const workspace = InitWorkspace(wallet);
        return workspace;
    }
}
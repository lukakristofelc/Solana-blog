use anchor_lang::prelude::*;

declare_id!("35AsEX1LkmsL96t7X91JYiw7cv7TtgEqybMvFwv5qpfn");

#[program]
pub mod solana_blog {
    use super::*;

    pub fn add_post(ctx: Context<AddPost>, content: String) 
    -> Result<()> {
        let post: &mut Account<Post> = &mut ctx.accounts.post;
        let user: &mut Account<User> = &mut ctx.accounts.user;

        post.author = user.key();
        post.username = (*user.name).to_string();
        post.content = content;
        post.timestamp = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }

    pub fn delete_post(_ctx: Context<DeletePost>) 
    -> Result<()> {
       Ok(())
    }

    pub fn create_user(ctx: Context<CreateUser>, username: String, creator: Pubkey, is_mod: bool) 
    -> Result<()> {
        let user: &mut Account<User> = &mut ctx.accounts.user;

        user.name = username;
        user.creator = creator;
        user.is_mod = is_mod;

        Ok(())
    }

    pub fn send_friend_request(ctx: Context<SendFriendRequest>) 
    -> Result<()> {
        let friends: &mut Account<Friends> = &mut ctx.accounts.friends;
        let requester: &mut Account<User> = &mut ctx.accounts.requester;

        friends.requests.push(requester.key());

        Ok(())
    }

    pub fn handle_friend_request(ctx: Context<HandleFriendRequest>, accepted: bool) 
    -> Result<()> {
        let friends1: &mut Account<Friends> = &mut ctx.accounts.friends1;
        let requester: &mut Account<User> = &mut ctx.accounts.requester;

        let friends2: &mut Account<Friends> = &mut ctx.accounts.friends2;
        let potential_friend: &mut Account<User> = &mut ctx.accounts.potential_friend;

        if accepted {
            friends1.friends.push(requester.key());
            friends2.friends.push(potential_friend.key());
            
            let index = friends1.requests.iter().position(|x| *x == requester.key()).unwrap();
            friends1.requests.remove(index);
        } else {
            let index = friends1.requests.iter().position(|x| *x == requester.key()).unwrap();
            friends1.requests.remove(index);
        }

        Ok(())
    }

    pub fn remove_friend(ctx: Context<RemoveFriend>) 
    -> Result<()> {
        let friends1: &mut Account<Friends> = &mut ctx.accounts.friends1;
        let former_friend1: &mut Account<User> = &mut ctx.accounts.former_friend1;
        let friends2: &mut Account<Friends> = &mut ctx.accounts.friends2;
        let former_friend2: &mut Account<User> = &mut ctx.accounts.former_friend2;

        friends1.friends.retain(|value| *value != former_friend2.key());
        friends2.friends.retain(|value| *value != former_friend1.key());
        Ok(())
    }

    pub fn create_chat(ctx: Context<CreateChat>) 
    -> Result<()> {
        let chat: &mut Account<Chat> = &mut ctx.accounts.chat;

        chat.chat_address = chat.key();
        chat.message_count = 0;
        Ok(())
    }

    pub fn send_message(ctx: Context<SendMessage>, content: String) 
    -> Result<()> {
        let chat: &mut Account<Chat> = &mut ctx.accounts.chat;
        let message: &mut Account<Message> = &mut ctx.accounts.message;
        let from: &mut Account<User> = &mut ctx.accounts.from;
        let to: &mut Account<User> = &mut ctx.accounts.to;
       
        chat.message_count = chat.message_count + 1;

        message.from = from.key();
        message.to = to.key();
        message.content = content;
        message.timestamp = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct AddPost<'info> {
    #[account(init, payer = author, space = 2000)]
    pub post: Account<'info, Post>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeletePost<'info> {
    #[account(mut, close = author)]
    pub post: Account<'info, Post>,
    pub author: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(init, payer = author, space = 2000)]
    pub user: Account<'info, User>,
    #[account(init, payer = author, space = 2000, seeds = [b"friends", user.key().as_ref()], bump)]
    pub friends: Account<'info, Friends>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SendFriendRequest<'info> {
    #[account(mut)]
    pub friends: Account<'info, Friends>,
    #[account(mut)]
    pub requester: Account<'info, User>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct HandleFriendRequest<'info> {
    #[account(mut)]
    pub friends1: Account<'info, Friends>,
    #[account(mut)]
    pub friends2: Account<'info, Friends>,
    #[account(mut)]
    pub requester: Account<'info, User>,
    #[account(mut)]
    pub potential_friend: Account<'info, User>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveFriend<'info> {
    #[account(mut)]
    pub friends1: Account<'info, Friends>,
    #[account(mut)]
    pub friends2: Account<'info, Friends>,
    #[account(mut)]
    pub former_friend1: Account<'info, User>,
    #[account(mut)]
    pub former_friend2: Account<'info, User>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateChat<'info> {
    #[account(init, payer=author, seeds = [b"chat", user1.key().as_ref(), user2.key().as_ref()], bump, space = 2000)]
    pub chat: Account<'info, Chat>,
    #[account(mut)]
    pub user1: Account<'info, User>,
    #[account(mut)]
    pub user2: Account<'info, User>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SendMessage<'info> {
    #[account(init, payer=author, seeds = [b"message", chat.key().as_ref(), chat.message_count.to_be_bytes().as_ref()], bump, space = 2000)]
    pub message: Account<'info, Message>,
    #[account(mut)]
    pub chat: Account<'info, Chat>,
    #[account(mut)]
    pub from: Account<'info, User>,
    #[account(mut)]
    pub to: Account<'info, User>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Post {
    pub username: String,
    pub author: Pubkey,
    pub content: String,
    pub timestamp: i64
}

#[account]
pub struct User {
    pub name: String,
    pub creator: Pubkey,
    pub is_mod: bool
}

#[account]
pub struct Friends {
    pub requests: Vec<Pubkey>,
    pub friends: Vec<Pubkey>
}

#[account]
pub struct Chat {
    pub chat_address: Pubkey,
    pub message_count: i64
}

#[account]
pub struct Message {
    pub from: Pubkey,
    pub to: Pubkey,
    pub content: String,
    pub timestamp: i64
}

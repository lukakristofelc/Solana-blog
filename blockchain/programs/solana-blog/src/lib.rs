use anchor_lang::prelude::*;

declare_id!("35AsEX1LkmsL96t7X91JYiw7cv7TtgEqybMvFwv5qpfn");

#[program]
pub mod solana_blog {
    use super::*;

    pub fn objavi_objavo(ctx: Context<ObjaviObjavo>, vsebina: String) 
    -> Result<()> {
        let objava: &mut Account<Objava> = &mut ctx.accounts.objava;
        let avtor: &Signer = &ctx.accounts.avtor;

        objava.avtor = *avtor.key;
        objava.vsebina = vsebina;
        objava.timestamp = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ObjaviObjavo<'info> {
    #[account(init, payer = avtor, space = 2000)]
    pub objava: Account<'info, Objava>,
    #[account(mut)]
    pub avtor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Objava {
    pub avtor: Pubkey,
    pub vsebina: String,
    pub timestamp: i64
}
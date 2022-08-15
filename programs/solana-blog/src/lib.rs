use anchor_lang::prelude::*;

declare_id!("3LAQqBgaMeYuBZ9PXKm9LJ3KaV3GR2JKtRbv1gdUfd1T");

#[program]
pub mod solana_blog {
    use super::*;

    pub fn objavi_objavo(ctx: Context<ObjaviObjavo>, vsebina: String) 
    -> Result<()> {
        let objava: &mut Account<Objava> = &mut ctx.accounts.objava;
        let avtor: &Signer = &ctx.accounts.avtor;

        if vsebina.chars().count() > 300 {
           return Err(error!(ErrorCode::ContentTooLong));
        }

        objava.avtor = *avtor.key;
        objava.vsebina = vsebina;
        objava.timestamp = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ObjaviObjavo<'info> {
    #[account(init, payer = avtor, space = Objava::LENGTH)]
    pub objava: Account<'info, Objava>,
    #[account(mut)]
    pub avtor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const VSEBINA_LENGTH: usize = 4;
const VSEBINA_MAX_LENGTH: usize = 300 * 4;

#[account]
pub struct Objava {
    pub avtor: Pubkey,
    pub vsebina: String,
    pub timestamp: i64
}

impl Objava {
    const LENGTH: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH
        + TIMESTAMP_LENGTH
        + VSEBINA_LENGTH + VSEBINA_MAX_LENGTH;
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}
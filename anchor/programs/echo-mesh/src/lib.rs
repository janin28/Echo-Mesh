use anchor_lang::prelude::*;

declare_id!("GtUgs8UkoT4LUVdARY7HNrzFx83QXFou5mL4cknDHSgc"); // This is the user's wallet, placeholder for program ID
// TODO: Replace with actual program ID after 'anchor build'


#[program]
pub mod echo_mesh {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("EchoMesh Program Initialized");
        Ok(())
    }

    pub fn settle_session(
        ctx: Context<SettleSession>,
        session_id: String,
        amount: u64,
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;
        session.id = session_id;
        session.amount = amount;
        session.settled = true;
        session.authority = *ctx.accounts.authority.key;
        
        msg!("Session {} settled with {} units", session.id, amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
#[instruction(session_id: String)]
pub struct SettleSession<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 64 + 8 + 1,
        seeds = [b"session", session_id.as_bytes()],
        bump
    )]
    pub session: Account<'info, SessionState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct SessionState {
    pub id: String,
    pub amount: u64,
    pub settled: bool,
    pub authority: Pubkey,
}

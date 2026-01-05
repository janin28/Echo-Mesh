use anchor_lang::prelude::*;

declare_id!("7CYDijxZh9A5wAbSZHdknTmpzw84p6zEz1BdNvrd5SXL");

#[program]
pub mod echo_mesh {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

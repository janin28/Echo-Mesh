# Solana Integration & Anchor Setup

## Wallet Configuration
- **Network**: Solana Devnet
- **Wallet Address**: `GtUgs8UkoT4LUVdARY7HNrzFx83QXFou5mL4cknDHSgc`
- **RPC URL**: `https://solana-devnet.core.chainstack.com/a7a8e0df62f2a5c5ff7239ca353df02e`

## Anchor Program
The EchoMesh program is located in `anchor/programs/echo-mesh`.

### Core Functions
- `initialize`: Sets up the program state.
- `settle_session`: Records a settled session and its payout on-chain.

### Deployment Instructions
1. Ensure the Solana CLI is installed and configured to devnet.
2. Fund your deployment wallet.
3. Run `anchor build` to generate the program binary and IDL.
4. Update the `declare_id!` in `lib.rs` and `Anchor.toml` with the generated program ID.
5. Run `anchor deploy`.

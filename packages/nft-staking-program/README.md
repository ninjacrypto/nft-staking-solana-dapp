# Monkettes NFT Staking

## Scripts

### `yarn admin`

```json
{
  "cluster": "devnet", // devnet | mainnet-beta
  "keypair": "./devnet-wallet.json", // path to admin keypair
  "maxNumNftMints": 10, // maximum number of NFTs that will be validated against, this number cannot be changed
  "rewardDuration": 31536000, // how long the rewards are paid out for ???,
  "rewardMint": "DgNPX1ESu2G3Hrjex9jB8FtC8gv4ZA5uZWsLCnn4rbe3", // the token mint used when paying rewards
  "preview": false // run script in preview mode
}
```

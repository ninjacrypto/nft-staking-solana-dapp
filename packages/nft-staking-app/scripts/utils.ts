import { PublicKey } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor"
import NftStakingIdl from "./nft_staking.json"

const PROGRAM_NFT_STAKING = new PublicKey(NftStakingIdl.metadata.address)

export const REWARD_TOKEN_ACCOUNT = new PublicKey(
  "GTcQd2tXUg8ShRcpowVoffcCjn44dJpvUUcKMhczhTZZ"
)

export const PREFIX = "nft_staking"
export const PREFIX_USER = "nft_staking_user"
export const PREFIX_MINT = "nft_staking_mint"

export const generateUuid = (): string => {
  return anchor.web3.Keypair.generate().publicKey.toBase58().slice(0, 6)
}

const configAccountPair: [PublicKey, string] = [
  new PublicKey("hPSepkvUwsJRPxtMGrmVdzAJQd8Xg3Re5QrjqJNtk61"),
  "3j5btb",
]

export const getConfigAccount = async (
  authority: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, string]> => {
  // if (configAccountPair) {
  //   return configAccountPair
  // }
  let configUuid = generateUuid()

  let configAccount = await PublicKey.createWithSeed(
    authority,
    configUuid,
    PROGRAM_NFT_STAKING
  )

  while (PublicKey.isOnCurve(configAccount.toBuffer())) {
    configUuid = generateUuid()
    configAccount = await PublicKey.createWithSeed(
      authority,
      configUuid,
      PROGRAM_NFT_STAKING
    )
  }

  return [configAccount, configUuid]
}

export const getPoolAccount = async (
  authority: anchor.web3.PublicKey,
  configPubKey: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(PREFIX)),
      authority.toBuffer(),
      configPubKey.toBuffer(),
    ],
    PROGRAM_NFT_STAKING
  )
}

export const getRewardAccount = async (
  authority: anchor.web3.PublicKey,
  poolAccount: anchor.web3.PublicKey,
  rewardMintId: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(PREFIX)),
      poolAccount.toBuffer(),
      authority.toBuffer(),
      rewardMintId.toBuffer(),
    ],
    PROGRAM_NFT_STAKING
  )
}

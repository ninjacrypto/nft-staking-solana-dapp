import _ from "lodash"
import { PublicKey, Keypair } from "@solana/web3.js"
import { utils } from "@project-serum/anchor"

const SEED_USER = "nft_staking_user"
const SEED_MINT = "nft_staking_mint"

export const generateUuid = (): string => {
  return Keypair.generate().publicKey.toBase58().slice(0, 6)
}

export const getUserAddress = async (
  poolPublicKey: PublicKey,
  walletPublicKey: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from(utils.bytes.utf8.encode(SEED_USER)),
      poolPublicKey.toBuffer(),
      walletPublicKey.toBuffer(),
    ],
    programId
  )
}

export const getMintStakeAddress = async (
  poolPublicKey: PublicKey,
  userPublicKey: PublicKey,
  uuid: string,
  programId: PublicKey
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from(utils.bytes.utf8.encode(SEED_MINT)),
      poolPublicKey.toBuffer(),
      userPublicKey.toBuffer(),
      Buffer.from(uuid),
    ],
    programId
  )
}

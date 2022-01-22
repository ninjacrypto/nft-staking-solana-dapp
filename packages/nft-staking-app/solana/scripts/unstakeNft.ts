import _ from "lodash"
import {
  PublicKey,
  Transaction,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js"
import {
  getUserAddress,
  generateUuid,
  getMintStakeAddress,
} from "../seedAddresses"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import BN from "bn.js"
import { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"
import { getClusterConstants } from "../../constants"

const unstakeNft = async (
  anchorAccountsCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  poolNftAccount: PublicKey
) => {
  if (!anchorAccountsCache.isEnabled) {
    throw new Error("Accounts cache not initialized")
  }
  const { nftStakingProgram } = anchorAccountsCache
  const { ADDRESS_STAKING_POOL } = getClusterConstants("ADDRESS_STAKING_POOL")

  const pool = await anchorAccountsCache.fetch("pool", ADDRESS_STAKING_POOL)
  if (!pool) {
    throw new Error("pool not found")
  }

  const [userAddress] = await getUserAddress(
    ADDRESS_STAKING_POOL,
    walletPublicKey,
    nftStakingProgram.programId
  )
  const userAccount = await anchorAccountsCache.fetch("user", userAddress)
  if (!userAccount) {
    throw new Error("user not found")
  }

  const mintStakedUuid = generateUuid()
  const [userMintStakedAccount, userMintStakedBump] = await getMintStakeAddress(
    ADDRESS_STAKING_POOL,
    userAddress,
    mintStakedUuid,
    nftStakingProgram.programId
  )

  return nftStakingProgram.rpc.unstake(userMintStakedBump, mintStakedUuid, {
    accounts: {
      staker: walletPublicKey,
      poolAccount: ADDRESS_STAKING_POOL,
      config: pool.data.config,
      authority: pool.data.authority,
      userAccount: userAddress,
      unstakeFromAccount: poolNftAccount,
      mintStaked: userMintStakedAccount,
      currentMintStaked: userAccount.data.mintStaked,
      rent: SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    },
  })
}

export default unstakeNft

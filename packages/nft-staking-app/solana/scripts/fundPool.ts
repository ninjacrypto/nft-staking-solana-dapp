import { PublicKey } from "@solana/web3.js"
import { Program, BN } from "@project-serum/anchor"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"
import { toRawAmount } from "../tokenConversion"

const fundPool = async (
  anchorAccountCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey,
  poolAccount: PublicKey,
  configAccount: PublicKey,
  rewardVault: PublicKey,
  funderVault: PublicKey,
  amount: number
) => {
  if (!anchorAccountCache.isEnabled) {
    throw new Error("App not connected")
  }

  const poolAccountInfo = await anchorAccountCache.fetch("pool", poolAccount)
  if (!poolAccountInfo) {
    throw new Error(`poolAccount not found: ${poolAccount.toString()}`)
  }

  const mint = await anchorAccountCache.fetch(
    "hMint",
    poolAccountInfo.data.rewardMint,
    true
  )
  if (!mint) {
    throw new Error(
      `mint not found: ${poolAccountInfo.data.rewardMint.toString()}`
    )
  }

  const rawAmount = toRawAmount(mint?.data.decimals, amount)
  return await anchorAccountCache.nftStakingProgram.rpc.fund(rawAmount, {
    accounts: {
      funder: walletPublicKey,
      poolAccount: poolAccount,
      rewardVault: rewardVault,
      funderVault: funderVault,
      authority: poolAccountInfo.data.authority,
      tokenProgram: TOKEN_PROGRAM_ID,
      config: configAccount,
    },
  })
}

export default fundPool

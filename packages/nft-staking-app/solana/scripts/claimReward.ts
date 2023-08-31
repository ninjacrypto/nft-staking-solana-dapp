import _ from "lodash"
import { Connection, Keypair, PublicKey, Transaction, clusterApiUrl, sendAndConfirmRawTransaction } from "@solana/web3.js"
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { IAnchorAccountCacheContext } from "../../contexts/AnchorAccountsCacheProvider"
import { getClusterConstants } from "../../constants"
import { getUserAddress } from "../seedAddresses"
import { getProvider } from "@project-serum/anchor"

const claimReward = async (
  anchorAccountsCache: IAnchorAccountCacheContext,
  walletPublicKey: PublicKey
) => {
  if (!anchorAccountsCache.isEnabled) {
    throw new Error("App is not connected")
  }
  const { ADDRESS_STAKING_POOL } = getClusterConstants("ADDRESS_STAKING_POOL")
  const poolAccount = await anchorAccountsCache.fetch(
    "pool",
    ADDRESS_STAKING_POOL
  )
  if (!poolAccount) {
    throw new Error("poolAccount not found")
  }
  console.log(poolAccount.publicKey.toString())
  const [userAddress] = await getUserAddress(
    ADDRESS_STAKING_POOL,
    walletPublicKey,
    anchorAccountsCache.nftStakingProgram.programId
  )
  
  const tokenAccounts = await anchorAccountsCache.fetchTokenAccountsByOwner(
    walletPublicKey
  )

  const tokenAccount = _.find(
    tokenAccounts,
    (tokenAccount) =>
      tokenAccount.data.mint === poolAccount.data.rewardMint.toString()
  )

  console.log(tokenAccount?.publicKey.toString())

  let rewardAccount: PublicKey
  let tx = new Transaction()
  if (tokenAccount) {
    rewardAccount = tokenAccount.publicKey
  } else {
    rewardAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      poolAccount.data.rewardMint,
      walletPublicKey
    )
    tx.add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        poolAccount.data.rewardMint,
        rewardAccount,
        walletPublicKey,
        walletPublicKey
      )
    )
  }

  tx.add(
    anchorAccountsCache.nftStakingProgram.instruction.claim({
      accounts: {
        user: walletPublicKey,
        poolAccount: ADDRESS_STAKING_POOL,
        authority: poolAccount.data.authority,
        rewardVault: poolAccount.data.rewardVault,
        userAccount: userAddress,
        rewardToAccount: rewardAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    }),    
  )

  // tx.recentBlockhash =  (await anchorAccountsCache.nftStakingProgram.provider.connection.getRecentBlockhash("finalized")).blockhash;
  // tx.feePayer = new PublicKey(walletPublicKey);

  // const signedTx = await anchorAccountsCache.nftStakingProgram.provider.wallet.signTransaction(tx)
  // console.log(anchorAccountsCache.nftStakingProgram.provider, tx);

  
  const opts = {
    preflightCommitment: "recent",
    commitment: "recent",
  };

  tx.feePayer = anchorAccountsCache.nftStakingProgram.provider.wallet.publicKey;
  tx.recentBlockhash = (
    await anchorAccountsCache.nftStakingProgram.provider.connection.getRecentBlockhash("recent")
  ).blockhash;

  const signedTx = await anchorAccountsCache.nftStakingProgram.provider.wallet.signTransaction(tx);
  
  const rawTx = signedTx.serialize();

  const txId = await sendAndConfirmRawTransaction(
    anchorAccountsCache.nftStakingProgram.provider.connection,
    rawTx,
  );

  return txId;

  // return await anchorAccountsCache.nftStakingProgram.provider.send(tx)
}

export default claimReward

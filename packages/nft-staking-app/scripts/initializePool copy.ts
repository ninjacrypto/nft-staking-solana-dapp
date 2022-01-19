// import _ from "lodash"
// import fs from "fs"
// import { Provider, Wallet, Program, BN } from "@project-serum/anchor"
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
// import {
//   Connection,
//   clusterApiUrl,
//   Keypair,
//   PublicKey,
//   SystemProgram,
//   SYSVAR_RENT_PUBKEY,
// } from "@solana/web3.js"
// import NftStakingIdl from "./nft_staking.json"
// import config from "./scriptConfig.json"
// import * as utils from "./utils"
// import scriptRunner from "./scriptRunner"

// const PROGRAM_NFT_STAKING = new PublicKey(NftStakingIdl.metadata.address)

// interface Config {
//   cluster: "devnet" | "mainnet-beta"
//   keypair: string
//   maxNumNftMints: number
//   rewardDuration: number
//   rewardMint: string
//   preview: boolean
//   validNftMints: string[]
// }

// const validateConfig = (value: any): value is Readonly<Config> => {
//   const invalidKeyMap: string[] = []
//   if (!_.includes(["devnet", "mainnet-beta"], value.cluster)) {
//     invalidKeyMap.push("cluster")
//   }
//   if (typeof value["preview"] !== "boolean") {
//     invalidKeyMap.push("preview")
//   }
//   if (typeof value["maxNumNftMints"] !== "number") {
//     invalidKeyMap.push("maxNumNftMints")
//   }
//   if (!_.isArray(value["validNftMints"])) {
//     invalidKeyMap.push("validNftMints")
//   }
//   _.forEach(["keypair"], (key) => {
//     if (typeof value[key] !== "string") {
//       invalidKeyMap.push(key)
//     }
//   })
//   if (_.isEmpty(invalidKeyMap)) {
//     return true
//   }
//   console.log(`Invalid keys: ${_.join(invalidKeyMap, ", ")}`)
//   return false
// }

// const loadKeypair = (keypairPath: string) => {
//   let keypair: Keypair
//   try {
//     const rawSecretKey = fs.readFileSync(keypairPath)
//     const parsedSecretKey = new Uint8Array(JSON.parse(rawSecretKey.toString()))
//     keypair = Keypair.fromSecretKey(parsedSecretKey)
//   } catch (err) {
//     console.log(err)
//     throw new Error("Failed to load keypair")
//   }
//   return keypair
// }

// const getOrCreatePool = async (
//   nftStakingProgram: Program,
//   scriptConfig: Config,
//   configAccount: PublicKey,
//   configUuid: string,
//   poolAccount: PublicKey,
//   poolBump: number,
//   rewardAccount: PublicKey,
//   rewardBump: number
// ): Promise<any> => {
//   const { maxNumNftMints, rewardDuration, rewardMint } = scriptConfig

//   const configSpace =
//     8 + // discriminator
//     32 + // authority
//     4 +
//     6 + // uuid + u32 le
//     4 + // num_mint
//     4 + // u32 len for Vec<Pubkey>
//     32 * maxNumNftMints

//   console.log("configSpace", configSpace)

//   const authorityPublicKey = nftStakingProgram.provider.wallet.publicKey

//   try {
//     const poolAccountInfo = await nftStakingProgram.account.pool.fetch(
//       poolAccount
//     )
//     console.log("Pool found")
//     return poolAccountInfo
//   } catch (err) {
//     console.log("Pool not found")
//   }

//   console.log("Initializing pool...")

//   const txSig = await nftStakingProgram.rpc.initializePool(
//     poolBump,
//     configUuid,
//     new BN(maxNumNftMints),
//     rewardBump,
//     new BN(rewardDuration),
//     {
//       accounts: {
//         authority: authorityPublicKey,
//         poolAccount: poolAccount,
//         config: configAccount,
//         rewardMint: new PublicKey(rewardMint),
//         rewardVault: rewardAccount,
//         rent: SYSVAR_RENT_PUBKEY,
//         tokenProgram: TOKEN_PROGRAM_ID,
//         systemProgram: SystemProgram.programId,
//       },
//       instructions: [
//         SystemProgram.createAccountWithSeed({
//           fromPubkey: authorityPublicKey,
//           newAccountPubkey: configAccount,
//           basePubkey: authorityPublicKey,
//           seed: configUuid,
//           lamports:
//             await nftStakingProgram.provider.connection.getMinimumBalanceForRentExemption(
//               configSpace
//             ),
//           space: configSpace,
//           programId: PROGRAM_NFT_STAKING,
//         }),
//       ],
//     }
//   )
//   console.log("Pool ready")
//   await nftStakingProgram.provider.connection.confirmTransaction(
//     txSig,
//     "finalized"
//   )

//   const poolAccountInfo = await nftStakingProgram.account.pool.fetch(
//     poolAccount
//   )
//   return poolAccountInfo
// }

// const addMintAddresses = async (
//   nftStakingProgram: Program,
//   scriptConfig: Config,
//   poolAccount: PublicKey,
//   configAccount: PublicKey
// ) => {
//   const mintAddresses = new Array(10000).fill(scriptConfig.validNftMints[0])
//   const authorityPublicKey = nftStakingProgram.provider.wallet.publicKey

//   const configAccountInfo = await nftStakingProgram.account.config.fetch(
//     configAccount
//   )

//   let batchSize = 20
//   if (mintAddresses.length < batchSize) {
//     console.log("adding mintAddress:", mintAddresses)
//     await nftStakingProgram.rpc.addMintAddresses(
//       mintAddresses.map((element) => new PublicKey(element)),
//       0,
//       {
//         accounts: {
//           authority: authorityPublicKey,
//           poolAccount: poolAccount,
//           config: configAccount,
//         },
//       }
//     )
//   } else {
//     let start = 0
//     do {
//       let mintAddressesBatch = mintAddresses.slice(start, start + batchSize)
//       console.log("adding mintAddress:", mintAddressesBatch)
//       await nftStakingProgram.rpc.addMintAddresses(
//         mintAddressesBatch.map((element) => new PublicKey(element)),
//         start,
//         {
//           accounts: {
//             authority: authorityPublicKey,
//             poolAccount: poolAccount,
//             config: configAccount,
//           },
//         }
//       )
//       start = start + batchSize
//     } while (start < mintAddresses.length)
//   }
// }

// const resumePool = async (
//   nftStakingProgram: Program,
//   poolAccount: PublicKey
// ) => {
//   const authorityPublicKey = nftStakingProgram.provider.wallet.publicKey
//   console.log("Resuming pool...")
//   return await nftStakingProgram.rpc.resume({
//     accounts: {
//       authority: authorityPublicKey, // owner wallet
//       poolAccount: poolAccount, // Pool Account
//     },
//   })
// }

// const fund = async (
//   nftStakingProgram: Program,
//   poolAccount: PublicKey,
//   configAccount: PublicKey,
//   rewardVault: PublicKey,
//   funderVault: PublicKey,
//   amount: number
// ) => {
//   const authorityPublicKey = nftStakingProgram.provider.wallet.publicKey
//   console.log("Funding reward pool...")
//   return await nftStakingProgram.rpc.fund(new BN(amount), {
//     accounts: {
//       funder: authorityPublicKey,
//       poolAccount: poolAccount,
//       rewardVault: rewardVault,
//       funderVault: funderVault,
//       authority: authorityPublicKey,
//       tokenProgram: TOKEN_PROGRAM_ID,
//       config: configAccount,
//     },
//   })
// }

// const getOrCreatePool = () => {}

// const main = async () => {
//   if (!validateConfig(config)) {
//     throw new Error("Config is invalid")
//   }
//   const connection = new Connection(clusterApiUrl(config.cluster))
//   const keypair = loadKeypair(config.keypair)
//   const wallet = new Wallet(keypair)
//   console.log(`Using wallet: ${wallet.publicKey.toString()}`)

//   const provider = new Provider(connection, wallet, {
//     preflightCommitment: "recent",
//     commitment: "recent",
//   })
//   const nftStakingProgram = await Program.at(PROGRAM_NFT_STAKING, provider)
//   console.log(`NFT Staking Program: ${PROGRAM_NFT_STAKING.toString()}`)

//   let [configAccount, configUuid] = await utils.getConfigAccount(
//     wallet.publicKey
//   )
//   console.log("configAccount", configAccount.toString())
//   console.log("configUuid", configUuid)
//   let [poolAccount, poolBump] = await utils.getPoolAccount(
//     wallet.publicKey,
//     configAccount
//   )
//   console.log("poolAccount", poolAccount.toString())
//   let [rewardAccount, rewardBump] = await utils.getRewardAccount(
//     wallet.publicKey,
//     poolAccount,
//     new PublicKey(config.rewardMint)
//   )
//   console.log("rewardAccount", rewardAccount.toString())

//   let poolAccountInfo = await getOrCreatePool(
//     nftStakingProgram,
//     config,
//     configAccount,
//     configUuid,
//     poolAccount,
//     poolBump,
//     rewardAccount,
//     rewardBump
//   )
//   console.log("poolAccountInfo", poolAccountInfo)

//   await addMintAddresses(nftStakingProgram, config, poolAccount, configAccount)

//   // await resumePool(nftStakingProgram, poolAccount)

//   // poolAccountInfo = await nftStakingProgram.account.pool.fetch(poolAccount)
//   // console.log("poolAccountInfo", poolAccountInfo)
//   // console.log("lastUpdateTime", poolAccountInfo.lastUpdateTime.toNumber())
//   // console.log(
//   //   "rewardRatePerToken",
//   //   poolAccountInfo.rewardRatePerToken.toNumber()
//   // )
//   // console.log("rewardDuration", poolAccountInfo.rewardDuration.toNumber())
//   // console.log("rewardDurationEnd", poolAccountInfo.rewardDuration.toNumber())

//   // await fund(
//   //   nftStakingProgram,
//   //   poolAccount,
//   //   configAccount,
//   //   poolAccountInfo.rewardVault,
//   //   utils.REWARD_TOKEN_ACCOUNT,
//   //   5_000_000_000_000_000
//   // )

//   // poolAccountInfo = await nftStakingProgram.account.pool.fetch(poolAccount)
//   // console.log("poolAccountInfo", poolAccountInfo)
//   // console.log("lastUpdateTime", poolAccountInfo.lastUpdateTime.toNumber())
//   // console.log(
//   //   "rewardRatePerToken",
//   //   poolAccountInfo.rewardRatePerToken.toNumber()
//   // )
//   // console.log("rewardDuration", poolAccountInfo.rewardDuration.toNumber())
//   // console.log("rewardDurationEnd", poolAccountInfo.rewardDuration.toNumber())

//   console.log("Process complete")
// }

// scriptRunner(main)

export default {}

import _ from "lodash"
import fs from "fs"
import { Provider, Wallet, Program } from "@project-serum/anchor"
import { Connection, clusterApiUrl, Keypair, PublicKey } from "@solana/web3.js"
import NftStakingIdl from "./nft_staking.json"
import scriptConfig from "./scriptConfig.json"

const PROGRAM_NFT_STAKING = new PublicKey(NftStakingIdl.metadata.address)

interface Config {
  cluster: "devnet" | "mainnet-beta"
  keypair: string
  maxNumNftMints: number
  rewardDuration: number
  rewardMint: string
  preview: boolean
  validNftMints: string[]
}

export interface ScriptRunnerArgs {
  connection: Connection
  keypair: Keypair
  wallet: Wallet
  provider: Provider
  program: Program
  scriptConfig: Config
  args: Record<string, string>
}

const validateConfig = (value: any): value is Readonly<Config> => {
  const invalidKeyMap: string[] = []
  if (!_.includes(["devnet", "mainnet-beta"], value.cluster)) {
    invalidKeyMap.push("cluster")
  }
  if (typeof value["preview"] !== "boolean") {
    invalidKeyMap.push("preview")
  }
  if (typeof value["maxNumNftMints"] !== "number") {
    invalidKeyMap.push("maxNumNftMints")
  }
  if (!_.isArray(value["validNftMints"])) {
    invalidKeyMap.push("validNftMints")
  }
  _.forEach(["keypair"], (key) => {
    if (typeof value[key] !== "string") {
      invalidKeyMap.push(key)
    }
  })
  if (_.isEmpty(invalidKeyMap)) {
    return true
  }
  console.log(`Invalid keys: ${_.join(invalidKeyMap, ", ")}`)
  return false
}

const loadKeypair = (keypairPath: string) => {
  let keypair: Keypair
  try {
    const rawSecretKey = fs.readFileSync(keypairPath)
    const parsedSecretKey = new Uint8Array(JSON.parse(rawSecretKey.toString()))
    keypair = Keypair.fromSecretKey(parsedSecretKey)
  } catch (err) {
    console.log(err)
    throw new Error("Failed to load keypair")
  }
  return keypair
}

const parseArgs = (args: string[]) => {
  return _.reduce(
    args,
    (accum, value) => {
      if (_.startsWith(value, "--")) {
        let [argKey, argValue] = _.split(value, "=")
        argKey = argKey.slice(2)
        accum[argKey] = argValue
      }
      return accum
    },
    {}
  )
}

const scriptRunner = async (
  script: ({
    connection,
    keypair,
    wallet,
    provider,
    program,
  }: ScriptRunnerArgs) => Promise<void>
) => {
  if (!validateConfig(scriptConfig)) {
    throw new Error("Config is invalid")
  }
  const args = parseArgs(process.argv)
  const connection = new Connection(clusterApiUrl(scriptConfig.cluster))
  const keypair = loadKeypair(scriptConfig.keypair)
  const wallet = new Wallet(keypair)
  console.log(`Using wallet: ${wallet.publicKey.toString()}`)

  const provider = new Provider(connection, wallet, {
    preflightCommitment: "recent",
    commitment: "recent",
  })
  const nftStakingProgram = await Program.at(PROGRAM_NFT_STAKING, provider)
  console.log(`NFT Staking Program: ${PROGRAM_NFT_STAKING.toString()}`)

  await script({
    connection,
    keypair,
    wallet,
    provider,
    program: nftStakingProgram,
    scriptConfig,
    args,
  })

  console.log("Process complete")
}

export default scriptRunner

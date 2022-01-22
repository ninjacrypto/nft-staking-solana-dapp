import _ from "lodash"
import { PublicKey } from "@solana/web3.js"
import { Program, BN } from "@project-serum/anchor"
import { BaseAnchorAccount, BaseAnchorAccountManager } from "./baseAnchor"

export const AccountType = "pool"

export interface PoolAccount {
  isInitialized: boolean
  paused: boolean
  userCount: number
  tokenStakeCount: number
  lastUpdateTime: BN
  rewardRatePerToken: BN
  rewardDuration: BN
  rewardDurationEnd: BN
  authority: PublicKey
  config: PublicKey
  rewardMint: PublicKey
  rewardVault: PublicKey
  funders: PublicKey[]
}

export class Pool extends BaseAnchorAccount<PoolAccount> {}

export class PoolManager extends BaseAnchorAccountManager<PoolAccount, Pool> {
  constructor(program: Program) {
    super(program, AccountType)
  }

  isValid = (entity: any): entity is Pool => {
    return (
      entity instanceof Pool &&
      typeof entity.data.isInitialized === "boolean" &&
      typeof entity.data.paused === "boolean" &&
      typeof entity.data.userCount === "number" &&
      typeof entity.data.tokenStakeCount === "number" &&
      BN.isBN(entity.data.lastUpdateTime) &&
      BN.isBN(entity.data.rewardRatePerToken) &&
      BN.isBN(entity.data.rewardDuration) &&
      BN.isBN(entity.data.rewardDurationEnd) &&
      _.isArray(entity.data.funders)
    )
  }

  toDomain = async (account: any, publicKey: PublicKey) => {
    const accountData = { ...account }
    return new Pool(publicKey, accountData)
  }
}

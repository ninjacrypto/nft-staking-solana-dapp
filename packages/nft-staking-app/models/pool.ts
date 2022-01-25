import _ from "lodash"
import { PublicKey } from "@solana/web3.js"
import { Program, BN } from "@project-serum/anchor"
import { BaseAnchorAccount, BaseAnchorAccountManager } from "./baseAnchor"

const U64_MAX = new BN("18446744073709551615")
const SEC_PER_WEEK = new BN("604800")

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

export class Pool extends BaseAnchorAccount<PoolAccount> {
  get rewardEndDisplay() {
    const rewardDurationEndNum = this.data.rewardDurationEnd.toNumber()
    if (rewardDurationEndNum === 0) {
      return ""
    }
    return new Date(rewardDurationEndNum * 1000).toLocaleDateString()
  }

  getFundAmount = (
    amountPerWeek: number,
    decimals: number,
    numMints: number
  ) => {
    if (amountPerWeek === 0) {
      return new BN(0)
    }
    const now = new BN(Date.now() / 1000)
    let leftover = new BN(0)
    if (now.lt(this.data.rewardDurationEnd)) {
      const remainingDuration = this.data.rewardDurationEnd.sub(now)
      leftover = this.data.rewardRatePerToken
        .mul(remainingDuration)
        .mul(new BN(numMints))
        .div(U64_MAX)
    }
    const fundAmount = new BN(10 ** decimals * amountPerWeek)
      .mul(this.data.rewardDuration)
      .mul(new BN(numMints))
      .div(SEC_PER_WEEK)
      .sub(leftover)

    return fundAmount
  }

  getFundAmountDisplay = (
    amountPerWeek: number,
    decimals: number,
    numMints: number
  ) => {
    const fundAmount = this.getFundAmount(amountPerWeek, decimals, numMints)
    const denominator = new BN(10).pow(new BN(decimals))
    return fundAmount.div(denominator)
  }
}

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

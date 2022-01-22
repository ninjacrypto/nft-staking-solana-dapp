import * as Pool from "./pool"
import * as HToken from "./tokenAccount"
import * as HMint from "./mint"
import * as MetaplexMetadata from "./metadata"
import * as User from "./user"

export const AccountMap = {
  [Pool.AccountType]: Pool,
  [HToken.AccountType]: HToken,
  [HMint.AccountType]: HMint,
  [MetaplexMetadata.AccountType]: MetaplexMetadata,
  [User.AccountType]: User,
}

export type TAccountMap = {
  [Pool.AccountType]: Pool.Pool
  [HToken.AccountType]: HToken.HToken
  [HMint.AccountType]: HMint.HMint
  [MetaplexMetadata.AccountType]: MetaplexMetadata.MetaplexMetadata
  [User.AccountType]: User.User
}

export type AccountTypes = keyof typeof AccountMap

export type SpecificAccountType<T extends AccountTypes> = TAccountMap[T]

export type SpecificAccountTypeMap<T extends AccountTypes> = {
  [key: string]: SpecificAccountType<T> | undefined
}

export type FilteredSpecificAccountTypeMap<T extends AccountTypes> = {
  [key: string]: SpecificAccountType<T>
}

export { Pool, HToken, HMint, MetaplexMetadata, User }

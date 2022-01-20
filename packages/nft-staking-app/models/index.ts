import * as Pool from "./pool"
import * as HToken from "./tokenAccount"
import * as HMint from "./mint"

export const AccountMap = {
  [Pool.AccountType]: Pool,
  [HToken.AccountType]: HToken,
  [HMint.AccountType]: HMint,
}

export type AccountTypes = keyof typeof AccountMap

export { Pool, HToken, HMint }

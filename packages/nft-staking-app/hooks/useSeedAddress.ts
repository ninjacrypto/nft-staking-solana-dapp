import _ from "lodash"
import { useState, useMemo, useEffect } from "react"
import { PublicKey } from "@solana/web3.js"
import { FilteredSpecificAccountTypeMap } from "../models"
import { programs } from "@metaplex/js"

const {
  metadata: { Metadata },
} = programs

type MaybePublicKey = PublicKey | undefined

export const useMetaplexMetadataAddresses = (
  nftAccounts?: FilteredSpecificAccountTypeMap<"hTokenAccount">
) => {
  const [seedAddresses, setSeedAddresses] = useState<
    { [key: string]: PublicKey } | undefined
  >()

  useEffect(() => {
    if (!nftAccounts) {
      setSeedAddresses(undefined)
      return
    }
    ;(async function () {
      const metadataPublicKeysList = await Promise.all(
        _.map(nftAccounts, async (nftAccount) => {
          const mintPublicKey = new PublicKey(nftAccount.data.mint)
          const metadataPublicKey = await Metadata.getPDA(
            mintPublicKey.toString()
          )
          return [nftAccount.publicKey, metadataPublicKey]
        })
      )
      const metadataPublicKeys = _.reduce(
        metadataPublicKeysList,
        (accum: { [key: string]: PublicKey }, value) => {
          const [nftAccountPublicKey, metadataPublicKey] = value
          accum[nftAccountPublicKey.toString()] = metadataPublicKey
          return accum
        },
        {}
      )
      setSeedAddresses(metadataPublicKeys)
    })()
  }, [_.size(nftAccounts)])
  return seedAddresses
}

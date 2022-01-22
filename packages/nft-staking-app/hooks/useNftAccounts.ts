import _ from "lodash"
import axios from "axios"
import { useContext, useEffect, useMemo, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { HToken } from "../models/tokenAccount"
import { MetaplexMetadata } from "../models/metadata"
import scriptConfig from "../scripts/scriptConfig.json"
import { AnchorAccountCacheContext } from "../contexts/AnchorAccountsCacheProvider"
import { useAccounts } from "./useAccounts"
import { useMetaplexMetadataAddresses } from "./useSeedAddress"

export const useNftAccounts = (ownerPublicKey: PublicKey | undefined) => {
  const anchorAccountCache = useContext(AnchorAccountCacheContext)
  const [tokenAccounts, setTokenAccounts] = useState<
    Record<string, HToken> | undefined
  >()

  useEffect(() => {
    if (!anchorAccountCache.isEnabled || !ownerPublicKey) {
      return
    }
    ;(async function () {
      const tokenAccounts = await anchorAccountCache.fetchTokenAccountsByOwner(
        ownerPublicKey
      )
      setTokenAccounts(tokenAccounts)
    })()
  }, [anchorAccountCache.isEnabled, ownerPublicKey?.toString()])

  return useMemo(() => {
    if (!tokenAccounts || _.isEmpty(tokenAccounts)) {
      return undefined
    }
    return _.reduce(
      tokenAccounts,
      (accum: Record<string, HToken>, tokenAccount) => {
        if (tokenAccount.data.amount === 1) {
          accum[tokenAccount.publicKey.toString()] = tokenAccount
        }
        return accum
      },
      {}
    )
  }, [tokenAccounts])
}

export type MonketteAccount = [MetaplexMetadata, any, string]

export const useMonketteAccounts = (ownerPublicKey: PublicKey | undefined) => {
  const { validNftMints } = scriptConfig
  const nftAccounts = useNftAccounts(ownerPublicKey)

  const monketteAccounts = useMemo(() => {
    if (!nftAccounts || _.isEmpty(validNftMints)) {
      return undefined
    }

    const validMintSet = new Set(validNftMints)
    return _.pickBy(nftAccounts, (nftAccount) =>
      validMintSet.has(nftAccount.data.mint)
    )
  }, [nftAccounts, validNftMints])

  const metadataAddresses = useMetaplexMetadataAddresses(monketteAccounts)
  const [metaplexMetadatas] = useAccounts(
    "metaplexMetadata",
    _.values(metadataAddresses),
    {
      useCache: true,
    }
  )

  const [monketteData, setMonketteData] = useState<
    { [key: string]: MonketteAccount } | undefined
  >()

  useEffect(() => {
    if (
      !metadataAddresses ||
      !metaplexMetadatas ||
      _.isEmpty(metaplexMetadatas)
    ) {
      return
    }
    ;(async function () {
      const fetchResults = await Promise.all(
        _.map(
          metadataAddresses,
          async function (
            metadataAddress: PublicKey,
            tokenAccountAddress: string
          ): Promise<[string, any, string]> {
            const metadata = metaplexMetadatas[metadataAddress.toString()]
            const { data } = await axios.get(metadata.data.data.uri)
            return [metadata.publicKey.toString(), data, tokenAccountAddress]
          }
        )
      )
      const fetchedMonketteData = _.reduce(
        fetchResults,
        (
          accum: { [key: string]: MonketteAccount },
          [key, data, tokenAccountAddress]
        ) => {
          accum[key] = [metaplexMetadatas[key], data, tokenAccountAddress]
          return accum
        },
        {}
      )
      setMonketteData(fetchedMonketteData)
    })()
  }, [_.size(metadataAddresses), _.size(metaplexMetadatas)])

  return monketteData
}

import _ from "lodash"
import { Heading, Image, Text } from "@chakra-ui/react"
import { PublicKey } from "@solana/web3.js"
import { Center, VStack, StackDivider, Box } from "@chakra-ui/layout"
import { useMonketteAccounts, MonketteAccount } from "../hooks/useNftAccounts"
import useWalletPublicKey from "../hooks/useWalletPublicKey"
import StakingModal from "../components/StakingModal"
import { useState } from "react"
import { MetaplexMetadata } from "../models/metadata"
import useTxCallback from "../hooks/useTxCallback"
import { useCallback } from "react"
import { useAnchorAccountCache } from "../contexts/AnchorAccountsCacheProvider"
import stakeNft from "../solana/scripts/stakeNft"

const ManagePoolPage = () => {
  const walletPublicKey = useWalletPublicKey()
  const anchorAccountCache = useAnchorAccountCache()
  const monketteAccounts = useMonketteAccounts(walletPublicKey)

  const [selectedMonkette, setSelectedMonkette] = useState<
    MonketteAccount | undefined
  >()

  const _stakeNftClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !walletPublicKey ||
      !selectedMonkette
    ) {
      throw new Error("Invalid data")
    }

    await stakeNft(
      anchorAccountCache,
      walletPublicKey,
      new PublicKey(selectedMonkette[2])
    )
    setSelectedMonkette(undefined)
  }, [
    anchorAccountCache.isEnabled,
    walletPublicKey?.toString(),
    selectedMonkette,
  ])

  const stakeNftClickHandler = useTxCallback(_stakeNftClickHandler, {
    info: "Stake NFT...",
    success: "NFT Staked!",
    error: "Transaction failed",
  })

  return (
    <Box>
      <StakingModal
        isOpen={!!selectedMonkette}
        selectedMonkette={selectedMonkette}
        onClose={setSelectedMonkette.bind(null, undefined)}
        onSubmit={stakeNftClickHandler}
      />
      <VStack w="full" spacing={16} textAlign="center">
        <Heading>Monkette Staking!</Heading>
        <VStack>
          <Heading size={"md"}>My Monkettes</Heading>
          <Text>(Click to stake)</Text>
        </VStack>
        {monketteAccounts && (
          <Center w="120" flexWrap={"wrap"}>
            {_.map(monketteAccounts, (monketteAccount, key) => {
              return (
                <Box
                  key={key}
                  m="4"
                  cursor="pointer"
                  onClick={setSelectedMonkette.bind(null, monketteAccount)}
                >
                  <Image
                    alt="selected nft"
                    w="36"
                    objectFit="cover"
                    boxShadow="md"
                    borderRadius="lg"
                    src={monketteAccount[1].image}
                  />
                </Box>
              )
            })}
          </Center>
        )}
      </VStack>
    </Box>
  )
}

export default ManagePoolPage

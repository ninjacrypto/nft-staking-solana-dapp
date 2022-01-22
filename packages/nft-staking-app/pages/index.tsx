import _ from "lodash"
import { Button, Heading, Image, Text, Flex } from "@chakra-ui/react"
import { PublicKey } from "@solana/web3.js"
import { Center, VStack, HStack, StackDivider, Box } from "@chakra-ui/layout"
import { useMonketteAccounts, MonketteAccount } from "../hooks/useNftAccounts"
import useWalletPublicKey from "../hooks/useWalletPublicKey"
import StakingModal from "../components/StakingModal"
import { useEffect, useState } from "react"
import { MetaplexMetadata } from "../models/metadata"
import useTxCallback from "../hooks/useTxCallback"
import { useCallback } from "react"
import { useAnchorAccountCache } from "../contexts/AnchorAccountsCacheProvider"
import stakeNft from "../solana/scripts/stakeNft"
import claimReward from "../solana/scripts/claimReward"
import { useUserAccountAddress } from "../hooks/useSeedAddress"
import { useAccount } from "../hooks/useAccounts"
import { getClusterConstants } from "../constants"

enum PAGE_TABS {
  MY_MONKETTES,
  STAKED_MONKETTES,
  CLAIM_VIBE,
}

const ManagePoolPage = () => {
  const walletPublicKey = useWalletPublicKey()
  const anchorAccountCache = useAnchorAccountCache()

  const [selectedTab, setSelectedTab] = useState<PAGE_TABS>(
    PAGE_TABS.MY_MONKETTES
  )

  // MY_MONKETTES
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

  const { ADDRESS_STAKING_POOL } = getClusterConstants("ADDRESS_STAKING_POOL")
  const [poolAccount] = useAccount("pool", ADDRESS_STAKING_POOL)
  console.log("poolAccount", poolAccount)
  console.log(
    "rewardRatePerToken",
    poolAccount?.data.rewardRatePerToken.toString()
  )

  // CLAIM_VIBE
  const userAccountAddress = useUserAccountAddress(walletPublicKey)
  const [userAccount] = useAccount("user", userAccountAddress)

  useEffect(() => {
    if (!anchorAccountCache.isEnabled || !userAccount) {
      return
    }
    ;(async function () {
      console.log(
        await anchorAccountCache.nftStakingProgram.account.mintStaked.fetch(
          userAccount?.data.mintStaked
        )
      )
    })()
  }, [userAccount])

  const _claimRewardClickHandler = useCallback(async () => {
    if (!anchorAccountCache.isEnabled || !walletPublicKey) {
      throw new Error("Invalid data")
    }
    await claimReward(anchorAccountCache, walletPublicKey)
  }, [anchorAccountCache.isEnabled, walletPublicKey?.toString()])

  const claimRewardClickHandler = useTxCallback(_claimRewardClickHandler, {
    info: "Claiming Vibe...",
    success: "Vibe claimed!",
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
        <Heading color="brandPink.200">Monkette Staking!</Heading>
        <HStack spacing="8">
          <Button
            w="48"
            color="white"
            size={"md"}
            onClick={setSelectedTab.bind(null, PAGE_TABS.MY_MONKETTES)}
            backgroundColor={
              selectedTab === PAGE_TABS.MY_MONKETTES
                ? "brandPink.900"
                : "brandPink.200"
            }
          >
            My Monkettes
          </Button>
          <Button
            w="48"
            color="white"
            size={"md"}
            onClick={setSelectedTab.bind(null, PAGE_TABS.STAKED_MONKETTES)}
            backgroundColor={
              selectedTab === PAGE_TABS.STAKED_MONKETTES
                ? "brandPink.900"
                : "brandPink.200"
            }
          >
            Staked Monkettes
          </Button>
          <Button
            w="48"
            color="white"
            size={"md"}
            onClick={setSelectedTab.bind(null, PAGE_TABS.CLAIM_VIBE)}
            backgroundColor={
              selectedTab === PAGE_TABS.CLAIM_VIBE
                ? "brandPink.900"
                : "brandPink.200"
            }
          >
            Claim Vibe
          </Button>
        </HStack>

        {selectedTab === PAGE_TABS.MY_MONKETTES && monketteAccounts && (
          <VStack>
            <Text>(Click to stake)</Text>
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
          </VStack>
        )}

        {selectedTab === PAGE_TABS.CLAIM_VIBE && userAccount && (
          <VStack w="96" spacing={8}>
            <Flex
              w="full"
              justifyContent="space-between"
              borderBottom={"2px solid grey"}
            >
              <Text textAlign={"left"} fontSize="18" fontWeight={600}>
                Vibe tokens claimed
              </Text>
              <Text textAlign={"right"} fontSize="18" fontWeight={600}>
                {`${userAccount?.data.rewardEarnedClaimed.toString()}`}
              </Text>
            </Flex>
            <Flex
              w="full"
              justifyContent="space-between"
              borderBottom={"2px solid grey"}
            >
              <Text textAlign={"left"} fontSize="18" fontWeight={600}>
                Vibe tokens available
              </Text>
              <Text textAlign={"right"} fontSize="18" fontWeight={600}>
                {`${userAccount?.data.rewardEarnedPending.toString()}`}
              </Text>
            </Flex>
            <Button
              size={"md"}
              border="1px solid grey"
              onClick={claimRewardClickHandler}
            >
              Claim
            </Button>
          </VStack>
        )}
      </VStack>
    </Box>
  )
}

export default ManagePoolPage

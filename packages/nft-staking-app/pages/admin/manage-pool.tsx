import _ from "lodash"
import { Heading, Button, Input } from "@chakra-ui/react"
import { PublicKey } from "@solana/web3.js"
import { Center, VStack, StackDivider, Box } from "@chakra-ui/layout"
import authorizeFunder from "../../solana/scripts/authorizeFunder"
import { getClusterConstants } from "../../constants"
import deauthorizeFunder from "../../solana/scripts/deauthorizeFunder"
import useWalletPublicKey from "../../hooks/useWalletPublicKey"
import { useState, useCallback } from "react"
import { useAnchorAccountCache } from "../../contexts/AnchorAccountsCacheProvider"
import useTxCallback from "../../hooks/useTxCallback"
import AccountViewer from "../../components/AccountViewer"

const ManagePoolPage = () => {
  const walletPublicKey = useWalletPublicKey()
  const anchorAccountCache = useAnchorAccountCache()

  const { ADDRESS_STAKING_POOL } = getClusterConstants("ADDRESS_STAKING_POOL")

  const [newFunderAddress, setNewFunderAddress] = useState("")
  const handleNewFunderAddressChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewFunderAddress(event.target.value)
  }

  const _authorizeFunderClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !walletPublicKey ||
      !newFunderAddress
    ) {
      throw new Error("Invalid data")
    }

    await authorizeFunder(
      anchorAccountCache.nftStakingProgram,
      walletPublicKey,
      ADDRESS_STAKING_POOL,
      new PublicKey(newFunderAddress)
    )
    setNewFunderAddress("")
  }, [
    anchorAccountCache.isEnabled,
    walletPublicKey?.toString(),
    newFunderAddress,
  ])

  const authorizeFunderClickHandler = useTxCallback(
    _authorizeFunderClickHandler,
    {
      info: "Authorize funder...",
      success: "Funder authorized!",
      error: "Transaction failed",
    }
  )

  const [oldFunderAddress, setOldFunderAddress] = useState("")
  const handleOldFunderAddressChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setOldFunderAddress(event.target.value)
  }

  const _deauthorizeFunderClickHandler = useCallback(async () => {
    if (
      !anchorAccountCache.isEnabled ||
      !walletPublicKey ||
      !oldFunderAddress
    ) {
      throw new Error("Invalid data")
    }

    await deauthorizeFunder(
      anchorAccountCache.nftStakingProgram,
      walletPublicKey,
      ADDRESS_STAKING_POOL,
      new PublicKey(oldFunderAddress)
    )
    setOldFunderAddress("")
  }, [
    anchorAccountCache.isEnabled,
    walletPublicKey?.toString(),
    newFunderAddress,
  ])

  const deauthorizeFunderClickHandler = useTxCallback(
    _deauthorizeFunderClickHandler,
    {
      info: "Deauthorize funder...",
      success: "Funder deauthorized!",
      error: "Transaction failed",
    }
  )

  return (
    <VStack
      w="full"
      divider={<StackDivider borderColor="gray.200" />}
      spacing={16}
      textAlign="center"
    >
      <Center flexDirection="column" w="96">
        <Heading w="full" mb="8">
          Authorize Funder
        </Heading>
        <Input
          placeholder="Address"
          w="full"
          value={newFunderAddress}
          onChange={handleNewFunderAddressChange}
        />
        <Button
          colorScheme="purple"
          mt="4"
          px="8"
          w="40"
          onClick={authorizeFunderClickHandler}
        >
          Submit
        </Button>
      </Center>
      <Center flexDirection="column" w="96">
        <Heading w="full" mb="8">
          De-Authorize Funder
        </Heading>
        <Input
          placeholder="Address"
          w="full"
          value={oldFunderAddress}
          onChange={handleOldFunderAddressChange}
        />
        <Button
          colorScheme="purple"
          mt="4"
          px="8"
          w="40"
          onClick={deauthorizeFunderClickHandler}
        >
          Submit
        </Button>
      </Center>
      <VStack w="full">
        <Heading w="full" mb="8">
          View Pool
        </Heading>
        <AccountViewer
          accountType="pool"
          accountAddresses={[ADDRESS_STAKING_POOL]}
        />
      </VStack>
    </VStack>
  )
}

export default ManagePoolPage

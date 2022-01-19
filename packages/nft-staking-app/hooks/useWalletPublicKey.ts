import { PublicKey } from "@solana/web3.js"
import { useAnchorWallet } from "@solana/wallet-adapter-react"

const useWalletPublicKey = () => {
  const wallet = useAnchorWallet()

  const impersonate = "7aouzGp7RRJwd7V5s8DuPoUNDwaJ3Cq2zzLAcErscVqv"

  if (impersonate) {
    return new PublicKey(impersonate)
  }

  return wallet?.publicKey
}

export default useWalletPublicKey

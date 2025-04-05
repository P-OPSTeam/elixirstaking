"use client"

import { useWriteContract } from "wagmi"
import ABI from "../../abis/burner.json"
import { useAccount } from "wagmi"

const useUnstake = (inputAmount: bigint, communityCode = "") => {
  const { address } = useAccount()
  const args = [address, inputAmount, communityCode]

  const {
    data,
    isPending,
    isError,
    writeContract,
    failureReason,
    error
  } = useWriteContract()
  
  const sendTransaction = () => {
    console.log("useMinterToStake sendTransaction")
    if (writeContract) {
      writeContract({
        address: process.env.NEXT_PUBLIC_CONTRACT_BURNER as `0x${string}`,
        abi: ABI,
        functionName: "burnAndRedeemIfPossible",
        args,
      })
    } else {
      console.log("useMinterToStake error", isError)
    }
  }

  return {
    sendTransaction,
    isLoading: isPending,
    transaction: data,
    error,
  }
}

export default useUnstake


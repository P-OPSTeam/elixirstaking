"use client"

import { useWriteContract, useAccount } from "wagmi"
import ABI from "../../abis/minter.json"

const useStake = (inputAmount: bigint, communityCode = "") => {
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
        address: process.env.NEXT_PUBLIC_CONTRACT_MINTER as `0x${string}`,
        abi: ABI,
        functionName: "mint",
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

export default useStake


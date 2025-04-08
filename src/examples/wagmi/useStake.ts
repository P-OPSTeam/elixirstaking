"use client"

import { useWriteContract, useAccount } from "wagmi"
import ABI from "../../abis/minter.json"
import { VARIABLES } from "@/src/constants"

const useStake = (inputAmount: bigint, communityCode = "", network: string) => {
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
        address: VARIABLES[network as keyof typeof VARIABLES]?.CONTRACT_MINTER as `0x${string}`,
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


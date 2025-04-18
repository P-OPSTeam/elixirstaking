"use client"

import { useWriteContract, useReadContract } from "wagmi"
import ABI_ERC20 from "../../abis/elx.json"
import { VARIABLES } from "@/src/constants"

export const useApprove = (spenderAddress: `0x${string}`, amount: bigint, network: string) => {
  // Contract write hook for approval
  const {
    data,
    isPending,
    isSuccess,
    isError,
    writeContract,
  } = useWriteContract()

  const approve = () => {
    if (writeContract) {
        writeContract({
            address: VARIABLES[network as keyof typeof VARIABLES]?.CONTRACT_NATIVE_TOKEN as `0x${string}`,
            abi: ABI_ERC20,
            functionName: "approve",
            args: [spenderAddress, amount],
        })
    } else {
      console.error("useApprove error: writeContract is not available")
    }
  }

  return {
    approve,
    pending: isPending,
    isLoading: isPending,
    transaction: data,
  }
}

export const useAllowance = (ownerAddress: `0x${string}` | undefined, spenderAddress: `0x${string}`, network: string) => {
  const { data, isLoading, refetch } = useReadContract({
    address: VARIABLES[network as keyof typeof VARIABLES]?.CONTRACT_NATIVE_TOKEN as `0x${string}`,
    abi: ABI_ERC20,
    functionName: "allowance",
    args: [ownerAddress || "0x0000000000000000000000000000000000000000", spenderAddress],
    query: {
        enabled: !!ownerAddress,
    }
  })

  return {
    allowance: data as bigint,
    isLoading,
    refetch,
  }
}


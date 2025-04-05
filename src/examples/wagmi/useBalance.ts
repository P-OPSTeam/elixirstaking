"use client"

import { useState, useEffect } from "react"
import { useBalance, useReadContract } from "wagmi"
import ABI_STELX from "../../abis/stelx.json"

export const useStakedBalance = ({ address }: { address: `0x${string}` }) => {
  const [balance, setBalance] = useState<bigint | null>(0n)
  const [hasError, setHasError] = useState<boolean>(false)

  const { data, isLoading, refetch } = useReadContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_STAKED_TOKEN as `0x${string}`,
    abi: ABI_STELX,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && address !== "0x0000000000000000000000000000000000000000",
    }
  })

  useEffect(() => {
    if (data) {
      setBalance(data as bigint)
      setHasError(false)
    }
  }, [data])

  return { balance, isLoading, hasError, refetch }
}

export const useBalanceElx = ({ address }: { address: `0x${string}` }) => {
  const [balance, setBalance] = useState<bigint | null>(0n)
  const [hasError, setHasError] = useState<boolean>(false)

  const { data, isLoading, refetch } = useBalance({
    token: process.env.NEXT_PUBLIC_CONTRACT_NATIVE_TOKEN as `0x${string}`,
    address: address,
  })

  useEffect(() => {
    if (data) {
      setBalance(data.value)
      setHasError(false)
    }
  }, [data])

  return { balance, isLoading, hasError, refetch }
}

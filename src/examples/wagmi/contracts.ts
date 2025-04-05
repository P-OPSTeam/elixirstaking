import { getContract, createPublicClient, http } from "viem"
import ABI_STELX from "../../abis/stelx.json"
import ABI_ELX from "../../abis/elx.json"
import ABI_OVERSEER from "../../abis/overseer.json"
import { mainnet, sepolia } from "viem/chains"

const RPC_URL = process.env.NEXT_PUBLIC_RPC_PROVIDER || "https://sepolia.infura.io"

// Create a public client directly
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
})

export const contractNativeToken = getContract({
  address: process.env.NEXT_PUBLIC_CONTRACT_NATIVE_TOKEN as `0x${string}`,
  abi: ABI_ELX,
  publicClient,
})

export const contractStakedToken = getContract({
  address: process.env.NEXT_PUBLIC_CONTRACT_STAKED_TOKEN as `0x${string}`,
  abi: ABI_STELX,
  publicClient,
})

export const contractOverseer = getContract({
  address: process.env.NEXT_PUBLIC_CONTRACT_OVERSEER as `0x${string}`,
  abi: ABI_OVERSEER,
  publicClient,
})

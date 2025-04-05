import { createConfig } from "wagmi"
import { http } from "viem"
import { mainnet, sepolia } from "viem/chains"
import { injected } from "wagmi/connectors"

// Create a minimal config with just the essentials
export const config = createConfig({
  chains: [sepolia, mainnet],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
})


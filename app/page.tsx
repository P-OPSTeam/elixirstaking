"use client"

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { config } from "@/src/examples/wagmi/config"
import StakingInterface from "@/components/staking-interface"
import { useState, useEffect } from "react"

export default function Home() {
  // Create a client
  const [queryClient] = useState(() => new QueryClient())

  // Use client-side only rendering to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false)
  const [network, setNetwork] = useState("mainnet")

  const handleNetworkSwitch = () => {
    if (network === "mainnet") {
      setNetwork("testnet")
    } else {
      setNetwork("mainnet")
    }
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render anything until client-side hydration is complete
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">stELX Staking</h1>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <main className="min-h-screen bg-black text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
              <img src="/logo-pops.png" alt="Pops Logo" className="h-16" />
              <h1 className="text-2xl text-center text-white">Still in development, use at your own risk</h1>
                <div className="flex flex-col items-start space-y-2">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={handleNetworkSwitch}
                  >
                    Switch network
                  </button>
                  <span>Current network: {network}</span>
                </div>
            </div>
            <h1 className="text-4xl font-bold text-center mb-2 text-white">stELX Staking</h1>
            <p className="text-center text-gray-300 mb-12">Stake your ELX tokens and earn rewards</p>
            <StakingInterface network={network} />
          </div>
        </main>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


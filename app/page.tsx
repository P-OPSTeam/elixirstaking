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
            <h1 className="text-4xl font-bold text-center mb-2 text-white">stELX Staking</h1>
            <p className="text-center text-gray-300 mb-12">Stake your ELX tokens and earn rewards</p>
            <StakingInterface />
          </div>
        </main>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


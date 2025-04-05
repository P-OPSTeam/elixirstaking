"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { contractOverseer } from "@/src/examples/wagmi/contracts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, Clock } from "lucide-react"

type BurnItem = {
  amount: bigint
  user: `0x${string}`
  completed: boolean
  sum: bigint
}

export default function UnstakeRequests() {
  const { address, isConnected } = useAccount()
  const [burns, setBurns] = useState<{ item: BurnItem; id: bigint }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [claimingId, setClaimingId] = useState<bigint | null>(null)

  const fetchBurns = async () => {
    if (!address || !isConnected) return

    try {
      setIsLoading(true)
      const [burnItems, burnIds] = (await contractOverseer.read.getBurns([address])) as [BurnItem[], bigint[]]

      const combinedBurns = burnItems.map((item, index) => ({
        item,
        id: burnIds[index],
      }))

      setBurns(combinedBurns)
    } catch (error) {
      console.error("Error fetching burn requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const claimUnstake = async (burnId: bigint) => {
    if (!isConnected) return

    try {
      setClaimingId(burnId)
      // This would be implemented with a proper contract write function
      // await contractOverseer.write.redeem([burnId]);
      console.log("Claiming unstake with burn ID:", burnId)
      // Simulate a delay for demonstration
      await new Promise((resolve) => setTimeout(resolve, 2000))
      fetchBurns()
    } catch (error) {
      console.error("Error claiming unstake:", error)
    } finally {
      setClaimingId(null)
    }
  }

  useEffect(() => {
    if (isConnected) {
      fetchBurns()
    }
  }, [isConnected, address])

  if (!isConnected) {
    return (
      <Card className="p-6 bg-gray-800 border-gray-700">
        <p className="text-center text-gray-400">Connect your wallet to view unstake requests</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gray-800 border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Unstake Requests</h2>
        <Button variant="ghost" size="sm" onClick={fetchBurns} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : burns.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>You don't have any unstake requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {burns.map((burn) => (
            <div key={burn.id.toString()} className="p-4 rounded-lg border border-gray-700 bg-gray-900">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="font-bold">{formatEther(burn.item.amount)} ELX</p>
                </div>
                <div className="flex items-center">
                  {burn.item.completed ? (
                    <span className="flex items-center text-green-500 text-sm">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Ready to claim
                    </span>
                  ) : (
                    <span className="flex items-center text-yellow-500 text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                <span>Burn ID: {burn.id.toString()}</span>
              </div>

              <Button
                onClick={() => claimUnstake(burn.id)}
                disabled={!burn.item.completed || claimingId === burn.id}
                variant={burn.item.completed ? "default" : "outline"}
                className="w-full"
              >
                {claimingId === burn.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : burn.item.completed ? (
                  "Claim ELX"
                ) : (
                  "Waiting for processing"
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}


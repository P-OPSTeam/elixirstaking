"use client"

import { useState, useEffect } from "react"
import { parseEther } from "viem"
import { contractStakedToken } from "@/src/examples/wagmi/contracts"
import { Card } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ExchangeRate() {
  const [rate, setRate] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchExchangeRate = async () => {
    try {
      setIsLoading(true)
      // Use 1 ELX as the input amount for calculation
      const inputAmount = parseEther("1")
      const outputAmount = (await contractStakedToken.read.assetsToShares([inputAmount])) as bigint

      // Calculate the rate
      const calculatedRate = outputAmount ? Number(inputAmount) / Number(outputAmount) : 0
      setRate(calculatedRate)
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExchangeRate()

    // Set up interval to refresh the rate every 30 seconds
    const interval = setInterval(fetchExchangeRate, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-400">stELX/ELX Exchange Rate</h3>
          {isLoading ? (
            <div className="flex items-center h-6 mt-1">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : (
            <p className="text-lg font-bold">{rate ? `1 stELX = ${rate.toFixed(6)} ELX` : "N/A"}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={fetchExchangeRate} disabled={isLoading}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}


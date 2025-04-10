"use client"

import { useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect, useReadContract, useWaitForTransactionReceipt } from "wagmi"
import { formatEther, parseEther } from "viem"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowUpRight, ArrowDownRight, Wallet, LogOut, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useStakedBalance, useBalanceElx } from "@/src/examples/wagmi/useBalance"
import useStake from "@/src/examples/wagmi/useStake"
import useUnstake from "@/src/examples/wagmi/useUnstake"
import ABI_BURNER from "@/src/abis/burner.json"
import { useAllowance, useApprove } from "@/src/examples/wagmi/useApprove"
import { useAllowanceUnstake, useApproveUnstake } from "@/src/examples/wagmi/useApproveUnstake"
import { VARIABLES } from "@/src/constants"
import { mainnet, sepolia } from "viem/chains"

export default function StakingInterface({ network }: { network: string }) {
  const { address, isConnected } = useAccount()
  const { connectAsync, connectors, isPending: isConnectLoading, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()

  const [walletError, setWalletError] = useState<string | null>(null)
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean>(false)
  const [explorer, setExplorer] = useState("")
  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")
  const [unstakeInfo, setUnstakeInfo] = useState<{
    instantUnstakeAmount: bigint
    unstakeRequestAmount: bigint
  }>({
    instantUnstakeAmount: 0n,
    unstakeRequestAmount: 0n,
  })

  // Check for MetaMask only on the client side
  useEffect(() => {
    setIsMetaMaskInstalled(typeof window !== "undefined" && Boolean(window.ethereum))
  }, [])

  // Fetch balance
  const {
    balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useBalanceElx({
    address: address || "0x0000000000000000000000000000000000000000",
    network,
  })
  
  // Fetch staked balance
  const {
    balance: stakedBalance,
    isLoading: isStakedBalanceLoading,
    refetch: refetchStakedBalance,
  } = useStakedBalance({
    address: address || "0x0000000000000000000000000000000000000000",
    network,
  })

  // Check allowance
  const {
    allowance,
    isLoading: isAllowanceLoading,
    refetch: refetchAllowance,
  } = useAllowance(
    address,
    VARIABLES[network as keyof typeof VARIABLES]?.CONTRACT_MINTER as `0x${string}`,
    network,
  )

  // Check unstake allowance
  const {
    allowance: unstakeAllowance,
    isLoading: isUnstakeAllowanceLoading,
    refetch: refetchUnstakeAllowance,
  } = useAllowanceUnstake(address, VARIABLES[network as keyof typeof VARIABLES]?.CONTRACT_BURNER as `0x${string}`, network)
  
  // Setup approve hook
  const {
    approve,
    pending: approvePending,
    transaction: approveTxHash,
  } = useApprove(VARIABLES[network as keyof typeof VARIABLES]?.CONTRACT_MINTER as `0x${string}`, stakeAmount ? parseEther(stakeAmount) : 0n, network)

  const {
    approve: approveUnstake,
    pending: approveUnstakePending,
    transaction: approveUnstakeTxHash,
  } = useApproveUnstake(VARIABLES[network as keyof typeof VARIABLES]?.CONTRACT_BURNER as `0x${string}`, unstakeAmount ? parseEther(unstakeAmount) : 0n, network)

  // Fetch max redeemable amount
  const { data: maxRedeemable, refetch: refetchMaxRedeemable } = useReadContract({
    address: VARIABLES[network as keyof typeof VARIABLES]?.CONTRACT_BURNER as `0x${string}`,
    abi: ABI_BURNER,
    functionName: "maxRedeemable",
    query: {
      enabled: isConnected,
    }
  })

  // Setup stake hook
  const {
    sendTransaction: sendStakeTransaction,
    isLoading: stakeLoading,
    transaction: stakeTx,
    error: errorStake,
  } = useStake(stakeAmount ? parseEther(stakeAmount) : 0n, VARIABLES[network as keyof typeof VARIABLES]?.COMMUNITY_CODE, network)

  // Setup unstake hook
  const {
    sendTransaction: sendUnstakeTransaction,
    isLoading: unstakeLoading,
    transaction: unstakeTx,
  } = useUnstake(
    unstakeAmount ? parseEther(unstakeAmount) : 0n,
    VARIABLES[network as keyof typeof VARIABLES]?.COMMUNITY_CODE,
    network
  )

  // Calculate unstake info
  const calculateUnstake = (amount: string) => {
    if (!isConnected || !maxRedeemable) return

    try {
      const inputAmount = parseEther(amount || "0")
      const instantlyBurnableAmount = maxRedeemable as bigint

      let instantUnstakeAmount = 0n
      let unstakeRequestAmount = 0n

      if (instantlyBurnableAmount < inputAmount) {
        instantUnstakeAmount = instantlyBurnableAmount
        unstakeRequestAmount = inputAmount - instantlyBurnableAmount
      } else {
        instantUnstakeAmount = inputAmount
      }

      setUnstakeInfo({
        instantUnstakeAmount,
        unstakeRequestAmount,
      })
    } catch (error) {
      console.error("Error calculating unstake:", error)
    }
  }

  // Check if amount is approved
  const isAmountApproved = () => {
    if (!stakeAmount || !allowance) return false
    try {
      const amount = parseEther(stakeAmount)
      return allowance >= amount
    } catch (error) {
      return false
    }
  }

  // Check if amount unstake is approved
  const isAmountUnstakeApproved = () => {
    if (!unstakeAmount || !unstakeAllowance) return false
    try {
      const amount = parseEther(unstakeAmount)
      return unstakeAllowance >= amount
    } catch (error) {
      return false
    }
  }

  const maxUnstakeAmount = ((stakedBalance as bigint) && (maxRedeemable as bigint)) ? ((stakedBalance as bigint) < (maxRedeemable as bigint) ? stakedBalance as bigint : maxRedeemable as bigint) : 0n

  // Handle connect wallet click
  const handleConnectWallet = async () => {
    try {
      setWalletError(null)
      console.log("Attempting to connect wallet...")
      console.log("Available connectors:", connectors)

      if (!isMetaMaskInstalled) {
        setWalletError("MetaMask is not installed. Please install MetaMask to continue.")
        return
      }

      // Find the injected connector
      const injectedConnector = connectors.find((c) => c.id === "injected")

      if (!injectedConnector) {
        setWalletError("No injected connector found. Please make sure MetaMask is installed.")
        return
      }

      await connectAsync({ connector: injectedConnector })
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      setWalletError(error?.message || "Failed to connect wallet. Please try again.")
    }
  }

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveTxHash,
      query: { enabled: approveTxHash !== undefined },
  })

  const { isLoading: isStakingConfirming, isSuccess: isStakingConfirmed } =
    useWaitForTransactionReceipt({
      hash: stakeTx,
      query: { enabled: stakeTx !== undefined },
  })

  const { isLoading: isApprovalUnstakeConfirming, isSuccess: isApprovalUnstakedConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveUnstakeTxHash,
      query: { enabled: approveUnstakeTxHash !== undefined },
  })

  const { isLoading: isUnstakingConfirming, isSuccess: isUnstakingConfirmed } =
    useWaitForTransactionReceipt({
      hash: unstakeTx,
      query: { enabled: unstakeTx !== undefined },
  })

  // Set error from connect hook
  useEffect(() => {
    if (connectError) {
      console.error("Connect error:", connectError)
      setWalletError(connectError.message || "Failed to connect wallet")
    }
  }, [connectError])

  // Fetch data when connected
  useEffect(() => {
    if (isConnected) {
      refetchMaxRedeemable()
      refetchStakedBalance()
      refetchAllowance()
      refetchUnstakeAllowance()
      refetchBalance()
    }
  }, [isConnected, refetchMaxRedeemable, refetchBalance, refetchStakedBalance, refetchAllowance, refetchUnstakeAllowance])

  // Calculate unstake info when amount changes
  useEffect(() => {
    calculateUnstake(unstakeAmount)
  }, [unstakeAmount, maxRedeemable])

  // Reset states when transaction is confirmed
  useEffect(() => {
    if (isApprovalConfirmed) {
      refetchAllowance()
    }
  }, [
    isApprovalConfirmed,
    refetchAllowance,
  ])

  useEffect(() => {
    if (isApprovalUnstakedConfirmed) {
      refetchUnstakeAllowance()
    }
  }, [
    isApprovalUnstakedConfirmed,
    refetchUnstakeAllowance,
  ])

  useEffect(() => {
    if (isStakingConfirmed) {
      refetchStakedBalance()
      refetchAllowance()
      refetchBalance()
      refetchUnstakeAllowance()
      refetchMaxRedeemable()
      setStakeAmount("")
    }
  }, [
    isStakingConfirmed,
  ])

  useEffect(() => {
    if (isUnstakingConfirmed) {
      refetchStakedBalance()
      refetchAllowance()
      refetchBalance()
      refetchUnstakeAllowance()
      refetchMaxRedeemable()
      setStakeAmount("")
      setUnstakeAmount("")
    }
  }, [
    isUnstakingConfirmed,
  ])

  useEffect(() => {
    if (network === "mainnet") {
      setExplorer(mainnet.blockExplorers.default.url)
    } else if (network === "testnet") {
      setExplorer(sepolia.blockExplorers.default.url)
    }
  }, [network])

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto p-6 bg-gray-900 border-gray-700">
        <div className="text-center">
          <Wallet className="mx-auto h-12 w-12 text-blue-400 mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">Connect Wallet</h2>
          <p className="text-gray-300 mb-6">Connect your wallet to start staking ELX tokens</p>

          {walletError && (
            <Alert className="mb-4 bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4 mr-2 text-red-400" />
              <AlertDescription className="text-red-300">{walletError}</AlertDescription>
            </Alert>
          )}

          {/* Only render this alert on the client side after checking */}
          {!isMetaMaskInstalled && (
            <Alert className="mb-4 bg-yellow-900/20 border-yellow-800">
              <AlertCircle className="h-4 w-4 mr-2 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                MetaMask is not installed. Please{" "}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-yellow-200 hover:text-yellow-100"
                >
                  install MetaMask
                </a>{" "}
                to continue.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleConnectWallet}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isConnectLoading}
          >
            {isConnectLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Wallet"
            )}
          </Button>

          <div className="mt-4 text-xs text-gray-400">
            Available connectors: {connectors.map((c) => c.id).join(", ")}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-gray-300">Connected Wallet</p>
          <p className="font-mono text-sm text-white">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="text-white border-gray-600 hover:bg-gray-700"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>

      <Card className="p-6 mb-6 bg-gray-900 border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Your stELX Balance</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchStakedBalance()}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            Refresh
          </Button>
        </div>

        {isStakedBalanceLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="text-3xl font-bold text-center py-4 text-white">
            {stakedBalance ? formatEther(stakedBalance) : "0"} stELX
          </div>
        )}
      </Card>

      <Tabs defaultValue="stake" className="mb-6">
        <TabsList className="grid grid-cols-2 mb-4 bg-gray-800">
          <TabsTrigger
            value="stake"
            className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
          >
            Stake
          </TabsTrigger>
          <TabsTrigger
            value="unstake"
            className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
          >
            Unstake
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stake">
          <Card className="p-6 bg-gray-900 border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-white">Stake ELX</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="stake-amount" className="block text-sm font-medium mb-1 text-gray-300">
                    Amount to Stake
                  </label>
                  <span className="text-xs text-gray-400">
                    {isStakedBalanceLoading ? (
                      <div>
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <div>
                        Balance {balance ? formatEther(balance) : "0"} ELX
                      </div>
                    )}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="stake-amount"
                    type="number"
                    placeholder="0.0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="bg-gray-800 text-white border-gray-700"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-300"
                    onClick={() => setStakeAmount(balance ? formatEther(balance) : "0")}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {isAllowanceLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : isAmountApproved() ? (
                <>
                  <div className="flex items-center text-green-400 text-sm mb-2">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approved to stake {stakeAmount} ELX
                  </div>
                  <Button
                    onClick={sendStakeTransaction}
                    disabled={!stakeAmount || stakeLoading || Number(stakeAmount) <= 0 || isStakingConfirming}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {stakeLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {stakeLoading ? "Transaction Pending..." : "Confirming..."}
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Stake ELX
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Alert className="bg-blue-900/20 border-blue-800 mb-2">
                    <AlertDescription className="text-blue-300">
                      You need to approve the contract to spend your ELX tokens before staking.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={approve}
                    disabled={!stakeAmount || approvePending || Number(stakeAmount) <= 0 || isApprovalConfirming}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {approvePending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {approvePending ? "Approval Pending..." : "Confirming..."}
                      </>
                    ) : (
                      "Approve ELX"
                    )}
                  </Button>
                </>
              )}

              {(isApprovalConfirming || isStakingConfirming) && <div>Waiting for confirmation...</div>}

              {isApprovalConfirmed && (
                <Alert className="bg-green-900/20 border-green-800">
                  <AlertDescription className="flex items-center text-green-300">
                    Approval confirmed! You can now stake your ELX tokens.
                    <a
                      href={`${explorer}/tx/${approveTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-400 hover:underline flex items-center"
                    >
                      View on Explorer <ArrowUpRight className="ml-1 h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}

              {isStakingConfirmed && (
                <Alert className="bg-green-900/20 border-green-800">
                  <AlertDescription className="flex items-center text-green-300">
                    Transaction confirmed!
                    <a
                      href={`${explorer}/tx/${stakeTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-400 hover:underline flex items-center"
                    >
                      View on Explorer <ArrowUpRight className="ml-1 h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </TabsContent>

       <TabsContent value="unstake">
          <Card className="p-6 bg-gray-900 border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-white">Unstake stELX</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="unstake-amount" className="block text-sm font-medium text-gray-300">
                    Amount to Unstake
                  </label>
                  <span className="text-xs text-gray-400">
                    Max to unstake: {formatEther(((stakedBalance as bigint) && (maxRedeemable as bigint)) ? ((stakedBalance as bigint) < (maxRedeemable as bigint) ? stakedBalance as bigint : maxRedeemable as bigint) : 0n)} ELX
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="unstake-amount"
                    type="number"
                    placeholder="0.0"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="bg-gray-800 text-white border-gray-700"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-300"
                    onClick={() => stakedBalance && setUnstakeAmount(formatEther(((stakedBalance as bigint) && (maxRedeemable as bigint)) ? ((stakedBalance as bigint) < (maxRedeemable as bigint) ? stakedBalance as bigint : maxRedeemable as bigint) : 0n))}
                  >
                    MAX
                  </Button>
                </div>
                {Number(unstakeAmount) > Number(formatEther(maxUnstakeAmount)) && (
                  <div className="text-red-500 text-xs mt-1">
                    Amount exceeds max unstake limit: {formatEther(maxUnstakeAmount)} stELX
                    </div>
                )}
              </div>

              {isUnstakeAllowanceLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : isAmountUnstakeApproved() ? (
                <>
                  <div className="flex items-center text-green-400 text-sm mb-2">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approved to unstake {unstakeAmount} stELX
                  </div>
                  <Button
                    onClick={sendUnstakeTransaction}
                    disabled={!unstakeAmount || unstakeLoading || Number(unstakeAmount) <= 0 || Number(unstakeAmount) > Number(formatEther(maxUnstakeAmount))}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {unstakeLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {unstakeLoading ? "Transaction Pending..." : "Confirming..."}
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="mr-2 h-4 w-4" />
                        Unstake stELX
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Alert className="bg-blue-900/20 border-blue-800 mb-2">
                    <AlertDescription className="text-blue-300">
                      You need to approve the contract to spend your stELX tokens before unstaking.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={approveUnstake}
                    disabled={!unstakeAmount || approveUnstakePending || Number(unstakeAmount) <= 0 || isApprovalUnstakeConfirming || Number(unstakeAmount) > Number(formatEther(maxUnstakeAmount))}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {approveUnstakePending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {approveUnstakePending ? "Approval Pending..." : "Confirming..."}
                      </>
                    ) : (
                      "Approve stELX"
                    )}
                  </Button>
                </>
              )}

              {(isApprovalUnstakeConfirming || isUnstakingConfirming) && <div>Waiting for confirmation...</div>}

              {isApprovalUnstakedConfirmed && (
                <Alert className="bg-green-900/20 border-green-800">
                  <AlertDescription className="flex items-center text-green-300">
                    Approval confirmed! You can now unstake your stELX tokens.
                    <a
                      href={`${explorer}/tx/${approveUnstakeTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-400 hover:underline flex items-center"
                    >
                      View on Explorer <ArrowUpRight className="ml-1 h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}

              {isUnstakingConfirmed && (
                <Alert className="bg-green-900/20 border-green-800">
                  <AlertDescription className="flex items-center text-green-300">
                    Transaction confirmed!
                    <a
                      href={`${explorer}/tx/${unstakeTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-400 hover:underline flex items-center"
                    >
                      View on Explorer <ArrowUpRight className="ml-1 h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


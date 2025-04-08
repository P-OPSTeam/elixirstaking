import { useSwitchChain } from 'wagmi'
import { useConfig } from 'wagmi'
import { useChainId } from 'wagmi'
import { useState } from "react"
import { mainnet } from "viem/chains"

export default function NetworkSwitch({ onNetworkSwitch }: { onNetworkSwitch?: (chainId: number) => void }) {
    const config = useConfig()
    const currentChainId = useChainId()
    const [selectedChain, setSelectedChain] = useState(currentChainId | mainnet.id)
    const { chains, switchChain } = useSwitchChain({ config })

    const handleNetworkSwitch = async (chainId: number) => {
        try {
            console.log(`Switched to chain ID: ${chainId}`)
            setSelectedChain(chainId)
            switchChain({ chainId: chainId })
            if (onNetworkSwitch) {
                onNetworkSwitch(chainId)
            }
        } catch (error) {
            console.error("Failed to switch network:", error)
        }
    }

    return (
        <div className="flex flex-col items-start space-y-2">
            {chains.map((chain) => (
                <button
                    key={chain.id}
                    onClick={() => handleNetworkSwitch(chain.id)}
                    className={`px-4 py-2 rounded hover:bg-gray-700 ${
                        chain.id === selectedChain ? 'bg-blue-500 text-white' : 'bg-gray-800 text-white'
                    }`}
                >
                    {chain.name}
                </button>
            ))}
        </div>
    )
}
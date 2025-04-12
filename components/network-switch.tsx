import { useSwitchChain } from 'wagmi'
import { useConfig } from 'wagmi'
import { useChainId } from 'wagmi'
import { useEffect, useState } from "react"
import { mainnet } from "viem/chains"

export default function NetworkSwitch({ onNetworkSwitch }: { onNetworkSwitch?: (chainId: number) => void }) {
    const config = useConfig()
    const currentChainId = useChainId()
    const [selectedChain, setSelectedChain] = useState(currentChainId || mainnet.id)
    const { chains, switchChain } = useSwitchChain({ config })

    useEffect(() => {
        console.log(`Current chain ID: ${currentChainId}`)
        handleNetworkSwitch(currentChainId)
    }, [])

    const handleNetworkSwitch = async (chainId: number) => {
        try {
            console.log(`Switched to chain ID: ${chainId}`)
            setSelectedChain(chainId)
            await switchChain({ chainId })
            if (onNetworkSwitch) {
                onNetworkSwitch(chainId)
            }
        } catch (error) {
            console.error("Failed to switch network:", error)
        }
    }

    return (
        <div className="flex flex-col items-start space-y-2">
            <select
                value={selectedChain}
                onChange={(e) => handleNetworkSwitch(Number(e.target.value))}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                {chains.map((chain) => (
                    <option key={chain.id} value={chain.id}>
                        {chain.name}
                    </option>
                ))}
            </select>
        </div>
    )
}
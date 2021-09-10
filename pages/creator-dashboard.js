import {ethers} from 'ethers'
import { useEffect, useState } from 'react'
import Web3Modal from 'web3modal'
import {create as ipfsHttpClient} from 'ipfs-http-client'
import axios from 'axios'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import { nftAddress, nftMarketAddress } from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function CreatorDashBoard() {
    const [nfts, setNfts] = useState([])
    const [sold, setSold] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')

    useEffect(() => {
        loadNfts()
    }, [])

    async function loadNfts() {
        const web3modal     = new Web3Modal()
        const connection    = await web3modal.connect()
        const provider      = new ethers.providers.Web3Provider(connection)
        const signer        = provider.getSigner()

        const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer)
        const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
        const data = await marketContract.fetchItemsCreated()

        const items = await Promise.all(data.map(async x => {
            const tokeURI = await tokenContract.tokenURI(x.tokenId)
            const meta    = await axios.get(tokeURI)

            let item = {
                price: ethers.utils.formatEther(x.price.toString()),
                tokenId: x.tokenId.toNumber(),
                seller: x.seller,
                owner: x.owner,
                image: meta.data.image,
                name: meta.data.name,
                description: meta.data.description,
            }
            return item
        }));
        const soldItems = items.filter(x => x.sold)
        setNfts(items)
        setSold(soldItems)
        setLoadingState('loaded')
    }

    if (loadingState === 'loaded' && !nfts.length) {
        return (<h1 className="py-10 px-20 text-3xl">No assets created</h1>)
    }
    return (
        <div>
        <div className="p-4">
            <h2 className="text-2xl py-2">Items Created</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {
                nfts.map((nft, i) => (
                <div key={i} className="border shadow rounded-xl overflow-hidden">
                    <img src={nft.image} className="rounded" />
                    <div className="p-4 bg-black">
                    <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                    </div>
                </div>
                ))
            }
            </div>
        </div>
            <div className="px-4">
            {
            Boolean(sold.length) && (
                <div>
                <h2 className="text-2xl py-2">Items sold</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                    sold.map((nft, i) => (
                        <div key={i} className="border shadow rounded-xl overflow-hidden">
                        <img src={nft.image} className="rounded" />
                        <div className="p-4 bg-black">
                            <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                        </div>
                        </div>
                    ))
                    }
                </div>
                </div>
            )
            }
            </div>
        </div>
    )
}
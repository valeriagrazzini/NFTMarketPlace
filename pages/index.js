import {ethers} from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'
import { nftAddress, nftMarketAddress, rpcProvider } from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function Home() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')

  useEffect(() => {
    loadNfts()
  }, [])

  async function loadNfts() {
    const provider = new ethers.providers.JsonRpcProvider(rpcProvider);
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, provider)
    const data = await marketContract.fetchMarketItems()

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
    setNfts(items)
    setLoadingState('loaded')
  }

  async function buyNft(nft) {
    const wen3modal   = new Web3Modal()
    const connection  = await wen3modal.connect()
    const provider    = new ethers.providers.Web3Provider(connection)
    const signer      = provider.getSigner()
    const contract    = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer)
    
    const price       = ethers.utils.parseEther(nft.price)
    console.log(price)
    const transaction = await contract.createMarketSale(nftAddress, nft.tokenId, {value: price})
    await transaction.wait()
    loadNfts()
  }

  if(loadingState == 'loaded' && !nfts.length) {
    return (<h1 className="px-20 py-10 text-3xl">No items in the Marketplace</h1>)
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.filter(x => x.image != undefined).map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} />
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} ETH</p>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function () {
  it("Should create and execute market sales", async function () {
    const [owner, buyerAddress, sellerAddress] = await ethers.getSigners();

    const Market = await ethers.getContractFactory("NFTMarket");
    const market = await Market.deploy();
    await market.deployed();
    
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(market.address);
    await nft.deployed();

    const listingPrice = await market.getListingPrice();
    const auctionPrice = ethers.utils.parseEther('100');

    await nft.createToken('https://www.mytokenlocation.com');
    await nft.createToken('https://www.mytokenlocation2.com');

    await market.createMarketItem(nft.address, 1, auctionPrice, {value: listingPrice});
    await market.createMarketItem(nft.address, 2, auctionPrice, {value: listingPrice});

    await market.connect(buyerAddress).createMarketSale(nft.address, 1, {value: auctionPrice});

    let items = await market.fetchMarketItems();

    items = await Promise.all(items.map(async x => {
      let item = {
        price: x.price.toString(),
        tokenId: x.tokenId.toString(),
        seller: x.seller,
        owner: x.owner,
        tokenUri: await nft.tokenURI(x.tokenId),
        sold: x.sold
      }
      return item
    }));

    console.log('items', items);
  });
});

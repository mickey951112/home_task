const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Auction Testing...", function () {
    let SIMNFT;
    let simNFT;
    let NFTAuction;
    let nftAuction;
    let contractOwner;
    let user1;
    let user2;
    let user3;
    let user4;

    beforeEach(async () => {
        // Deploy the SIMNFT contract factory
        SIMNFT = await ethers.getContractFactory("SIMNFT");

        // Deploy the NFTAuction contract factory
        NFTAuction = await ethers.getContractFactory("NFTAuction");

        // Get signers (addresses) for different roles
        [contractOwner, user1, user2, user3, user4] = await ethers.getSigners();

        // Deploy the SIMNFT contract
        simNFT = await SIMNFT.deploy("My Simulate NFT", "SNFT");
        await simNFT.deployed();

        // Mint an NFT to the contract owner
        await simNFT.mint(contractOwner.address, 1);

        // Deploy the NFTAuction contract
        nftAuction = await NFTAuction.deploy();
        await nftAuction.deployed();

        // Approve the NFTAuction contract to handle the NFT
        await simNFT.connect(contractOwner).approve(nftAuction.address, 1);
    });

    // Test case: Creating an auction by the owner
    it("Creating an auction by owner...", async () => {
        const tokenId = 1;
        const startPrice = ethers.utils.parseEther("1");
        const durationBlocks = 10;

        // Create an auction for the NFT
        await nftAuction.createAuction(simNFT.address, tokenId, startPrice, durationBlocks);

        // Retrieve the created auction
        const auction = await nftAuction.auctions(1);

        // Assert that auction details match the expected values
        expect(auction.tokenId).to.equal(tokenId);
        expect(auction.startPrice).to.equal(startPrice);
    });

    // Test case: Placing bids by users
    it("Placing bids by user...", async function () {
        const tokenId = 1;
        const startPrice = ethers.utils.parseEther("1");
        const durationBlocks = 10;

        // Create an auction for the NFT
        await nftAuction.createAuction(simNFT.address, tokenId, startPrice, durationBlocks);

        // Place bids by different users
        await nftAuction.connect(user1).placeBid(1, { value: ethers.utils.parseEther("1.5") });
        await nftAuction.connect(user2).placeBid(1, { value: ethers.utils.parseEther("2") });
        await nftAuction.connect(user3).placeBid(1, { value: ethers.utils.parseEther("4") });
        await nftAuction.connect(user4).placeBid(1, { value: ethers.utils.parseEther("5") });

        // Retrieve the auction after bids
        const auction = await nftAuction.auctions(1);

        // Assert that the highest bidder and bid amount match the expected values
        expect(auction.highestBidder).to.equal(user4.address);
        expect(auction.highestBid).to.equal(ethers.utils.parseEther("5"));
    });

    // Test case: Closing auction and transferring NFT by owner
    it("Closing auction and transferring NFT by owner...", async function () {
        const tokenId = 1;
        const startPrice = ethers.utils.parseEther("1");
        const durationBlocks = 10;

        // Create an auction for the NFT
        await nftAuction.createAuction(simNFT.address, tokenId, startPrice, durationBlocks);

        // Place bids by users
        await nftAuction.connect(user1).placeBid(1, { value: ethers.utils.parseEther("1.5") });
        await nftAuction.connect(user2).placeBid(1, { value: ethers.utils.parseEther("2") });
        await nftAuction.connect(user3).placeBid(1, { value: ethers.utils.parseEther("4") });
        await nftAuction.connect(user4).placeBid(1, { value: ethers.utils.parseEther("5") });

        // Increase time to simulate auction end
        const auctionDuration = 7 * 24 * 60 * 60; // 7 days in seconds
        await ethers.provider.send("evm_increaseTime", [auctionDuration]);
        await ethers.provider.send("evm_mine");

        // Increment blocks to further advance time
        const blocksToAdvance = 20;
        for (let i = 0; i < blocksToAdvance; i++) {
            await ethers.provider.send("evm_mine");
        }

        // Get owner's balance before closing auction
        let lastownerBalance = await ethers.provider.getBalance(contractOwner.address);

        // Close the auction by the owner
        await nftAuction.connect(contractOwner).closeAuction(1);

        // Retrieve auction details after closing
        const auction = await nftAuction.auctions(1);

        // Assert that the auction has ended and ownership is transferred
        expect(auction.ended).to.be.true;

        // Get owner's balance after closing auction
        let ownerBalance = await ethers.provider.getBalance(contractOwner.address);

        // Calculate the balance change and assert that it's less than 5 ETH
        const balanceChange = ownerBalance.sub(lastownerBalance);
        expect(balanceChange).to.lt(ethers.utils.parseEther("5"));

        // Assert that the NFT ownership has been transferred to the highest bidder
        expect(await simNFT.ownerOf(tokenId)).to.equal(user4.address);
    });
});

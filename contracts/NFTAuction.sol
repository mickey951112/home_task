// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.19;

// Import the ERC721 interface from OpenZeppelin
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTAuction {
    // Contract owner's address
    address public owner;

    // Auction number counter
    uint256 public auctionNumber;

    // Structure to represent an auction
    struct Auction {
        uint256 id;             // Unique auction identifier
        IERC721 token;          // ERC721 token contract address
        uint256 tokenId;        // Token ID being auctioned
        uint256 startPrice;     // Starting price of the auction
        uint256 endBlock;       // Block number at which the auction ends
        address highestBidder;  // Address of the highest bidder
        uint256 highestBid;     // Highest bid amount
        bool ended;             // Flag to indicate if the auction has ended
    }

    // Mapping to store auctions by their ID
    mapping(uint256 => Auction) public auctions;

    // Events to log important contract actions
    event AuctionCreated(uint256 indexed auctionId, uint256 tokenId, uint256 startPrice, uint256 endBlock);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 bidAmount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 winningBid);

    // Contract constructor
    constructor() {
        owner = msg.sender; // Set the contract owner as the deployer
    }

    // Modifier to restrict functions to the contract owner
    modifier onlyOwner() {
        require(owner == msg.sender, "onlyOwner: caller is not the owner");
        _;
    }

    // Function to get the current block number
    function getCurrentBlockNumber() external view returns (uint256) {
        return block.number;
    }

    // Function to create an auction by the owner
    function createAuction(address _token, uint256 _tokenId, uint256 _startPrice, uint256 _durationBlocks) external onlyOwner {
        // Increment the auction number
        auctionNumber++;

        // Create a new auction and initialize its properties
        auctions[auctionNumber] = Auction({
            id: auctionNumber,
            token: IERC721(_token),
            tokenId: _tokenId,
            startPrice: _startPrice,
            endBlock: block.number + _durationBlocks,
            highestBidder: address(0),
            highestBid: 0,
            ended: false
        });

        // Transfer the token from the owner to the contract
        auctions[auctionNumber].token.transferFrom(owner, address(this), _tokenId);

        // Emit an event to log the auction creation
        emit AuctionCreated(auctionNumber, _tokenId, _startPrice, auctions[auctionNumber].endBlock);
    }

    // Function to place a bid on an auction
    function placeBid(uint256 _auctionId) external payable {
        // Get the auction based on the provided auction ID
        Auction storage auction = auctions[_auctionId];

        // Check if the auction has ended
        require(!auction.ended, "Auction has ended");

        // Check if the current block is within the auction duration
        require(block.number <= auction.endBlock, "Auction has ended");

        // Check if the bid amount is higher than the start price and current highest bid
        require(msg.value > auction.startPrice, "Bid must be higher than start price");
        require(msg.value > auction.highestBid, "Bid must be higher than current highest bid");

        // Store previous highest bidder's address and bid amount
        address lastHighestBidder = auction.highestBidder;
        uint256 lastHighestBid = auction.highestBid;

        // Update the highest bidder and bid amount
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        // Transfer back the funds to the previous highest bidder
        if (lastHighestBidder != address(0)) {
            payable(lastHighestBidder).transfer(lastHighestBid);
        }

        // Emit an event to log the bid placement
        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    // Function to close an auction and handle the transfer of funds and tokens
    function closeAuction(uint256 _auctionId) external onlyOwner {
        // Get the auction based on the provided auction ID
        Auction storage auction = auctions[_auctionId];

        // Check if the auction has already ended
        require(!auction.ended, "Auction has already ended");

        // Check if the current block is after the auction end block
        require(block.number > auction.endBlock, "Auction has not ended yet");

        // Mark the auction as ended
        auction.ended = true;

        // Handle the transfer of the token and funds to the winner or owner
        if (auction.highestBidder != address(0)) {
            // Transfer the NFT to the highest bidder
            auction.token.approve(auction.highestBidder, auction.tokenId);
            auction.token.transferFrom(address(this), auction.highestBidder, auction.tokenId);

            // Transfer the highest bid amount to the owner
            payable(owner).transfer(auction.highestBid);

            // Emit an event to log the auction end
            emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
        } else {
            // If there are no bids, return the NFT to the owner
            auction.token.approve(owner, auction.tokenId);
            auction.token.transferFrom(address(this), owner, auction.tokenId);

            // Emit an event to log the auction end
            emit AuctionEnded(_auctionId, address(0), 0);
        }
    }

    // Function to get the balance of the contract
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

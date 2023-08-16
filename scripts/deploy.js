async function main() {
    const [deployer] = await ethers.getSigners();


    console.log("=== Deploying NFT for simulating ===");
    const simNFT = await ethers.deployContract("SIMNFT", ["SIMULATING NFT", "SNFT"]);
    console.log("\nSNFT address:", await simNFT.address);
  
    console.log("\n=== Deploying auction contract with the account:", deployer.address);
    const nftAuction = await ethers.deployContract("NFTAuction");
    console.log("\nAuction contract address:", await nftAuction.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
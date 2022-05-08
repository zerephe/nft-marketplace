import { ethers } from "hardhat";

async function main() {
 /* Deploying the contract */
  const [owner] = await ethers.getSigners()
  const NFTBazaar = await ethers.getContractFactory("NftBazaar", owner);
  const marketInstance = await NFTBazaar.deploy(
    "0x80122a756DC6D24145069C6f87c144bdb4c52C7E", 
    "0x7993D6fEfcC2C977E32Becb0ea621c44b4627e17", 
    "0x71e935E827f5AA8DFB013b4071dcfB2D28fc677C"
  );
 
  await marketInstance.deployed();

  console.log("Deployed to:", marketInstance.address);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

export default {
  solidity: "0.8.4"
};
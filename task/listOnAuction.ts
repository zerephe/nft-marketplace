import * as dotenv from "dotenv";
import { task } from "hardhat/config";

dotenv.config();

task("listOnAuction", "List your nft on auction")
  .addParam("tokenAddress")
  .addParam("tokenId")
  .addParam("price")
  .setAction(async (args, hre) => {
    const contractAddress = process.env.CONTRACT_ADDRESS as string;
    const marketInstance = await hre.ethers.getContractAt("NftBazaar", contractAddress);

    const result = await marketInstance.listItemOnAuction(args.tokenAddress, args.tokenId, args.price);
    console.log(result);
  });

  export default {
    solidity: "0.8.4"
  };
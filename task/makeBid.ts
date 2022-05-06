import * as dotenv from "dotenv";
import { task } from "hardhat/config";

dotenv.config();

task("makeBid", "Bid on nft")
  .addParam("auctionId")
  .addParam("price")
  .setAction(async (args, hre) => {
    const contractAddress = process.env.CONTRACT_ADDRESS as string;
    const marketInstance = await hre.ethers.getContractAt("NftBazaar", contractAddress);

    const result = await marketInstance.makeBid(args.auctionId, args.price);
    console.log(result);
  });

  export default {
    solidity: "0.8.4"
  };
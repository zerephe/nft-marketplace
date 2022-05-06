import * as dotenv from "dotenv";
import { task } from "hardhat/config";

dotenv.config();

task("listItem", "List your nft on marketplace")
  .addParam("tokenAddress")
  .addParam("tokenId")
  .addParam("price")
  .setAction(async (args, hre) => {
    const contractAddress = process.env.CONTRACT_ADDRESS as string;
    const marketInstance = await hre.ethers.getContractAt("NftBazaar", contractAddress);

    const result = await marketInstance.listItem(args.tokenAddress, args.tokenId, args.price);
    console.log(result);
  });

  export default {
    solidity: "0.8.4"
  };
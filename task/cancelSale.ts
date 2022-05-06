import * as dotenv from "dotenv";
import { task } from "hardhat/config";

dotenv.config();

task("cancelSale", "Cancel your nft sale")
  .addParam("itemId", "Uniqe item id")
  .setAction(async (args, hre) => {
    const contractAddress = process.env.CONTRACT_ADDRESS as string;
    const marketInstance = await hre.ethers.getContractAt("NftBazaar", contractAddress);

    const result = await marketInstance.cancelSale(args.itemId);
    console.log(result);
  });

  export default {
    solidity: "0.8.4"
  };
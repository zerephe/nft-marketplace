import * as dotenv from "dotenv";
import { task } from "hardhat/config";

dotenv.config();

task("createItem721", "Create ERC721 nft")
  .addParam("uri", "URI of nft")
  .addParam("to", "Recipient")
  .setAction(async (args, hre) => {
    const contractAddress = process.env.CONTRACT_ADDRESS as string;
    const marketInstance = await hre.ethers.getContractAt("NftBazaar", contractAddress);

    const result = await marketInstance.createItem721(args.uri, args.to);
    console.log(result);
  });

  export default {
    solidity: "0.8.4"
  };
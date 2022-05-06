import * as dotenv from "dotenv";
import { task } from "hardhat/config";

dotenv.config();

task("createItem1155", "Create ERC1155 nft")
  .addParam("uri", "URI of nft")
  .addParam("to", "Recipient")
  .addParam("ids", "Token ids")
  .addParam("amounts", "Token amounts")
  .setAction(async (args, hre) => {
    const contractAddress = process.env.CONTRACT_ADDRESS as string;
    const marketInstance = await hre.ethers.getContractAt("NftBazaar", contractAddress);

    const ids = args.ids.split(",");
    const amounts = args.ids.split(",");
    const result = await marketInstance.createItem721(args.uri, args.to, ids, amounts);
    console.log(result);
  });

  export default {
    solidity: "0.8.4"
  };
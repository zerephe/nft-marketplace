import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { parse } from "path";

describe("NumberCollectible NFTs", function () {

  let marketInstance: Contract;
  let t721: Contract;
  let t1155: Contract;
  let t20: Contract;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function(){

    const Token20 = await ethers.getContractFactory("VolkovCoin");
    t20 = await Token20.deploy();
    await t20.deployed();

    const Token721 = await ethers.getContractFactory("NumberCollectible");
    t721 = await Token721.deploy("Num", "NUM");
    await t721.deployed();

    const Token1155 = await ethers.getContractFactory("NumberCollectible2");
    t1155 = await Token1155.deploy();
    await t1155.deployed();
    
    const Token = await ethers.getContractFactory("NftBazaar");
    marketInstance = await Token.deploy(t721.address, t1155.address, t20.address);
    [owner, addr1] = await ethers.getSigners();

    await marketInstance.deployed();

    const minterRole = await t721.MINTER_ROLE();
    await t721.grantRole(minterRole, marketInstance.address);

    const minterRole1155 = await t1155.MINTER_ROLE();
    await t1155.grantRole(minterRole1155, marketInstance.address);

    await t20._mint(addr1.address, "20000");
    await t20._mint(owner.address, "20000");
  });

  describe("Deploy", function(){
    it("Should return proper token addresses on deploy", async function() {
      expect(marketInstance.address).to.be.properAddress;
    });
  });

  describe("Txs", function() {
    it("Should have some nft after creating", async function() {
      await marketInstance.createItem721("newuri", owner.address);

      expect(await t721.balanceOf(owner.address)).to.eq(1);
    });

    it("Should revert if uri is empty", async function() {
      await expect(marketInstance.createItem721("", owner.address)).to.be.revertedWith("Undefined uri!");
    });

    it("Should have some 1155 nft after creating", async function() {
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);

      expect(await t1155.balanceOf(owner.address, 0)).to.eq(1);
    });

    it("Should revert if batch limit exeeded", async function() {
      const ids = [1,2,3,4];
      await expect(marketInstance.createItem1155("sd", owner.address, ids, ids)).to.be.revertedWith("Limit per batch exeeded!");
    });

    it("Should should be possible to change Batchlimit", async function() {
      await marketInstance.setBatchLimit(1);
      expect(await marketInstance.batchLimit()).to.eq(1);
    });

    it("Should should be possible to list item 721 on marketplace", async function() {
      await marketInstance.createItem721("newuri", owner.address);
      await t721.approve(marketInstance.address, 0);
      await marketInstance.listItem(t721.address, 0, 100);

      const _onSale = await marketInstance.saleList(0);
      expect(_onSale[5]).to.eq(true);
    });

    it("Should should be possible to list item 1155 on marketplace", async function() {
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItem(t1155.address, 0, 100);

      const _onSale = await marketInstance.saleList(0);
      expect(_onSale[5]).to.eq(true);
    });

    it("Should revert if token not from marketplace", async function() {
      await expect(marketInstance.listItem(t721.address, 0, 100)).to.be.revertedWith("Non marketplace token!");
    });

    it("Should be able to buy item", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItem(t1155.address, 0, 100);

      await t20.connect(addr1).approve(marketInstance.address, 100);
      await marketInstance.connect(addr1).buyItem(0);

      const balance1155 = await t1155.connect(addr1).balanceOf(addr1.address, 0)

      expect(balance1155).to.eq(1);
      expect(Number(balance20) + 100).to.eq(20100);
    });

    it("Should be reverted if buyer is owner of token", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItem(t1155.address, 0, 100);

      await t20.approve(marketInstance.address, 100);
      await expect(marketInstance.buyItem(0)).to.be.revertedWith("You are token owner!");
    });

    it("Should be reverted if token not on sale", async function() {
      await expect(marketInstance.buyItem(0)).to.be.revertedWith("Token sold or sale canceled!");
    });

    it("Should be able to cancel sale", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItem(t1155.address, 0, 100);
      await marketInstance.cancelSale(0);

      const _onSale = await marketInstance.saleList(0);
      expect(_onSale[5]).to.eq(false);
    });
    
    it("Should be reverted if sale is not active or token already sold", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItem(t1155.address, 0, 100);

      await t20.connect(addr1).approve(marketInstance.address, 100);
      await marketInstance.connect(addr1).buyItem(0);
      
      await expect(marketInstance.cancelSale(0)).to.be.revertedWith("Sale canceled, sold or not exists!");
    });

    it("Should should be possible to list item 1155 on auction", async function() {
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      const _onSale = await marketInstance.auctionList(0);
      expect(_onSale[5]).to.eq(true);
    });

    it("Should should reverted if item not minted in marketplace", async function() {
      await expect(marketInstance.listItemOnAuction(t1155.address, 0, 100)).to.be.revertedWith("Non marketplace token");
    });

    it("Should be able bid", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      await t20.connect(addr1).approve(marketInstance.address, 150);
      await marketInstance.connect(addr1).makeBid(0, 150);

      const bider = await marketInstance.bids(0);
      expect(bider[0]).to.be.eq(addr1.address);
    });

    it("Should be able rebid bid", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      await t20.connect(addr1).approve(marketInstance.address, 150);
      await marketInstance.connect(addr1).makeBid(0, 150);
      await t20.connect(addr1).approve(marketInstance.address, 210);
      await marketInstance.connect(addr1).makeBid(0, 210);

      const bider = await marketInstance.bids(0);
      expect(bider[2]).to.be.eq(2);
    });

    it("Should be reverted if auction doesnt exist", async function() {
      await t20.approve(marketInstance.address, 150);
      await expect(marketInstance.makeBid(0, 150)).to.be.revertedWith("Non existed auction!");
    });

    it("Should be reverted if bider is owner", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      await t20.approve(marketInstance.address, 150);
      await expect(marketInstance.makeBid(0, 150)).to.be.revertedWith("You are token owner!");
    });

    it("Should be reverted if bid price is lower than min price", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      
      await t20.connect(addr1).approve(marketInstance.address, 150);
      await expect(marketInstance.connect(addr1).makeBid(0, 80)).to.be.revertedWith("Non relevant price!");
    });
    
    it("Should be reverted if bid price is lower than last bid price", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      await t20.connect(addr1).approve(marketInstance.address, 150);
      await marketInstance.connect(addr1).makeBid(0, 150);
      await t20.connect(addr1).approve(marketInstance.address, 150);
      await expect(marketInstance.connect(addr1).makeBid(0, 80)).to.be.revertedWith("Non relevant price!");
    });

    it("Should be reverted if auction has ended", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
      await ethers.provider.send('evm_mine', []);

      await t20.connect(addr1).approve(marketInstance.address, 150);
      await expect(marketInstance.connect(addr1).makeBid(0, 150)).to.be.revertedWith("Auction has ended!");
    });

    it("Should able to finish auction not successfully with no bider", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
      await ethers.provider.send('evm_mine', []);

      await marketInstance.finishAuction(0);
      const auction = await marketInstance.auctionList(0);
      expect(auction[5]).to.eq(false);
    });

    it("Should able to finish auction not successfully with one bider", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      await t20.connect(addr1).approve(marketInstance.address, 150);
      await marketInstance.connect(addr1).makeBid(0, 150);

      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
      await ethers.provider.send('evm_mine', []);

      await marketInstance.finishAuction(0);
      const auction = await marketInstance.auctionList(0);
      expect(auction[5]).to.eq(false);
    });

    it("Should able to finish auction successfully", async function() {
      const balance20 = ethers.utils.formatUnits(await t20.balanceOf(owner.address), "wei");
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      await t20.connect(addr1).approve(marketInstance.address, 150);
      await marketInstance.connect(addr1).makeBid(0, 150);
      await t20.connect(addr1).approve(marketInstance.address, 160);
      await marketInstance.connect(addr1).makeBid(0, 160);
      await t20.connect(addr1).approve(marketInstance.address, 170);
      await marketInstance.connect(addr1).makeBid(0, 170);

      await ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
      await ethers.provider.send('evm_mine', []);

      await marketInstance.finishAuction(0);
      const auction = await marketInstance.auctionList(0);
      expect(auction[5]).to.eq(false);
    });

    it("Should be reverted if auction doesnt exist", async function() {
      await expect(marketInstance.finishAuction(0)).to.be.revertedWith("Non existed auction!");
    });

    it("Should revert if auction time not reached", async function() {
      await marketInstance.createItem1155("newuri", owner.address, [0], [1]);
      await t1155.setApprovalForAll(marketInstance.address, true);
      await marketInstance.listItemOnAuction(t1155.address, 0, 100);

      await expect(marketInstance.finishAuction(0)).to.be.revertedWith("Not time to finish");
    });
  });
});
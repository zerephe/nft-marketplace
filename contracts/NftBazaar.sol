// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./IMy721.sol";
import "./IMy1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NftBazaar is Ownable, ReentrancyGuard, IERC721Receiver, IERC1155Receiver{
    using Counters for Counters.Counter;
    Counters.Counter private _uniqID;

    IMy721 private token721;
    IMy1155 private token1155;
    IERC20 private volkovCoin;

    uint256 public batchLimit = 3;
    uint256 private auctionTime = 3 days;

    mapping(address => mapping(uint256 => bool)) public inBazaar;
    mapping(uint256 => SaleItem) public saleList; 
    mapping(uint256 => SaleItem) public auctionList; 
    mapping(uint256 => Bider) public bids;

    struct SaleItem {
        address tokenOwner;
        address tokenAddress;
        uint256 tokenId;
        uint256 timeStamp;
        uint256 price;
        bool onSale;
    }

    struct Bider {
        address bider;
        uint256 price;
        uint256 bidCount;
    }

    constructor (address _erc721, address _erc1155, address _erc20){
        token721 = IMy721(_erc721);
        token1155 = IMy1155(_erc1155);
        volkovCoin = IERC20(_erc20);
        require(token721.supportsInterface(type(IERC721).interfaceId), "Not supported interface contact!");
        require(token1155.supportsInterface(type(IERC1155).interfaceId), "Not supported interface contact!");
    }

    function createItem721(string memory uri, address to) external returns(bool) {
        require(bytes(uri).length > 0, "Undefined uri!");
        inBazaar[address(token721)][token721.safeMintWithURI(uri, to)] = true;

        return true;
    }

    function createItem1155(string memory uri, address to, uint256[] memory ids, uint256[] memory amounts) external returns(bool){
        require(ids.length < batchLimit, "Limit per batch exeeded!");

        token1155.mintBatchWithURI(uri, to, ids, amounts, "0x00");

        //pushing every nft id that was created to marketplace mapping
        for(uint256 i = 0; i < ids.length; i++){
            inBazaar[address(token1155)][ids[i]] = true;
        }

        return true;
    }

    function setBatchLimit(uint256 _newLimit) external onlyOwner returns(bool){
        batchLimit = _newLimit;

        return true;
    }

    function listItem(address tokenAddress, uint256 tokenId, uint256 price) external nonReentrant returns(uint256) {
        require(inBazaar[tokenAddress][tokenId], "Non marketplace token!");
        
        _safeTransferFrom(tokenAddress, msg.sender, address(this), tokenId);

        uint256 uniqID = _uniqID.current();
        _uniqID.increment();

        saleList[uniqID].tokenOwner = msg.sender;
        saleList[uniqID].tokenAddress = tokenAddress;
        saleList[uniqID].tokenId = tokenId;
        saleList[uniqID].price = price;
        saleList[uniqID].onSale = true;

        return uniqID;
    }

    function buyItem(uint256 uniqID) external nonReentrant returns(bool){
        require(saleList[uniqID].onSale, "Token sold or sale canceled!");
        require(msg.sender != saleList[uniqID].tokenOwner, "You are token owner!");

        volkovCoin.transferFrom(
            msg.sender, 
            saleList[uniqID].tokenOwner, 
            saleList[uniqID].price
        );

        _safeTransferFrom(saleList[uniqID].tokenAddress, address(this), msg.sender, saleList[uniqID].tokenId);

        saleList[uniqID].onSale = false;

        return true;
    }

    function cancelSale(uint256 uniqID) external nonReentrant returns(bool) {
        require(saleList[uniqID].onSale, "Sale canceled, sold or not exists!");
        
        _safeTransferFrom(saleList[uniqID].tokenAddress, address(this), msg.sender, saleList[uniqID].tokenId);
        
        saleList[uniqID].onSale = false;

        return true;
    }
    
    function listItemOnAuction(address tokenAddress, uint256 tokenId, uint256 minPrice) external nonReentrant returns(uint256) {
        require(inBazaar[tokenAddress][tokenId], "Non marketplace token");
        
        _safeTransferFrom(tokenAddress, msg.sender, address(this), tokenId);

        uint256 uniqID = _uniqID.current();
        _uniqID.increment();

        auctionList[uniqID].tokenOwner = msg.sender;
        auctionList[uniqID].tokenAddress = tokenAddress;
        auctionList[uniqID].tokenId = tokenId;        
        auctionList[uniqID].price = minPrice;
        auctionList[uniqID].timeStamp = block.timestamp;
        auctionList[uniqID].onSale = true;

        return uniqID;
    }

    function makeBid(uint256 auctionId, uint256 price) external nonReentrant returns(bool) {
        require(auctionList[auctionId].onSale, "Non existed auction!");
        require(msg.sender != auctionList[auctionId].tokenOwner, "You are token owner!");
        require(auctionList[auctionId].price < price, "Non relevant price!");
        require(bids[auctionId].price < price, "Non relevant price!");
        require(auctionList[auctionId].timeStamp + auctionTime >= block.timestamp, "Auction has ended!");
        
        if(bids[auctionId].price > 0){
            volkovCoin.transferFrom(msg.sender, address(this), price);
            volkovCoin.transfer(bids[auctionId].bider, bids[auctionId].price);
            bids[auctionId].price = price;
            bids[auctionId].bider = msg.sender;
            bids[auctionId].bidCount += 1;
        }
        else {
            volkovCoin.transferFrom(msg.sender, address(this), price);
            bids[auctionId].price = price;
            bids[auctionId].bider = msg.sender;
            bids[auctionId].bidCount += 1;
        }

        return true;
    }

    function finishAuction(uint256 auctionId) external nonReentrant returns(bool) {
        require(auctionList[auctionId].onSale, "Non existed auction!");
        require(auctionList[auctionId].timeStamp + auctionTime <= block.timestamp, "Not time to finish");

        if(bids[auctionId].bidCount > 2) {
            volkovCoin.transfer(auctionList[auctionId].tokenOwner, bids[auctionId].price);
            _safeTransferFrom(auctionList[auctionId].tokenAddress, address(this), bids[auctionId].bider, auctionList[auctionId].tokenId);
        }
        else if(bids[auctionId].bidCount == 0){
            _safeTransferFrom(auctionList[auctionId].tokenAddress, address(this), auctionList[auctionId].tokenOwner, auctionList[auctionId].tokenId);
        }
        else {
            volkovCoin.transfer(bids[auctionId].bider, bids[auctionId].price);
            _safeTransferFrom(auctionList[auctionId].tokenAddress, address(this), auctionList[auctionId].tokenOwner, auctionList[auctionId].tokenId);
        }

        auctionList[auctionId].onSale = false;

        return true;
    }

    function _safeTransferFrom(address tokenAddress, address from, address to, uint256 tokenId) internal returns(bool) {
        if(address(token721) == tokenAddress) {
            token721.safeTransferFrom(from, to, tokenId);
        }
        else{
            token1155.safeTransferFrom(from, to, tokenId, 1, "0x00");
        }

        return true;
    }

    function onERC721Received(
        address _operator,
        address _from, 
        uint256 _tokenId, 
        bytes memory _data
    ) external override returns(bytes4) {
        return this.onERC721Received.selector;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4){
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4){
        return this.onERC1155Received.selector;
    }

    function supportsInterface(bytes4 interfaceId) external override view returns (bool) {
        return true;
    }
}
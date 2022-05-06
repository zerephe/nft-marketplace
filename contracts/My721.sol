// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NumberCollectible is AccessControl, ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenId;
    
    mapping(bytes4 => bool) internal supportedInterfaces;

    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public maxSupply = 10;
    string private tokenCID = "QmSeAyQ55prvUASLJpj4KN36NJRvDkSu18oKcMsM2scCSy";

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        supportedInterfaces[type(IERC721).interfaceId] = true;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function _baseURI(string memory _tokenCID) internal pure returns (string memory) {
        return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/", _tokenCID));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return supportedInterfaces[interfaceId];
    }
    
    function safeMint(address to) external onlyRole(MINTER_ROLE) {
        require(totalSupply() <= maxSupply, "Mint limit exeeded!");

        uint256 tokenId = _tokenId.current();
        _tokenId.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _baseURI(tokenCID));
    }

     function safeMintWithURI(string memory uri,address to) external onlyRole(MINTER_ROLE) returns(uint256){
        require(totalSupply() <= maxSupply, "Mint limit exeeded!");

        uint256 tokenId = _tokenId.current();
        _tokenId.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        return tokenId;
    }

    function totalSupply() public view returns(uint256) {
        return _tokenId.current();
    }
}

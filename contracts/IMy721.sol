// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IMy721 is IERC721 {
    function safeMint(address to) external;
    
    function safeMintWithURI(string memory uri,address to) external returns(uint256);

    function totalSupply() external view returns(uint256);
}
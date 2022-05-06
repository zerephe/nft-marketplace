// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NumberCollectible2 is ERC1155URIStorage, AccessControl {
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    string private _baseUri = "https://ipfs.io/ipfs/QmV4KdKfFTV8MPkj9ntW41RMY22MgUbrGyKsegi1Ax5P9V/{id}.json";
    
    mapping(bytes4 => bool) internal supportedInterfaces;

    constructor() ERC1155(_baseUri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        supportedInterfaces[type(IERC1155).interfaceId] = true;
    }

    function setURI(string memory newuri) internal pure returns(string memory) {
        return string(abi.encodePacked(newuri, "/{id}.json"));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return supportedInterfaces[interfaceId];
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyRole(MINTER_ROLE){
        _mint(to, id, amount, data);
    }

    function mintWithURI(string memory _uri, address to, uint256 id, uint256 amount, bytes memory data) external onlyRole(MINTER_ROLE){
        _mint(to, id, amount, data);
        _setURI(id, _uri);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external onlyRole(MINTER_ROLE){
        _mintBatch(to, ids, amounts, data);
    }

    function mintBatchWithURI(string memory _uri, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external onlyRole(MINTER_ROLE){
        _mintBatch(to, ids, amounts, data);

        for(uint256 i = 0; i < ids.length; i++){
            _setURI(ids[i], setURI(_uri));
        }
    }
}
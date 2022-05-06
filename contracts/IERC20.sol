//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//ERC20 standart template
interface IERC20 {

    // //This function returns total amount of tokens minted
    // function totalSupply() external view returns (uint256);

    //Returns balance of specified address
    function balanceOf(address account) external view returns (uint256);

    // //Returns amount of tokens allowed to use by owner
    // function allowance(address owner, address spender) external view returns (uint256);

    //Just a transfer function
    function transfer(address recipient, uint256 amount) external returns (bool);

    //This function returns true if owner approved spender to use amount of tokens
    function approve(address spender, uint256 amount) external returns (bool);

    //Just like transfer, but we can transfer from specific address to another
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    //Emitted when tokens transfered from address to another
    event Transfer(address indexed from, address indexed to, uint256 value);

    //Emitted when allowance is set
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

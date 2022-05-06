//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./IERC20.sol";

contract VolkovCoin is IERC20{

    address private contractOwner;
    string public name;
    string public symbol;
    uint8 public constant DECIMAL = 18;
    uint256 public totalSupply;


    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) public allowed;

    constructor(){
        name = "VolkovCoin";
        symbol = "VLC";
        contractOwner = msg.sender;
    }

    function balanceOf(address _owner) external view override returns(uint256) {
        return balances[_owner];
    }

    function owner() external view returns(address){
        return contractOwner;
    }
    
    modifier ownerOnly {
        require(msg.sender == contractOwner, "Access denied!");
        _;
    } 

    function _mint(address _to, uint256 amount) external ownerOnly{
        balances[_to] += amount;
        totalSupply += amount;

        emit Transfer(address(0), _to, amount);
    }

    function _burn(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Burn amount higher than balance!");
        balances[msg.sender] -= amount;
        totalSupply -= amount;

        emit Transfer(msg.sender, address(0), amount);
    }

    function transfer(address recipient, uint256 amount) external override returns (bool){
        require(balances[msg.sender] >= amount, "Transfer amount exceeded!");
        require(recipient != address(0), "Recipient can't be zero address!");

        balances[msg.sender] -= amount;
        balances[recipient] += amount;

        emit Transfer(msg.sender, recipient, amount);

        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool){
        require(spender != address(0), "Spender can't be zero address!");

        allowed[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);

        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool){
        require(sender != address(0), "Sender can't be zero address!");
        require(recipient != address(0), "Recipient can't be zero address!");
        require(balances[sender] >= amount, "Transfer amount exceeded!");
        require(allowed[sender][msg.sender] >= amount, "Not enough allowance!");
        
        allowed[sender][msg.sender] -=amount;
        balances[sender] -= amount;
        balances[recipient] += amount;
        
        emit Transfer(sender, recipient, amount);

        return true;
    }
}
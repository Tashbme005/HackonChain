// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "src/MockUSDC.sol";
import "forge-std/Script.sol";


contract DeployMockUSDC is Script {

    function run() external {

        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(privateKey);

        MockUSDC token = new MockUSDC(msg.sender);

        vm.stopBroadcast();
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "src/TrustFlow.sol";
import "forge-std/Script.sol";


contract DeployTrustFlow is Script {

    function run() external {

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address usdc = vm.envAddress("USDC_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        TrustFlow trustFlow = new TrustFlow(
            usdc,
            msg.sender
        );

        vm.stopBroadcast();
    }
}
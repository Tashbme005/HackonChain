// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {OpenImpact} from "../src/OpenImpact.sol";

/**
 * Deploy OpenImpact. Owner defaults to the broadcaster.
 *
 * Sepolia example:
 *   forge script script/DeployOI.s.sol:DeployOI \
 *     --rpc-url $SEPOLIA_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast
 */
contract DeployOI is Script {
    function run() external {
        address owner = vm.envOr("OPENIMPACT_OWNER", msg.sender);
        vm.startBroadcast();
        OpenImpact deployed = new OpenImpact(owner);
        console2.log("OpenImpact deployed at", address(deployed));
        console2.log("owner", owner);
        vm.stopBroadcast();
    }
}

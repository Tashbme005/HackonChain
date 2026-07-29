// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {OpenImpact} from "../src/OpenImpact.sol";

contract OpenImpactTest is Test {
    OpenImpact internal app;
    address internal owner = address(0xA11CE);
    address internal donor = address(0xB0B);
    address internal org = address(0xC0FFEE);
    address internal recipient = address(0xD00D);

    function setUp() public {
        app = new OpenImpact(owner);
        vm.deal(donor, 10 ether);
    }

    function test_createAndConfirmDonation() public {
        vm.prank(donor);
        app.createDonation{value: 1 ether}(org, recipient);

        OpenImpact.Donation memory d = app.getDonation(0);
        assertEq(d.donor, donor);
        assertEq(d.organisation, org);
        assertEq(d.recipient, recipient);
        assertEq(d.amount, 1 ether);
        assertEq(uint256(d.status), uint256(OpenImpact.DonationStatus.Sent));

        uint256 beforeBal = recipient.balance;
        vm.prank(recipient);
        app.confirmReceipt(0);

        d = app.getDonation(0);
        assertEq(uint256(d.status), uint256(OpenImpact.DonationStatus.Received));
        assertEq(recipient.balance, beforeBal + 1 ether);
    }

    function test_submitProofAndPublicationHashes() public {
        vm.prank(donor);
        app.createDonation{value: 0.5 ether}(org, recipient);

        vm.prank(recipient);
        app.submitRecipientProof(0, "sha256:proof-demo");

        vm.prank(org);
        app.submitPublication(0, "sha256:pub-demo");

        OpenImpact.Donation memory d = app.getDonation(0);
        assertEq(d.recipientProofHash, "sha256:proof-demo");
        assertEq(d.publicationHash, "sha256:pub-demo");
    }
}

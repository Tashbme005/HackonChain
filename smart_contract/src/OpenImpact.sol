// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TrustFlow (OpenImpact) — Transparent Donation Accountability Platform
 * @notice Deployed on Base Sepolia Testnet. Handles USDC token escrow, recipient confirmation,
 * recipient proof hash recording, and organisation publication hash recording.
 */
contract TrustFlow is Ownable {
    IERC20 public immutable usdc;

    enum DonationStatus {
        Sent,
        Received,
        Verified
    }

    enum VerificationStatus {
        Pending,
        Verified,
        Flagged
    }

    struct Donation {
        uint256 id;
        address donor;
        address organisation;
        address recipient;
        uint256 amountUSDC;
        uint256 timestamp;
        DonationStatus status;
        string recipientProofHash;
        VerificationStatus recipientVerification;
        string publicationHash;
        VerificationStatus publicationVerification;
    }

    uint256 public nextDonationId;

    mapping(uint256 => Donation) public donations;

    event DonationCreated(
        uint256 indexed donationId,
        address indexed donor,
        address indexed organisation,
        address recipient,
        uint256 amount
    );

    event RecipientConfirmed(uint256 indexed donationId);

    event RecipientProofSubmitted(uint256 indexed donationId, string proofHash);

    event PublicationSubmitted(uint256 indexed donationId, string publicationHash);

    event RecipientVerificationUpdated(uint256 indexed donationId, VerificationStatus status);

    event PublicationVerificationUpdated(uint256 indexed donationId, VerificationStatus status);

    constructor(address usdcAddress, address initialOwner) Ownable(initialOwner) {
        require(usdcAddress != address(0), "Invalid USDC address");
        usdc = IERC20(usdcAddress);
    }

    function createDonation(address organisation, address recipient, uint256 amount) external {
        require(amount > 0, "Donation must be greater than zero");
        require(organisation != address(0), "Organisation required");
        require(recipient != address(0), "Recipient required");

        // Escrow funds into contract via USDC transferFrom (requires prior approve)
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");

        donations[nextDonationId] = Donation({
            id: nextDonationId,
            donor: msg.sender,
            organisation: organisation,
            recipient: recipient,
            amountUSDC: amount,
            timestamp: block.timestamp,
            status: DonationStatus.Sent,
            recipientProofHash: "",
            recipientVerification: VerificationStatus.Pending,
            publicationHash: "",
            publicationVerification: VerificationStatus.Pending
        });

        emit DonationCreated(nextDonationId, msg.sender, organisation, recipient, amount);

        nextDonationId++;
    }

    function confirmReceipt(uint256 donationId) external {
        Donation storage donation = donations[donationId];
        require(msg.sender == donation.recipient, "Only recipient");
        require(donation.status == DonationStatus.Sent, "Not awaiting receipt");

        donation.status = DonationStatus.Received;

        // Transfer escrowed USDC tokens to recipient
        require(usdc.transfer(donation.recipient, donation.amountUSDC), "USDC release failed");

        emit RecipientConfirmed(donationId);
    }

    function submitRecipientProof(uint256 donationId, string calldata proofHash) external {
        Donation storage donation = donations[donationId];
        require(msg.sender == donation.recipient, "Only recipient");
        require(bytes(proofHash).length > 0, "Empty proof hash");

        donation.recipientProofHash = proofHash;

        emit RecipientProofSubmitted(donationId, proofHash);
    }

    function submitPublication(uint256 donationId, string calldata publicationHash) external {
        Donation storage donation = donations[donationId];
        require(msg.sender == donation.organisation, "Only organisation");
        require(bytes(publicationHash).length > 0, "Empty publication hash");

        donation.publicationHash = publicationHash;

        emit PublicationSubmitted(donationId, publicationHash);
    }

    function updateRecipientVerification(uint256 donationId, VerificationStatus status) external onlyOwner {
        donations[donationId].recipientVerification = status;

        if (status == VerificationStatus.Verified) {
            donations[donationId].status = DonationStatus.Verified;
        }

        emit RecipientVerificationUpdated(donationId, status);
    }

    function updatePublicationVerification(uint256 donationId, VerificationStatus status) external onlyOwner {
        donations[donationId].publicationVerification = status;

        emit PublicationVerificationUpdated(donationId, status);
    }

    function getDonation(uint256 donationId) external view returns (Donation memory) {
        return donations[donationId];
    }
}

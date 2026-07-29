// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TrustFlow is Ownable {

    constructor(address initialOwner) Ownable(initialOwner) {}

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

        uint256 amount;
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

    event RecipientProofSubmitted(
        uint256 indexed donationId,
        string proofHash
    );

    event PublicationSubmitted(
        uint256 indexed donationId,
        string publicationHash
    );

    event VerificationUpdated(
        uint256 indexed donationId
    );

    function createDonation(
        address organisation,
        address recipient
    )
        external
        payable
    {
        require(msg.value > 0, "Donation must be greater than zero");

        donations[nextDonationId] = Donation({
            id: nextDonationId,
            donor: msg.sender,
            organisation: organisation,
            recipient: recipient,
            amount: msg.value,
            timestamp: block.timestamp,
            status: DonationStatus.Sent,
            recipientProofHash: "",
            recipientVerification: VerificationStatus.Pending,
            publicationHash: "",
            publicationVerification: VerificationStatus.Pending
        });

        emit DonationCreated(
            nextDonationId,
            msg.sender,
            organisation,
            recipient,
            msg.value
        );

        nextDonationId++;
    }

    function confirmReceipt(uint256 donationId) external {

        Donation storage donation = donations[donationId];

        require(msg.sender == donation.recipient);

        donation.status = DonationStatus.Received;

        payable(donation.recipient).transfer(donation.amount);

        emit RecipientConfirmed(donationId);
    }

    function submitRecipientProof(
        uint256 donationId,
        string calldata proofHash
    )
        external
    {
        Donation storage donation = donations[donationId];

        require(msg.sender == donation.recipient);

        donation.recipientProofHash = proofHash;

        emit RecipientProofSubmitted(
            donationId,
            proofHash
        );
    }

    function submitPublication(
        uint256 donationId,
        string calldata publicationHash
    )
        external
    {
        Donation storage donation = donations[donationId];

        require(msg.sender == donation.organisation);

        donation.publicationHash = publicationHash;

        emit PublicationSubmitted(
            donationId,
            publicationHash
        );
    }

    function verifyRecipientProof(
        uint256 donationId,
        VerificationStatus status
    )
        external
        onlyOwner
    {
        donations[donationId].recipientVerification = status;

        if(status == VerificationStatus.Verified){
            donations[donationId].status = DonationStatus.Verified;
        }

        emit VerificationUpdated(donationId);
    }

    function verifyPublication(
        uint256 donationId,
        VerificationStatus status
    )
        external
        onlyOwner
    {
        donations[donationId].publicationVerification = status;

        emit VerificationUpdated(donationId);
    }

    function getDonation(
        uint256 donationId
    )
        external
        view
        returns (Donation memory)
    {
        return donations[donationId];
    }
}
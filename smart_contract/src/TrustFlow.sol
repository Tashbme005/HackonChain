// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "forge-std/Script.sol";
contract TrustFlow is Ownable {
    IERC20 public immutable usdc;

    enum DonationStatus { Pending, Released }
    enum VerificationStatus { Pending, Verified, Flagged }

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
    event RecipientProofSubmitted(uint256 indexed donationId,string proofHash);
    event PublicationSubmitted(uint256 indexed donationId,string publicationHash);
    event RecipientVerificationUpdated(uint256 indexed donationId,VerificationStatus status);
    event PublicationVerificationUpdated(uint256 indexed donationId,VerificationStatus status);

    constructor(address usdcAddress,address initialOwner) Ownable(initialOwner){
        require(usdcAddress!=address(0),"Invalid USDC");
        usdc = IERC20(usdcAddress);
    }

    function createDonation(
        address organisation,
        address recipient,
        uint256 amount
    ) external {
        require(organisation!=address(0),"Invalid organisation");
        require(recipient!=address(0),"Invalid recipient");
        require(amount>0,"Amount must be >0");

        require(usdc.transferFrom(msg.sender,address(this),amount),"USDC transfer failed");

        donations[nextDonationId]=Donation({
            id:nextDonationId,
            donor:msg.sender,
            organisation:organisation,
            recipient:recipient,
            amountUSDC:amount,
            timestamp:block.timestamp,
            status:DonationStatus.Pending,
            recipientProofHash:"",
            recipientVerification:VerificationStatus.Pending,
            publicationHash:"",
            publicationVerification:VerificationStatus.Pending
        });

        emit DonationCreated(nextDonationId,msg.sender,organisation,recipient,amount);
        nextDonationId++;
    }

    function confirmReceipt(uint256 donationId) external {
        Donation storage d = donations[donationId];
        require(msg.sender==d.recipient,"Not recipient");
        require(d.status==DonationStatus.Pending,"Already released");

        d.status=DonationStatus.Released;
        require(usdc.transfer(d.recipient,d.amountUSDC),"USDC payout failed");

        emit RecipientConfirmed(donationId);
    }

    function submitRecipientProof(uint256 donationId,string calldata proofHash) external {
        Donation storage d = donations[donationId];
        require(msg.sender==d.recipient,"Not recipient");
        d.recipientProofHash=proofHash;
        emit RecipientProofSubmitted(donationId,proofHash);
    }

    function submitPublication(uint256 donationId,string calldata publicationHash) external {
        Donation storage d = donations[donationId];
        require(msg.sender==d.organisation,"Not organisation");
        d.publicationHash=publicationHash;
        emit PublicationSubmitted(donationId,publicationHash);
    }

    function updateRecipientVerification(uint256 donationId,VerificationStatus status) external onlyOwner {
        donations[donationId].recipientVerification=status;
        emit RecipientVerificationUpdated(donationId,status);
    }

    function updatePublicationVerification(uint256 donationId,VerificationStatus status) external onlyOwner {
        donations[donationId].publicationVerification=status;
        emit PublicationVerificationUpdated(donationId,status);
    }

    function getDonation(uint256 donationId) external view returns(Donation memory){
        return donations[donationId];
    }
}

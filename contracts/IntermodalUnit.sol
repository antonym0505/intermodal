// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ERC4907.sol";
import "./FacilityRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title IntermodalUnit - NFT representing shipping containers
/// @notice Implements dual-state possession model for container tracking
/// @dev Extends ERC4907 for owner/possessor separation with shipping-specific features
contract IntermodalUnit is ERC4907, Ownable {

    /// @notice Container metadata structure following ISO standards
    struct ContainerMetadata {
        string unitNumber;      // ISO 6346 container number (e.g., "MSCU1234567")
        string isoType;         // ISO 6346 type code (e.g., "22G1" = 20ft standard)
        string ownerCode;       // Owner prefix (e.g., "MSK", "MSC", "CMA")
        uint256 tareWeight;     // Empty weight in kg
        uint256 maxGrossWeight; // Maximum loaded weight in kg
        uint256 registeredAt;   // Registration timestamp
    }

    /// @notice Handoff status for possession transfers
    enum HandoffStatus {
        NONE,
        PENDING,
        CONFIRMED
    }

    /// @notice Pending handoff information
    struct PendingHandoff {
        address from;           // Current possessor
        address to;             // Intended next possessor
        uint64 expires;         // Handoff expiration
        uint256 initiatedAt;    // When handoff was initiated
        HandoffStatus status;   // Current status
    }

    /// @notice Reference to the facility registry
    FacilityRegistry public facilityRegistry;

    /// @notice Token ID counter
    uint256 private _tokenIdCounter;

    /// @notice Mapping from token ID to container metadata
    mapping(uint256 => ContainerMetadata) public containers;

    /// @notice Mapping from unit number to token ID
    mapping(string => uint256) public tokenIdByUnitNumber;

    /// @notice Mapping from token ID to pending handoff
    mapping(uint256 => PendingHandoff) public pendingHandoffs;

    /// @notice Emitted when a new container is registered
    event ContainerRegistered(
        uint256 indexed tokenId,
        string unitNumber,
        string ownerCode,
        address indexed owner
    );

    /// @notice Emitted when possession transfer is initiated
    event PossessionTransferInitiated(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint64 expires
    );

    /// @notice Emitted when possession is confirmed by the receiving facility
    event PossessionConfirmed(
        uint256 indexed tokenId,
        address indexed possessor,
        uint256 timestamp,
        string location
    );

    /// @notice Emitted when a handoff expires or is cancelled
    event HandoffCancelled(uint256 indexed tokenId, address indexed from, address indexed to);

    /// @notice Error when caller is not an authorized facility
    error NotAuthorizedFacility(address caller);

    /// @notice Error when container already exists
    error ContainerAlreadyExists(string unitNumber);

    /// @notice Error when handoff is invalid
    error InvalidHandoff(uint256 tokenId);

    /// @notice Error when handoff is not pending
    error HandoffNotPending(uint256 tokenId);

    constructor(
        address _facilityRegistry
    ) ERC4907("Intermodal Unit", "IMOD") Ownable(msg.sender) {
        facilityRegistry = FacilityRegistry(_facilityRegistry);
    }

    /// @notice Register a new container as an NFT
    /// @dev Only owner (shipping line) can mint new containers
    /// @param to Initial owner address (typically the shipping line)
    /// @param unitNumber ISO 6346 container number
    /// @param isoType ISO type code
    /// @param ownerCode Owner prefix code
    /// @param tareWeight Empty weight in kg
    /// @param maxGrossWeight Maximum gross weight in kg
    /// @return tokenId The ID of the newly minted token
    function registerContainer(
        address to,
        string calldata unitNumber,
        string calldata isoType,
        string calldata ownerCode,
        uint256 tareWeight,
        uint256 maxGrossWeight
    ) external onlyOwner returns (uint256 tokenId) {
        if (tokenIdByUnitNumber[unitNumber] != 0) {
            revert ContainerAlreadyExists(unitNumber);
        }

        _tokenIdCounter++;
        tokenId = _tokenIdCounter;

        containers[tokenId] = ContainerMetadata({
            unitNumber: unitNumber,
            isoType: isoType,
            ownerCode: ownerCode,
            tareWeight: tareWeight,
            maxGrossWeight: maxGrossWeight,
            registeredAt: block.timestamp
        });

        tokenIdByUnitNumber[unitNumber] = tokenId;

        _safeMint(to, tokenId);

        emit ContainerRegistered(tokenId, unitNumber, ownerCode, to);
    }

    /// @notice Initiate possession transfer to a facility
    /// @dev Can be called by owner or current possessor
    /// @param tokenId The container token ID
    /// @param toFacility The receiving facility address
    /// @param duration How long the possession should last (in seconds)
    function initiatePossessionTransfer(
        uint256 tokenId,
        address toFacility,
        uint64 duration
    ) external {
        require(_ownerOf(tokenId) != address(0), "IntermodalUnit: invalid token");
        
        // Caller must be owner or current possessor
        address currentOwner = ownerOf(tokenId);
        address currentPossessor = userOf(tokenId);
        
        require(
            msg.sender == currentOwner || msg.sender == currentPossessor,
            "IntermodalUnit: not authorized"
        );

        // Destination must be a registered and active facility
        if (!facilityRegistry.isFacility(toFacility)) {
            revert NotAuthorizedFacility(toFacility);
        }

        // Cancel any existing pending handoff
        if (pendingHandoffs[tokenId].status == HandoffStatus.PENDING) {
            emit HandoffCancelled(
                tokenId,
                pendingHandoffs[tokenId].from,
                pendingHandoffs[tokenId].to
            );
        }

        uint64 expires = uint64(block.timestamp + duration);
        address from = currentPossessor != address(0) ? currentPossessor : currentOwner;

        pendingHandoffs[tokenId] = PendingHandoff({
            from: from,
            to: toFacility,
            expires: expires,
            initiatedAt: block.timestamp,
            status: HandoffStatus.PENDING
        });

        emit PossessionTransferInitiated(tokenId, from, toFacility, expires);
    }

    /// @notice Confirm possession receipt (simulates NFC scan)
    /// @dev Must be called by the receiving facility
    /// @param tokenId The container token ID
    /// @param location Optional location identifier
    function confirmPossession(uint256 tokenId, string calldata location) external {
        PendingHandoff storage handoff = pendingHandoffs[tokenId];

        if (handoff.status != HandoffStatus.PENDING) {
            revert HandoffNotPending(tokenId);
        }

        if (msg.sender != handoff.to) {
            revert NotAuthorizedFacility(msg.sender);
        }

        if (block.timestamp > handoff.expires) {
            revert InvalidHandoff(tokenId);
        }

        // Update the ERC4907 user (possessor)
        _setUserInternal(tokenId, handoff.to, handoff.expires);

        handoff.status = HandoffStatus.CONFIRMED;

        emit PossessionConfirmed(tokenId, msg.sender, block.timestamp, location);
    }

    /// @notice Get container details by token ID
    /// @param tokenId The container token ID
    /// @return metadata The container metadata
    function getContainer(uint256 tokenId) external view returns (ContainerMetadata memory) {
        return containers[tokenId];
    }

    /// @notice Get container token ID by unit number
    /// @param unitNumber The ISO container number
    /// @return tokenId The token ID (0 if not found)
    function getTokenIdByUnitNumber(string calldata unitNumber) external view returns (uint256) {
        return tokenIdByUnitNumber[unitNumber];
    }

    /// @notice Get current possession info for a container
    /// @param tokenId The container token ID
    /// @return owner The legal owner
    /// @return possessor The current possessor (if any)
    /// @return possessionExpires When possession expires
    function getPossessionInfo(uint256 tokenId) external view returns (
        address owner,
        address possessor,
        uint256 possessionExpires
    ) {
        owner = ownerOf(tokenId);
        possessor = userOf(tokenId);
        possessionExpires = userExpires(tokenId);
    }

    /// @notice Get total number of registered containers
    /// @return count Total container count
    function getTotalContainers() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /// @notice Internal function to set user without authorization checks
    /// @dev Used by confirmPossession after validation
    function _setUserInternal(uint256 tokenId, address user, uint64 expires) internal {
        _users[tokenId].user = user;
        _users[tokenId].expires = expires;
        emit UpdateUser(tokenId, user, expires);
    }

    /// @notice Override to prevent clearing user on transfer (ownership changes don't affect possession)
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        // Call ERC721's _update directly, skipping ERC4907's user-clearing behavior
        return ERC721._update(to, tokenId, auth);
    }

    /// @notice Update facility registry address
    /// @param newRegistry New registry address
    function setFacilityRegistry(address newRegistry) external onlyOwner {
        require(newRegistry != address(0), "IntermodalUnit: zero address");
        facilityRegistry = FacilityRegistry(newRegistry);
    }
}

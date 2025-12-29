// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FacilityRegistry - Registry of authorized facilities
/// @notice Manages the whitelist of terminals, ports, depots, and vessels
/// @dev Facilities must be registered to receive container possession
contract FacilityRegistry is Ownable {
    /// @notice Types of facilities in the supply chain
    enum FacilityType {
        TERMINAL,   // Port terminal (e.g., APM Terminals)
        PORT,       // Port authority
        DEPOT,      // Container depot/storage
        VESSEL,     // Shipping vessel
        RAIL,       // Rail terminal
        TRUCK       // Trucking company
    }

    /// @notice Facility metadata
    struct Facility {
        string facilityCode;    // Unique identifier (e.g., "USLAX-APM")
        FacilityType facilityType;
        string name;            // Human-readable name
        string location;        // Physical location (e.g., "Los Angeles, CA")
        bool isActive;          // Whether facility can receive containers
        uint256 registeredAt;   // Registration timestamp
    }

    /// @notice Mapping from wallet address to facility info
    mapping(address => Facility) public facilities;
    
    /// @notice Mapping from facility code to wallet address
    mapping(string => address) public facilityByCode;
    
    /// @notice List of all registered facility addresses
    address[] public registeredFacilities;

    /// @notice Emitted when a new facility is registered
    event FacilityRegistered(
        address indexed facilityAddress,
        string facilityCode,
        FacilityType facilityType,
        string name
    );

    /// @notice Emitted when a facility is updated
    event FacilityUpdated(
        address indexed facilityAddress,
        string facilityCode,
        bool isActive
    );

    /// @notice Emitted when a facility is deactivated
    event FacilityDeactivated(address indexed facilityAddress, string facilityCode);

    constructor() Ownable(msg.sender) {}

    /// @notice Register a new facility
    /// @dev Only owner can register facilities
    /// @param facilityAddress The wallet address representing the facility
    /// @param facilityCode Unique facility identifier
    /// @param facilityType Type of facility
    /// @param name Human-readable name
    /// @param location Physical location
    function registerFacility(
        address facilityAddress,
        string calldata facilityCode,
        FacilityType facilityType,
        string calldata name,
        string calldata location
    ) external onlyOwner {
        require(facilityAddress != address(0), "FacilityRegistry: zero address");
        require(bytes(facilityCode).length > 0, "FacilityRegistry: empty code");
        require(bytes(facilities[facilityAddress].facilityCode).length == 0, "FacilityRegistry: already registered");
        require(facilityByCode[facilityCode] == address(0), "FacilityRegistry: code already exists");

        facilities[facilityAddress] = Facility({
            facilityCode: facilityCode,
            facilityType: facilityType,
            name: name,
            location: location,
            isActive: true,
            registeredAt: block.timestamp
        });

        facilityByCode[facilityCode] = facilityAddress;
        registeredFacilities.push(facilityAddress);

        emit FacilityRegistered(facilityAddress, facilityCode, facilityType, name);
    }

    /// @notice Update facility active status
    /// @param facilityAddress The facility to update
    /// @param isActive New active status
    function setFacilityActive(address facilityAddress, bool isActive) external onlyOwner {
        require(bytes(facilities[facilityAddress].facilityCode).length > 0, "FacilityRegistry: not registered");
        
        facilities[facilityAddress].isActive = isActive;
        
        emit FacilityUpdated(facilityAddress, facilities[facilityAddress].facilityCode, isActive);
    }

    /// @notice Check if an address is a registered and active facility
    /// @param facilityAddress The address to check
    /// @return True if the address is a registered and active facility
    function isFacility(address facilityAddress) external view returns (bool) {
        return facilities[facilityAddress].isActive;
    }

    /// @notice Check if an address is registered (regardless of active status)
    /// @param facilityAddress The address to check
    /// @return True if the address is registered
    function isRegistered(address facilityAddress) external view returns (bool) {
        return bytes(facilities[facilityAddress].facilityCode).length > 0;
    }

    /// @notice Get facility details by address
    /// @param facilityAddress The facility address
    /// @return Facility struct with all details
    function getFacility(address facilityAddress) external view returns (Facility memory) {
        return facilities[facilityAddress];
    }

    /// @notice Get facility address by code
    /// @param facilityCode The facility code
    /// @return The facility's wallet address
    function getFacilityByCode(string calldata facilityCode) external view returns (address) {
        return facilityByCode[facilityCode];
    }

    /// @notice Get total number of registered facilities
    /// @return Count of registered facilities
    function getFacilityCount() external view returns (uint256) {
        return registeredFacilities.length;
    }

    /// @notice Get all registered facility addresses
    /// @return Array of facility addresses
    function getAllFacilities() external view returns (address[] memory) {
        return registeredFacilities;
    }
}

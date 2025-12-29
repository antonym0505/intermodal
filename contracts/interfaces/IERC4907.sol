// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC165.sol";

/// @title ERC-4907: Rental NFT, an Extension of EIP-721
/// @dev See https://eips.ethereum.org/EIPS/eip-4907
interface IERC4907 is IERC165 {
    /// @notice Emitted when the `user` of an NFT or the `expires` of the `user` is changed
    event UpdateUser(uint256 indexed tokenId, address indexed user, uint64 expires);

    /// @notice Set the user and expires of an NFT
    /// @dev The zero address indicates there is no user
    /// Throws if `tokenId` is not valid NFT
    /// @param user The new user of the NFT
    /// @param expires UNIX timestamp, The new user could use the NFT before expires
    function setUser(uint256 tokenId, address user, uint64 expires) external;

    /// @notice Get the user address of an NFT
    /// @dev The zero address indicates that there is no user or the user is expired
    /// @param tokenId The NFT to get the user address for
    /// @return The user address for this NFT
    function userOf(uint256 tokenId) external view returns (address);

    /// @notice Get the user expires of an NFT
    /// @dev The zero value indicates that there is no user
    /// @param tokenId The NFT to get the user expires for
    /// @return The user expires for this NFT
    function userExpires(uint256 tokenId) external view returns (uint256);
}

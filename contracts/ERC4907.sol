// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./interfaces/IERC4907.sol";

/// @title ERC4907 - Rental NFT with User/Owner Separation
/// @notice Base implementation of EIP-4907 extending ERC721
/// @dev This separates "owner" (legal title holder) from "user" (current possessor)
abstract contract ERC4907 is ERC721, IERC4907 {
    struct UserInfo {
        address user;   // Address of the current user (possessor)
        uint64 expires; // UNIX timestamp when user rights expire
    }

    mapping(uint256 => UserInfo) internal _users;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /// @notice Set the user and expiration for an NFT
    /// @dev Only the owner or approved operator can set the user
    /// @param tokenId The NFT to set the user for
    /// @param user The new user address
    /// @param expires The expiration timestamp
    function setUser(uint256 tokenId, address user, uint64 expires) public virtual override {
        require(_isAuthorized(ownerOf(tokenId), msg.sender, tokenId), "ERC4907: caller is not owner nor approved");
        
        UserInfo storage info = _users[tokenId];
        info.user = user;
        info.expires = expires;
        
        emit UpdateUser(tokenId, user, expires);
    }

    /// @notice Get the current user of an NFT
    /// @dev Returns zero address if no user or user rights have expired
    /// @param tokenId The NFT to query
    /// @return The current user address
    function userOf(uint256 tokenId) public view virtual override returns (address) {
        if (uint256(_users[tokenId].expires) >= block.timestamp) {
            return _users[tokenId].user;
        }
        return address(0);
    }

    /// @notice Get the expiration timestamp for the user
    /// @param tokenId The NFT to query
    /// @return The expiration timestamp
    function userExpires(uint256 tokenId) public view virtual override returns (uint256) {
        return _users[tokenId].expires;
    }

    /// @notice Check if the contract supports an interface
    /// @param interfaceId The interface identifier
    /// @return True if supported
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC4907).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @dev Clear user info on transfer (optional behavior - can be overridden)
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = super._update(to, tokenId, auth);
        
        // Clear user info on transfer if desired (ownership change clears possession)
        if (from != to && _users[tokenId].user != address(0)) {
            delete _users[tokenId];
            emit UpdateUser(tokenId, address(0), 0);
        }
        
        return from;
    }
}

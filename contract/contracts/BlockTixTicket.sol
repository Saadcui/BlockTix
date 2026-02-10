// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlockTixTicket
 * @dev Implements Soulbound (IERC5192) and Platform Custody.
 */
contract BlockTixTicket is ERC721, ERC721URIStorage, ERC2981, Ownable {
    uint256 private _nextTokenId;

    mapping(uint256 => bool) public isRedeemed;
    mapping(uint256 => bool) private _isLocked;

    event TicketMinted(uint256 indexed tokenId, address indexed to, string uri);
    event TicketClaimed(uint256 indexed tokenId, address indexed from, address indexed to);
    event TicketRedeemed(uint256 indexed tokenId);
    
    // IERC5192 Events
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    constructor(address initialOwner) 
        ERC721("BlockTix Ticket", "BTIX") 
        Ownable(initialOwner)
    {}

    /**
     * @dev Check if a ticket is locked (Soulbound).
     */
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return _isLocked[tokenId];
    }

    /**
     * @dev Minting handles both Custodial and Direct-to-Wallet.
     * Items are Unlocked by default while in custody.
     */
    function mintTicket(
        address to,
        string memory uri,
        uint96 royaltyFeeNumerator
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        if (royaltyFeeNumerator > 0) {
            _setTokenRoyalty(tokenId, owner(), royaltyFeeNumerator);
        }

        emit TicketMinted(tokenId, to, uri);
        emit Unlocked(tokenId); // Custodial tickets are "unlocked" for platform resale
        return tokenId;
    }

    /**
     * @dev Move ticket from Platform Custody to User's MetaMask.
     * Becomes LOCKED (Soulbound) upon claiming.
     */
    function claimToWallet(uint256 tokenId, address userWallet) external onlyOwner {
        address currentOwner = ownerOf(tokenId);
        _isLocked[tokenId] = true;
        _transfer(currentOwner, userWallet, tokenId);
        emit TicketClaimed(tokenId, currentOwner, userWallet);
        emit Locked(tokenId);
    }

    /**
     * @dev Optional: Move ticket from User's MetaMask back to Custody for resale.
     * Becomes UNLOCKED again in custody.
     */
    function returnToCustody(uint256 tokenId) external onlyOwner {
        address currentOwner = ownerOf(tokenId);
        _isLocked[tokenId] = false;
        _transfer(currentOwner, owner(), tokenId);
        emit Unlocked(tokenId);
    }

    /**
     * @dev Mark ticket as used. Only the backend (gate) calls this.
     */
    function redeemTicket(uint256 tokenId) external onlyOwner {
        require(!isRedeemed[tokenId], "Already redeemed");
        isRedeemed[tokenId] = true;
        emit TicketRedeemed(tokenId);
    }

    // --- TRANSFER RESTRICTIONS ---

    /**
     * @dev Restricts transfers to the Platform Owner only.
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        virtual 
        override 
        returns (address) 
    {
        address from = _ownerOf(tokenId);
        
        // Allow Minting and Burn
        // Block all other transfers except those initiated by the Platform Owner
        if (from != address(0) && to != address(0) && msg.sender != owner()) {
            revert("BlockTix: Transfer restricted (Soulbound)");
        }

        return super._update(to, tokenId, auth);
    }

    // --- OVERRIDES ---

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC2981) returns (bool) {
        // Support for IERC5192 (Soulbound) interfaceId is 0xb45a3c0e
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlockTixTicket is ERC721, ERC721URIStorage, ERC2981, Ownable {
    uint256 private _nextTokenId;

    mapping(uint256 => bool) public isRedeemed;

    event TicketMinted(uint256 indexed tokenId, address indexed to, string uri);
    event TicketClaimed(uint256 indexed tokenId, address indexed from, address indexed to);
    event TicketRedeemed(uint256 indexed tokenId);

    constructor(address initialOwner) 
        ERC721("BlockTix Ticket", "BTIX") 
        Ownable(initialOwner)
    {}

    /**
     * @dev Minting handles both Custodial and Direct-to-Wallet.
     */
    function mintTicket(
        address to,
        string memory uri,
        uint96 royaltyFeeNumerator
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Ensure organizer always gets royalties
        if (royaltyFeeNumerator > 0) {
            _setTokenRoyalty(tokenId, owner(), royaltyFeeNumerator);
        }

        emit TicketMinted(tokenId, to, uri);
        return tokenId;
    }

    /**
     * @dev Move ticket from Platform Custody to User's MetaMask.
     */
    function claimToWallet(uint256 tokenId, address userWallet) external onlyOwner {
        address currentOwner = ownerOf(tokenId);
        _transfer(currentOwner, userWallet, tokenId);
        emit TicketClaimed(tokenId, currentOwner, userWallet);
    }

    /**
     * @dev Mark ticket as used. Only the backend (gate) calls this.
     */
    function redeemTicket(uint256 tokenId) external onlyOwner {
        require(!isRedeemed[tokenId], "Already redeemed");
        isRedeemed[tokenId] = true;
        emit TicketRedeemed(tokenId);
    }

    // --- TRANSFER RESTRICTIONS (THE LOCK) ---

    /**
     * @dev This is the ultimate guardrail. 
     * It blocks ALL transfers unless triggered by the Platform Owner.
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        virtual 
        override 
        returns (address) 
    {
        address from = _ownerOf(tokenId);
        
        // Allow Minting (from address 0)
        // Allow Platform Owner to facilitate transfers (Claiming / Resale)
        if (from != address(0) && msg.sender != owner()) {
            revert("Transfers restricted to BlockTix Platform");
        }

        return super._update(to, tokenId, auth);
    }

    // --- OVERRIDES ---

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
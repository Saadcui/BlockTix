// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlockTixTicket
 * @dev Specialized NFT contract for the BlockTix "Custody-First" ticketing system.
 * It supports custodial minting, claim-to-wallet transfers, and on-chain redemption status.
 */
contract BlockTixTicket is ERC721, ERC721URIStorage, ERC2981, Ownable {
    uint256 private _nextTokenId;

    // Track if a ticket has been scanned and redeemed at the gate
    mapping(uint256 => bool) public isRedeemed;

    event TicketMinted(uint256 indexed tokenId, address indexed to, string uri);
    event TicketClaimed(uint256 indexed tokenId, address indexed from, address indexed to);
    event TicketRedeemed(uint256 indexed tokenId);

    constructor(address initialOwner) 
        ERC721("BlockTix Ticket", "BTIX") 
        Ownable(initialOwner)
    {}

    /**
     * @dev Mint a new ticket NFT.
     * In the "Custody-First" flow, 'to' would typically be the platform's custodial wallet.
     * Only the platform owner (backend) can mint.
     */
    function mintToCustody(
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
        return tokenId;
    }

    /**
     * @dev Transfer a ticket from the platform's custodial wallet to a user's wallet.
     * This is used when a user clicks "Claim to Wallet".
     * Only the platform owner (backend) can trigger this transfer to ensure it's a valid claim.
     */
    function claimToWallet(uint256 tokenId, address userWallet) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        address currentOwner = ownerOf(tokenId);
        // We use _transfer (internal) to bypass approval requirements if the platform holds the keys.
        // However, standard transferFrom would also work if the custodial wallet approved the contract.
        _transfer(currentOwner, userWallet, tokenId);
        emit TicketClaimed(tokenId, currentOwner, userWallet);
    }

    /**
     * @dev Mark a ticket as redeemed/used at the gate.
     * This prevents the same NFT from being used for entry multiple times.
     * Only the platform owner (gate verifier backend) can call this.
     */
    function redeemTicket(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        require(!isRedeemed[tokenId], "Ticket already redeemed");
        isRedeemed[tokenId] = true;
        emit TicketRedeemed(tokenId);
    }

    /**
     * @dev Set default royalty for all tokens.
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    // The following functions are overrides required by mapping standard ERC extensions.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

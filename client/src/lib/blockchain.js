import { ethers } from "ethers";

const ABI = [
    "function mintTicket(address to, string memory uri, uint96 royaltyFeeNumerator) external returns (uint256)",
    "function claimToWallet(uint256 tokenId, address userWallet) external",
    "function redeemTicket(uint256 tokenId) external",
    "function returnToCustody(uint256 tokenId) external",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function isRedeemed(uint256 tokenId) public view returns (bool)",
    "function locked(uint256 tokenId) external view returns (bool)",
    "event TicketMinted(uint256 indexed tokenId, address indexed to, string uri)"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PLATFORM_CUSTODY_PRIVATE_KEY;
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL;

export async function getContract() {
    if (!CONTRACT_ADDRESS || !PRIVATE_KEY || !RPC_URL) {
        throw new Error("Missing blockchain configuration in environment variables");
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
}

export async function mintTicketNFT(toAddress, metadataUri, royaltyNumerator = 500) {
    const contract = await getContract();

    console.log(`Minting NFT to ${toAddress} with metadata ${metadataUri}...`);
    const tx = await contract.mintTicket(toAddress, metadataUri, royaltyNumerator);
    const receipt = await tx.wait();

    console.log("Transaction Receipt Status:", receipt.status);

    // Extract tokenId from event
    // In ethers v6, we parse logs via the contract interface
    const event = receipt.logs.map(log => {
        try {
            const parsed = contract.interface.parseLog(log);
            console.log("Parsed Log Name:", parsed.name);
            return parsed;
        } catch (e) {
            return null;
        }
    }).find(parsed => parsed && parsed.name === "TicketMinted");

    const tokenId = event ? event.args[0] : null;
    console.log("Extracted TokenID:", tokenId ? tokenId.toString() : "NULL");

    return {
        txHash: receipt.hash,
        tokenId: tokenId ? Number(tokenId) : null
    };
}

export async function claimNFT(tokenId, userWallet) {
    const contract = await getContract();
    const tx = await contract.claimToWallet(tokenId, userWallet);
    return await tx.wait();
}

export async function redeemNFT(tokenId) {
    const contract = await getContract();
    const tx = await contract.redeemTicket(tokenId);
    return await tx.wait();
}

export async function returnToCustody(tokenId) {
    const contract = await getContract();
    const tx = await contract.returnToCustody(tokenId);
    return await tx.wait();
}

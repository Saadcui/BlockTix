const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("BlockTixTicket Contract", function () {
    // 1. SETUP: Deploy the contract once for every test
    async function deployFixture() {
        const [deployer, user1, user2, custodialWallet] = await ethers.getSigners();

        const BlockTixTicket = await ethers.getContractFactory("BlockTixTicket");
        // Deploy with the deployer as the initial owner
        const ticketContract = await BlockTixTicket.deploy(deployer.address);

        return {
            ticketContract,
            deployer,
            user1,
            user2,
            custodialWallet
        };
    }

    // 2. DEPLOYMENT TESTS
    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            const { ticketContract, deployer } = await loadFixture(deployFixture);
            expect(await ticketContract.owner()).to.equal(deployer.address);
        });

        it("Should have correct name and symbol", async function () {
            const { ticketContract } = await loadFixture(deployFixture);
            expect(await ticketContract.name()).to.equal("BlockTix Ticket");
            expect(await ticketContract.symbol()).to.equal("BTIX");
        });
    });

    // 3. MINTING TESTS
    describe("Minting", function () {
        const tokenURI = "ipfs://test-ticket-metadata";
        const royaltyBPS = 500; // 5% (500 basis points)

        it("Should allow the owner to mint a ticket", async function () {
            const { ticketContract, deployer, user1 } = await loadFixture(deployFixture);

            // Call mintTicket
            await expect(ticketContract.connect(deployer).mintTicket(user1.address, tokenURI, royaltyBPS))
                .to.emit(ticketContract, "TicketMinted")
                .withArgs(0, user1.address, tokenURI);

            expect(await ticketContract.ownerOf(0)).to.equal(user1.address);
            expect(await ticketContract.tokenURI(0)).to.equal(tokenURI);
        });

        it("Should set correct royalty info (ERC2981)", async function () {
            const { ticketContract, deployer, user1 } = await loadFixture(deployFixture);

            await ticketContract.connect(deployer).mintTicket(user1.address, tokenURI, royaltyBPS);

            // Check royalty for a sale price of 10,000 wei
            const [receiver, amount] = await ticketContract.royaltyInfo(0, 10000);
            expect(receiver).to.equal(deployer.address); // Organizer (owner) gets royalties
            expect(amount).to.equal(500); // 5% of 10,000
        });

        it("Should fail if a non-owner tries to mint", async function () {
            const { ticketContract, user1, user2 } = await loadFixture(deployFixture);

            await expect(ticketContract.connect(user1).mintTicket(user2.address, tokenURI, royaltyBPS))
                .to.be.revertedWithCustomError(ticketContract, "OwnableUnauthorizedAccount");
        });
    });

    // 4. CLAIMING TESTS
    describe("Claiming (Custody to Wallet)", function () {
        const tokenURI = "ipfs://claim-test";

        async function mintedFixture() {
            const f = await deployFixture();
            // Mint token #0 to custodialWallet
            await f.ticketContract.connect(f.deployer).mintTicket(f.custodialWallet.address, tokenURI, 0);
            return f;
        }

        it("Should allow the owner to move a ticket from custody to user and LOCK it", async function () {
            const { ticketContract, deployer, custodialWallet, user1 } = await loadFixture(mintedFixture);

            await expect(ticketContract.connect(deployer).claimToWallet(0, user1.address))
                .to.emit(ticketContract, "TicketClaimed")
                .withArgs(0, custodialWallet.address, user1.address)
                .and.to.emit(ticketContract, "Locked")
                .withArgs(0);

            expect(await ticketContract.ownerOf(0)).to.equal(user1.address);
            expect(await ticketContract.locked(0)).to.be.true;
        });

        it("Should allow the owner to return a ticket to custody and UNLOCK it", async function () {
            const { ticketContract, deployer, user1 } = await loadFixture(mintedFixture);

            // Claim first
            await ticketContract.connect(deployer).claimToWallet(0, user1.address);
            expect(await ticketContract.locked(0)).to.be.true;

            // Return to custody
            await expect(ticketContract.connect(deployer).returnToCustody(0))
                .to.emit(ticketContract, "Unlocked")
                .withArgs(0);

            expect(await ticketContract.ownerOf(0)).to.equal(deployer.address);
            expect(await ticketContract.locked(0)).to.be.false;
        });
    });

    // 5. REDEMPTION TESTS
    describe("Redemption", function () {
        async function mintedFixture() {
            const f = await deployFixture();
            await f.ticketContract.connect(f.deployer).mintTicket(f.user1.address, "ipfs://redeem-test", 0);
            return f;
        }

        it("Should allow the owner to redeem a ticket", async function () {
            const { ticketContract, deployer } = await loadFixture(mintedFixture);

            expect(await ticketContract.isRedeemed(0)).to.be.false;

            await expect(ticketContract.connect(deployer).redeemTicket(0))
                .to.emit(ticketContract, "TicketRedeemed")
                .withArgs(0);

            expect(await ticketContract.isRedeemed(0)).to.be.true;
        });

        it("Should fail if ticket is already redeemed", async function () {
            const { ticketContract, deployer } = await loadFixture(mintedFixture);

            await ticketContract.connect(deployer).redeemTicket(0);

            await expect(ticketContract.connect(deployer).redeemTicket(0))
                .to.be.revertedWith("Already redeemed");
        });
    });

    // 6. TRANSFER RESTRICTION TESTS (THE LOCK)
    describe("Transfer Restrictions", function () {
        async function mintedFixture() {
            const f = await deployFixture();
            // Mint Token #0 to User1
            await f.ticketContract.connect(f.deployer).mintTicket(f.user1.address, "ipfs://lock-test", 0);
            return f;
        }

        it("Should BLOCK a regular user from transferring their own ticket", async function () {
            const { ticketContract, user1, user2 } = await loadFixture(mintedFixture);

            await expect(
                ticketContract.connect(user1).transferFrom(user1.address, user2.address, 0)
            ).to.be.revertedWith("BlockTix: Transfer restricted (Soulbound)");
        });

        it("Should support IERC5192 interface", async function () {
            const { ticketContract } = await loadFixture(deployFixture);
            expect(await ticketContract.supportsInterface("0xb45a3c0e")).to.be.true;
        });
    });
});

const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("BlockTixTicket Contract", function () {
    async function deployFixture() {
        const [deployer, user1, user2, custodialWallet] = await ethers.getSigners();

        const BlockTixTicket = await ethers.getContractFactory("BlockTixTicket");
        const ticketContract = await BlockTixTicket.deploy(deployer.address);

        return {
            ticketContract,
            deployer,
            user1,
            user2,
            custodialWallet
        };
    }

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

    describe("Minting", function () {
        const tokenURI = "ipfs://test-ticket-metadata";
        const royaltyBPS = 500; // 5%

        it("Should allow the owner to mint to a custodial wallet", async function () {
            const { ticketContract, deployer, custodialWallet } = await loadFixture(deployFixture);

            await expect(ticketContract.connect(deployer).mintToCustody(custodialWallet.address, tokenURI, royaltyBPS))
                .to.emit(ticketContract, "TicketMinted")
                .withArgs(0, custodialWallet.address, tokenURI);

            expect(await ticketContract.ownerOf(0)).to.equal(custodialWallet.address);
            expect(await ticketContract.tokenURI(0)).to.equal(tokenURI);
        });

        it("Should set corect royalty info", async function () {
            const { ticketContract, deployer, custodialWallet } = await loadFixture(deployFixture);

            await ticketContract.connect(deployer).mintToCustody(custodialWallet.address, tokenURI, royaltyBPS);

            const [receiver, amount] = await ticketContract.royaltyInfo(0, 10000);
            expect(receiver).to.equal(deployer.address);
            expect(amount).to.equal(500);
        });

        it("Should fail if a non-owner tries to mint", async function () {
            const { ticketContract, user1, custodialWallet } = await loadFixture(deployFixture);

            await expect(ticketContract.connect(user1).mintToCustody(custodialWallet.address, tokenURI, royaltyBPS))
                .to.be.revertedWithCustomError(ticketContract, "OwnableUnauthorizedAccount");
        });
    });

    describe("Claiming", function () {
        const tokenURI = "ipfs://claim-test";

        async function mintedFixture() {
            const f = await deployFixture();
            await f.ticketContract.connect(f.deployer).mintToCustody(f.custodialWallet.address, tokenURI, 0);
            return f;
        }

        it("Should allow the owner to transfer a ticket from custody to a user wallet", async function () {
            const { ticketContract, deployer, custodialWallet, user1 } = await loadFixture(mintedFixture);

            // The platform/owner calls claimToWallet to send it to user1
            await expect(ticketContract.connect(deployer).claimToWallet(0, user1.address))
                .to.emit(ticketContract, "TicketClaimed")
                .withArgs(0, custodialWallet.address, user1.address);

            expect(await ticketContract.ownerOf(0)).to.equal(user1.address);
        });

        it("Should fail if claiming a non-existent ticket", async function () {
            const { ticketContract, deployer, user1 } = await loadFixture(deployFixture);

            await expect(ticketContract.connect(deployer).claimToWallet(999, user1.address))
                .to.be.revertedWith("Ticket does not exist");
        });

        it("Should fail if non-owner tries to claim", async function () {
            const { ticketContract, user1 } = await loadFixture(mintedFixture);

            await expect(ticketContract.connect(user1).claimToWallet(0, user1.address))
                .to.be.revertedWithCustomError(ticketContract, "OwnableUnauthorizedAccount");
        });
    });

    describe("Redemption", function () {
        async function mintedFixture() {
            const f = await deployFixture();
            await f.ticketContract.connect(f.deployer).mintToCustody(f.custodialWallet.address, "ipfs://redeem-test", 0);
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
                .to.be.revertedWith("Ticket already redeemed");
        });

        it("Should fail if non-owner tries to redeem", async function () {
            const { ticketContract, user1 } = await loadFixture(mintedFixture);

            await expect(ticketContract.connect(user1).redeemTicket(0))
                .to.be.revertedWithCustomError(ticketContract, "OwnableUnauthorizedAccount");
        });
    });
});

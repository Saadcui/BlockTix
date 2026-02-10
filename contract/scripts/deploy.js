const fs = require('fs');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const BlockTixTicket = await ethers.getContractFactory("BlockTixTicket");
  const deployed = await BlockTixTicket.deploy(deployer.address);
  await deployed.waitForDeployment();

  const address = await deployed.getAddress();
  console.log("BlockTixTicket deployed to:", address);

  fs.writeFileSync('contract_address.txt', address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

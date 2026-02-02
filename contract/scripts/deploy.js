async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const BlockTixTicket = await ethers.getContractFactory("BlockTixTicket");
  const deployed = await BlockTixTicket.deploy(deployer.address);
  await deployed.waitForDeployment();

  console.log("BlockTixTicket deployed to:", await deployed.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

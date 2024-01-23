const { ethers, deployments } = require("hardhat")

async function main() {
  const fundMeDeployment = await deployments.get("FundMe")
  const fundMe = await ethers.getContractAt(
    fundMeDeployment.abi,
    fundMeDeployment.address
  )

  console.log(`Got contract FundMe at ${fundMe.address}`)
  console.log("Funding contract...")
  const transactionResponse = await fundMe.fund({
    value: ethers.parseEther("0.03"),
  })
  await transactionResponse.wait(1)
  console.log("Funded!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

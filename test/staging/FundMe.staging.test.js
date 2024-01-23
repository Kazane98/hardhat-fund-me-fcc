const { ethers, deployments, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.config.chainId)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe
      let deployer
      const sendValue = ethers.parseEther("0.03")

      beforeEach(async function () {
        const accounts = await ethers.getSigners()
        deployer = accounts[0].address

        // assuming we are on a test net, already deployed
        const fundMeDeployment = await deployments.get("FundMe")
        fundMe = await ethers.getContractAt(
          fundMeDeployment.abi,
          fundMeDeployment.address
        )
      })

      it("allows people to fund and withdraw", async function () {
        await fundMe.fund({ value: sendValue })
        await fundMe.withdraw()
        const endingBalance = await ethers.provider.getBalance(
          fundMe.getAddress()
        )
        assert.equal(endingBalance, 0)
      })
    })

const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async () => {
  let fundMe
  let deployer
  let mockV3Aggregator
  // const sendValue = ethers.utils.parseEther("1")
  const sendValue = ethers.parseEther("1")
  beforeEach(async () => {
    //Deplo FundMe contract
    //using hardhat deploy
    const accounts = await ethers.getSigners()
    deployer = accounts[0].address
    await deployments.fixture(["all"])
    // there is no getContract function in ethers, so using getContractAt
    const FundMeDeployment = await deployments.get("FundMe")
    fundMe = await ethers.getContractAt(
      FundMeDeployment.abi,
      FundMeDeployment.address
    )
    const MockV3AggregatorDeployment = await deployments.get("MockV3Aggregator")
    mockV3Aggregator = await ethers.getContractAt(
      MockV3AggregatorDeployment.abi,
      MockV3AggregatorDeployment.address
    )
  })

  describe("constructor", async function () {
    it("sets the aggregator addresses correctly", async function () {
      const response = await fundMe.getPriceFeed()
      assert.equal(response, mockV3Aggregator.target)
    })
  })

  describe("fund", function () {
    // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
    // could also do assert.fail
    it("Fails if you don't send enough ETH", async () => {
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      )
    })
    // we could be even more precise here by making sure exactly $50 works
    // but this is good enough for now
    it("Updates the amount funded data structure", async () => {
      await fundMe.fund({ value: sendValue })
      const response = await fundMe.getAddressToAmountFunded(deployer)
      assert.equal(response.toString(), sendValue.toString())
    })
    it("Adds funder to array of funders", async () => {
      await fundMe.fund({ value: sendValue })
      const funder = await fundMe.getFunder(0)
      assert.equal(funder, deployer)
    })
  })

  describe("withdraw", function () {
    beforeEach(async () => {
      await fundMe.fund({ value: sendValue })
    })

    it("Can withdraw ETH from a single founder", async () => {
      console.log("test")
      const startingFundMeBalance = await ethers.provider.getBalance(
        fundMe.getAddress()
      )
      console.log("test2")
      const startingDeployerBalance = await ethers.provider.getBalance(deployer)
      console.log(startingDeployerBalance, startingFundMeBalance)

      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait(1)

      const { gasUsed, gasPrice } = transactionReceipt
      const gasCost = gasUsed * gasPrice

      const endingFundMeBalance = await ethers.provider.getBalance(
        fundMe.getAddress()
      )
      const endingDeployerBalance = await ethers.provider.getBalance(deployer)

      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance + startingDeployerBalance,
        endingDeployerBalance + gasCost
      )
    })

    it("Can cheaperWithdraw ETH from a single founder", async () => {
      console.log("test")
      const startingFundMeBalance = await ethers.provider.getBalance(
        fundMe.getAddress()
      )
      console.log("test2")
      const startingDeployerBalance = await ethers.provider.getBalance(deployer)
      console.log(startingDeployerBalance, startingFundMeBalance)

      const transactionResponse = await fundMe.cheaperWithdraw()
      const transactionReceipt = await transactionResponse.wait(1)

      const { gasUsed, gasPrice } = transactionReceipt
      const gasCost = gasUsed * gasPrice

      const endingFundMeBalance = await ethers.provider.getBalance(
        fundMe.getAddress()
      )
      const endingDeployerBalance = await ethers.provider.getBalance(deployer)

      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance + startingDeployerBalance,
        endingDeployerBalance + gasCost
      )
    })

    it("allows us to withdraw with multiple funders", async function () {
      const accounts = await ethers.getSigners()
      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i])
        await fundMeConnectedContract.fund({ value: sendValue })
      }

      const startingFundMeBalance = await ethers.provider.getBalance(
        fundMe.getAddress()
      )
      const startingDeployerBalance = await ethers.provider.getBalance(deployer)

      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait(1)

      const { gasUsed, gasPrice } = transactionReceipt
      const gasCost = gasUsed * gasPrice

      const endingFundMeBalance = await ethers.provider.getBalance(
        fundMe.getAddress()
      )
      const endingDeployerBalance = await ethers.provider.getBalance(deployer)

      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance + startingDeployerBalance,
        endingDeployerBalance + gasCost
      )
      await expect(fundMe.getFunder(0)).to.be.reverted

      for (let i = 1; i < 6; i++) {
        assert.equal(await fundMe.getAddressToAmountFunded(accounts[i]), 0)
      }
    })

    it("cheaperWithdraw testing...", async function () {
      const accounts = await ethers.getSigners()
      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i])
        await fundMeConnectedContract.fund({ value: sendValue })
      }

      const startingFundMeBalance = await ethers.provider.getBalance(
        fundMe.getAddress()
      )
      const startingDeployerBalance = await ethers.provider.getBalance(deployer)

      const transactionResponse = await fundMe.cheaperWithdraw()
      const transactionReceipt = await transactionResponse.wait(1)

      const { gasUsed, gasPrice } = transactionReceipt
      const gasCost = gasUsed * gasPrice

      const endingFundMeBalance = await ethers.provider.getBalance(
        fundMe.getAddress()
      )
      const endingDeployerBalance = await ethers.provider.getBalance(deployer)

      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance + startingDeployerBalance,
        endingDeployerBalance + gasCost
      )
      await expect(fundMe.getFunder(0)).to.be.reverted

      for (let i = 1; i < 6; i++) {
        assert.equal(await fundMe.getAddressToAmountFunded(accounts[i]), 0)
      }
    })

    it("Only allows owner to withdraw", async function () {
      const accounts = await ethers.getSigners()
      const attacker = accounts[1]
      const attackerConnectedContract = await fundMe.connect(attacker)

      await expect(
        attackerConnectedContract.withdraw()
      ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
    })
  })
})

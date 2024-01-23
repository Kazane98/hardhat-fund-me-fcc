const { network } = require("hardhat")
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  //When localhost on hardhat network => use mock to replace chainlik ETH/USD price API
  if (developmentChains.includes(chainId)) {
    log("Local network detected, deploying mocks...")
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      args: [DECIMALS, INITIAL_ANSWER], // Put priceFeed here
      log: true,
    })
    log("Mocks deployed !")
    log("--------------------------------")
  }
}

module.exports.tags = ["all", "mocks"]

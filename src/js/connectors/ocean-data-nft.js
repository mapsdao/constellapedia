const {
  NftFactory,
  configHelperNetworks,
  ConfigHelper,
  Nft,
  setContractDefaults
} = require('@oceanprotocol/lib')
import web3 from './web3';

const INBOUND_KEY = 'inbound_addrs'
const OUTBOUND_KEY = 'outbound_addrs'


const getCurrentAccount = async () => {
  const accounts = await web3.eth.getAccounts();
  return accounts[0]; 
}

class Node extends Nft {
  constructor(nftAddress, web3, network, config) {
    super(web3, network, null, config)
    this.nftAddress = nftAddress
  }

  async name() {
    const nftContract = setContractDefaults(
      new this.web3.eth.Contract(this.nftAbi, this.nftAddress),
      this.config
    )
    return await nftContract.methods.name().call()
  }

  async symbol() {
    const nftContract = setContractDefaults(
      new this.web3.eth.Contract(this.nftAbi, this.nftAddress),
      this.config
    )
    return await nftContract.methods.symbol().call()
  }

  // ==== inbounds ====

  async getInboundAddrs() {
    return await this._getAddrs(INBOUND_KEY)
  }

  async addInboundNode(node) {
    await this.addInboundAddr(node.nftAddress)
  }
  
  async addInboundAddr(nodeAddress) {
    await this._addAddr(INBOUND_KEY, nodeAddress)
  }

  // ==== outbounds ====

  async getOutboundAddrs() {
    return await this._getAddrs(OUTBOUND_KEY)
  }

  async addOutboundNode(node) {
    await this.addOutboundAddr(node.nftAddress)
  }
  
  async addOutboundAddr(nodeAddress) {
    await this._addAddr(OUTBOUND_KEY, nodeAddress)
  }

  // ==== helpers ====

  async _getAddrs(key) {
    const s = await this.getNodeData(key)
    return s.split(' ')
  }

  async _addAddr(key, value) {
    const s = await this.getNodeData(key)
    if (s.includes(value)) {
      throw new Error(`${value} already exists in ${key}`)
    }
    await this.setNodeData(key, `${s} ${value}`)
  }

  async setNodeData(key, value) {
    // we need to updgrae @oceanprotocol/lib to support this
    // await this.setData(this.nftAddress, account, key, value)
  }

  async getNodeData(key) {
    // we need to updgrae @oceanprotocol/lib to support this
    // return await this.getData(this.nftAddress, key)
  }
}

class NodeFactory {
  async init() {
    const chainId = await web3.eth.getChainId()

    this.web3 = web3
    this.config = new ConfigHelper().getConfig(chainId)

    this.factory = new NftFactory(
      this.config?.erc721FactoryAddress,
      this.web3
    )
  }

  async newGoal(name) {
    const symbol = `GOAL-${this._randomNumber()}`
    return this._newNode(symbol, name)
  }

  async newProject(name) {
    const symbol = `PROJ-${this._randomNumber()}`
    return this._newNode(symbol, name)
  }

  async _newNode(symbol, name) {
    const account = await getCurrentAccount()

    const nftParamsAsset = {
      name: name,
      symbol: symbol,
      templateIndex: 1,
      tokenURI: 'https://oceanprotocol.com/nft/',
      transferable: true,
      owner: account
    }

    const nftAddress = await this.factory.createNFT(account, nftParamsAsset)

    const node = new Node(nftAddress, this.web3, this.network, this.config)
    await node.setNodeData(account, INBOUND_KEY, "")
    await node.setNodeData(account, OUTBOUND_KEY, "")
    return node
  }

  _randomNumber() {
    const random = Math.floor(Math.random() * 9999)
    return String(random).padStart(4, '0');
  }
}

module.exports.Node = Node
module.exports.NodeFactory = NodeFactory
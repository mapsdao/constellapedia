const {
  Aquarius,
  configHelperNetworks,
  ConfigHelper,
  generateDid,
  getHash,
  Nft,
  NftFactory,
  ProviderInstance,
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
  async newGoal(name) {
    const symbol = `GOAL-${this._randomNumber()}`
    return this._newNode(symbol, name, 'GOAL')
  }

  async newProject(name) {
    const symbol = `PROJ-${this._randomNumber()}`
    return this._newNode(symbol, name, 'PROJECT')
  }

  async _newNode(symbol, name, type) {
    const chainId = await web3.eth.getChainId()
    const config = new ConfigHelper().getConfig(chainId)

    const factory = new NftFactory(config.erc721FactoryAddress, web3)

    // get Metamask account
    const account = await getCurrentAccount()

    // create new nft
    const nftParamsAsset = {
      name: name,
      symbol: symbol,
      templateIndex: 1,
      tokenURI: 'https://oceanprotocol.com/nft/',
      transferable: true,
      owner: account
    }
    const nftAddress = await factory.createNFT(account, nftParamsAsset)

    // set ddo metadata
    const ddo = {
      '@context': ['https://w3id.org/did/v1'],
      id: generateDid(nftAddress, chainId),
      nftAddress,
      version: '4.1.0',
      chainId: chainId,
      metadata: {
        created: new Date().toISOString().replace(/\.[0-9]{3}Z/, 'Z'),
        updated: new Date().toISOString().replace(/\.[0-9]{3}Z/, 'Z'),
        type,
        name: symbol,
        description: name,
        tags: 'themap',
        author: 'TheMap',
        license: 'https://market.oceanprotocol.com/terms'
      },
      services: [
        {
          id: 'testFakeId',
          type: 'access',
          files: '',
          datatokenAddress: '0x0',
          serviceEndpoint: 'https://v4.provider.rinkeby.oceanprotocol.com',
          timeout: 0
        }
      ]
    }
    console.log(ddo)

    // encrypt ddo with provider service
    console.log(`Provider service URL: ${config.providerUri}`)
    const providerResponse = await ProviderInstance.encrypt(ddo, config.providerUri)
    const encryptedResponse = await providerResponse

    // validate ddo with aquarius service
    console.log(`Aquarius service URL: ${config.metadataCacheUri}`)
    const aquarius = new Aquarius(config.metadataCacheUri)
    const validateResult = await aquarius.validate(ddo)
    if (!validateResult.valid) {
      throw new Error('Could not validate metadata')
    }

    // set ddo metadata on nft
    const nft = new Nft(web3)
    await nft.setMetadata(
      nftAddress,
      account,
      0,
      config.providerUri,
      '',
      '0x2',
      encryptedResponse,
      validateResult.hash // '0x' + getHash(JSON.stringify(ddo))
    )

    // const aquarius = new Aquarius(config.metadataCacheUri)
    const resolvedDDO = await aquarius.waitForAqua(ddo.id)
    console.log(resolvedDDO)

    const node = new Node(nftAddress, web3, chainId, config)
    await node.setNodeData(account, INBOUND_KEY, "")
    await node.setNodeData(account, OUTBOUND_KEY, "")
    return node
  }

  _randomNumber() {
    const random = Math.floor(Math.random() * 9999)
    return String(random).padStart(4, '0');
  }
}

class NodeSearch {
  async querySearch(config, query, signal) {
    const aquarius = new Aquarius(config.metadataCacheUri)

    const path = aquarius.aquariusURL + '/api/aquarius/assets/query'

    try {
      const response = await fetch(path, {
        method: 'POST',
        body: JSON.stringify(query),
        headers: {
          'Content-Type': 'application/json'
        },
        signal: signal
      })

      if (response.ok) {
        return response.json()
      } else {
        throw new Error('querySearch failed: ' + response.status + response.statusText)
      }
    } catch (error) {
      throw new Error('Error querying metadata: ' + error)
    }
  }

  async search() {
    const chainId = await web3.eth.getChainId()
    const config = new ConfigHelper().getConfig(chainId)

    const searchQuery = {
      "query": {
        "bool": {
          "must": [
            {
              "bool": {
                "should": [
                  {
                    "query_string": {
                      "query": "(metadata.tags:\"themap\")",
                      "fields": ["metadata.tags"],
                      "default_operator": "AND"
                    } 
                  }
                ]
              }
            }
          ],
          "filter": [
            {
              "terms": {
                "chainId": [chainId]
              }
            },
            {
              "term": {
                "purgatory.state": false
              }
            }
          ]
        }
      },
      "size": 10000
    }
    const nodes = await this.querySearch(config, searchQuery)
    if (nodes.hits && nodes.hits.hits) {
      //return nodes.hits.hits.map(hit => hit._source)
      nodes.hits.hits.map(hit => console.log(hit._source))
    }

    console.log(nodes)
  }
}

module.exports.Node = Node
module.exports.NodeFactory = NodeFactory
module.exports.NodeSearch = NodeSearch
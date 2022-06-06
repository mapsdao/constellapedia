# Constellapedia Web3 conversion

## What is this?
A simplified version of [Constellapedia](https://github.com/domingosl/mapmaps), all references to web2 API, 
db connections and dependencies for non web3 relevant libraries have been removed for easy of use during the conversion
to the Ocean protocol.

## Project structure (mostly the relevant parts)
```console
.
├── src                             # source for the frontend
│   ├── img                         # Static image assets
│   ├── js                          # FE JS sources
│   │   ├── connectors              # Modules that provide the data to the app
│   │   │   ├── url-json            # Simple connector for fetching a JSON from a URL
│   │   │   └── ocean-data-nft.js   # Connector for the Ocean protocol (TODO)
│   │   ├── modals                  # UI Modals
│   │   └── visualizer-app.js       # The main FE application logic
│   ├── scss                        # Saas application styles
│   └── visualizer.html             # The visualizer entry point
│── server.js                       # Test server
└── json-example-data.json          # An example data json for the JSON URL connector
```

##

## How to Develop/Test
You'll need a host machine with NodeJS 15+

- Install dependencies
```bash
npm i
```
- Build the front end and keep a watcher for changes
```bash
npm run dev
```
This will create a folder named **public** with the FE code compiled in the root of the project 
and listen to changes in **/src**.

- Start an HTML server for serving the FE
```bash
npm run server
```

If everything went well, you should have a functioning auto reloading frontend in **http://127.0.0.1:8080/visualizer/foo**

## Where should I start?
In **/src/js/visualizer-app.js** look for comment "relevant001", you should see something like:
```javascript
const response = await jsonURLConnector('/json-test/foo.json');
```
This is the most basic connector, a JSON fetcher that downloads a JSON file from the Internet. That a look on how the interface
is defined and how simple is to fetch data to the FE.

## TODO
Take a look at the [Project page](https://github.com/orgs/mapsdao/projects/1)
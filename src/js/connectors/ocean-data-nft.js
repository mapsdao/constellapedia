import { NodeFactory, NodeSearch, connectWallet } from "themap-ocean.js";
const nodeSearch = new NodeSearch();


const goalColor = '#8fce00';
const projectTeamColor = '#ffd966';

module.exports.getData = async () => {

    try {
        await connectWallet();
    }
    catch (error) {
        return Promise.reject({ message: error.message || "Something went wrong" });
    }

    const nodes = [];
    const edges = [];

    const nodesFromOcean = await nodeSearch.searchAll();

    nodesFromOcean.forEach(node => {

        nodes.push({
            id: node.nftAddress,
            label: node.metadata.description,
            color: node.metadata.additionalInformation.type === 'goal' ? goalColor : projectTeamColor
        });

        const inboundEdges = node.metadata.additionalInformation.inbound_addrs ? node.metadata.additionalInformation.inbound_addrs.split(" ") : [];
        const outboundEdges = node.metadata.additionalInformation.outbound_addrs ? node.metadata.additionalInformation.outbound_addrs.split(" ") : [];

        inboundEdges.forEach(edge => {
            edges.push({
                from: edge,
                to: node.nftAddress,
                label: ""
            });
        });

        outboundEdges.forEach(edge => {
            edges.push({
                to: edge,
                from: node.nftAddress,
                label: ""
            });
        });

    });

    console.log(nodesFromOcean);
    return { nodes, edges };
};
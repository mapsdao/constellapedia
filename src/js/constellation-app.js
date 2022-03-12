const axios = require('axios');
const blockingLoader = require('./blocking-loader');
const selectNodeModal = require('../js/modals/select-node');
const helpers = require('../js/helpers');

import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Underline from "@editorjs/underline";
import Table from "@editorjs/table";
import Delimiter from "@editorjs/delimiter";

import 'animate.css';

angular.module('constellation', []).controller('main', async function ($scope, $timeout) {

    blockingLoader.show();
    blockingLoader.setProgress(0);

    $scope.drawPanelIsOpen = false;
    $scope.nodePanelIsOpen = false;

    $scope.toggleDrawOptionsPanel = () => {
        $scope.drawPanelIsOpen = !$scope.drawPanelIsOpen;
    };

    let nodeEditor;

    $scope.closeNodeOptionsPanel = () => {
        $scope.nodePanelIsOpen = false;
        nodeEditor.destroy();
    };

    $scope.openNodeOptionsPanel = async (nodeId) => {

        blockingLoader.show();

        const response = (await axios.get(process.env.API_BASEURL + '/nodes/' + nodeId)).data.data;

        $scope.formData.nodeId = nodeId;
        $scope.formData.nodeTitle = helpers.capitalize(response.name);
        $scope.formData.nodeEdges = response.edges;


        const content = JSON.parse(response.content);

        nodeEditor = new EditorJS({
            autofocus: false,
            placeholder: "Tell the story of this node...",
            data: Object.keys(content).length === 0 ? null : content,
            holder: "node-editor",
            onReady: () => {
            },
            tools: {
                header: Header,
                list: List,
                underline: Underline,
                delimiter: Delimiter,
                table: Table
            }
        });


        $timeout(()=> $scope.nodePanelIsOpen = true, 0);


        blockingLoader.hide();

    };

    $scope.saveNode = async () => {

        blockingLoader.show();
        await axios.put(process.env.API_BASEURL + '/nodes/' + $scope.formData.nodeId, {
            name: $scope.formData.nodeTitle,
            content: JSON.stringify(await nodeEditor.save()),
            edges: $scope.formData.nodeEdges
        });
        blockingLoader.hide();

        $timeout($scope.closeNodeOptionsPanel, 0);

    };

    $scope.removeEdge = async (index) => {
        $scope.formData.nodeEdges.splice(index, 1);
    };

    $scope.addNodeEdge = (direction) => {

        selectNodeModal.show(null, direction === 'from' ? "To node" : "From node", (node)=>{

            $timeout(()=>{
                $scope.formData.nodeEdges.push({
                    from: direction === 'from' ? { name: $scope.formData.nodeTitle, id: $scope.formData.nodeId} : { id: node.id, name: node.label },
                    to: direction === 'to' ? { name: $scope.formData.nodeTitle, id: $scope.formData.nodeId} : { id: node.id, name: node.label },
                    type: ''
                })
            });

        })


    };

    const response = (await axios.get(process.env.API_BASEURL + '/constellations/' + window.constellation)).data.data;

    const nodes = new vis.DataSet(response.nodes);
    const edges = new vis.DataSet(response.edges);

    const container = document.getElementById("constellation");

    const data = {
        nodes: nodes,
        edges: edges,
    };

    let constellation;
    const options = JSON.parse(window.options);

    $scope.formData = { options };
    $scope.formData.edgesLabel = !!$scope.formData.options.edges.font.size;

    function draw() {

        //blockingLoader.show();

        constellation = new vis.Network(container, data, $scope.formData.options);

        constellation.on("stabilizationProgress", function (params) {
            blockingLoader.setProgress(Math.round(100 * params.iterations / params.total));
        });

        constellation.once("stabilizationIterationsDone", function () {
            blockingLoader.hide();
        });

        constellation.on("selectNode", function (event) {
            console.log(event.nodes);
            $timeout(() => $scope.openNodeOptionsPanel(event.nodes[0]), 0);
        });

        constellation.on("doubleClick", function (e) {
            //alert("ddd")
        });

    }

    draw();

    $scope.redrawConstellation = () => $timeout(draw, 0);

    $scope.toggleEdgesLabel = () => $scope.formData.options.edges.font.size = $scope.formData.edgesLabel ? 15 : 0;


});


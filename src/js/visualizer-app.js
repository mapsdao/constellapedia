const axios = require('axios');
const blockingLoader = require('./blocking-loader');
const selectNodeModal = require('../js/modals/select-node');
const confirmModal = require('../js/modals/confirm-dialog');
const abstractModal = require('../js/modals/abstract');
const constellationTutModal = require('../js/modals/constellation-tut');
const helpers = require('../js/helpers');
const jsonURLConnector = require('./connectors/url-json');
const { NodeFactory }  = require('./connectors/ocean-data-nft');

import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Underline from "@editorjs/underline";
import Table from "@editorjs/table";
import Delimiter from "@editorjs/delimiter";

import 'animate.css';

angular.module('constellation', []).controller('main', [ '$scope', '$timeout' ,async function ($scope, $timeout) {

    blockingLoader.show();
    blockingLoader.setProgress(0);

    $scope.drawPanelIsOpen = false;
    $scope.nodePanelIsOpen = false;

    $scope.toggleDrawOptionsPanel = () => {
        $scope.drawPanelIsOpen = !$scope.drawPanelIsOpen;
    };

    let nodeEditor;

    $scope.snapshot = () => {
        const canvas = document.getElementsByTagName('canvas')[0];
        const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement('a');
        link.download = "constellapedia-snapshot.png";
        link.href = image;
        link.click();
    }

    $scope.jsonExport = () => {
        blockingLoader.show();
        window.location = process.env.API_BASEURL + '/constellations/' + window.constellation + "?download=json";
        blockingLoader.hide();
    }

    $scope.forkConstellation = () => {
        abstractModal.Alert("info", "We are still in this feature, stay tuned!", "Work in progress!");
    }

    $scope.closeNodeOptionsPanel = () => {
        $scope.nodePanelIsOpen = false;
        nodeEditor.destroy();
    };

    $scope.openNodeOptionsPanel = async (nodeId) => {

        blockingLoader.show();

        let content;

        if(nodeId) {

            const response = (await axios.get(process.env.API_BASEURL + '/nodes/' + nodeId)).data.data;

            $scope.formData.nodeId = nodeId;
            $scope.formData.nodeTitle = helpers.capitalize(response.name);
            $scope.formData.nodeEdges = response.edges;
            content = JSON.parse(response.content);
            $scope.formData.nodeType = response.type;
        }
        else {
            $scope.formData.nodeId = null;
            $scope.formData.nodeTitle = "";
            $scope.formData.nodeEdges = [];
            content = {};
        }

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

        try {
            // Test create node with OceanJS
            const nodeFactory = new NodeFactory();
            await nodeFactory.init();

            if (($scope.formData.nodeType !== '0') && ($scope.formData.nodeType !== '1')){
              throw new Error('Unknown node type');
            }
            if (!$scope.formData.nodeTitle) {
              throw new Error('You must specify a title');
            }

            if ($scope.formData.nodeId) {
              // update node
              alert('update node');
                /* await axios.put(process.env.API_BASEURL + '/nodes/' + $scope.formData.nodeId, {
                    name: $scope.formData.nodeTitle,
                    content: JSON.stringify(await nodeEditor.save()),
                    edges: $scope.formData.nodeEdges,
                    constellation: window.constellation
                }); */
            } else {
              // create node
              if ($scope.formData.nodeType === '0') {
                const newGoal = await nodeFactory.newGoal(
                  $scope.formData.nodeTitle
                )
              } else if ($scope.formData.nodeType === '1') {
                const newProject = await nodeFactory.newProject(
                  $scope.formData.nodeTitle
                )
              }
              /* await axios.post(process.env.API_BASEURL + '/nodes/', {
                  name: $scope.formData.nodeTitle,
                  content: JSON.stringify(await nodeEditor.save()),
                  edges: $scope.formData.nodeEdges,
                  constellation: window.constellation,
                  type: $scope.formData.nodeType
              }); */
            }
        }
        catch (e) {
            blockingLoader.hide();
            if(e.message) {
              abstractModal.Alert('warning', e.message, 'Error');
            } else {
                abstractModal.Alert('warning', e, 'Error');
            }

            return;
        }

        blockingLoader.hide();

        $timeout(()=>{ $scope.closeNodeOptionsPanel(); $scope.redrawConstellation(); }, 0);

    };

    $scope.deleteNode = () => {

        confirmModal.show(async ()=>{
            blockingLoader.show();
            try {
                await axios.delete(process.env.API_BASEURL + '/nodes/' + $scope.formData.nodeId + "?constellation=" + window.constellation);
            }
            catch (e) {

                blockingLoader.hide();
                if(e.response && e.response.data && e.response.data.code === 403)
                    abstractModal.Alert('warning', e.response.data.message, 'Error');

                return;
            }

            $scope.closeNodeOptionsPanel();
            $scope.redrawConstellation();
        });

    };

    $scope.removeEdge = async (index) => {
        $scope.formData.nodeEdges.splice(index, 1);
    };

    $scope.addNodeEdge = (direction) => {

        if(!$scope.formData.nodeTitle)
            return abstractModal.Toast('error', "A node title must be added first");

        selectNodeModal.show(window.constellation, direction === 'from' ? "To node" : "From node", (node)=>{

            $timeout(()=>{
                $scope.formData.nodeEdges.push({
                    from: direction === 'from' ? { name: $scope.formData.nodeTitle, id: $scope.formData.nodeId} : { id: node.id, name: node.label },
                    to: direction === 'to' ? { name: $scope.formData.nodeTitle, id: $scope.formData.nodeId} : { id: node.id, name: node.label },
                    type: 'IMPLIES_THAT'
                })
            });
        })
    };

    $scope.redrawConstellation = () => $timeout(draw, 0);

    $scope.toggleEdgesLabel = () => $scope.formData.options.edges.font.size = $scope.formData.edgesLabel ? 15 : 0;

    async function draw() {

        blockingLoader.show();

        $scope.drawPanelIsOpen = false;

        //relevant001
        const response = await jsonURLConnector('/json-test/foo.json');

        const nodes = new vis.DataSet(response.nodes);
        const edges = new vis.DataSet(response.edges);

        const container = document.getElementById("constellation");

        const data = {
            nodes: nodes,
            edges: edges,
        };

        let constellation;

        if(!$scope.formData)
            $scope.formData = {};

        if(!$scope.formData.options)
            $scope.formData = { options: JSON.parse(atob(window.options)) };

        $scope.formData.edgesLabel = !!$scope.formData.options.edges.font.size;

        constellation = new vis.Network(container, data, $scope.formData.options);

        constellation.on("stabilizationProgress", function (params) {
            blockingLoader.setProgress(Math.round(100 * params.iterations / params.total));
        });

        constellation.once("stabilizationIterationsDone", function () {
            blockingLoader.hide();
        });

        constellation.once("afterDrawing", function () {

            blockingLoader.hide();

            const isSmall = window.matchMedia ?
                window.matchMedia("screen and (max-width: 480px)") :
                screen.width<=670;

            !isSmall.matches && constellationTutModal.show();
        });

        constellation.on("doubleClick", function (event) {
            if(!event.nodes[0])
                $timeout(() => $scope.openNodeOptionsPanel(), 0);
            else
                $timeout(() => $scope.openNodeOptionsPanel(event.nodes[0]), 0);
        });

    }
    draw();
}]);
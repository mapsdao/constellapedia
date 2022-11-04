const blockingLoader = require('./blocking-loader');
const selectNodeModal = require('../js/modals/select-node');
const confirmModal = require('../js/modals/confirm-dialog');
const abstractModal = require('../js/modals/abstract');
const constellationTutModal = require('../js/modals/constellation-tut');
const helpers = require('../js/helpers');
const oceanConnector = require('./connectors/ocean-data-nft');

import 'animate.css';

angular.module('constellation', []).controller('main', ['$scope', '$timeout', async function ($scope, $timeout) {

    blockingLoader.show();
    blockingLoader.setProgress(0);

    $scope.drawPanelIsOpen = false;
    $scope.nodePanelIsOpen = false;

    $scope.toggleDrawOptionsPanel = () => {
        $scope.drawPanelIsOpen = !$scope.drawPanelIsOpen;
    };


    $scope.snapshot = () => {
        const canvas = document.getElementsByTagName('canvas')[0];
        const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement('a');
        link.download = "constellapedia-snapshot.png";
        link.href = image;
        link.click();
    }

    $scope.closeNodeOptionsPanel = () => {
        $scope.nodePanelIsOpen = false;
    };

    $scope.openNodeOptionsPanel = async (nodeId) => {

        blockingLoader.show();

        if (nodeId) {

            const node = await oceanConnector.getNode(nodeId);

            $scope.formData.nodeId = nodeId;
            $scope.formData.nodeName = node.metadata.name;
            $scope.formData.nodeTags = node.metadata.tags;
            $scope.formData.nodeTitle = node.metadata.description;
            $scope.formData.nodeEdges = [];
            $scope.formData.nodeType = node.metadata.additionalInformation.type;
        } else {
            $scope.formData.nodeId = null;
            $scope.formData.nodeTitle = "";
            $scope.formData.nodeName = "";
            $scope.formData.nodeTags = [];
            $scope.formData.nodeEdges = [];

        }


        $timeout(() => $scope.nodePanelIsOpen = true, 0);


        blockingLoader.hide();

    };

    $scope.saveNode = async () => {

        blockingLoader.show();
        console.log("$scope.formData", $scope.formData);

        if(!$scope.formData.nodeId)
            oceanConnector.saveNode($scope.formData.nodeType, $scope.formData.nodeTitle,
                (step, message) => {
                    console.log(step, message);
                    blockingLoader.setMessage(message);
                }, (node) => {
                    $scope.redrawConstellation();
                    $timeout(()=>{$scope.nodePanelIsOpen = false;}, 0);
                },
                (error) => {
                    blockingLoader.hide();
                    abstractModal.Alert("error", error.message || "Something went wrong, please try again", "Oh oh!");
                    console.log("FAIL", error);
                }
            );
        else {
            try {
                const node = await oceanConnector.getNode($scope.formData.nodeId);
                node.metadata.description = $scope.formData.nodeTitle;

                blockingLoader.setMessage("Updating node");


                await node.pushToAquarius();
                blockingLoader.hide();
                $scope.redrawConstellation();
                $timeout(() => {
                    $scope.nodePanelIsOpen = false;
                }, 0);
            }
            catch (error) {
                blockingLoader.hide();
                abstractModal.Alert("error", error.message || "Something went wrong, please try again", "Oh oh!");
            }
        }

    };

    $scope.deleteNode = () => {

        confirmModal.show(async () => {

            try {
                blockingLoader.show();
                const node = await oceanConnector.getNode($scope.formData.nodeId);
                node.metadata.additionalInformation.deleted = true;

                blockingLoader.setMessage("Deleting node");


                await node.pushToAquarius();
                blockingLoader.hide();
                $scope.redrawConstellation();
                $timeout(() => {
                    $scope.nodePanelIsOpen = false;
                }, 0);
            }
            catch (error) {
                blockingLoader.hide();
                abstractModal.Alert("error", error.message || "Something went wrong, please try again", "Oh oh!");
            }

        });

    };

    $scope.removeEdge = async (index) => {
        $scope.formData.nodeEdges.splice(index, 1);
    };

    $scope.addNodeEdge = (direction) => {

        if (!$scope.formData.nodeTitle)
            return abstractModal.Toast('error', "A node title must be added first");

        selectNodeModal.show(window.constellation, direction === 'from' ? "To node" : "From node", (node) => {

            $timeout(() => {
                $scope.formData.nodeEdges.push({
                    from: direction === 'from' ? {
                        name: $scope.formData.nodeTitle,
                        id: $scope.formData.nodeId
                    } : {id: node.id, name: node.label},
                    to: direction === 'to' ? {
                        name: $scope.formData.nodeTitle,
                        id: $scope.formData.nodeId
                    } : {id: node.id, name: node.label},
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

        try {
            const response = await oceanConnector.search();


            const nodes = new vis.DataSet(response.nodes);
            const edges = new vis.DataSet(response.edges);

            const container = document.getElementById("constellation");

            const data = {
                nodes: nodes,
                edges: edges,
            };

            let constellation;

            if (!$scope.formData)
                $scope.formData = {};

            if (!$scope.formData.options)
                $scope.formData = {options: require('./default-rendering-options')};

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
                    screen.width <= 670;

                !isSmall.matches && constellationTutModal.show();
            });


            constellation.on("doubleClick", function (event) {
                if (!event.nodes[0])
                    $timeout(() => $scope.openNodeOptionsPanel(), 0);
                else
                    $timeout(() => $scope.openNodeOptionsPanel(event.nodes[0]), 0);
            });

        } catch (error) {
            blockingLoader.hide();
            console.log(error);
            abstractModal.Alert("error", error.message, "Oh oh!");
        }
    }

    draw();


}]);
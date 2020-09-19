/*
    N O D E  S T A T U S

    the status of a node is ALWAYS determined by one of its own properties¹
        and/or querying the properties of its neighbors (and the neighbors neighbors, etc)        
        
    in other words, determining a node status SHOULD NEVER involve querying the network object,
        this should be left to whatever network rule is being executed by the status
        
    ¹ with the expection of the spawn status which is the very first status used to actually spawn nodes
        consequently is never is actually set on any node!
*/

// node status names as used in network settings
const Spawn = "Spawn"
const Isolated = "Isolated"
const ActiveEnd = "ActiveEnd"
const DeadEnd = "DeadEnd"
const EveryThird = "EveryThird"
const EveryFourth = "EveryFourth"
const EveryFifth = "EveryFifth"
const EverySixth = "EverySixth"
const NoAction = "NoAction"

// dictionary to link the node status names to actual functions
const NodeStatusMapping = {
    Isolated: IsolatedStatus,
    ActiveEnd: ActiveEndStatus,
    DeadEnd: DeadEndStatus,
    EveryThird: EveryThirdStatus,
    EveryFourth: EveryFourthStatus,
    EveryFifth: EveryFifthStatus,
    EverySixth: EverySixthStatus
}

// array filled with statuses as determined by network settings
let applicableStatus = []

//finally the dictionary build from network settings
const nodeStatuses = {
    initialize: function () {
        networkSettings.Rules.forEach(rule => {
            // spawn is never set on a node
            // noaction is a default once all other status rules have been exhausted
            if (rule.nodeStatus != Spawn && rule.nodeStatus != NoAction) {
                this[rule.nodeStatus] = []
                this[rule.nodeStatus] = NodeStatusMapping[rule.nodeStatus]
                applicableStatus.push(rule.nodeStatus)
            }
        })
    }
}

// the actual functions to determine a node status
function IsolatedStatus(node) {
    if (node.connections == 0) {
        return Isolated
    }
}

function ActiveEndStatus(node) {
    if (node.connections == 1 && node.isActive) {
        return ActiveEnd
    }
}

function DeadEndStatus(node) {
    if (node.connections == 1 && !node.isActive) {
        return DeadEnd
    }
}

function EveryThirdStatus(node) {
    if (node.NoC == 4 && node.neighbors.filter(n => n.NoC == 4).length == 2) {
        return EveryThird
    }
}

function EveryFourthStatus(node) {
    if (EveryThirdStatus(node) != undefined) {
        if (node.neighbors[0].neighbors.filter(n => n.NoC == 4).length == 2 &&
            node.neighbors[1].neighbors.filter(n => n.NoC == 4).length == 2) {
            return EveryFourth
        }
    }
}

function EveryFifthStatus(node) {
    if (EveryFourthStatus(node) != undefined) {
        if (node.neighbors[0].neighbors[0].neighbors.filter(n => n.NoC == 4).length == 2 &&
            node.neighbors[0].neighbors[1].neighbors.filter(n => n.NoC == 4).length == 2 &&
            node.neighbors[1].neighbors[0].neighbors.filter(n => n.NoC == 4).length == 2 &&
            node.neighbors[1].neighbors[1].neighbors.filter(n => n.NoC == 4).length == 2)  {
            return EveryFifth
        }
    }
}

function EverySixthStatus(node) {
    if (EveryFifthStatus(node) != undefined) {
        if (node.neighbors[0].neighbors[0].neighbors[0].neighbors.filter(n => n.NoC == 4).length == 2 &&
            node.neighbors[0].neighbors[0].neighbors[1].neighbors.filter(n => n.NoC == 4).length == 2 &&
            node.neighbors[0].neighbors[1].neighbors[0].neighbors.filter(n => n.NoC == 4).length == 2 &&
            node.neighbors[0].neighbors[1].neighbors[1].neighbors.filter(n => n.NoC == 4).length == 2 &&
            node.neighbors[1].neighbors[0].neighbors[0].neighbors.filter(n => n.NoC == 4).length == 2 &&
            node.neighbors[1].neighbors[0].neighbors[1].neighbors.filter(n => n.NoC == 4).length == 2 &&
            node.neighbors[1].neighbors[1].neighbors[0].neighbors.filter(n => n.NoC == 4).length == 2 &&            
            node.neighbors[1].neighbors[1].neighbors[1].neighbors.filter(n => n.NoC == 4).length == 2)  {
            return EverySixth
        }
    }
}
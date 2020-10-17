/*
    Here be Dragons . .
    
    The first and largest section of this file contains function declarations,
    so-called node rules which are triggered by a node status.
    The linking of node status and rule to exectute is done via network settings file, as key-value pair.

    Therefor a networkRules dictionary is build at the very end of this file. Before that a number of
    literal keys are defined for function names, meta rules, and rule properties. The latter two are
    used in network settings to define response curves, and used to build the responseCurve object in
    the respective file. 


    ----------------------

    N O D E R U L E S
       
    each network rule MUST have an execute AND debugDraw function, 
        and both functions MUST be passed a node ¹

        let rule = {
            execute : function(n ,i){},
            debugDraw : function(n){}
        }

    if a network rule calls on any method in Generator.js than it MUST define a config object, 
        and said config MUST contain generateNewPos(n,c) & getAngle(n,c) function both of 
        which are passed a node and the config, in that order  

    ¹ expect for SpawnNodes which is the very first rule and hence no node can be passed to execute.
    
*/

let SpawnNodesRule = {
    execute: function (seeds) {
        for (let i = 0; i < seeds; i++) {
            let config = {
                margin: networkSettings.centerMargin,
                width: network.width,
                height: network.height,
                generateNewPos: function (n, c) {
                    let x = random(c.margin, c.width - c.margin)
                    let y = random(c.margin, c.height - c.margin)
                    return createVector(x, y)
                },
                placeBridge: function (c) { return false },
                followShore: function (c) { return false }
            }
            let pos = checkForWater("", config)
            let newNode = new Node(pos);
            network.nodes.push(newNode)
            network.qtNodes.push(newNode.asQuadTreeObject())
        }
    },
    debugDraw: function (node) {
        let x = networkSettings.centerMargin
        let y = networkSettings.centerMargin
        let w = network.width - networkSettings.centerMargin
        let h = network.height - networkSettings.centerMargin
        noFill()
        stroke('red')
        rectMode(CORNERS)
        rect(x, y, w, h)
    }
}
let SproutNodesRule = {
    execute: function (node, iteration) {
        let config = network.getConfig()
        let sprouts = random(networkSettings.numberOfSprouts[0], networkSettings.numberOfSprouts[1])
        let theta = 360 / sprouts
        for (let i = 1; i <= sprouts; i++) {
            config.length = responseCurves[DefaultSegmentLength].getValue(0)
            config.deviation = random(networkSettings.sproutDeviation[0], networkSettings.sproutDeviation[1])
            config.theta = i * theta
            config.getAngle = function (n, c) {
                return radians(random(c.theta - c.deviation, c.theta + c.deviation))
            }
            checkNewPosAndAdd(node, config, network)
        }
    },
    debugDraw: function (node) {
        let debugRadius = 10
        // circle(node.pos.x, node.pos.y, this.debugRadius)
    }
}

let SpawnNSproutRule = {
    execute: function (seeds) {
        SpawnNodesRule.execute(seeds)
        network.nodes.forEach(n => {
            if (n.status == Isolated) {
                SproutNodesRule.execute(n, 0)
            }
        })

        while (network.nodes.filter(n => n.status == ActiveEnd).length > 0) {
            network.it++
            network.nodes.forEach(n => {
                n.setStatus()
                if (n.status == ActiveEnd) {
                    networkRules[n.status].execute(n, 0)
                }
            })
        }

        network.nodes.forEach(n => {
            if (n.status == DeadEnd) {
                networkRules[n.status].execute(n, network.nodes.length)
            }            
        })   
        print(network.nodes)
        // while (network.nodes.filter(n => n.status == EverySixth|| n.status == ActiveEnd).length > 0) {
        //     network.it++
        //     network.nodes.forEach(n => {
        //         n.setStatus()
        //         if (n.status == EverySixth || n.status == ActiveEnd) {
        //             networkRules[n.status].execute(n, network.nodes.length)
        //         }
        //     })
        // }

        // while (network.nodes.filter(n => n.status == EveryThird|| n.status == ActiveEnd).length > 0) {
        //     network.it++
        //     network.nodes.forEach(n => {
        //         n.setStatus()
        //         if (n.status == EveryThird || n.status == ActiveEnd) {
        //             networkRules[n.status].execute(n, network.nodes.length)
        //         }
        //     })
        // }

    },
    debugDraw: function () {
        // SpawnNodesRule.debugDraw()

        network.nodes.forEach(n => {

        })
    }
}

let NodeSpreadHeadingRule = {
    boundSize: 50,
    execute: function (node, iteration) {
        let config = network.getConfig()
        config.length = responseCurves[DefaultSegmentLength].getValue(iteration)
        config.deviation = responseCurves[SpreadHeading][Deviation].getValue(iteration)
        config.getAngle = function (n, c) {
            let heading = p5.Vector.sub(n.pos, n.neighbors[0].pos).heading()
            c.angle = heading + radians(random(-c.deviation, c.deviation))
            return c.angle
        }

        checkNewPosAndAdd(node, config, network)

        let newNode = node.neighbors.filter(n => n.status == ActiveEnd)[0]
        if (newNode != undefined) {
            if (newNode.pos.x < 0 || newNode.pos.x > network.width ||
                newNode.pos.y < 0 || newNode.pos.y > network.height) {
                newNode.isActive = false
            }
        }
    },

    debugDraw: function (node) {
        noFill()
        stroke('Gainsboro')
        let collider = node.getCollider(this.boundSize)
        rect(collider.x, collider.y, collider.width, collider.height)
    }
}


let NodeRandomSplitFollowRule = {
    execute: function (node, iteration) {
        let splitChance = responseCurves[HeadingSplitChance].getValue(iteration)
        let replaceRadius = networkSettings.replacementRadius
        if (ReplaceWithNearestNodeInRadius(node, replaceRadius)) {
            return
        } else {
            random(1) < splitChance ?
                NodeSplitHeadingRule.execute(node, iteration) :
                NodeFollowHeadingRule.execute(node, iteration)
        }
    },
    debugDraw: function (node) {
        noFill()
        stroke('Gainsboro')
        circle(node.pos.x, node.pos.y, this.replaceRadius * 2)
        let near = network.getNodesInRadius(node, this.replaceRadius)
        near.forEach(n => {
            stroke('red')
            circle(n.pos.x, n.pos.y, 5)
        })
    }
}
let NodeSplitHeadingRule = {
    execute: function (node, iteration) {
        let config = network.getConfig()
        config.split = 0 // meh not great       
        config.length = responseCurves[DefaultSegmentLength].getValue(iteration)
        config.deviation = responseCurves[SplitHeading][Deviation].getValue(iteration)
        config.getAngle = function (n, c) {
            let heading = p5.Vector.sub(n.pos, n.neighbors[0].pos).heading()
            let d = c.split == 0 ? radians(-c.deviation) : radians(c.deviation)
            c.angle = heading + d
            return c.angle
        }
        for (let i = 0; i < 2; i++) {
            checkNewPosAndAdd(node, config, network)
            config.split++
        }
    },
    debugDraw: function (node) {

    }
}
let NodeFollowHeadingRule = {
    execute: function (node, iteration) {
        let config = network.getConfig()
        config.length = responseCurves[DefaultSegmentLength].getValue(iteration)
        config.deviation = responseCurves[FollowHeading][Deviation].getValue(iteration)
        config.getAngle = function (n, c) {
            let heading = p5.Vector.sub(n.pos, n.neighbors[0].pos).heading()
            c.angle = heading + radians(random(-c.deviation, c.deviation))
            return c.angle
        }
        checkNewPosAndAdd(node, config, network)
    },

    debugDraw: function (node) {
        noFill()
        stroke('Gainsboro')
        // circle(node.pos.x, node.pos.y, this.getRadius(node) * 2)
    }
}
let NodeEndRule = {
    getRadius: function (node) {
        return node.pos.dist(node.neighbors[0].pos) + 1
    },
    execute: function (node, iteration) {
        ReplaceWithNearestNodeInRadius(node, this.getRadius(node))
    },
    debugDraw: function (node) {
        let near = network.getNodesInRadius(node, this.getRadius(node))
        noFill()
        stroke('red')
        circle(node.pos.x, node.pos.y, this.getRadius(node) * 2)
        near.forEach(n => {
            noStroke()
            fill('red')
            circle(n.pos.x, n.pos.y, 2)
        })
    }
}

let RandomLeftRightChanceRule = {
    execute: function (node, networkSize) {
        let value = responseCurves[RandomLeftRight][Chance].getValue(networkSize)
        let rng = random(100)
        if (rng <= value) {
            RandomLeftRightRule.execute(node, 2)
        }
    },
    debugDraw: function (node) {
    }
}

let RandomLeftRightRule = {
    execute: function (node, iteration) {
        let config = network.getConfig()
        config.rule = "rlr"
        config.length = responseCurves[DefaultSegmentLength].getValue(iteration)
        config.deviation = responseCurves[RandomLeftRight][Deviation].getValue(iteration)
        config.getAngle = function (n, c) {
            let heading = p5.Vector.sub(n.pos, n.neighbors[0].pos).heading()
            let a = responseCurves[RandomLeftRight][Angle].getValue(iteration)
            let lr = random(0, 2) >= 1 ? a : -a
            c.angle = heading + radians(lr) + radians(random(-c.deviation, c.deviation))
            return c.angle
        }
        checkNewPosAndAdd(node, config, network)
    },
    debugDraw: function (node) {
        noFill()
        stroke('green')
        circle(node.pos.x, node.pos.y, 15)
    }
}
let NodeNoActionRule = {
    execute: function (node, iteration) { },
    debugDraw: function (node) { }
}

// node rules
// function names as used in network settings. 
const SpawnNodes = "SpawnNodes"
const SproutNodes = "SproutNodes"
const SpawmNSproutNodes = "SpawnNSproutNodes"
const NodeRandomSplitFollow = "NodeRandomSplitFollow"
const SplitHeading = "SplitHeading"
const FollowHeading = "FollowHeading"
const SpreadHeading = "SpreadHeading"
const NodeDeadEnd = "NodeDeadEnd"
const RandomLeftRight = "RandomLeftRight"
const RandomLeftRightChance = "RandomLeftRightChance"
const Nothing = "Nothing"


// node rules
// properties for which a response curve can be defined
const Length = "length"
const Deviation = "deviation"
const Angle = "angle"
const Chance = "chance"

// meta rules 
// are used in network settings to define a response curve 
const HeadingSplitChance = "HeadingSplitChance"
const DefaultSegmentLength = "DefaultSegmentLength"

// dictionary to link the node rule functionNames to actual functions
const NodeRulesMapping = {
    SpawnNodes: SpawnNodesRule,
    SproutNodes: SproutNodesRule,
    SpawnNSproutNodes: SpawnNSproutRule,
    NodeRandomSplitFollow: NodeRandomSplitFollowRule,
    SplitHeading: NodeSplitHeadingRule,
    FollowHeading: NodeFollowHeadingRule,
    SpreadHeading: NodeSpreadHeadingRule,
    NodeDeadEnd: NodeEndRule,
    RandomLeftRight: RandomLeftRightRule,
    RandomLeftRightChance: RandomLeftRightChanceRule,
    Nothing: NodeNoActionRule,
}

//finally the dictionary which binds node status to node rule function
//and is build from network settings
const networkRules = {
    initialize: function () {
        networkSettings.Rules.forEach(rule => {
            this[rule.nodeStatus] = []
            this[rule.nodeStatus] = NodeRulesMapping[rule.functionName]
        })
    }
}


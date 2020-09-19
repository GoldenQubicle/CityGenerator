let networkSettings = {
    showCurves: false,
    hasRandomSeed: true,
    seed: 478000213157004, // the random generator seed
    hasRiver: false,
    iterations: 75, // the number of iterations after which the network is rendered
    iterations_CoT: 75, // the number of iterations for which response curve values are calculated. 
    centerMargin: 450, // note: depends on sketch dimensions, determines the bounds in which seeds are placed
    numberOfSeeds: [2, 2], // initial seeds, [min, max] rng
    numberOfSprouts: [2, 2], // sprouts per seed, [min, max] rng
    sproutLength: [12, 12], // [min, max] rng
    sproutDeviation: [12, 23], // sprout angle = TAU/numberOfSprouts +- deviation, [min, max] rng   
    replacementRadius: 2, //2 or more nodes within this radius will be replaced with 1  
    Rules: [
        {
            nodeStatus: "Spawn",
            functionName: "SpawnNodes"
        },
        {
            nodeStatus: "Isolated",
            functionName: "SproutNodes"
        },
        {
            nodeStatus: "ActiveEnd",
            functionName: "NodeRandomSplitFollow"
        },
        {
            nodeStatus: "DeadEnd",
            functionName: "NodeDeadEnd"
        },
        {
            nodeStatus: "EveryThird",
            functionName: "RandomLeftRight"
        },
        {
            nodeStatus: "NoAction",
            functionName: "Nothing"
        }

    ],
    FollowHeading: {
        length: {
            curveSettings: {
                maxResponsePoints : "iterations_CoT",
                range: { min: 0, max: 50 },
                bounds: {
                    lower: { start: 7, end: 12 },
                    upper: { start: 10, end: 17 }
                },
                controlPoints: {
                    one: { x: .5, y: .5 },
                    // two: { x: .75, y: .05 }
                },
                isParabola: false
            }
        },
        // followHeading angle = heading current node +- deviation rnd[lower, upper] 
        deviation: {
            curveSettings: {
                maxResponsePoints : "iterations_CoT",
                range: { min: 0, max: 30 },
                bounds: {
                    lower: { start: 15, end: 0 },
                    upper: { start: 30, end: 1 }
                },
                controlPoints: {
                    one: { x: .05, y: .78 },
                    two: { x: .5, y: .95 }
                },
                isParabola: false
            }
        }
    },
    SplitHeading: {
        length: {
            curveSettings: {
                maxResponsePoints : "iterations_CoT",
                range: { min: 0, max: 50 },
                bounds: {
                    lower: { start: 7, end: 12 },
                    upper: { start: 9, end: 35 }
                },
                controlPoints: {
                    one: { x: .5, y: 1.95 },
                    two: { x: .75, y: -1.5 }
                },
                isParabola: false
            }
        },
        //Split Heading angle = heading current node +- deviation rnd[lower, upper] 
        deviation: {
            curveSettings: {
                maxResponsePoints : "iterations_CoT",
                range: { min: 0, max: 100 },
                bounds: {
                    lower: { start: 25, end: 10 }, // minimum of 7.18, otherwise split ends will likely merge
                    upper: { start: 45, end: 17 }
                },
                controlPoints: {
                    one: { x: .5, y: .5 },
                    // two: { x: .5, y: .95 }
                },
                isParabola: false
            }
        }
    },
    HeadingSplitChance: {
        curveSettings: {
            maxResponsePoints : "iterations_CoT",
            range: { min: 0, max: .20 },
            bounds: {
                lower: { start: 0.0, end: 0.0 },
                // upper: { start: 0.20, end: 0.00125 }
            },
            controlPoints: {
                one: { x: .5, y: .5 },
                // two: { x: .975, y: .05 }
            },
            isParabola: false
        }
    },
    DefaultSegmentLength: {
        curveSettings: {
            maxResponsePoints : "iterations_CoT",
            range: { min: 0, max: 30 },
            bounds: {
                lower: { start: 5, end: 17 },
                upper: { start: 9, end: 30 }
            },
            controlPoints: {
                one: { x: .5, y: .5 },
                two: { x: .8, y: -.75 }
            },
            isParabola: false
        }
    },
    RandomLeftRight: {
        length: {
            curveSettings: {
                maxResponsePoints : "iterations_CoT",
                range: { min: 0, max: 50 },
                bounds: {
                    lower: { start: 7, end: 12 },
                    upper: { start: 10, end: 17 }
                },
                controlPoints: {
                    one: { x: .5, y: .5 },
                    // two: { x: .75, y: .05 }
                },
                isParabola: false
            }
        },
        //   // followHeading angle = heading current node +- deviation rnd[lower, upper] 
        deviation: {
            curveSettings: {
                maxResponsePoints : "iterations_CoT",
                range: { min: 0, max: 25 },
                bounds: {
                    lower: { start: 15, end: 0 },
                    upper: { start: 25, end: 0 }
                },
                controlPoints: {
                    one: { x: .05, y: .95 },
                    two: { x: 1, y: 0.75 }
                },
                isParabola: false
            }
        },
        angle: {
            curveSettings: {
                maxResponsePoints : "iterations_CoT",
                range: { min: 75, max: 90 },
                bounds: {
                    lower: { start: 75, end: 90 },
                    upper: { start: 80, end: 90 }
                },
                controlPoints: {
                    one: { x: .05, y: .5 },
                    two: { x: .5, y: .1 }
                },
                isParabola: false
            }
        }
    }
}
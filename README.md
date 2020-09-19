# City Generator
Trying my hand at procedural generation, inspired by the likes of [watawatabou](https://twitter.com/watawatabou) and [Dragons Abound](https://twitter.com/AboundDragons). Needless to say it nowhere near as fancy or pretty. Here's the generation process visualized, typically it just iterates and renders the end state. 

<img src="https://raw.githubusercontent.com/GoldenQubicle/CityGenerator/master/gifs/streetplan14.gif" width="512" height="512" />

Most of the settings can be configured via json. Parameter values can be made to change while the generation process chugs along to allow for variation. 

<img src="https://raw.githubusercontent.com/GoldenQubicle/CityGenerator/master/gifs/streetplan12.gif" width="557" height="260" />

The project is made with;

* [p5js](https://p5js.org)
* [geometric.js](https://github.com/HarryStevens/geometric) 
* [bezier.js](https://github.com/Pomax/bezierjs) 
* [quadtree-lib](https://github.com/elbywan/quadtree-lib) 


To see the project in action and play around;
* clone the repo
* checkout the [develop branch](https://github.com/GoldenQubicle/CityGenerator/tree/develop) 
* run it with your favorite server. I use the vs-code [LiveServer](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension. 
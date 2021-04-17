
// set the dimensions and bevolkingmargins of the graph
const bevolkingmargin = {top: 20, right: 20, bottom: 30, left: 50},
    // Get width from browser
    bevolkingwidth = bevolking.clientWidth - bevolkingmargin.left - bevolkingmargin.right,
    bevolkingheight = 500 - bevolkingmargin.top - bevolkingmargin.bottom;


// append the svg object to the body of the page
let bevolkingsvg = d3.select("#bevolking")
    .append("svg")
    .attr("width", bevolkingwidth + bevolkingmargin.left + bevolkingmargin.right)
    .attr("height", bevolkingheight + bevolkingmargin.top + bevolkingmargin.bottom);

// append an svg group to the svg within the bevolkingmargins
let bevolkinggroup = bevolkingsvg.append("g")
    .style("pointer-events", "all")
    .attr("transform",
        "translate(" + bevolkingmargin.left + "," + bevolkingmargin.top + ")");


// create a view rect to handle all mouse events
let bevolkingview = bevolkinggroup.append("rect")
    .attr("id", "viewport")
    // -1 width to fix undefined values
    .attr("width", bevolkingwidth-1)
    .attr("height", bevolkingheight)
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", "white")
    .style("pointer-events", "all");

// append an invisible tooltip div
let bevolkingtooltip = d3.select("#bevolking")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip");


(async function(){
    let bevolkingData = await d3.csv("../data/Bevolking.csv")
    console.log(bevolkingData);

})();

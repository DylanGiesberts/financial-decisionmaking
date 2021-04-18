
// set the dimensions and bevolkingmargins of the graph
let bevolkingmargin = {top: 20, right: 20, bottom: 30, left: 50},
    // Get width from browser
    bevolkingwidth = bevolking.clientWidth - bevolkingmargin.left - bevolkingmargin.right,
    bevolkingheight = 500 - bevolkingmargin.top - bevolkingmargin.bottom;

if (bevolking.clientWidth < 500) {
    bevolkingwidth = 400;
}

const color = ["lightgreen", "green", "lightblue", "blue", "lightgreen", "green", "lightblue", "blue"];
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
    let bevolkingData = await d3.csv("data/Bevolking.csv")

    const stack = d3.stack().keys(["0-20", "20-65", "65-80", "80+", "0-20p", "20-65p", "65-80p", "80+p"]);
    const stackedValues = stack(bevolkingData);
    const stackedData = [];

    // Copy the stack offsets back into the data.
    stackedValues.forEach((layer, index) => {
        const currentStack = [];
        layer.forEach((d, i) => {
        currentStack.push({
            values: d,
            year: bevolkingData[i].jaar
        });
        });
        stackedData.push(currentStack);
    });

    const yScale = d3.scaleLinear()
        .range([bevolkingheight, 0])
        .domain([0, d3.max(stackedValues[stackedValues.length - 1], dp => dp[1])]);

    const xScale = d3.scaleTime()
        .range([0, bevolkingwidth])
        .domain(d3.extent(bevolkingData, function(d) {
            return new Date(d.jaar, 0, 1);
        }));

    const area = d3.area()
        .x(function(d) { return xScale(new Date(d.year, 0, 1)) })
        .y0(function(d) { return yScale(d.values[0]); })
        .y1(function(d) { return yScale(d.values[1]); });

    const series = bevolkinggroup.selectAll(".series")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("class", "series");

    series.append("path")
        .style("fill", (d, i) => color[i])
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", "1.5")
        .attr("d", d => area(d));

    // Add the X Axis
    bevolkinggroup.append("g")
        .attr("transform", `translate(0,${bevolkingheight})`)
        .call(d3.axisBottom(xScale));

    // Add the Y Axis
    bevolkinggroup.append("g")
        .attr("transform", `translate(0, 0)`)
        .call(d3.axisLeft(yScale)); 
    
    bevolkingview.on("mouseout", function() {
        bevolkingtooltip.style("opacity", 0);
    })
    .on("mouseover", function() {
        bevolkingtooltip.style("opacity", 1);
    })
    .on("mousemove", function() {

        let x0 = xScale.invert(d3.pointer(event, this)[0]);
        
        let bisectDate = d3.bisector(function(d) { return new Date(d.jaar,1,1); }).right;

        i = bisectDate(bevolkingData, x0);

        bevolkingtooltip.html("time: " + x0 +
        "<br/>0-20: " + bevolkingData[i]["0-20"]);


    });
    
})();
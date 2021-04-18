
// set the dimensions and bevolkingmargins of the graph
let bevolkingmargin = {top: 20, right: 20, bottom: 30, left: 50},
    // Get width from browser
    bevolkingwidth = bevolking.clientWidth - bevolkingmargin.left - bevolkingmargin.right,
    bevolkingheight = 500 - bevolkingmargin.top - bevolkingmargin.bottom;

if (bevolking.clientWidth < 500) {
    bevolkingwidth = window.innerWidth-200;
}

const color = ["hsl(120, 73.4%, 74.9%)", "hsl(120, 60.8%, 50%)",
    "hsl(10, 100%, 65%)", "hsl(0, 100%, 50%)",
    "hsl(120, 73.4%, 85%)", "hsl(120, 60.8%, 60%)",
    "hsl(10, 100%, 75%)", "hsl(0, 100%, 65%)"];
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
let bevolkingviewleft = bevolkinggroup.append("rect")
    .attr("id", "viewportleft")
    .attr("width", 0.585*bevolkingwidth)
    .attr("height", bevolkingheight)
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", "white")
    .style("pointer-events", "all");

let bevolkingviewright = bevolkinggroup.append("rect")
.attr("id", "viewportright")
.attr("width", 0.415*bevolkingwidth)
.attr("height", bevolkingheight)
.attr("x", 0.585*bevolkingwidth)
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
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", "1")
        .attr("d", d => area(d));

    // Add the X Axis
    bevolkinggroup.append("g")
        .attr("transform", `translate(0,${bevolkingheight})`)
        .call(d3.axisBottom(xScale));

    // Add the Y Axis
    bevolkinggroup.append("g")
        .attr("transform", `translate(0, 0)`)
        .call(d3.axisLeft(yScale)); 

    // Line at the prognose transition
    let prognosetransition = bevolkinggroup.append("rect")
        .attr("x", 0.582*bevolkingwidth)
        .attr("y", 0)
        .attr("height", bevolkingheight)
        .attr("width", 6)
        .attr("class", "prognose-rect")

    bevolkinggroup.append("line")
        .attr("x1", 0.5875*bevolkingwidth)
        .attr("x2", 0.5875*bevolkingwidth)
        .attr("y1", yScale.range()[1])
        .attr("y2", yScale.range()[0])
        .attr("class", "prognose-line");

    bevolkinggroup.append("text")
        .attr("x", 0.6*bevolkingwidth)
        .attr("y", yScale.range()[1]+20)
        .attr("stroke", "grey")
        .attr("stroke-width", 0.5)
        .style("font-size", 12)
        .text("Prognose ->");
    
    bevolkingviewleft.on("mouseout", function() {
        bevolkingtooltip.style("opacity", 0);
    })
    .on("mouseover", function() {
        bevolkingtooltip.style("opacity", 1);
    })
    .on("mousemove", function() {

        let x0 = xScale.invert(d3.pointer(event, this)[0]);
        
        let bisectDate = d3.bisector(function(d) { return new Date(d.jaar,1,1); }).right;

        i = bisectDate(bevolkingData, x0);

        bevolkingtooltip.html(formatYear(x0) + "<b>" +
        "<div class='box box-0-20'>0-20: " + bevolkingData[i]["0-20"] + " mln</div>" +
        "<div class='box box-20-65'>20-65: " + bevolkingData[i]["20-65"] + " mln</div>" +
        "<div class='box box-65-80'>65-80: " + bevolkingData[i]["65-80"] + " mln</div>" +
        "<div class='box box-80plus'>80+: " + bevolkingData[i]["80+"] + " mln</div>"
        + "</b>")
            .style("left", (event.pageX) + 12 + "px")
            .style("top", (event.pageY - 28) + "px");
    });

    bevolkingviewright.on("mouseout", function() {
        bevolkingtooltip.style("opacity", 0);
    })
    .on("mouseover", function() {
        bevolkingtooltip.style("opacity", 1);
    })
    .on("mousemove", function() {

        let x0 = xScale.invert(d3.pointer(event, this)[0]);
        
        let bisectDate = d3.bisector(function(d) { return new Date(d.jaar,1,1); }).right;

        i = bisectDate(bevolkingData, x0);

        bevolkingtooltip.html(formatYear(x0) + "<b>" +
        "<div class='box box-0-20p'>0-20 prognose: " + bevolkingData[i]["0-20p"] + " mln</div>" +
        "<div class='box box-20-65p'>20-65 prognose: " + bevolkingData[i]["20-65p"] + " mln</div>" +
        "<div class='box box-65-80p'>65-80 prognose: " + bevolkingData[i]["65-80p"] + " mln</div>" +
        "<div class='box box-80plusp'>80+ prognose: " + bevolkingData[i]["80+p"] + " mln</div>"
        + "</b>")
            .style("left", (event.pageX) + 12 + "px")
            .style("top", (event.pageY - 28) + "px");
    });
    
})();
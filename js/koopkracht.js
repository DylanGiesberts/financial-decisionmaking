
// set the dimensions and koopkrachtmargins of the graph
let koopkrachtmargin = {top: 20, right: 20, bottom: 30, left: 50},
    // Get width from browser
    koopkrachtwidth = koopkracht.clientWidth - koopkrachtmargin.left - koopkrachtmargin.right,
    koopkrachtheight = 500 - koopkrachtmargin.top - koopkrachtmargin.bottom;

if (koopkracht.clientWidth < 500) {
    koopkrachtwidth = window.innerWidth-100;
}


// append the svg object to the body of the page
let koopkrachtsvg = d3.select("#koopkracht")
    .append("svg")
    .attr("width", koopkrachtwidth + koopkrachtmargin.left + koopkrachtmargin.right)
    .attr("height", koopkrachtheight + koopkrachtmargin.top + koopkrachtmargin.bottom);

// append an svg group to the svg within the koopkrachtmargins
let koopkrachtgroup = koopkrachtsvg.append("g")
    .style("pointer-events", "all")
    .attr("transform",
        "translate(" + koopkrachtmargin.left + "," + koopkrachtmargin.top + ")");


// create a view rect to handle all mouse events
let koopkrachtview = koopkrachtgroup.append("rect")
    .attr("id", "viewport")
    // -1 width to fix undefined values
    .attr("width", koopkrachtwidth-1)
    .attr("height", koopkrachtheight)
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", "white")
    .style("pointer-events", "all");

// append an invisible tooltip div
let koopkrachttooltip = d3.select("#koopkracht")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip");

// to parse Unix epoch to new Date object
const parseTime = d3.timeParse("%Q");

// to parse Date object to a more readable format
const formatTime = d3.timeFormat("%d-%m-%Y %H:%M");

// format to date
const formatDate = d3.timeFormat("%d-%m-%Y");

// Parse to month, year
const formatMonth = d3.timeFormat("%B %Y");

// parse to year only
const formatYear = d3.timeFormat("%Y");


(async function() {
    let koopkrachtData = await d3.csv("data/Koopkrachtontwikkeling.csv")

    // x scale based on time
    let koopkrachtx = d3.scaleTime()
    .domain(d3.extent(koopkrachtData, function(d) {
        return parseTime(+new Date(d.jaar, 0, 1)); 
    }))
    .range([ 0, koopkrachtwidth ]);

    // appending a bottom axis at x: 0, y: height
    koopkrachtgroup.append("g")
        .attr("transform", "translate(0," + koopkrachtheight + ")")
        .attr("id", "koopkrachtx-axis")
        .call(d3.axisBottom(koopkrachtx));

    // We save the min and max value of our closing price data, 'close', for later use below.
    let koopkrachtyScaleDomain = d3.extent(koopkrachtData, function(d) {
        return +d.totaleBevolking, +d.gepensioneerden; 
    });

    // to give our line 10 pixels padding, we will manipulate our scale domain, adding 10 to the max and min expected values. 
    let koopkrachtyScalePadding = 10;
    let koopkrachty = d3.scaleLinear()
        .domain([koopkrachtyScaleDomain[0] - koopkrachtyScalePadding, koopkrachtyScaleDomain[1] + koopkrachtyScalePadding])
        .range([ koopkrachtheight, 0 ]);


    // appending a left axis at x: 0, y: 0
    koopkrachtgroup.append("g")
    .attr("transform", "translate(0,0)")
    .attr("id", "koopkrachty-axis")
    .call(d3.axisLeft(koopkrachty));
    
    // append a grid-line
    let koopkrachtgridLine = koopkrachtgroup.append("line")
        .attr("y1", koopkrachty.range()[1])
        .attr("y2", koopkrachty.range()[0])
        .attr("class", "grid-line");

    // line function to parse our time and close datapoints through our scales
    const totalebevolkingline = d3.line()
        .x(function(d) { return koopkrachtx(parseTime(+new Date(d.jaar, 1, 1))); })
        .y(function(d) { return koopkrachty(d.totaleBevolking); });

    const pensioenline = d3.line()
        .x(function(d) { return koopkrachtx(parseTime(+new Date(d.jaar, 1, 1))); })
        .y(function(d) { return koopkrachty(d.gepensioneerden); });

    koopkrachtgroup.append("path")
        .data([koopkrachtData])
        .attr("id", "totalebevolkingline")
        .attr("class", "line")
        .attr("d", totalebevolkingline);

    koopkrachtgroup.append("path")
        .data([koopkrachtData])
        .attr("id", "pensioenline")
        .attr("class", "line")
        .attr("d", pensioenline);

    koopkrachtview.on("mouseout", function() {
        koopkrachtgridLine.style("opacity", 0);
        koopkrachttooltip.style("opacity", 0);
    })
    .on("mouseover", function() {
        koopkrachtgridLine.style("opacity", 1);
        koopkrachttooltip.style("opacity", 1);
    })
    .on("mousemove", function() {
        // invert the x coordinate to turn it back into a date object
        let x0 = koopkrachtx.invert(d3.pointer(event,this)[0])

        // create a bisector to get the index of our date
        let bisectDate = d3.bisector(function(d) { return +parseTime(+new Date(d.jaar,1,1)) }).right;

        // call the bisector to get our index
        i = bisectDate(koopkrachtData, x0);
        
        koopkrachttooltip.html(formatYear(x0) + "<b>" +
            "<div class='box box-totaal'>Totale bevolking: " + koopkrachtData[i].totaleBevolking + "</div>" + 
            "<div class='box box-gepensioneerden'>Gepensioneerden: " + koopkrachtData[i].gepensioneerden + "</div>"
            + "</b>")
            .style("left", (event.pageX) + 12 + "px")
            .style("top", (event.pageY - 28) + "px");
        
        koopkrachtgridLine.attr("x1", d3.pointer(event,this)[0]).attr("x2", d3.pointer(event,this)[0]);
    });

})();

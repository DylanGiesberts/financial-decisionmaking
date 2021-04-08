
// set the dimensions and margins of the graph
const margin = {top: 20, right: 20, bottom: 30, left: 50},
    // Get width from browser
    width = my_dataviz.clientWidth - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;



// append the svg object to the body of the page
let svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);


// append an svg group to the svg within the margins
let group = svg.append("g")
    .style("pointer-events", "all")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// create a view rect to handle all mouse events
let view = group.append("rect")
    .attr("id", "viewport")
    // -1 width to fix undefined values
    .attr("width", width-1)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", "white")
    .style("pointer-events", "all");

// append an invisible tooltip div
let tooltip = d3.select("#my_dataviz")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip");

// to parse Unix epoch to new Date object
const parseTime = d3.timeParse("%Q");

// to parse Date object to a more readable format
const formatTime = d3.timeFormat("%d-%m-%Y %H:%M");

document.getElementById("calculate").onclick = Calculate;

function ValidateForm() {
    // Grab values from form
    let initialInvestment = document.getElementById("initial-investment").value;
    let monthlyContribution = document.getElementById("monthly-contribution").value;
    let interestRate = document.getElementById("interest-rate").value;
    let interestYears = document.getElementById("interest-years").value;

    // Check values
    try {
        initialInvestment = Number(initialInvestment);
        monthlyContribution = Number(monthlyContribution);
        interestRate = Number(interestRate);
        interestYears = Number(interestYears);
    }
    catch (error) {
        
    }
}

function Calculate(){

    let investmentData = [];

    // Grab values from form
    let initialInvestment = Number(document.getElementById("initial-investment").value);
    let monthlyContribution = Number(document.getElementById("monthly-contribution").value);
    let interestRate = Number(document.getElementById("interest-rate").value)/100;
    let interestYears = Number(document.getElementById("interest-years").value);


    // Get current date
    let now = new Date();
    // Set start to 1st of next month
    let start = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    let end = new Date(start.getFullYear() + interestYears, start.getMonth(), 1)
    // Set up d3 timerange
    let timeRange = d3.timeMonth.range(start, end);

    for(i = 0; i < timeRange.length; i++){

        // Is dit overbodig?
        investmentData[i] = {};

        // Setting variables beforehand
        let interest = 0;
        let total = 0;
        let totalPrevMonth = 0;

        try {
            // Get prev month total if it exists
            totalPrevMonth = investmentData[i-1].total;
        }
        catch (error) {
            // Set total prev month to initial investment (only happens on 1st month)
            totalPrevMonth = initialInvestment;
        }

        // Monthly interest 
        interest = totalPrevMonth * (interestRate / 12);

        total = totalPrevMonth + monthlyContribution + interest;

        let obj = {
            unixtime: timeRange[i].getTime(),
            saved: initialInvestment + monthlyContribution * (i+1),
            interest: interest,
            total: total,
        }
        investmentData[i] = obj;
    }

    // eindwaardes (beetje scuffed?)
    let result = document.getElementById("result");
    result.innerHTML = `Total: ${investmentData[investmentData.length-1].total}<br/>
        Saved: ${investmentData[investmentData.length-1].saved}<br/>
        Total interest: ${investmentData[investmentData.length-1].total - investmentData[investmentData.length-1].saved}`;

    
    // Remove old graph
    d3.select("#totalline").remove();
    d3.select("#savedline").remove();
    d3.select("#x-axis").remove();
    d3.select("#y-axis").remove();


    // x scale based on time
    let x = d3.scaleTime()
    .domain(d3.extent(investmentData, function(d) {
        // if (compoundsMonthly) { return 01-xx-20xx }?
        // else { return 01-01-20xx }?
        return parseTime(+d.unixtime); 
    }))
    .range([ 0, width ]);

    // appending a bottom axis at x: 0, y: height
    group.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("id", "x-axis")
        .call(d3.axisBottom(x));

    // We save the min and max value of our closing price data, 'close', for later use below.
    let yScaleDomain = d3.extent(investmentData, function(d) {
        return +d.total; 
    });

    // to give our line 10 pixels padding, we will manipulate our scale domain, adding 10 to the max and min expected values. 
    let yScalePadding = 10;
    let y = d3.scaleLinear()
        .domain([yScaleDomain[0] - yScalePadding, yScaleDomain[1] + yScalePadding])
        .range([ height, 0 ]);

    // appending a left axis at x: 0, y: 0
    group.append("g")
    .attr("transform", "translate(0,0)")
    .attr("id", "y-axis")
    .call(d3.axisLeft(y));

    // append a grid-line
    let gridLine = group.append("line")
        .attr("y1", y.range()[1])
        .attr("y2", y.range()[0])
        .attr("class", "grid-line");

    // line function to parse our time and close datapoints through our scales
    const totalline = d3.line()
        .x(function(d) { return x(parseTime(+d.unixtime)); })
        .y(function(d) { return y(d.total); });

    const savedline = d3.line()
        .x(function(d) { return x(parseTime(+d.unixtime)); })
        .y(function(d) { return y(d.saved); });

    group.append("path")
        .data([investmentData])
        .attr("id", "totalline")
        .attr("class", "line")
        .attr("d", totalline);

    group.append("path")
        .data([investmentData])
        .attr("id", "savedline")
        .attr("class", "line")
        .attr("d", savedline);

    view.on("mouseout", function() {
        gridLine.style("opacity", 0);
        tooltip.style("opacity", 0);
    })
    .on("mouseover", function() {
        gridLine.style("opacity", 1);
        tooltip.style("opacity", 1);
    })
    .on("mousemove", function() {
        // invert the x coordinate to turn it back into a date object
        let x0 = x.invert(d3.pointer(event,this)[0])

        // create a bisector to get the index of our date
        let bisectDate = d3.bisector(function(d) { return parseTime(+d.unixtime) }).right;

        // call the bisector to get our index
        i = bisectDate(investmentData, x0);
        
        tooltip.html("time: " + formatTime(x0) + 
            "<br/>total: " + investmentData[i].total + 
            "<br/>saved: " + investmentData[i].saved)
            .style("left", (event.pageX) + 12 + "px")
            .style("top", (event.pageY - 28) + "px");
        
        gridLine.attr("x1", d3.pointer(event,this)[0]).attr("x2", d3.pointer(event,this)[0]);
    });
        
}
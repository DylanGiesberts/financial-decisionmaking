
// set the dimensions and calculatormargins of the graph
const calculatormargin = {top: 20, right: 20, bottom: 30, left: 50},
    // Get width from browser
    calculatorwidth = calculator.clientWidth - calculatormargin.left - calculatormargin.right,
    calculatorheight = 500 - calculatormargin.top - calculatormargin.bottom;



// append the svg object to the body of the page
let calculatorsvg = d3.select("#calculator")
    .append("svg")
    .attr("width", calculatorwidth + calculatormargin.left + calculatormargin.right)
    .attr("height", calculatorheight + calculatormargin.top + calculatormargin.bottom);


// append an svg group to the svg within the calculatormargins
let calculatorgroup = calculatorsvg.append("g")
    .style("pointer-events", "all")
    .attr("transform",
        "translate(" + calculatormargin.left + "," + calculatormargin.top + ")");

// create a view rect to handle all mouse events
let calculatorview = calculatorgroup.append("rect")
    .attr("id", "viewport")
    // -1 width to fix undefined values
    .attr("width", calculatorwidth-1)
    .attr("height", calculatorheight)
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", "white")
    .style("pointer-events", "all");

// append an invisible tooltip div
let calculatortooltip = d3.select("#calculator")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip");


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
    let calculatorstart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    let calculatorend = new Date(calculatorstart.getFullYear() + interestYears, calculatorstart.getMonth(), 1)
    // Set up d3 timerange
    let calculatortimeRange = d3.timeMonth.range(calculatorstart, calculatorend);

    for(i = 0; i < calculatortimeRange.length; i++){

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
            unixtime: calculatortimeRange[i].getTime(),
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
    d3.select("#calculatorx-axis").remove();
    d3.select("#calculatory-axis").remove();


    // x scale based on time
    let calculatorx = d3.scaleTime()
    .domain(d3.extent(investmentData, function(d) {
        // if (compoundsMonthly) { return 01-xx-20xx }?
        // else { return 01-01-20xx }?
        return parseTime(+d.unixtime); 
    }))
    .range([ 0, calculatorwidth ]);

    // appending a bottom axis at x: 0, y: height
    calculatorgroup.append("g")
        .attr("transform", "translate(0," + calculatorheight + ")")
        .attr("id", "calculatorx-axis")
        .call(d3.axisBottom(calculatorx));

    // We save the min and max value of our closing price data, 'close', for later use below.
    let calculatoryScaleDomain = d3.extent(investmentData, function(d) {
        return +d.total; 
    });

    // to give our line 10 pixels padding, we will manipulate our scale domain, adding 10 to the max and min expected values. 
    let calculatoryScalePadding = 10;
    let calculatory = d3.scaleLinear()
        .domain([calculatoryScaleDomain[0] - calculatoryScalePadding, calculatoryScaleDomain[1] + calculatoryScalePadding])
        .range([ calculatorheight, 0 ]);

    // appending a left axis at x: 0, y: 0
    calculatorgroup.append("g")
    .attr("transform", "translate(0,0)")
    .attr("id", "calculatory-axis")
    .call(d3.axisLeft(calculatory));

    // append a grid-line
    let calculatorgridLine = calculatorgroup.append("line")
        .attr("y1", calculatory.range()[1])
        .attr("y2", calculatory.range()[0])
        .attr("class", "grid-line");

    // line function to parse our time and close datapoints through our scales
    const totalline = d3.line()
        .x(function(d) { return calculatorx(parseTime(+d.unixtime)); })
        .y(function(d) { return calculatory(d.total); });

    const savedline = d3.line()
        .x(function(d) { return calculatorx(parseTime(+d.unixtime)); })
        .y(function(d) { return calculatory(d.saved); });

    calculatorgroup.append("path")
        .data([investmentData])
        .attr("id", "totalline")
        .attr("class", "line")
        .attr("d", totalline);

    calculatorgroup.append("path")
        .data([investmentData])
        .attr("id", "savedline")
        .attr("class", "line")
        .attr("d", savedline);

    calculatorview.on("mouseout", function() {
        calculatorgridLine.style("opacity", 0);
        calculatortooltip.style("opacity", 0);
    })
    .on("mouseover", function() {
        calculatorgridLine.style("opacity", 1);
        calculatortooltip.style("opacity", 1);
    })
    .on("mousemove", function() {
        // invert the x coordinate to turn it back into a date object
        let x0 = calculatorx.invert(d3.pointer(event,this)[0])

        // create a bisector to get the index of our date
        let bisectDate = d3.bisector(function(d) { return parseTime(+d.unixtime) }).right;

        // call the bisector to get our index
        i = bisectDate(investmentData, x0);
        
        calculatortooltip.html("time: " + formatTime(x0) + 
            "<br/>total: " + investmentData[i].total + 
            "<br/>saved: " + investmentData[i].saved)
            .style("left", (event.pageX) + 12 + "px")
            .style("top", (event.pageY - 28) + "px");
        
        calculatorgridLine.attr("x1", d3.pointer(event,this)[0]).attr("x2", d3.pointer(event,this)[0]);
    });
        
}
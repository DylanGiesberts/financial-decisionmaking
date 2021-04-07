
// set the dimensions and margins of the graph
const margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
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
.attr("width", width)
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
    let compoundsMonthly = document.getElementById("compound-frequency").value;

    // Check values
    try {
        initialInvestment = Number(initialInvestment);
        monthlyContribution = Number(monthlyContribution);
        interestRate = Number(interestRate);
        interestYears = Number(interestYears);
        compoundsMonthly = Number(compoundsMonthly);
    }
    catch (error) {
        
    }
}

function Calculate(){

    let investmentData = {};

    // Grab values from form
    let initialInvestment = Number(document.getElementById("initial-investment").value);
    let monthlyContribution = Number(document.getElementById("monthly-contribution").value);
    let interestRate = Number(document.getElementById("interest-rate").value)/100;
    let interestYears = Number(document.getElementById("interest-years").value);
    let compoundsMonthly = Boolean(Number(document.getElementById("compound-frequency").value));


    // Scuffed volgens stackoverflow maar date.now werkt niet?
    // Get current date
    let start = +new Date;
    // 31,556,926 seconds in a year, 31,556,926,000 milliseconds (javascript uses milliseconds)
    let end = start + (31556926000 * interestYears);
    // Set up d3 timerange based on unix time
    let timeRange = d3.timeMonth.range(start, end);

    for(i = 0; i < timeRange.length; i++){
        let monthKey = formatTime(timeRange[i]);
        investmentData[monthKey] = {};

        // Setting variables beforehand
        // let saved = initialInvestment + monthlyContribution * (i+1);
        let interest = 0;
        let total = 0;
        let totalPrevMonth = 0;

        try {
            // Get prev month total if it exists
            totalPrevMonth = investmentData[formatTime(timeRange[i-1])].total
        }
        catch (error) {
            // Set total prev month to initial investment (only happens on 1st month)
            totalPrevMonth = initialInvestment
        }

        // Monthly interest 
        if (compoundsMonthly) {
            interest = totalPrevMonth * (interestRate / 12);
        }

        // Yearly interest
        else {
            // Check if month is january
            if (timeRange[i].getMonth() == 0) {
                interest = totalPrevMonth * interestRate;
            }
        }

        total = totalPrevMonth + monthlyContribution + interest;

        let obj = {
            saved: initialInvestment + monthlyContribution * (i+1),
            interest: interest,
            total: total,
        }

        investmentData[monthKey] = obj;
       
    }
    console.log(investmentData)

    // Beetje scuffed tooltip prototype
    let result = document.getElementById("result");
    result.innerHTML = `Total: ${investmentData[formatTime(timeRange[timeRange.length-1])].total}<br/>
        Saved: ${investmentData[formatTime(timeRange[timeRange.length-1])].saved}<br/>
        Total interest: ${investmentData[formatTime(timeRange[timeRange.length-1])].total - investmentData[formatTime(timeRange[timeRange.length-1])].saved}`

    
}
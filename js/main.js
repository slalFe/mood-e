var h = 500;
var w = 700;
var headerHeight = 30;
var canvasheight = h - headerHeight;
var canvasPadding = 5;
var axisPadding = 50;
var ds;
var canvas;
var xScale;
var yScale;
var tooltip;
var points;

function buildHeader () {
	var svg = d3.select("body").append("svg")
		.attr("width", w)
		.attr("height", headerHeight);
		
	var title = svg.append("text")
		.attr("x", 25)
		.attr("y", 25)
		.text("Mega Mood Mashup");
}

function buildGraphArea () {
	canvas = d3.select("body").append("svg")
        .attr("width", w)
        .attr("height", h - headerHeight);
		
	var borderPath = canvas.append("rect")
		.attr("x", 0)
		.attr("y", 1)
		.attr("height", h - headerHeight - 1)
		.attr("width", w)
		.style("stroke", "blue")
		.style("fill", "none")
		.style("stroke-width", 1);
}

function buildTooltip () {
	tooltip = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 1e-6);
}

function buildScales (dates) {
	function getDate(d) {
		return d3.time.format("%d/%m/%Y").parse(d);
	}
	
	var minDate = d3.min(dates, function(d){ return getDate(d.Date); }),
		maxDate = d3.max(dates, function(d){ return getDate(d.Date); });
	xScale = d3.time.scale().domain([minDate, maxDate]).range([0, w - (axisPadding*2)]);
	
	var minMood = 0,
		maxMood = 10;
	yScale = d3.scale.linear().domain([maxMood, minMood]).range([axisPadding, canvasheight - axisPadding]);
}

function buildAxes (dates) {
	var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(d3.time.days);
	
	var yAxis = d3.svg.axis().scale(yScale).orient("left");
		
	var xAxisGroup = canvas.append("g")
		.attr("transform", "translate(" + axisPadding + "," + (canvasheight - axisPadding) + ")")
		.call(xAxis);
			
	var yAxisGroup = canvas.append("g")
		.attr("transform", "translate(" + axisPadding + ",0)")
		.call(yAxis);
}

function buildAverageLine (dates) {
  var showFeelings = d3.svg.line()
        .x(function (d) { return xScale(d3.time.format("%d/%m/%Y").parse(d.Date)) + axisPadding; })
        .y(function (d) { return yScale(d3.mean(d.Moods, function (mood) { return mood.Feeling; })); })
        .interpolate("linear");
  
  var vix = canvas.append("path")
        .attr("d", showFeelings(dates))
        .attr("stroke", "purple")
        .attr("stroke-width", 2)
        .attr("fill", "none");
}

function getFace (feeling) {
	return feeling < 7 ? "_angry" : "";
}

function buildIndividualLines (dates, name, colour) {
	function filterByName (d) {
		return d.Person === name;
	}
	
	var showFeelings = d3.svg.line()
        .x(function (d) { return xScale(d3.time.format("%d/%m/%Y").parse(d.Date)) + axisPadding; })
        .y(function (d) { return yScale(d3.mean(d.Moods.filter(filterByName), function (mood) { return mood.Feeling; })); })
        .interpolate("linear");
  
	var vix = canvas.append("path")
        .attr("d", showFeelings(dates))
        .attr("stroke", colour)
        .attr("stroke-width", 2)
        .attr("fill", "none");
		
	if (points == undefined) {
		points = canvas.selectAll("circle").data(dates).enter()
	}
		
	points.append("circle")
			.attr("cx", function (d) { return xScale(d3.time.format("%d/%m/%Y").parse(d.Date)) + axisPadding; })
			.attr("cy", function (d) { 
				return yScale(d3.mean(d.Moods.filter(filterByName), function (mood) { 
					return mood.Feeling; 
				}));
			})
			.attr("r", function (d) {
				var reason = d.Moods.filter(filterByName)[0].Reason;
				return reason != undefined ? 3 : 0;
			})
			.on("mouseover", function (d) {
				var reason = d.Moods.filter(filterByName)[0].Reason;
				if (reason != undefined) {
					tooltip
						.text(reason)
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 30) + "px")
						.style("background-image", "Url(./data/faces/" + name + getFace(d.Moods.filter(filterByName)[0].Feeling) + ".jpg)")
						.transition()
							.duration(500)
							.style("opacity", 1);
				}
			})
			.on("mouseout", function (d) {
				tooltip.transition()
					.duration(500)
					.style("opacity", 1e-6);
			});
}

(function () {
	buildHeader();
	buildGraphArea();
	buildTooltip();
	d3.json(".\\data\\moods.json", function (error, data) {
		if (error) {
			console.log(error);
		} else {
			console.log(data);
			ds = data;
		}
	
		buildScales(ds.Dates);
		buildAxes(ds.Dates);
		
		buildAverageLine(ds.Dates);
		buildIndividualLines(ds.Dates, "P", "green");
		buildIndividualLines(ds.Dates, "T", "pink");
	});
})();
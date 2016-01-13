var headerHeight = 30;
var canvasPadding = 50;
var axisPadding = 50;
var h;
var w;
var canvasHeight;
var canvasWidth;
var ds;
var canvas;
var xScale;
var yScale;
var tooltip;

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
        .attr("width", canvasWidth)
        .attr("height", canvasHeight)
		.attr("class", "mainCanvas");
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
	yScale = d3.scale.linear().domain([maxMood, minMood]).range([axisPadding, canvasHeight - axisPadding]);
}

function buildAxes (dates) {
	var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(d3.time.days);
	
	var yAxis = d3.svg.axis().scale(yScale).orient("left");
		
	var xAxisGroup = canvas.append("g")
		.attr("transform", "translate(" + axisPadding + "," + (canvasHeight - axisPadding) + ")")
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
		
	var points = canvas.selectAll("." + name + "-tooltip").data(dates).enter();
		
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
				var mood = d.Moods.filter(filterByName)[0];
				if (mood.Reason != undefined) {
					tooltip
						.text(mood.Reason)
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 30) + "px")
						.style("background-color", function () {
							switch (mood.Feeling) {
								case 10:
								case 9:
								case 8:
									return "#9f9";
								case 7:
								case 6:
								case 5:
								case 4:
									return "#6cf";
								default:
									return "#f99";
							};
						})
						.style("background-image", "Url(./data/faces/" + name + getFace(mood.Feeling) + ".jpg)")
						.style("background-size", "30px 30px")
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

function DestroyEverything () {
	d3.selectAll("svg").remove();
}

function DrawEverything() {
	DestroyEverything();
	
	h = window.innerHeight;
	w = window.innerWidth;
	canvasHeight = h - headerHeight - canvasPadding;
	canvasWidth = w - canvasPadding;
	
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
}

(function () {
	DrawEverything();
	window.onresize = DrawEverything;
})();
/* global d3 */
//Width and height
var width = 960;
var height = 600;

//Define map projection
var projection = d3.geoAlbers()
    .rotate([0,0])
    .center([8.3, 46.8])
    .scale(16000)
    .translate([width / 2, height / 2])
    .precision(.1);

//Define path generator
var path = d3.geoPath()
    .projection(projection);

//Define quantize scale to sort data values into buckets of color
//var color = d3.scaleQuantize()
                    //.range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);
                    //Colors derived from ColorBrewer, by Cynthia Brewer, and included in
                    //https://github.com/d3/d3-scale-chromatic
var color = d3.scaleQuantize()
    .range(d3.schemeGreens[9].slice(1,7));

var x = d3.scaleLinear()
    .rangeRound([600,800]);

var y = d3.scaleLinear()
    .rangeRound([600,800]);

var squash = function(x) {
    var value = Math.floor((""+x).length/3); 
    return value;
};

var sort_asc = function(x) {
    return x.sort(function (x, y) {
        return d3.ascending(+x.residents, +y.residents);
    })
};

var construct_value_array = function() {
    var value_array = [];
    for (var i = 0; i < 5; i++) {
        value_array.push(x.invert(640 + 40*i));
    }
    return value_array;
}

//Create SVG element
var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

//Load in agriculture data
d3.csv("Auslander_PermResidents.csv", function(data) {
    sortedAscending = sort_asc(data);

    //Set input domain for color scale
    //Used third quartile instead of max to make visualization more informative (a few districts had very high data points)
    color.domain([
        d3.min(data, function(d) { return +d.residents; }),
        d3.quantile(sortedAscending, 0.9, function(d) { return +d.residents;})
    ]);
    
    x.domain([
        d3.min(data, function(d) { return +d.residents; }),
        d3.quantile(sortedAscending, 0.9, function(d) { return +d.residents;})
    ]);
    
    
    //Load in GeoJSON data
    d3.json("Switzerland.json", function(json) {

        //Merge the population data and GeoJSON
        //Loop through once for each population data value
        for (var i = 0; i < data.length; i++) {

            //Grab state name
            var dataState = data[i].district;

            //Grab data value, and convert from string to float
            var dataValue = +data[i].residents;

            //Find the corresponding state inside the GeoJSON
            for (var j = 0; j < json.features.length; j++) {

                var jsonState = json.features[j].properties.NAME_2;

                if (dataState == jsonState) {

                    //Copy the data value into the JSON
                    json.features[j].properties.value = dataValue;

                    //Stop looking through the JSON
                    break;

                }
            }		
        }

        //Bind data and create one path per GeoJSON feature
        svg.selectAll("path")
           .data(json.features)
           .enter()
           .append("path")
           .attr("d", path)
           .style("stroke", 'grey')
           .style("fill", function(d) {
                //Get data value
                var value = d.properties.value;

                if (value) {
                    //If value exists…
                    return color(value);
                } else {
                    //If value is undefined…
                    return "#ccc";
                }
           });

        var g = svg.append("g")
            .attr("class", "key")
            .attr("transform", "translate(0,15)");

        g.selectAll("rect")
          .data(color.range().map(function(d) {
              d = color.invertExtent(d);
              return d;
            }))
          .enter().append("rect")
            .attr("height", 8)
            .attr("x", function(d, i) { return 600+(40 * i); })
            .attr("width", 40)
            .attr("fill", function(d) { return color(d[0]); });

        g.append("text")
            .attr("class", "caption")
            .attr("x", 600)
            .attr("y", -6)
            .attr("fill", "#000")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Non-native Permanent Residents");

        g.call(d3.axisBottom(x)
            .tickSize(13)
            .tickFormat(function(x) {
                return ">" + d3.format(".2s")(x);
            })
            .tickValues(construct_value_array()))
          .select(".domain")
            .remove();
    });
});

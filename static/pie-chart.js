function renderPieChart(data) {
    var width = 300
        height = 300
        margin = 40

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius = Math.min(width, height) / 2 - margin

    // append the svg object to the div called 'my_dataviz'
    var svg = d3.select("#my_dataviz")
    .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Create dummy data
    //var data = {confirmed: 100, deaths: 20, cured: 30, getting cured: 50, e:12}

    //var data = {a: 100, b: 20, c: 30, d: 50, e:12}
    //var data = {confirmed: 100, deaths: 20, cured: 30, getting_cured: 50}

    // set the color scale
    // set the color scale

    delete data["Confirmed"]
    var color = d3.scale.ordinal()
        .domain(data)
        .range(["#a62c2b", "#296e01", "#da680f"]);

    // Compute the position of each group on the pie:
    var pie = d3.layout.pie()
        .value(function(d) {return d.value; })
    var data_ready = pie(d3.entries(data))
    // Now I know that group A goes from 0 degrees to x degrees and so on.

    // shape helper to build arcs:
    var arcGenerator = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(radius)

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg.selectAll('mySlices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arcGenerator)
        .attr('fill', function(d){ return(color(d.data.key)) })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)

    // Now add the annotation. Use the centroid method to get the best coordinates
    svg.selectAll('mySlices')
        .data(data_ready)
        .enter()
        .append('text')
        .text(function(d){ return d.data.key})
        .attr("transform", function(d) { return "translate(" + arcGenerator.centroid(d) + ")";  })
        .style("text-anchor", "middle")
        .style("font-size", 17)

}
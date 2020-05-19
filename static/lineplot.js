function lineplot(data) {
    var margin = {top: 20, right: 20, bottom: 30, left: 70},
        width = 700 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    // parse the date / time
    var parseTime = d3.time.format("%m/%d/%y");

    // set the ranges
    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    // define the 1st line
    var valueline = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.deaths); });

    // define the 2nd line
    var valueline2 = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.confirmed); });

    var valueline3 = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.recovered); });
    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("#line_plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // Get the data
//    d3.csv("https://raw.githubusercontent.com/AparnaDutt/AparnaDutt/master/myfile.csv", function(error, data) {
//        console.log(data)
//      if (error) throw error;

        console.log(data)
      // format the data
      data.forEach(function(d) {
          d.date = parseTime.parse(d.date);
          d.deaths = +d.deaths;
          d.confirmed = +d.confirmed;
      });

      // Scale the range of the data
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) {
          return Math.max(d.deaths, Math.max(d.confirmed,d.recovered)); })]);

      // Add the valueline path.  deaths line
      svg.append("path")
          .data([data])
          .attr("class", "line")
          .attr("d", valueline);

      // Add the valueline2 path.   confirmed line
      svg.append("path")
          .data([data])
          .attr("class", "line")
          .style("stroke", "red")
          .attr("d", valueline2);


      // Add the valueline3 path.   recovered line
      svg.append("path")
          .data([data])
          .attr("class", "line")
          .style("stroke", "green")
          .attr("d", valueline3);


      // Add the X Axis
      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.svg.axis().scale(x))
           .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start");;

      // Add the Y Axis
      svg.append("g")
          .call(d3.svg.axis().scale(y).orient("left"));

//    });
}
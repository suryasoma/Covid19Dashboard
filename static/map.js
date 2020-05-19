function processWorldD(world, data) {
    var mapdata = {};
    var palette = ['#fd8d3c','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c', '#bd0026', '#800026'];
    var width = 500, height = 450;
    var minDocCount = 0, quantiles = {};
    // projection definitions
    var projection = d3.geo.mercator()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width/2, height/2])
        .precision(.1);
    var path = d3.geo.path().projection(projection);
    var graticule = d3.geo.graticule();

    // SVG related definitions
    var svg = d3.select("#world_map")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .style("margin-left", 50)
                    .style("margin-top", 50)
                    .style("margin-bottom", -150)
                    .append("g");

    var filter = svg.append('defs')
        .append('filter')
        .attr({'x':0, 'y':0, 'width':1, 'height':1, 'id':'gray-background'});
    filter.append('feFlood')
        .attr('flood-color', '#f2f2f2')
        .attr('result', 'COLOR');
    filter.append('feMorphology')
        .attr('operator', 'dilate')
        .attr('radius', '.9')
        .attr('in', 'SourceAlpha')
        .attr('result', 'MORPHED');
    filter.append('feComposite')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'MORPHED')
        .attr('result', 'COMP1');
    filter.append('feComposite')
        .attr('in', 'COMP1')
        .attr('in2', 'COLOR');
    
    svg.append("path")
        // .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);


        for(var idx=0; idx < data.aggregations.world_map.buckets.length; idx++) {
            var cCode = data.aggregations.world_map.buckets[idx].key.toUpperCase();
            var doc_count = data.aggregations.world_map.buckets[idx].doc_count;
            for(var wdx=0; wdx < world.objects.subunits.geometries.length; wdx++) {
                var cName = world.objects.subunits.geometries[wdx].id.toUpperCase();
                if (cCode === cName) {
                    world.objects.subunits.geometries[wdx].properties.doc_count = doc_count;
                }
            }
        }
        var subunits = topojson.feature(world, world.objects.subunits);
        subunits.features = subunits.features.filter(function(d){ return d.id !== "ATA"; });
        console.log('subunits',subunits);
        minDocCount = d3.min(subunits.features, function(d){ return d.properties.doc_count; });
        console.log('minDocCount',minDocCount);
        var doc_counts = subunits.features.map(function(d){ return d.properties.doc_count; });
        doc_counts = doc_counts.filter(function(d){ return d; }).sort(d3.ascending);
        //console.log('doc_counts',doc_counts);
        quantiles['0.95'] = d3.quantile(doc_counts, '0.95');
        quantiles['0.99'] = d3.quantile(doc_counts, '0.995');
        var countries = svg.selectAll('path.subunit')
            .data(subunits.features).enter();
        countries.insert('path', '.graticule')
            .attr('class', function(d) { return 'subunit ca'+d.id; })
            .style('fill', heatColor)
            .attr('d', path)
            .on('mouseover',mouseoverLegend).on('mouseout',mouseoutLegend)
            .on('click', coutryclicked);
        
        countries.append('svg:text')
            .attr('class', function(d){ return 'subunit-label la'+d.id+d.properties.name.replace(/[ \.#']+/g,''); })
            //.attr('transform', function(d) { return 'translate('+ path.centroid(d) +')'; })
            .attr('transform', function(d) { return 'translate('+(width-(5*d.properties.name.length))+','+(15)+')'; })
            .attr('dy', '.35em')
            .attr('filter', 'url(#gray-background)')
            .append('svg:tspan')
            .attr('x', 0)
            .attr('dy', 5)
            .text(function(d) { return d.properties.name; })
            .append('svg:tspan')
            .attr('x', 0)
            .attr('dy', 20)
            .text(function(d) { return d.properties.doc_count ? d.properties.doc_count : ''; });

//            svg.call(tooltip);
            var tooltip = d3.select("#world_map")
                .append("div")
                .style("position", "absolute")
                .style("z-index", "10")
                .style("visibility", "hidden")
                .style("background", "#ffffff")
                .text("a simple tooltip");

            function mouseoverLegend(datum, index) {
//                d3.selectAll('.subunit-label.la'+datum.id+datum.properties.name.replace(/[ \.#']+/g,''))
//                    .style('display', 'inline-block');
                tooltip.text(datum.properties.name + ":" + datum.properties.doc_count);
                d3.selectAll('.subunit.ca'+datum.id)
                    .style('fill', '#000000');
                return tooltip.style("visibility", "visible");
            }
            
            function mouseoutLegend(datum, index) {
//                d3.selectAll('.subunit-label.la'+datum.id+datum.properties.name.replace(/[ \.#']+/g,''))
//                    .style('display', 'none');
                d3.selectAll('.subunit.ca'+datum.id)
                    .style('fill', heatColor(datum));
                return tooltip.style("visibility", "hidden");
            }
            
            function coutryclicked(datum, index) {
                //filter event for this country should be applied here
                console.log('coutryclicked datum', datum);
                ajax_fx("http://127.0.0.1:5000/mapclick?countryname="+datum.properties.name+"#world_map")
            }
            function heatColor(d) {
                if (quantiles['0.95'] === 0 && minDocCount === 0) return '#F0F0F0';
                if (!d.properties.doc_count) return '#F0F0F0';
                if (d.properties.doc_count > quantiles['0.99']) return palette[(palette.length - 1)];
                if (d.properties.doc_count <= quantiles['0.99'] && d.properties.doc_count > quantiles['0.95']) return palette[(palette.length - 2)];
                if (quantiles['0.95'] == minDocCount) return palette[(palette.length-1)];
                var diffDocCount = quantiles['0.95'] - minDocCount;
                var paletteInterval = diffDocCount / palette.length;
                var diffDocCountDatum = quantiles['0.95'] - d.properties.doc_count;
                var diffDatumDiffDoc = diffDocCount - diffDocCountDatum;
                var approxIdx = diffDatumDiffDoc / paletteInterval;
                if (!approxIdx || Math.floor(approxIdx) === 0) approxIdx = 0;
                else approxIdx = Math.floor(approxIdx) - 1;
                return palette[approxIdx];
            }
}


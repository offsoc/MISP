var scope_id = $('#eventdistri_graph').data('event-id');
var event_distribution = $('#eventdistri_graph').data('event-distribution');
var extended_text = $('#eventdistri_graph').data('extended') == 1 ? true : false;
var spanOffset_orig = 15; // due to padding
var payload = {};
var distribution_chart;

function clickHandlerGraph(evt) {
	var firstPoint = distribution_chart.getElementAtEvent(evt)[0];
	var distribution_id;
	if (firstPoint) {
		var value = distribution_chart.data.datasets[firstPoint._datasetIndex].data[firstPoint._index];
		if (value == 0) {
			document.getElementById('attributesFilterField').value = "";
			filterAttributes('all', scope_id);
		} else {
			distribution_id = distribution_chart.data.distribution[firstPoint._index].value;
			var value_to_set = String(distribution_id);
			value_to_set += distribution_id == event_distribution ? '|' + '5' : '';
			document.getElementById('attributesFilterField').value = value_to_set;
			filterAttributes('distribution', scope_id);
		}
	}
}

function generate_additional_info(info) {
	if (info.length == 0) {
		return "";
	} else {
		var to_ret = "\n\nInvolved:\n";
		var sel = document.createElement('select');
		sel.classList.add('distributionInfo');
		for (var i of info) {
			var opt = document.createElement('option');
			opt.val = i;
			opt.innerHTML = i;
			sel.appendChild(opt);
		}
		return to_ret += sel.outerHTML;
	}
}

function clickHandlerPbText(evt) {
	var distribution_id = evt.target.dataset.distribution;
	var value_to_set = String(distribution_id);
	value_to_set += distribution_id == event_distribution ? '|' + '5' : '';
	document.getElementById('attributesFilterField').value = value_to_set;
	filterAttributes('distribution', scope_id);
}
function clickHandlerPb(evt) {
	var distribution_id = evt.target.dataset.distribution;
	var distribution_id = $(evt.target).data('distribution');
	var value_to_set = String(distribution_id);
	document.getElementById('attributesFilterField').value = value_to_set;
	filterAttributes('distribution', scope_id);
}

function fill_distri_for_search(start_distri, end_distri) {
	var to_ret = "";
	for (var i=start_distri; i<end_distri; i++) {
		to_ret += String(i) + "|";
		to_ret += i==event_distribution ? "5|" : "";
	}
	to_ret += String(end_distri);
	to_ret += end_distri==event_distribution ? "|5" : "";
	return to_ret;
}

// true distri -> pb distri
function get_adjusted_from_true_distri(distribution) {
	if (distribution == 0) {
		return 0;
	} else if (distribution == 1) {
		return 1;
	} else if (distribution == 2) {
		return 3;
	} else if (distribution == 3) {
		return 4;
	} else if (distribution == 4) {
		return 2;
	} else if (distribution == 5) {
		return event_distribution;
	} else {
		return;
	}
}

// pb distri -> true distri
function get_adjusted_from_pb(distribution) {
	if (distribution == 0) {
		return 0;
	} else if (distribution == 1) {
		return 1;
	} else if (distribution == 2) {
		return 4;
	} else if (distribution == 3) {
		return 2;
	} else if (distribution == 4) {
		return 3;
	} else {
		return;
	}
}

function get_maximum_distribution(array) {
	var org = array[0];
	var community = array[1];
	var connected = array[2];
	var all = array[3];
	var sharing = array[4];
	if (all != 0) {
		return 3;
	} else if (connected != 0) {
		return 2;
	} else if (community != 0) {
		return 1;
	} else {
		return 0;
	}
}

function get_minimum_distribution(array, event_dist) {
	var org = array[0];
	var community = array[1];
	var connected = array[2];
	var all = array[3];
	var sharing = array[4];
	if (connected != 0 && 3 < event_distribution) {
		return 2;
	} else if (community != 0 && 1 < event_distribution) {
		return 1;
	} else if (org != 0 && 0 < event_distribution) {
		return 0;
	} else {
		return -1;
	}
}

function swap_distribution(dist) {
	var distribution = jQuery.extend({}, dist); // deep clone distribution object
	distribution[0].num = 0;
	distribution[1].num = 1;
	var temp = distribution[2];
	distribution[2] = distribution[4];
	distribution[2].num = 4;
	distribution[4] = distribution[3];
	distribution[4].num = 3;
	distribution[3] = temp;
	distribution[3].num = 2;
	return distribution;
}

function add_level_to_pb(distribution, additionalInfo, maxLevel) {
	var pb_container = document.getElementById('eventdistri_pb_container');
	var pb = document.getElementById('eventdistri_pb_background');
	document.getElementById('eventdistri_graph').style.left = spanOffset_orig + 'px'; // center graph inside the popover
	var pbStep = pb.clientWidth / 4.0;
	var pb_top = pb.offsetTop;

	var spanOffset = spanOffset_orig;
	distribution = jQuery.extend({}, distribution); // deep clone distribution object
	for (var d in distribution) {
		d = parseInt(d);
		if (d == 4) { // skip sharing group
			continue;
		}
		// text
		var span = document.createElement('span');
		span.classList.add('useCursorPointer', 'pbDistributionText', 'badge');
		span.onclick = clickHandlerPbText;
		span.innerHTML = distribution[d].key;
		span.setAttribute('data-distribution', d);
		span.style.whiteSpace = 'pre-wrap';
		if (maxLevel == d+1) { // current event distribution
			span.style.fontSize = 'larger';
			span.style.top = d % 2 == 0 ? pb_top-37+'px' : pb_top+30+'px';
		} else {
			span.style.opacity = '0.5';
			span.style.top = d % 2 == 0 ? pb_top-37+'px' : pb_top+30+'px';
		}
		pb_container.appendChild(span);
		if (d == Object.keys(distribution).length-2) { // last one, move a bit to the left. (-2 because sharing is not considered)
			span.style.left = (pbStep*(d+1))+spanOffset-span.clientWidth/2-35 + 'px';
		} else {
			span.style.left = (pbStep*(d+1))+spanOffset-span.clientWidth/2 + 'px';
		}
		var pop = $(span).popover({
			placement: d % 2 == 0 ? 'top' : 'bottom',
			trigger: 'click',
			content: distribution[d].desc + generate_additional_info(additionalInfo[d]),
			title: distribution[d].key,
			container: 'body',
			html: true,
			template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title distributionInfo"></h3><div class="popover-content distributionInfo" style="white-space: pre-wrap"></div></div>'
		});

		// tick
		var span = document.createElement('span');
		span.classList.add('pbDistributionTick');
		spanOffset += (pbStep*(d+1))+spanOffset > pb_container.clientWidth ? -3 : 0; // avoid the tick width to go further than the pb
		span.style.left = (pbStep*(d+1))+spanOffset + 'px';
		//span.style.bottom = d % 2 == 0 ? '32px' : '25px';
		span.style.top = d % 2 == 0 ? pb_top-15+'px' : pb_top+0+'px';
		if (maxLevel == d+1) {
			span.style.opacity = '0.6';
		} else {
			span.style.opacity = '0.2';
		}
		pb_container.appendChild(span);
	}
	
}
$(document).ready(function() {
	var pop = $('.distribution_graph').popover({
		title: "<b>Distribution graph</b> [atomic event]",
		html: true,
		content: function() { return $('#distribution_graph_container').html(); },
		template : '<div class="popover" role="tooltip" style="z-index: 1;"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content" style="padding-left: '+spanOffset_orig+'px; padding-right: '+spanOffset_orig*2+'px;"></div></div>'
	});

	$('body').on('mouseup', function(e) {
		if(!$(e.target).hasClass('distributionInfo') && !($(e.target).hasClass('pbDistributionText') || $(e.target).hasClass('sharingGroup_pb_text'))) {
			$('.pbDistributionText').popover('hide');
			$('.sharingGroup_pb_text').popover('hide');
		}
	});

	$('.distribution_graph').click(function() {
		if ($(this).data('shown') == 'true') {
			$(this).data('shown', 'false');
			return;
		} else {
			$(this).data('shown', 'true');
		}
		$.ajax({
			url: "/events/"+"getDistributionGraph"+"/"+scope_id+"/event.json",
			dataType: 'json',
			type: 'post',
			contentType: 'application/json',
			data: JSON.stringify( payload ),
			processData: false,
			beforeSend: function (XMLHttpRequest) {
				$(".loadingPopover").show();
			},
			success: function( data, textStatus, jQxhr ){
				$(".loadingPopover").hide();

				// DISTRIBUTION PROGRESSBAR
				$('#eventdistri_pb_invalid').tooltip();
				$('#eventdistri_pb').tooltip();
				$('#eventdistri_pb_min').tooltip();

				$('#eventdistri_pb_invalid').click(function(evt) { clickHandlerPb(evt); });
				$('#eventdistri_pb').click(function(evt) { clickHandlerPb(evt); });
				$('#eventdistri_pb_min').click(function(evt) { clickHandlerPb(evt); });
				$('#eventdistri_sg_pb').click(function(evt) { clickHandlerPb(evt); });

				// pb
				var event_dist = event_distribution+1; // +1 to reach the first level
				var min_distri = get_minimum_distribution(data.event, event_dist)+1; // +1 to reach the first level
				var max_distri = get_maximum_distribution(data.event)+1; // +1 to reach the first level
				add_level_to_pb(data.distributionInfo, data.additionalDistributionInfo, event_dist);

				var bg_width_step = $('#eventdistri_pb_background').width()/4.0;
				$('#eventdistri_pb_min').width(bg_width_step*min_distri + 'px');
				$('#eventdistri_pb_min').data("distribution", fill_distri_for_search(0, min_distri-1));
				$('#eventdistri_pb_min').attr('aria-valuenow', min_distri*25);
				$('#eventdistri_pb_min').css("background", "#ffc107");

				$('#eventdistri_pb').width((event_dist)*25+'%');
				$('#eventdistri_pb').data("distribution", fill_distri_for_search(0, event_dist-1));
				$('#eventdistri_pb').attr('aria-valuenow', (event_dist-min_distri)*25);
				$('#eventdistri_pb').css("background", "#28a745");

				$('#eventdistri_pb_invalid').width((max_distri-event_dist)*25+'%');
				$('#eventdistri_pb_invalid').data("distribution", fill_distri_for_search(event_dist, max_distri-1));
				$('#eventdistri_pb_invalid').attr('aria-valuenow', (max_distri-event_dist)*25);
				$('#eventdistri_pb_invalid').css("background", "#dc3545");

				// SHARING GROUPS
				var sgNum = data.event[4];
				var sgPerc = (sgNum/data.allSharingGroup.length)*100;
				if (sgPerc > 0) {
					$('#eventdistri_sg_pb').width(sgPerc+'%');
					$('#eventdistri_sg_pb').text(sgNum +' / '+ data.allSharingGroup.length);
					$('#eventdistri_sg_pb').data("distribution", '4');
					$('#eventdistri_sg_pb').attr('aria-valuenow', sgPerc);
					$('#eventdistri_sg_pb').css("background", "#7a86e0");
				} else { // no sg, hide it and display
					$('#eventdistri_sg_pb_background').text("Event not distributed to any sharing group");
				}

				$('.sharingGroup_pb_text').popover({
					placement: 'bottom',
					trigger: 'click',
					title: 'Sharing group',
					content: data.distributionInfo[4].desc + generate_additional_info(data.additionalDistributionInfo[4]),
					container: 'body',
					html: true,
					template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title distributionInfo"></h3><div class="popover-content distributionInfo" style="white-space: pre-wrap"></div></div>'
				});


				// RADAR
				var doughnutColors = ['red', 'orange', 'lime', 'green', 'rgb(122, 134, 224)'];
				var doughnut_dataset = [
					{
						label: "Event",
						data: data.event,
						hidden: false,
						backgroundColor: doughnutColors
					},
					{
						label: "Attributes",
						data: data.attribute,
						hidden: true,
						backgroundColor: doughnutColors
					},
					{
						label: "Object attributes",
						data: data.obj_attr,
						hidden: true,
						backgroundColor: doughnutColors
					},
				
				];
				var ctx = document.getElementById("distribution_graph_canvas");
				ctx.onclick = function(evt) { clickHandlerGraph(evt); };
				distribution_chart = new Chart(ctx, {
					type: 'doughnut',
					data: {
						labels: data.distributionInfo.map(function(elem, index) { return [elem.key]; }),
						distribution: data.distributionInfo,
						datasets: doughnut_dataset,
					},
					options: {
						title: {
							display: false
						},
						animation: {
							duration: 500
						},
						tooltips: {
							callbacks: {
								label: function(item, data) {
									return data.datasets[item.datasetIndex].label
										+ " - " + data.labels[item.index]
										+ ": " + data.datasets[item.datasetIndex].data[item.index];
								}
							}
						}
					},
					
				});

				// create checkboxes
				var div = $('<div></div>');
				div.addClass('distribution_checkboxes_dataset');
				var distri_graph = $('#eventdistri_graph');
				var distriOffset = distri_graph.offset();
				var distriHeight = distri_graph.height()/2;
				div.css({top: distriOffset.top+distriHeight+50+'px', left: 50+'px'});
				for (var i in doughnut_dataset) {
					var item = doughnut_dataset[i];
					var label = $('<label></label>');
					label.addClass('useCursorPointer');
					label.css({'user-select': 'none'});
					var checkbox = $('<input type="checkbox">');
					checkbox.data('dataset-index', i);
					checkbox.prop('checked', item.label === 'Event');
					checkbox.change(function(evt) {
						var clickedIndex = $(this).data('dataset-index');
						var isChecked = $(this).prop('checked');
						distribution_chart.config.data.datasets[clickedIndex].hidden = !isChecked;
						distribution_chart.update();
					});
					label.append(checkbox);
					label.append(item.label);
					div.append(label);
				}
				distri_graph.append(div);
			},
			error: function( jqXhr, textStatus, errorThrown ){
				console.log( errorThrown );
			}
		});
	});
});

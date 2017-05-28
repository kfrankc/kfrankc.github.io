// JSON data from Google Spreadsheet
var dataURL = "https://spreadsheets.google.com/feeds/list/1E-LiavlGRMcJyIv6T32pDLycSbtAIM6XSIa4RlOpcUA/od6/public/values?alt=json";

// takes in JSON object from google sheets and turns into a json formatted
// this way based on the original google Doc
// [
// 	{
// 		'column1': info1,
// 		'column2': info2,
// 	}
// ]
function clean_google_sheet_json(data){
	var formatted_json = [];
	var elem = {};
	var real_keyname = '';
	$.each(data.feed.entry.reverse(), function(i, entry) {
		elem = {};
		$.each(entry, function(key, value){
			// fields that were in the spreadsheet start with gsx$
			if (key.indexOf("gsx$") == 0)
			{
				// get everything after gsx$
				real_keyname = key.substring(4);
				elem[real_keyname] = value['$t'];
			}
		});
		formatted_json.push(elem);
	});
	return formatted_json;
}

function addData(){
	$.getJSON(dataURL, function(json){
		var data = clean_google_sheet_json(json);
		var source = $("#card-template").html();
		var cardTemp = Handlebars.compile(source);
		console.log(data)

		$("#content").append(cardTemp({drawing: data}));

	});
}

Handlebars.registerHelper('grouped_each', function(every, context, options) {
    var out = "", subcontext = [], i;
    if (context && context.length > 0) {
        for (i = 0; i < context.length; i++) {
            if (i > 0 && i % every === 0) {
                out += options.fn(subcontext);
                subcontext = [];
            }
            subcontext.push(context[i]);
        }
        out += options.fn(subcontext);
    }
    return out;
});

// execute addData() function
addData();
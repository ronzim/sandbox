// var fs = require('fs-extra');
// var stream = fs.createReadStream('pos.json');
//
// // stream.pipe(process.stdout)
// var c = 0;
//
// stream.on('data', function(data){
//   console.log('\n>>>>>>> new chunk : ', ++c, '\n\n', data.toString('utf-8'))
// })
//
// stream.on('end', function(){
//   console.log('=== file end ===')
// })


var ReadJSONStream = require('read-json-stream').default;

ReadJSONStream('pos.json')
  .progress(function(p) {
    if (p){
      // console.log(p + '% done so far!');
      drawBar(p/100);
    }
  })
  .done(function(err, data) {
    if(err) {
      // handle error
    } else {
      // do something with the freshly-parsed data!
      console.log(Object.keys(data), data.locations.length)
    }
  });

function drawBar(current_progress){
  const bar_length = process.stdout.columns - 30;

  var filled_bar_length = (current_progress * bar_length).toFixed(0);
  var empty_bar_length = bar_length - filled_bar_length;

  var filled_bar = get_bar(filled_bar_length, "=");
  var empty_bar = get_bar(empty_bar_length, " ");
  var percentage_progress = (current_progress * 100).toFixed(2);

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(
    `Current progress: [${filled_bar}${empty_bar}] | ${percentage_progress}%`
  );
  // console.log('\n');
}


function get_bar(length, char, color) {
		let str = "";
		for (let i = 0; i < length; i++) {
			str += char;
		}
		return str;
	}

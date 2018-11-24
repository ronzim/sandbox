var consoleLoc = process.console.tag('ddd');
// consoleLoc.opt.defaultTags = ['ccc', 'bbbq'];

consoleLoc.log(process.console.opt.defaultTags);
consoleLoc.log(consoleLoc.opt.defaultTags);

setInterval(function(){
  consoleLoc.tag('bbb').log('other');
}, 2154);

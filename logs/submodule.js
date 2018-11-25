// and this can be any soubmodule
a = 0;
setInterval(function(){
  a++
}, 1000);


process.console.tag('submodule').log('a log in a submodule');
setInterval(function(){
  process.console.tag(a.toString()).log('a log in a submodule');
}, 500);

console.log('>>>>>', __filename.split('/').slice(-1)[0]);

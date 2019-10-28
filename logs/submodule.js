// and this can be any soubmodule
a = 0;
setInterval(function(){
  a += (Math.random()*10)
}, 200);

b = 0;
setInterval(function(){
  b += (Math.random()*10)
}, 300);

process.console.tag('submodule').log('a log in a submodule');
setInterval(function(){
  process.console.tag('random_values_a').log(a);
  process.console.tag('random_values_b').log(b);
}, 500);

// console.log('>>>>>', __filename.split('/').slice(-1)[0]);

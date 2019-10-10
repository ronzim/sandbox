/**
 * @jsx React.DOM
 */
// The above declaration must remain intact at the top of the script.
/** @jsx React.DOM */

// const remote = require('electron').remote;
// const dialog = remote.dialog;
// const path   = require("path");


/*  ================================================================  */
/*  ================================================================  */

var Canvas = React.createClass({displayName: "Canvas",

  getInitialState: function() {
    return { height: null };
  },

  componentDidMount: function() {
    var scene = require(path.join(rootPath, "js","scene.js"));
    scene.render();
  },

  render: function(){
    return(
      React.createElement("div", {id: "canvas-container"}
      )
    )
  }
});

var render = function () {
  ReactDOM.render(
    React.createElement(Canvas),
    window.document.getElementById('app-container')
  );
}

exports.render = render;

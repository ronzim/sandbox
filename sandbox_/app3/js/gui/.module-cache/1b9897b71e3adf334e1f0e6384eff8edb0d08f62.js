/**
 * @jsx React.DOM
 */
// The above declaration must remain intact at the top of the script.
/** @jsx React.DOM */

const remote    = require('electron').remote;
const dialog    = remote.dialog;

var path     = require("path");


/*  ================================================================  */
/*  ================================================================  */

var Canvas = React.createClass({displayName: "Canvas",

  getInitialState: function() {
    return { height: null };
  },

  componentDidMount: function() {

    var tool   = require(path.join(rootPath, "js","tool.js"));
    tool.renderer();

  },

  render: function(){

    return(
      React.createElement("canvas", {id: "targetCanvas", className: "container"}
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

exports.render       = render;

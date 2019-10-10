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

var Canvas = React.createClass({

  getInitialState: function() {
    return { height: null };
  },

  componentDidMount: function() {

    var tool   = require(path.join(rootPath, "js","tool.js"));
    tool.render();
    //var dataStruct   = require(path.join(rootPath, "js","dataStruct.js"));
    //dataStruct.render();

  },

  render: function(){

    return(
      <div id="canvas-container">
      </div>
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

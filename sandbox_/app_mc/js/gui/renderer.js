/**
 * @jsx React.DOM
 */
// The above declaration must remain intact at the top of the script.
/** @jsx React.DOM */

const remote    = require('electron').remote;
const dialog    = remote.dialog;

/*  ================================================================  */
/*  ================================================================  */

var Canvas = React.createClass({displayName: "Canvas",

  getInitialState: function() {
    return { height: null };
  },

  componentDidMount: function() {

    var tool   = require('../../js/tool.js');
    tool.render();
    //var dataStruct   = require(path.join(rootPath, "js","dataStruct.js"));
    //dataStruct.render();

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

exports.render       = render;

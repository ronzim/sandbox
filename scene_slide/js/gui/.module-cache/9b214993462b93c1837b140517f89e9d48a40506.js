/**
 * @jsx React.DOM
 */
// The above declaration must remain intact at the top of the script.
/** @jsx React.DOM */

const remote    = require('electron').remote;
const dialog    = remote.dialog;

var path     = require("path");
var ablationTools   = require(path.join(rootPath, "js"));

/*  ================================================================  */
/*  ================================================================  */

var Canvas = React.createClass({displayName: "Canvas",

  getInitialState: function() {
    return { height: null };
  },

  componentDidMount: function() {
    var _this = this;
    $( window ).resize(function() {
      var height = $( window ).height() - $('#home-header').outerHeight();
      $('#body').css( 'height', $( window ).height() );
    });
    var height = $( window ).height() - $('#home-header').outerHeight();
    $('#body').css( 'height', $( window ).height() );

    //scene creation

  },

  makeCallback: function( fun, arg ) {
    return function() { return fun( arg ); };
  },

  centerModal: function( target ) {
    $( $( '.modal' ) ).each( function( i ) {
      if ( $( this ).hasClass( target ) ) {
        $(this).css('display', 'block');
        var $dialog = $(this).find(".modal-dialog");
        var offset  = ($('#body').height() - $dialog.height()) / 2;
        $dialog.css("margin-top", offset);
      }
    });
  },

  centerModalFromTarget: function( target ) {
    $( $( '.modal' ) ).each( function( i ) {
      if ( $( this ).hasClass( target ) ) {
        $(this).css('display', 'block');
        var $dialog = $(this).find(".modal-dialog");
        var offset  = ($('#body').height() - $dialog.height()) / 2;
        $dialog.css("margin-top", offset);
      }
    });
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

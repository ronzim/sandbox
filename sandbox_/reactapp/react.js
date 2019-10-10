var React    = require('react');
var ReactDOM = require('react-dom');

// var Square = createReactClass({
class Square extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: null,
    };
  }

  render() {
    return (
      React.createElement("button", null, 
        "'Button'"
      )
    );
  }
}

var render = function() {
  ReactDOM.render(
    React.createElement("div", null, " ", React.createElement(Square, null), " "),
    document.getElementById('container')
  );
};

render();

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
    return
      (
      React.createElement("button", {
        className: "square", onClick: 
          () => this.setState({value: 'X'})
        }, 
        this.state.value
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

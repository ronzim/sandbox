var React    = require('react');
var ReactDOM = require('react-dom');

class Button extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: null,
    };
  }

  render() {
    return (
      <button>
        'Button'
      </button>
    );
  }
}

var render = function() {
  ReactDOM.render(
    <div> <Square /> </div>,
    document.getElementById('container')
  );
};

render();

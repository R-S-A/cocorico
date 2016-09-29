var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var ReactIntl = require('react-intl');
var Reflux = require('reflux');
var classNames = require('classnames');
var Base64 = require('js-base64').Base64;

var TransactionStore = require('../store/TransactionStore'),
  VoteStore = require('../store/VoteStore');

var VoteAction = require('../action/VoteAction');

var LoadingIndicator = require('../component/LoadingIndicator'),
  Title = require('../component/Title'),
  QRCodeReader = require('../component/QRCodeReader'),
  FileSelectButton = require('../component/FileSelectButton');

var Grid = ReactBootstrap.Grid,
  Row = ReactBootstrap.Row,
  Col = ReactBootstrap.Col,
  Modal = ReactBootstrap.Modal,
  Button = ReactBootstrap.Button,
  ButtonToolbar = ReactBootstrap.ButtonToolbar,
  FormGroup = ReactBootstrap.FormGroup,
  MenuItem = ReactBootstrap.MenuItem,
  InputGroup = ReactBootstrap.InputGroup,
  FormControl = ReactBootstrap.FormControl,
  DropdownButton = ReactBootstrap.DropdownButton;

var BallotBox = React.createClass({

  mixins: [
    ReactIntl.IntlMixin,
    Reflux.connect(TransactionStore, 'transactions'),
    Reflux.connect(VoteStore, 'votes'),
  ],

  getInitialState: function() {
    return {
      qrCodeReader: false,
      searchMode: 'Transaction',
    };
  },

  componentWillMount: function() {
    VoteAction.getTransactions(this.props.params.voteId);
    VoteAction.show(this.props.params.voteId);
  },

  getVoteValueDisplayMessage: function(id) {
    var vote = this.state.votes.getById(this.props.params.voteId);

    var labels = (!!vote.labels && vote.labels.length !== 0)
      ? vote.labels
      : [
        this.getIntlMessage('vote.VOTE_YES'),
        this.getIntlMessage('vote.VOTE_BLANK'),
        this.getIntlMessage('vote.VOTE_NO'),
      ];

    return labels[id];
  },

  proofOfVoteSuccess: function(data) {
    console.log(data);
  },

  readFromFileHandler: function(data) {
    var svg = Base64.decode(data.substr(26));
    var pof = svg.match(/<desc>(.*)<\/desc>/);

    var data = pof[1];

    if (!!data) {
      console.log(data);
    }
  },

  render: function() {
    var vote = this.state.votes.getById(this.props.params.voteId);

    if (!vote) {
      return (
        <Grid>
          <Row>
            <Col xs={12}>
              <LoadingIndicator/>
            </Col>
          </Row>
        </Grid>
      );
    }

    return (
      <div className="page">
        {this.renderQRCodeReaderModal()}
        <Grid>
          <Row>
            <Col xs={12}>
              <h1>{vote.title} <small>Ballot Box</small></h1>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <h2>Verify your ballot</h2>
              <ButtonToolbar>
                <Button
                  bsStyle="primary"
                  onClick={(e)=>this.setState({qrCodeReader:true})}>
                  Scan my printed proof of vote
                </Button>
                <FileSelectButton onSuccess={this.readFromFileHandler}>
                  Select my downloaded proof of vote
                </FileSelectButton>
              </ButtonToolbar>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <h2>Explore the ballot box</h2>
            </Col>
          </Row>
          <Row>
            <Col xs={12} md={8}>
              {this.renderSearchForm()}
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              {this.renderContent()}
            </Col>
          </Row>
        </Grid>
      </div>
    );
  },

  renderQRCodeReaderModal: function() {
    return (
      <Modal show={this.state.qrCodeReader}>
        <Modal.Body>
          <QRCodeReader onSuccess={this.qrCodeReaderSuccess}/>
        </Modal.Body>
        <Modal.Footer>
          <Button
            bsStyle="link"
            onClick={(e)=>this.setState({qrCodeReader:false})}>
            Annuler
          </Button>
        </Modal.Footer>
      </Modal>
    );
  },

  renderSearchForm: function() {
    var searchModes = [
      'Transaction',
      'Voter',
      'Proposal',
    ];

    return (
      <form>
        <FormGroup>
          <InputGroup>
            <FormControl type="text" placeholder="Type here to search..."/>
            <DropdownButton
              componentClass={InputGroup.Button}
              id="input-dropdown-addon"
              title={this.state.searchMode}
              onSelect={(k, e)=>this.setState({searchMode:k})}
              pullRight={true}>
              {searchModes.map((mode, index) => {
                return (
                  <MenuItem key={index} eventKey={mode}>{mode}</MenuItem>
                );
              })}
            </DropdownButton>
          </InputGroup>
        </FormGroup>
      </form>
    );
  },

  renderContent: function() {
    var transactions = this.state.transactions.getByVoteId(this.props.params.voteId);
    var vote = this.state.votes.getById(this.props.params.voteId);

    if (!transactions) {
      return <LoadingIndicator/>;
    }

    var hasLabels = vote.labels.length !== 0;

    return (
      <table className="table table-hover table-ellipsis">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Voter</th>
            <th>Proposal</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            return (
              <tr key={tx.transactionHash}>
                <td className="truncate">{tx.transactionHash}</td>
                <td className="truncate">{tx.args.voter}</td>
                <td className="truncate">
                  <span className={classNames({
                    'label': true,
                    'label-primary': hasLabels,
                    'positive-background': !hasLabels && tx.args.proposal === '0',
                    'neutral-background': !hasLabels && tx.args.proposal === '1',
                    'negative-background': !hasLabels && tx.args.proposal === '2',
                  })}>
                    <Title text={this.getVoteValueDisplayMessage(tx.args.proposal)}/>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  },
});

module.exports = BallotBox;

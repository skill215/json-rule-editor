import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { login } from '../../actions/app';
import { uploadRuleset } from '../../actions/ruleset';
import { TitlePanel } from '../../components/panel/panel';
import Button from '../../components/button/button';
import { createHashHistory } from 'history';
import FooterLinks from '../../components/footer/footer';
import footerLinks from '../../data-objects/footer-links.json';
import { includes } from 'lodash/collection';
import Notification from '../../components/notification/notification';
import { RULE_AVAILABLE_UPLOAD, RULE_UPLOAD_ERROR } from '../../constants/messages';
import ApperanceContext from '../../context/apperance-context';
import { faCloudArrowDown } from '@fortawesome/free-solid-svg-icons'
import SweetAlert from 'react-bootstrap-sweetalert';



class FetchContainer extends Component {

    constructor(props) {
        super(props);
        this.state = { message: {}, fetchErrFlag: false, fetchErrMsg: '', fetched: false };
        this.handleGetFromServer = this.handleGetFromServer.bind(this);
        this.getFromServer = this.getFromServer.bind(this);
        this.cancelAlert = this.cancelAlert.bind(this);
        this.fetchErrAlert = this.fetchErrAlert.bind(this);
    }

    allowDrop(e) {
        e.preventDefault();
    }

    getFromServer() {
        this.handleGetFromServer();

    }

    handleGetFromServer() {
        fetch('http://localhost:3001/get-ruleset')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(json => {
                console.log(`Success: ${JSON.stringify(json)}`);
                if (json.length > 0) {
                    json.forEach(ruleset => {
                        this.props.uploadRuleset(ruleset);
                    });
                    this.navigate('./ruleset');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.setState({
                    fetchErrFlag: true,
                    fetchErrMsg: `Failed to fetch rulesets from server. Please check your connection. Error: ${error.message}`
                });
            });
    }

    navigate(location) {
        const history = createHashHistory();
        this.props.login();
        history.push(location);
    }

    fetchErrAlert = () => {
        return (<SweetAlert
            error
            title={"Fetching Rulesets Error!"}
            onConfirm={this.cancelAlert}
        > {this.state.fetchErrMsg}
        </SweetAlert>);
    }

    cancelAlert() {
        this.setState({ fetchErrFlag: false });
    }

    render() {
        const { fileExist, uploadError, message, fetchCnt } = this.state;
        const title = "Get Rules From Server";
        const appctx = this.context;

        return <div className="fetch-container">
            <div className="single-panel-container">
                <TitlePanel title={title} titleClass={faCloudArrowDown}>
                    <div className="fetch-panel">
                        <p className = "warning">NOTE: Local ruleset that has same name as ruleset in server will NOT be overwritten.</p>
                        <div className="btn-group">
                            <Button label={"Get From Server"} onConfirm={this.handleGetFromServer} classname="primary-btn" type="button" />
                        </div>
                    </div>
                </TitlePanel>
            </div>
            {!this.props.loggedIn && <div className='footer-container home-page'>
                <FooterLinks links={footerLinks} />
            </div>}
            {this.state.fetchErrFlag && this.fetchErrAlert()}

        </div>
    }
}

FetchContainer.contextType = ApperanceContext;

FetchContainer.propTypes = {
    ruleset: PropTypes.array,
    uploadRuleset: PropTypes.func,
    login: PropTypes.func,
    loggedIn: PropTypes.bool,
}

FetchContainer.defaultProps = {
    login: () => false,
    loggedIn: false,
    uploadRuleset: () => false,

}

const mapStateToProps = (state) => ({
    rulenames: state.ruleset.rulesets.map(r => r.name),

    loggedIn: state.app.loggedIn,
});

const mapDispatchToProps = (dispatch) => ({
    login: () => dispatch(login()),
    uploadRuleset: (ruleset) => dispatch(uploadRuleset(ruleset)),

});

export default connect(mapStateToProps, mapDispatchToProps)(FetchContainer);
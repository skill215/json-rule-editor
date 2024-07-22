
/* eslint-disable no-undef */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import pako from 'pako';
import { connect } from 'react-redux';
import PageTitle from '../../components/title/page-title';
import Tabs from '../../components/tabs/tabs';
import Klist from '../../components/klists/klist';
import Decisions from '../../components/decisions/decision';
import ValidateRules from '../../components/validate/validate-rules';
import { handleKlist } from '../../actions/klists';
import { handleDecision } from '../../actions/decisions';
import Banner from '../../components/panel/banner';
import Panel from '../../components/panel/panel';
import * as Message from '../../constants/messages';
import { groupBy } from 'lodash/collection';
import RuleErrorBoundary from '../../components/error/ruleset-error';
import SweetAlert from 'react-bootstrap-sweetalert';
import Notification from '../../components/notification/notification';
import '../../sass/components/ruleset-container.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { backendIp } from '../../../config'

// const tabs = [{ name: 'Facts' }, { name: 'Decisions' }, { name: 'Validate' }, { name: 'Generate' }, { name: 'Apply' }];
const tabs = [{ name: 'Rules' }, { name: 'Keyword Lists' }, { name: 'Validate' }, { name: 'Local Ops' }, { name: 'Server Ops' }];

// const backendIp = "161.189.188.48"
class RulesetContainer extends Component {

  constructor(props) {
    super(props);

    const { attributes } = this.props.ruleset;
    // console.log(`attributes in RulesetContainer: ${JSON.stringify(attributes)}`)
    const conditions = attributes.filter(attr => attr.type !== 'object' && ({ name: attr.name, value: '' }))

    this.state = {
      activeTab: 'Rules',
      klNames: [],
      generateFlag: false,
      sendToServerFlag: false,
      sendToServerErrFlag: false,
      deleteFromServerFlag: false,
      deleteFromServerErrFlag: false,
      validateFlag: false,
      validateErrFlag: false,
      deleteFlag: false,
      deleteErrFlag: false,
      deployFlag: false,
      deployErrFlag: false,
      isLoading: false,
      deployResponses: [],
      alert: null,
      vState: {
        conditions: conditions,
        outcomes: [],
        result: false,
        error: false
      },
      defaultAction: 'ACCEPT',
      feature: 'Spamming Protection',
      message: ''
    };

    // console.log(`this.state.vState in RulesetContainer: ${JSON.stringify(this.state.vState)}`);

    this.generateFile = this.generateFile.bind(this);
    this.cancelAlert = this.cancelAlert.bind(this);
    this.getKlnames = this.getKlnames.bind(this);
    this.sendValidate = this.sendValidate.bind(this);
    this.sendRuleset = this.sendRuleset.bind(this);
    this.preSendRuleset = this.preSendRuleset.bind(this);
    this.sendDeleteRuleset = this.sendDeleteRuleset.bind(this);
    this.preSendDeleteRuleset = this.preSendDeleteRuleset.bind(this);
    this.preSendDeployRuleset = this.preSendDeployRuleset.bind(this);
    this.sendDeployRuleset = this.sendDeployRuleset.bind(this);
    this.updateVState = this.updateVState.bind(this);
    this.clearUpdatedFlag = this.clearUpdatedFlag.bind(this);
  }

  handleTab = (tabName) => {
    this.setState({ activeTab: tabName });
  }

  generateFile() {
    const ruleset = { ...this.props.ruleset, timestamp: new Date().toISOString() };

    // console.log(`ruleset == ${ruleset}`);
    const fileData = JSON.stringify(ruleset, null, '\t');
    const blob = new Blob([fileData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = ruleset.name + '.json';
    link.href = url;
    link.click();
    this.setState({ generateFlag: true });
  }

  preSendRuleset() {
    const getAlert = () => (
      <SweetAlert
        warning
        showCancel
        confirmBtnText="Yes, upload it!"
        confirmBtnBsStyle="danger"
        title="Are you sure to upload the ruleset?"
        onConfirm={() => this.sendRuleset()}
        onCancel={() => this.cancelAlert()}
        focusCancelBtn
      >
        The server version of this ruleset will be overwritten!
      </SweetAlert>
    );

    this.setState({
      alert: getAlert()
    });
  }

  sendRuleset() {
    this.cancelAlert();
    const ruleset = { ...this.props.ruleset, timestamp: new Date().toISOString() };
    const fileData = JSON.stringify(ruleset, null, '\t');

    // console.log(`The JSON body is: ${fileData}`);

    // Compress the JSON data
    console.log('Compressing data...');
    const startTime = performance.now(); // Start timing
    const compressedData = pako.gzip(fileData);
    const endTime = performance.now(); // End timing
    console.log(`Data compressed in ${endTime - startTime} milliseconds.`);

    console.log('Starting fetch operation...');
    const fetchStartTime = performance.now(); // Start timing the fetch operation

    fetch('http://' + backendIp + ':3001/receive-ruleset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip' // Indicate that the request body is compressed
      },
      body: compressedData // Send the compressed data
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(errorText => {
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        this.clearUpdatedFlag();

        this.setState({ sendToServerFlag: true });
      })
      .catch((error) => {
        console.error('Error:', error);
        this.setState({ sendToServerErrFlag: true, message: error });
      })
      .finally(() => {
        const fetchEndTime = performance.now(); // End timing the fetch operation
        console.log(`Fetch operation completed in ${fetchEndTime - fetchStartTime} milliseconds.`);
      });
  }

  preSendDeleteRuleset() {
    const getAlert = () => (
      <SweetAlert
        warning
        showCancel
        confirmBtnText="Yes, delete it!"
        confirmBtnBsStyle="danger"
        title="Are you sure to delete the ruleset on SERVER?"
        onConfirm={() => this.sendDeleteRuleset()}
        onCancel={() => this.cancelAlert()}
        focusCancelBtn
      >
        Please make sure you have a backup of the ruleset.
      </SweetAlert>
    );

    this.setState({
      alert: getAlert()
    });
  }

  sendDeleteRuleset() {
    this.cancelAlert();
    const { ruleset } = this.props;
    // console.log(`this.props == ${JSON.stringify(this.props)}`);
    const rulesetName = ruleset.name;

    fetch('http://' + backendIp + ':3001/delete-ruleset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: rulesetName })
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(errorText => {
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
          });
        }
        return response.json();
      })
      .then(data => {
        // console.log('Success:', data);
        this.setState({ deleteFlag: true });
      })
      .catch((error) => {
        console.error('Error:', error);
        this.setState({ deleteErrFlag: true, message: error });
      });
  }

  sendValidate(facts, ruleset = {}) {
    // const factsFile = JSON.stringify(facts, null, '\t');
    // const rulesetFile = JSON.stringify(ruleset, null, '\t');

    // console.log(`The first JSON body is: ${facts}`);
    // console.log(`The second JSON body is: ${ruleset}`);

    const combinedData = JSON.stringify({ facts: facts, ruleset: ruleset });

    return fetch('http://' + backendIp + ':3001/receive-validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: combinedData
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(errorText => {
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
          });
        }
        return response.json();
      })
      .then(data => {
        // console.log('Success:', data);
        this.setState({ validateFlag: true });
        // console.log(`data.success == ${data.success}`);
        // console.log(`data.data == ${data.data}`);
        return { success: data.success, data: data.data };
      })
      .catch((error) => {
        console.error('Error:', error);
        if (error.message === 'Failed to fetch') {
          console.error('Network error. Is the server running?');
        }
        this.setState({ validateErrFlag: true, message: error });
        return { success: false, error: error };
      });
  }

  preSendDeployRuleset() {
    if (this.state.isLoading) {
      console.log('Already sending request to server. Please wait.');
      return;
    }

    const getAlert = () => (
      <SweetAlert
        warning
        showCancel
        confirmBtnText="Yes, deploy it!"
        confirmBtnBsStyle="danger"
        title="Are you sure to activate the ruleset on PRODUCTION?"
        onConfirm={() => this.sendDeployRuleset()}
        onCancel={() => this.cancelAlert()}
        focusCancelBtn
      >
        Please make sure you have a backup of the ruleset.
      </SweetAlert>
    );

    this.setState({
      alert: getAlert()
    });
  }

  transformData(data) {
    // console.log('Transforming data:', data);

    let deployResponses = [];

    data.forEach((item, index) => {
      // console.log(`Processing item ${index}:`, item);

      if (item.result) {
        try {
          let info = JSON.parse(JSON.parse(item.info));
          // console.log(`Parsed info for item ${index}:`, info);

          let node = item.node;
          let result = info.success;
          let message = info.data ? info.data.message : 'info.data is undefined';

          deployResponses.push({ node, result, info: message });

          console.log(`Updated deployResponses for item ${index}:`, deployResponses);
        } catch (error) {
          console.error(`Error parsing info for item ${index}:`, error);
        }
      } else {
        deployResponses.push({ node: item.node, result: false, info: item.info });

        console.log(`Updated deployResponses for item ${index}:`, deployResponses);
      }
    });

    console.log('Final deployResponses:', deployResponses);
    return deployResponses;
  }
  
  sendDeployRuleset() {
    this.cancelAlert();
    const { ruleset } = this.props;
    const rulesetWithTimestamp = { ...ruleset, timestamp: new Date().toISOString() };
    const rulesetData = JSON.stringify(rulesetWithTimestamp, null, '\t');

    console.log('Compressing data...');
    const startTime = performance.now(); // Start timing
    const compressedData = pako.gzip(rulesetData);
    const endTime = performance.now(); // End timing
    console.log(`Data compressed in ${endTime - startTime} milliseconds.`);

    console.log('Starting fetch operation...');
    const fetchStartTime = performance.now(); // Start timing the fetch operation

    return fetch('http://' + backendIp + ':3001/receive-deploy-ruleset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip' // Indicate that the request body is compressed
      },
      body: compressedData // Send the compressed data
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(errorText => {
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
          });
        }
        this.setState({ isLoading: false });
        return response.json();
      })
      .then(data => {
        let deployResponses = this.transformData(data);
        this.setState({ deployFlag: true, deployResponses: deployResponses, isLoading: false });
        return { success: true, data: data };
      })
      .catch((error) => {
        console.log('Error:', error);
        this.setState({ deployErrFlag: true, message: error, isLoading: false });
        return { success: false, error: error };
      })
      .finally(() => {
        const fetchEndTime = performance.now(); // End timing the fetch operation
        console.log(`Fetch operation completed in ${fetchEndTime - fetchStartTime} milliseconds.`);
      });
  }

  cancelAlert() {
    this.setState({
      generateFlag: false,
      sendToServerFlag: false,
      sendToServerErrFlag: false,
      deleteFromServerFlag: false,
      deleteFromServerErrFlag: false,
      validateFlag: false,
      validateErrFlag: false,
      deleteFlag: false,
      deleteErrFlag: false,
      deployFlag: false,
      deployErrFlag: false,
      alert: null,
      message: ''
    });
  }

  successAlert = () => {
    const { name } = this.props.ruleset;
    return (<SweetAlert
      success
      title={"File generated!"}
      onConfirm={this.cancelAlert}
    > {`${name} rule is successfully generated at your default download location`}
    </SweetAlert>);
  }

  sendToServerAlert = () => {
    const { name } = this.props.ruleset;
    return (<SweetAlert
      success
      title={"Ruleset Uploaded to Server!"}
      onConfirm={this.cancelAlert}
    > {`${name} ruleset is successfully uploaded to server.`}
    </SweetAlert>);
  }

  sendToServerErrAlert = () => {
    const { name } = this.props.ruleset;
    const { message } = this.state;
    return (<SweetAlert
      error
      title={"Rule Uploaded to Server Failed!"}
      onConfirm={this.cancelAlert}
    > {`${name} rule is not uploaded to server because of error: ${message}.`}
    </SweetAlert>);
  }

  deleteFromServerAlert = () => {
    const { name } = this.props.ruleset;
    return (<SweetAlert
      success
      title={"Ruleset Deleted on Server!"}
      onConfirm={this.cancelAlert}
    > {`${name} ruleset is successfully deleted server.`}
    </SweetAlert>);
  }

  deleteFromServerErrAlert = () => {
    const { name } = this.props.ruleset;
    const { message } = this.state;
    return (<SweetAlert
      error
      title={"Ruleset Not Deleted on Server!"}
      onConfirm={this.cancelAlert}
    > {`${name} rule is not deleted on server because of error: ${message}.`}
    </SweetAlert>);
  }


  validateAlert = () => {
    const { name } = this.props.ruleset;
    return (<SweetAlert
      success
      title={"Rule Validated!"}
      onConfirm={this.cancelAlert}
    > {`${name} rule validation is performed. Refer to the output field for result.`}
    </SweetAlert>);
  }

  validateErrAlert = () => {
    const { name } = this.props.ruleset;
    const { message } = this.state;
    return (<SweetAlert
      error
      title={"Rule Validate Failed!"}
      onConfirm={this.cancelAlert}
    > {`${name} rule validation failed because of error: ${message}`}
    </SweetAlert>);
  }

  deployAlert = () => {
    const { name } = this.props.ruleset;
    return (
      <SweetAlert
        success
        title={"Rule Deployed!"}
        onConfirm={this.cancelAlert}
      >
        {`${name} rule deployment operation succeeded. For detailed result of individual node, check the in-page table.`}
      </SweetAlert>
    );
  }

  deployErrAlert = () => {
    const { name } = this.props.ruleset;
    const { message } = this.state;
    return (
      <SweetAlert
        error
        title={"Rule Deploy Failed!"}
        onConfirm={this.cancelAlert}
      >
        {`${name} rule deployment failed with error: ${message}`}
      </SweetAlert>
    );
  }

  getKlnames = () => {
    const { lists: klists } = this.props.ruleset;

    if (!klists) {
      console.log('klists is undefined');
      return [];
    }

    // console.log(`klists in ruleset-container: ${JSON.stringify(klists)}`);
    const klNames = klists.map(klist => klist.name);
    console.log(`klNames in ruleset-container: ${JSON.stringify(klNames)}`);
    return klNames;
  }

  updateVState = (vState) => {
    console.log(`Update vState in RulesetContainer: ${JSON.stringify(vState)}`);
    this.setState({ vState: vState });
  }

  clearUpdatedFlag = () => {
    console.log('Clearing updated flag');
    this.props.handleDecisions('CLEARUPDATEDFLAG', null);
  }


  render() {
    const { attributes, decisions, name, lists: klists, defaultAction, feature } = this.props.ruleset;
    const { vState } = this.state;
    // console.log(`deployResponses ==> ${JSON.stringify(this.state.deployResponses)}`);
    // if (this.state.deployResponses && this.state.deployResponses.length > 0) {
    //   console.log(`Should display the table`);
    // }
    const indexedDecisions = decisions && decisions.length > 0 &&
      decisions.map((decision, index) => ({ ...decision, index }));

    let outcomes = indexedDecisions; // The group by operation type is not needed.
    // if (indexedDecisions && indexedDecisions.length > 0) {
    //   outcomes = groupBy(indexedDecisions, data => data.event.type);
    // }

    // const generate_message = this.props.updatedFlag ? Message.MODIFIED_MSG : Message.NO_CHANGES_MSG;
    const generate_message = Message.MODIFIED_MSG;
    // const upload_message = this.props.updatedFlag ? Message.UPLOAD_MSG : Message.NO_CHANGES_MSG;
    const upload_message = Message.UPLOAD_MSG;
    const deploy_message = Message.DEPLOY_MSG;
    const delete_message = Message.DELETE_MSG;
    const delete_server_message = Message.DELETE_SERVER_MSG;

    // console.log(`defaultAction in RulesetContainer: ${defaultAction}`)
    // console.log(`feature in RulesetContainer: ${feature}`)

    return <div>
      <RuleErrorBoundary>
        <PageTitle name={name} />
        <Tabs tabs={tabs} onConfirm={this.handleTab} activeTab={this.state.activeTab} />
        <div className="tab-page-container">
          {this.state.activeTab === 'Keyword Lists' && <Klist klists={klists}
            handleKlist={this.props.handleKlist} />}
          {this.state.activeTab === 'Rules' && (
            <>
              <Decisions decisions={indexedDecisions || []} attributes={attributes} defaultAction={defaultAction} feature={feature}
                handleDecisions={this.props.handleDecisions} getKlnames={this.getKlnames} outcomes={outcomes} />

            </>)}
          {this.state.activeTab === 'Validate' && <ValidateRules attributes={attributes} decisions={decisions} vState={vState} ruleset={this.props.ruleset} sendValidate={this.sendValidate} updateVState={this.updateVState} />}
          {this.state.activeTab === 'Local Ops' && (
            <>
              <Banner message={generate_message} ruleset={this.props.ruleset} onConfirm={this.generateFile} />
              {/* <Banner message={delete_message} ruleset={this.props.ruleset} onConfirm={this.deleteRuleset} /> */}
            </>
          )}
          {this.state.activeTab === 'Server Ops' && (
            <>
              <Banner message={upload_message} ruleset={this.props.ruleset} onConfirm={this.preSendRuleset} />
              <Banner message={delete_server_message} ruleset={this.props.ruleset} onConfirm={this.preSendDeleteRuleset} />
              <Banner message={deploy_message} ruleset={this.props.ruleset} onConfirm={this.preSendDeployRuleset} isLoading={this.state.isLoading} />
              <Panel title="Deployment Results" >
                {this.state.deployResponses && this.state.deployResponses.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }} align='center'>Node</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }} align='center'>Result</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.deployResponses.map((item, index) => (
                        <tr key={index} >
                          <td style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }} align='center'>{item.node}</td>
                          <td style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }} align='center'>
                            {item.result ?
                              <FontAwesomeIcon icon={faCircleCheck} color="green" /> :
                              <FontAwesomeIcon icon={faCircleExclamation} color="red" />
                            }
                          </td>
                          <td style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }}>{item.info}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>)}
              </Panel>
            </>
          )}
          {this.state.generateFlag && this.successAlert()}
          {this.state.sendToServerFlag && this.sendToServerAlert()}
          {this.state.sendToServerErrFlag && this.sendToServerErrAlert()}
          {this.state.validateFlag && this.validateAlert()}
          {this.state.validateErrFlag && this.validateErrAlert()}
          {this.state.alert}
          {this.state.deleteFlag && this.deleteFromServerAlert()}
          {this.state.deleteErrFlag && this.deleteFromServerErrAlert()}
          {this.state.deployFlag && this.deployAlert()}
          {this.state.deployErrFlag && this.deployErrAlert()}
        </div>
      </RuleErrorBoundary>
    </div>
  }
}

RulesetContainer.propTypes = {
  ruleset: PropTypes.object,
  handleKlist: PropTypes.func,
  handleDecisions: PropTypes.func,
  updatedFlag: PropTypes.array,
  runRules: PropTypes.func,
}

RulesetContainer.defaultProps = {
  ruleset: {},
  handleKlist: () => false,
  handleDecisions: () => false,
  updatedFlag: [],
}
const mapStateToProps = (state) => ({
  ruleset: state.ruleset.rulesets[state.ruleset.activeRuleset],
  updatedFlag: state.ruleset.updatedFlag,
});

const mapDispatchToProps = (dispatch) => ({
  handleKlist: (operation, klist, name) => dispatch(handleKlist(operation, klist, name)),
  handleDecisions: (operation, decision, metadata = {}) => dispatch(handleDecision(operation, decision, metadata)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RulesetContainer);
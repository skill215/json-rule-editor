import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Tree from '../tree/tree';
import { PanelBox } from '../panel/panel';
import 'font-awesome/css/font-awesome.min.css';
import SweetAlert from 'react-bootstrap-sweetalert';
import { transformRuleToTree } from '../../utils/transform';
import ViewAttribute from '../attributes/view-attributes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowCircleUp, faArrowCircleDown, faCircleMinus, faEyeSlash, faEye, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

class DecisionDetails extends Component {

    static getDerivedStateFromProps(props, state) {
        let sRules = DecisionDetails.getSortedRules(props.outcomes);
        if ((Object.keys(sRules).length !== state.showCase.length) || (state.changedFlag == true) || (props.ruleDetailUpdatedFlag == true)) {
            //console.log(`sRules).length=${Object.keys(sRules).length}, state.showCase.length=${state.showCase.length}`);
            const showCase = Object.keys(sRules).map((key, index) => {
                return ({ case: false, edit: false, index });
            });
            // console.log(`Rules changed, showCase =========> ${JSON.stringify(showCase)}`);
            // console.log(`Rules changed, sRUles =========> ${JSON.stringify(sRules)}`);
            // console.log(`Rules changed, sortedRule =========> ${JSON.stringify(state.sortedRules)}`);
            // console.log(`Rule details updated, props.ruleDetailUpdatedFlag =========> ${JSON.stringify(props.ruleDetailUpdatedFlag)}`);
            // console.log(`Rules changed, state.changedFlag =========> ${JSON.stringify(state.changedFlag)}`);
            props.setRuleDetailUpdatedFlag(false);
            return { showCase, sortedRules: Object.values(sRules), changedFlag: false };
        }
        return null;
    }


    static getSortedRules = (input) => {
        let output = {};

        if (!input) {
            return {};
        }

        // Iterate over each rule in the input array
        input.forEach(rule => {
            // Add the rule to the output object, using its ruleIndex as the key
            output[rule.ruleIndex] = rule;
        });

        // Convert the output object to an array of rules
        let outputArray = Object.values(output);

        // Sort the array by ruleIndex
        outputArray.sort((a, b) => a.ruleIndex - b.ruleIndex);

        // Convert the sorted array back to an object
        let sortedOutput = {};
        outputArray.forEach(rule => {
            sortedOutput[rule.ruleIndex] = rule;
        });

        return sortedOutput;
    }

    static getSortedRulesBeta = (input) => {
        let output = [];

        // Flatten the input array of arrays into a single array
        input.forEach(subArray => {
            output = [...output, ...subArray];
        });

        // Sort the array by index
        output.sort((a, b) => a.index - b.index);

        return output;
    }

    constructor(props) {
        super(props);

        const sortedRules = DecisionDetails.getSortedRules(props.outcomes);

        const showCase = Object.keys(sortedRules).map((key, index) => {
            return ({ case: false, edit: false, index });
        })

        // console.log(`showCase =========> ${JSON.stringify(showCase)}`);
        // console.log(`outcomes =========> ${JSON.stringify(props.outcomes)}`);
        // console.log(`Sorted Rules =========> ${JSON.stringify(sortedRules)}`);

        this.state = {
            showCase,
            sortedRules,
            submitAlert: false,
            removeAlert: false,
            successAlert: false,
            removeDecisionAlert: false,
            moveRuleUpAlert: false,
            moveRuleDownAlert: false,
            changedFlag: false,
            showFullRuleName: false,
            successMsg: '',
            ruleCount: 0
        };
        this.handleExpand = this.handleExpand.bind(this);
        this.handleRemoveCondition = this.handleRemoveCondition.bind(this);
        this.handleRemoveConditions = this.handleRemoveConditions.bind(this);
        this.editCondition = this.editCondition.bind(this);
        this.cancelAlert = this.cancelAlert.bind(this);
        this.removeCase = this.removeCase.bind(this);
        this.removeDecisions = this.removeDecisions.bind(this);
        this.moveRuleUp = this.moveRuleUp.bind(this);
        this.moveRuleDown = this.moveRuleDown.bind(this);
        this.toggleActive = this.toggleActive.bind(this);
        this.updateRule = this.updateRule.bind(this);
    }


    handleEdit(e, val) {
        e.preventDefault();
        this.setState({ showRuleIndex: val });
    }

    editCondition(e, decisionIndex) {
        e.preventDefault();
        console.log(`in editCondition, decisionIndex =========> ${JSON.stringify(decisionIndex)}`);
        this.props.editCondition(decisionIndex);
    }

    handleExpand(e, index) {
        e.preventDefault();
        const cases = [...this.state.showCase];
        let updateCase = cases[index];
        updateCase = { ...updateCase, case: !updateCase.case }
        cases[index] = { ...updateCase };
        // console.log(`cases [${index}] =========> ${JSON.stringify(cases)}`);
        this.setState({ showCase: cases });
    }

    handleRemoveCondition(e, decisionIndex) {
        e.preventDefault();
        // console.log(`in handleRemoveCondition, decisionIndex =========> ${JSON.stringify(decisionIndex)}`);
        // console.log(`in handleRemoveCondition, this.props =========> ${JSON.stringify(this.props)}`);
        // console.log(`in handleRemoveCondition, this.state =========> ${JSON.stringify(this.state)}`);
        this.setState({ removeAlert: true, removeDecisionIndex: decisionIndex });
    }

    handleRemoveConditions(e, outcome) {
        e.preventDefault();
        // console.log(`in handleRemoveConditions, outcome =========> ${JSON.stringify(outcome)}`);
        this.setState({ removeDecisionAlert: true, removeOutcome: outcome });
    }

    cancelAlert = () => {
        this.setState({ removeAlert: false, successAlert: false, removeDecisionAlert: false });
    }

    removeCase = () => {
        // console.log('In removeCase')
        this.props.removeCase(this.state.removeDecisionIndex);
        this.setState({ removeAlert: false, successAlert: true, successMsg: 'Selected condition is removed' });
    }

    removeDecisions = () => {
        // console.log(`this.props =========> ${JSON.stringify(this.props)}`)
        this.props.removeDecisions(this.state.removeIndex);
        this.setState({ removeDecisionAlert: false, successAlert: true, successMsg: 'Selected conditions are removed', removeIndex: '' });
    }

    updateRule = (rule) => {
        //console.log(`In updateRule, rule =========> ${JSON.stringify(rule)}`);
        //console.log(`In updateRule, this.props =========> ${JSON.stringify(this.props)}`)
        //console.log(`in updateRule, this.state =========> ${JSON.stringify(this.state)}`);
        //this.props.removeCase(rule);
        const result = this.props.updateRule(rule);

        // console.log(`In updateRule, the result is =========> ${JSON.stringify(result)}`);
    }

    moveRuleUp = (e, index) => {
        e.preventDefault();
        // console.log(`In moveRuleUp, index =========> ${JSON.stringify(index)}`);
        this.props.moveUp(index);
        this.setState({ changedFlag: true, moveRuleUpAlert: true, successMsg: 'Selected condition is moved up' });
    }

    moveRuleDown = (e, index) => {
        e.preventDefault();
        // console.log(`In moveRuleDown, index =========> ${JSON.stringify(index)}`);
        this.props.moveDown(index);
        this.setState({ changedFlag: true, moveRuleDownAlert: true, successMsg: 'Selected condition is moved down' });
    }

    toggleActive = (e, rule) => {
        e.preventDefault();
        // console.log(`In toggleActive, rule =========> ${JSON.stringify(rule)}`);

        const updatedRule = { ...rule, enabled: !rule.enabled };

        // console.log(`In toggleActive after change, rule =========> ${JSON.stringify(rule)}`);

        this.updateRule(updatedRule);
        this.setState(prevState => ({
            sortedRules: {
                ...prevState.sortedRules,
                [updatedRule.key]: updatedRule
            }
        }));
        this.setState({ changedFlag: true, });
    }

    removeCaseAlert = () => {
        return (<SweetAlert
            warning
            showCancel
            confirmBtnText="Yes, Remove it!"
            confirmBtnBsStyle="danger"
            title="Are you sure?"
            onConfirm={this.removeCase}
            onCancel={this.cancelAlert}
            focusCancelBtn
        >
            You will not be able to recover the changes!
        </SweetAlert>)
    }

    removeDecisionAlert = () => {
        return (<SweetAlert
            warning
            showCancel
            confirmBtnText="Yes, Remove it!"
            confirmBtnBsStyle="danger"
            title="Are you sure?"
            onConfirm={this.removeDecisions}
            onCancel={this.cancelAlert}
            focusCancelBtn
        >
            You will not be able to recover the changes!
        </SweetAlert>)
    }

    successAlert = () => {
        return (<SweetAlert
            success
            title={this.state.successMsg}
            onConfirm={this.cancelAlert}
        >
        </SweetAlert>);
    }

    alert = () => {
        return (<div>
            {this.state.removeAlert && this.removeCaseAlert()}
            {this.state.removeDecisionAlert && this.removeDecisionAlert()}
            {this.state.successAlert && this.successAlert()}
        </div>);
    }

    renderConditions = (conditions, index) => {
        console.log(`index =========> ${JSON.stringify(index)}`);
        console.log(`conditions =========> ${JSON.stringify(conditions)}`);
        const transformedData = transformRuleToTree(conditions);
        console.log(`transformedData =========> ${JSON.stringify(transformedData)}`);
        return (
            <div className="rule-flex-container">
                <div className="decision-box" key={`case - ${index}`}>
                    <div className="tool-flex">
                        <div><a href="" onClick={(e) => this.editCondition(e, index)}><FontAwesomeIcon icon={faPenToSquare} /></a></div>
                        {/* <div><a href="" onClick={((e) => this.handleRemoveCondition(e, index))}><FontAwesomeIcon icon={faTrash} /></a></div> */}
                    </div>
                    <Tree treeData={transformedData.node} count={transformedData.depthCount} />
                    {transformedData.event.params && <div className="view-params-container">
                        <h4>Params</h4>
                        <ViewAttribute items={transformedData.event.params.map(param => ({
                            key: param.key,
                            value: `Operator: ${param.operator}, Original Value: ${param.ovalue}, Target Value: ${param.tvalue}`
                        }))} />
                    </div>}
                    {transformedData.event && <div className="view-event-container">
                        <h4>Actions</h4>
                        {transformedData.event.map((event, i) => (
                            <div key={i}>
                                {event.params && event.params.length > 0
                                    ? <div>
                                        <h4>{event.type}</h4>
                                        <table style={{ borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ borderRight: '1px solid black', padding: '5px' }}>Key</th>
                                                    <th style={{ borderRight: '1px solid black', padding: '5px' }}>Operator</th>
                                                    <th style={{ borderRight: '1px solid black', padding: '5px' }}>Original Value</th>
                                                    <th style={{ padding: '5px' }}>Target Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {event.params.map((param, index) =>
                                                    <tr key={index}>
                                                        <td style={{ borderRight: '1px solid black', padding: '5px' }}>{param.key}</td>
                                                        <td style={{ borderRight: '1px solid black', padding: '5px' }}>{param.operator}</td>
                                                        <td style={{ borderRight: '1px solid black', padding: '5px' }}>{param.ovalue}</td>
                                                        <td style={{ padding: '5px' }}>{param.tvalue}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    : <p>{event.type}</p>
                                }
                            </div>
                        ))}
                    </div>}
                </div>
            </div>
        );
    }

    render() {
        const { outcomes } = this.props;
        const { showCase } = this.state;
        const { sortedRules } = this.state;
        // const displayRuleName = showFullRuleName ? ruleName : `${ruleName.substring(0, 20)}...`;

        // console.log(`sortedRules =========> ${JSON.stringify(sortedRules)}`);
        const conditions = Object.keys(sortedRules).map((key) =>
        (<div key={key}>
            <PanelBox className={'boolean'}>
                <div className="enable">
                    {/* TODO: The enable/disable status are not updated timely*/}
                    <input type="checkbox" checked={sortedRules[key].enabled} onChange={((e) => this.toggleActive(e, sortedRules[key]))} title="Toggle Rule ON/OFF" />
                    <label style={{ fontSize: '0.8em' }}>{sortedRules[key].enabled ? 'Enabled' : 'Disabled'}</label>
                </div>
                <div className="index" title="Index/priority">{Number(key) + 1}</div>
                <div className="name" title="Name">{String(`${sortedRules[key].ruleName.substring(0, 50)}`)}</div>
                {/* <div className="type">conditions <span className="type-badge">{Object.keys(sortedRules[key].conditions).length}</span></div> */}
                <div className="move">
                    <a href="" onClick={((e) => this.moveRuleUp(e, sortedRules[key].ruleIndex))}><FontAwesomeIcon icon={faArrowCircleUp} title="Rise the priority" /></a>
                    <a href="" onClick={((e) => this.moveRuleDown(e, sortedRules[key].ruleIndex))}><FontAwesomeIcon icon={faArrowCircleDown} title="Lower the priority" /></a>
                </div>
                <div className="menu">
                    <a href="" onClick={(e) => this.handleExpand(e, key)}> {showCase[key].case ? <FontAwesomeIcon icon={faEyeSlash} title="Collapse details" /> : <FontAwesomeIcon icon={faEye} title="Show details" />}</a>
                    <a href="" onClick={((e) => this.handleRemoveCondition(e, String(key)))}>
                        <FontAwesomeIcon icon={faCircleMinus} title="DELETE the rule" color="#D34836" />
                    </a>
                </div>
            </PanelBox>

            {showCase[key].case && this.renderConditions(sortedRules[key], key)}
        </div>));

        return (<div className="">
            {this.alert()}
            {conditions}
        </div>);
    }
}

DecisionDetails.defaultProps = ({
    decisions: [],
    editCondition: () => false,
    removeCase: () => false,
    removeDecisions: () => false,
    moveUp: () => false,
    moveDown: () => false,
    updateRule: () => false,
    getKlnames: () => false,
    outcomes: [],
    // ruleDetailUpdatedFlag: false,
    // setRuleDetailUpdatedFlag: () => false,
});

DecisionDetails.propTypes = ({
    decisions: PropTypes.array,
    editCondition: PropTypes.func,
    removeCase: PropTypes.func,
    removeDecisions: PropTypes.func,
    ruleDetailUpdatedFlag: PropTypes.bool,
    moveUp: PropTypes.func,
    moveDown: PropTypes.func,
    updateRule: PropTypes.func,
    getKlnames: PropTypes.func,
    outcomes: PropTypes.array,
    setRuleDetailUpdatedFlag: PropTypes.func,
});

export default DecisionDetails;
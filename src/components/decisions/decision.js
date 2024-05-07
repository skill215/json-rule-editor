import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SelectField from '../forms/selectmenu-field';
import ToolBar from '../toolbar/toolbar';
import AddDecision from './add-decision';
import DecisionDetails from './decision-details';
import Banner from '../panel/banner';
import * as Message from '../../constants/messages';
import { transformRuleToTree } from '../../utils/transform';
import { isContains } from '../../utils/stringutils';
import features from '../../data-objects/features.json';

class Decision extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showAddRuleCase: false,
            searchCriteria: '',
            editCaseFlag: false,
            editCondition: [],
            message: Message.NO_DECISION_MSG,
            decisions: props.decisions || [],
            bannerflag: false,
            defaultAction: props.defaultAction || 'ACCEPT',
            defaultActionSetFlag: false,
            feature: props.feature || 'Spamming Protection',
            featureSetFlag: false,
            ruleDetailUpdatedFlag: false,
        };
        this.handleAdd = this.handleAdd.bind(this);
        this.updateCondition = this.updateCondition.bind(this);
        this.editCondition = this.editCondition.bind(this);
        this.addCondition = this.addCondition.bind(this);
        this.removeCase = this.removeCase.bind(this);
        this.cancelAddAttribute = this.cancelAddAttribute.bind(this);
        this.removeDecisions = this.removeDecisions.bind(this);
        this.updateRule = this.updateRule.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.moveDown = this.moveDown.bind(this);
        this.moveUp = this.moveUp.bind(this);
        this.uploadList = this.uploadList.bind(this);
        this.getKlnames = this.getKlnames.bind(this);
        this.handleDefaultActionChange = this.handleDefaultActionChange.bind(this);
        this.onChangeNewFeature = this.onChangeNewFeature.bind(this);
        this.setRuleDetailUpdatedFlag = this.setRuleDetailUpdatedFlag.bind(this);
    }

    handleSearch = (value) => {
        this.setState({ searchCriteria: value })
    }

    handleAdd = () => {
        this.setState({ showAddRuleCase: true, bannerflag: true });
    }

    cancelAddAttribute = () => {
        this.setState({ showAddRuleCase: false, editCaseFlag: false, bannerflag: false });
    }

    editCondition(decisionIndex) {
        const decision = this.props.decisions[decisionIndex];
        console.log(`in editCondition, decision: ${JSON.stringify(decision)} `);
        const editCondition = transformRuleToTree(decision);
        console.log(`in editCondition, editCondition: ${JSON.stringify(editCondition)} `);
        let outputParams = [];
        if (decision.event.params && decision.event.params.length > 0) {
            outputParams = decision.event.params.map(param => ({
                key: param.key,
                operator: param.operator,
                ovalue: param.ovalue,
                tvalue: param.tvalue
            }));
        }

        this.setState({
            editCaseFlag: true,
            editCondition,
            editDecisionIndex: decisionIndex,
            editOutcome: decision.event,
        });
    }

    addCondition(condition, metadata) {
        //console.log(`in addCondition, this.props: ${JSON.stringify(this.props)} `);
        const updatedMetadata = { ...metadata, ruleIndex: this.props.decisions.length };
        console.log(`in addCondition, updatedMetadata: ${JSON.stringify(updatedMetadata)} `);
        this.props.handleDecisions('ADD', { condition }, updatedMetadata);

        // HACK: set the default action and feature when the user firstly add a condition
        if (!this.state.defaultActionSetFlag) {
            this.setState({ defaultActionSetFlag: true });
            this.props.handleDecisions('UPDATEDEFAULTACTION', { defaultAction: this.state.defaultAction });
        }
        if (!this.state.featureSetFlag) {
            this.setState({ featureSetFlag: true });
            this.props.handleDecisions('UPDATEFEATURE', { feature: this.state.feature });
        }
        console.log(`in addCondition, set the ruleDetailUpdatedFlag to true `);

        this.setState({ showAddRuleCase: false, ruleDetailUpdatedFlag: true });
    }

    updateCondition(condition, metadata) {
        console.log(`in updateCondition, condition: ${JSON.stringify(condition)} `);
        console.log(`in updateCondition, metadata: ${JSON.stringify(metadata)} `);
        this.props.handleDecisions('UPDATE', {
            condition,
            decisionIndex: this.state.editDecisionIndex
        }, metadata);
        console.log(`in updateCondition, set the ruleDetailUpdatedFlag to true `);
        this.setState({ editCaseFlag: false, ruleDetailUpdatedFlag: true });
    }

    setRuleDetailUpdatedFlag(flag) {
        // console.log(`in setRuleDetailUpdatedFlag, flag: ${JSON.stringify(flag)} `);
        this.setState({ ruleDetailUpdatedFlag: flag });
    }

    removeCase(decisionIndex) {
        this.props.handleDecisions('REMOVECONDITION', { decisionIndex });
    }

    removeDecisions(index) {
        // console.log(`in removeDecisions, index: ${JSON.stringify(index)} `);
        this.props.handleDecisions('REMOVEDECISION', { index });
    }

    updateRule(rule) {
        // console.log(`in updateRule in decision.js, rule: ${JSON.stringify(rule)} `);
        this.props.handleDecisions('UPDATERULE', rule);
        // console.log(`in updateRule, set the ruleDetailUpdatedFlag to true `);

        this.setState({ editCaseFlag: false, ruleDetailUpdatedFlag: true });

    }

    // updateRule(rule) {}

    handleReset() {
        this.props.handleDecisions('RESET');
    }

    filterOutcomes = () => {
        const { searchCriteria } = this.state;
        const { outcomes } = this.props;
        let filteredOutcomes = {};
        Object.keys(outcomes).forEach((key) => {
            if (isContains(key, searchCriteria)) {
                filteredOutcomes[key] = outcomes[key];
            }
        });
        return filteredOutcomes;
    }

    moveUp(ruleIndex) {
        // console.log(`in moveUp, ruleIndex: ${JSON.stringify(ruleIndex)} `);
        this.props.handleDecisions('MOVEUP', { ruleIndex });
    }

    moveDown(ruleIndex) {
        // console.log(`in moveDown, ruleIndex: ${JSON.stringify(ruleIndex)} `);
        this.props.handleDecisions('MOVEDOWN', { ruleIndex });
    }

    uploadList(listContent) {
        // console.log(`in uploadList, listContent: ${JSON.stringify(listContent)} `);
        this.props.handleDecisions('UPLOADLIST', listContent);
    }

    getKlnames() {
        const klNames = this.props.getKlnames();
        // console.log(`klNames in decision.js: ${JSON.stringify(klNames)}`);
        return klNames;
    }


    handleDefaultActionChange(event) {
        this.setState({ defaultAction: event.target.value });
        this.props.handleDecisions('UPDATEDEFAULTACTION', { defaultAction: event.target.value });
    }

    onChangeNewFeature = (e, name) => {
        this.setState({ [name]: e.target.value });
        console.log(`e.target.value in onChangeNewFeature: ${JSON.stringify(e.target.value)}`);
        this.props.handleDecisions('UPDATEFEATURE', { feature: e.target.value });
    }

    render() {
        const { searchCriteria, bannerflag } = this.state;
        const { defaultAction, feature } = this.props;
        const buttonProps = { primaryLabel: 'Add Rulecase', secondaryLabel: 'Cancel' };
        const editButtonProps = { primaryLabel: 'Save Changes', secondaryLabel: 'Cancel' };
        const filteredOutcomes = searchCriteria ? this.filterOutcomes() : this.props.outcomes;
        const { outcomes } = this.props;
        const { features: featureArray } = features;
        const featureOptions = featureArray.map(feature => ({ value: feature, label: feature }));

        // console.log(`featureOptions in decision.js: ${JSON.stringify(featureOptions)}`);

        return (<div className="rulecases-container">

            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ marginRight: '30px' }}>
                    <label htmlFor="feature">Apply on Feature:</label>
                    <select id="feature" onChange={(e) => this.onChangeNewFeature(e, 'feature')} value={feature} title="Select the feature that this rule should be applied to">
                        {featureOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="defaultAction">Default Action:</label>
                    <select id="defaultAction" onChange={this.handleDefaultActionChange} value={defaultAction} title="Default Action when no rule is matched">
                        <option value="ACCEPT">ACCEPT</option>
                        <option value="REJECT">REJECT</option>
                    </select>
                </div>
                <ToolBar handleAdd={this.handleAdd} />
            </div>

            {this.state.showAddRuleCase && <AddDecision attributes={this.props.attributes} addCondition={this.addCondition} cancel={this.cancelAddAttribute} uploadList={this.uploadList} getKlnames={this.getKlnames} buttonProps={buttonProps} />}

            {this.state.editCaseFlag && <AddDecision attributes={this.props.attributes} editCondition={this.state.editCondition}
                outcome={this.state.editOutcome} editDecision addCondition={this.updateCondition} cancel={this.cancelAddAttribute} getKlnames={this.getKlnames} buttonProps={editButtonProps} />}

            <DecisionDetails outcomes={filteredOutcomes} editCondition={this.editCondition} ruleDetailUpdatedFlag={this.state.ruleDetailUpdatedFlag} removeCase={this.removeCase} removeDecisions={this.removeDecisions} updateRule={this.updateRule} moveUp={this.moveUp} moveDown={this.moveDown} getKlnames={this.getKlnames} setRuleDetailUpdatedFlag={this.setRuleDetailUpdatedFlag} />

            {!bannerflag && Object.keys(outcomes).length < 1 && <Banner message={this.state.message} onConfirm={this.handleAdd} />}
        </div>);
    }
}

Decision.defaultProps = ({
    handleDecisions: () => false,
    submit: () => false,
    reset: () => false,
    decisions: [],
    attributes: [],
    outcomes: [],
    moveUp: () => false,
    moveDown: () => false,
    getKlnames: () => false,
    defaultAction: '',
    feature: '',
});

Decision.propTypes = ({
    handleDecisions: PropTypes.func,
    submit: PropTypes.func,
    reset: PropTypes.func,
    decisions: PropTypes.array,
    attributes: PropTypes.array,
    outcomes: PropTypes.object,
    moveUp: PropTypes.func,
    moveDown: PropTypes.func,
    getKlnames: PropTypes.func,
    defaultAction: PropTypes.string,
    feature: PropTypes.string,
});

export default Decision;
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Panel from '../panel/panel';
import InputField from '../forms/input-field';
import SelectField from '../forms/selectmenu-field';
import Button from '../button/button';
import ButtonGroup from '../button/button-groups';
import operator from '../../data-objects/operator.json';
import abstractOperator from '../../data-objects/abstract-operator.json';
import paramsOptions from '../../data-objects/params.json';
import decisionValidations from '../../validations/decision-validation';
import Tree from '../tree/tree';
import { has } from 'lodash/object';
import { getNodeDepthDetails, getNodeDepth } from '../../utils/treeutils';
import { transformTreeToRule } from '../../utils/transform';
import { sortBy } from 'lodash/collection';
import { validateAttribute } from '../../validations/decision-validation';
import { PLACEHOLDER } from '../../constants/data-types';
import ApperanceContext from '../../context/apperance-context';
import { filter } from 'lodash';



const nodeStyle = {
    shape: 'circle',
    shapeProps: {
        fill: '#1ABB9C',
        r: 10,
    },
};

const factsButton = [{ label: 'Add Condition', disable: false },
{ label: 'Add All', disable: false },
{ label: 'Add Any', disable: false },
{ label: 'Remove', disable: false }];

const topLevelOptions = [{ label: 'All', active: false, disable: false },
{ label: 'Any', active: false, disable: false }];

const outcomeOptions = [{ label: 'Add Action', active: false, disable: false },
{ label: 'Edit Conditions', active: false, disable: false }];

const editOutcomeOptions = [{ label: 'Edit Action', active: false, disable: false },
{ label: 'Edit Conditions', active: false, disable: false }];

class AddDecision extends Component {
    constructor(props) {
        super(props);

        const addAttribute = { error: {}, name: '', operator: '', value: '' };
        const node = props.editDecision ? props.editCondition.node : {};
        const activeNode = { index: 0, depth: 0 };
        const eventTypes = paramsOptions["event-type"];

        this.state = {
            attributes: props.attributes,
            outcome: props.editDecision ? props.outcome.map(outcomeItem => ({
                ...outcomeItem,
                params: outcomeItem.params.map(param => ({
                    key: param.key || '', // Assuming 'key' exists in your current structure and you want to keep its value or set a default
                    operator: param.operator || '', // Same assumption as above
                    ovalue: param.ovalue || '', // Initialize 'ovalue' with an existing value or set a default
                    tvalue: param.tvalue || '' // Initialize 'tvalue' with an existing value or set a default
                }))
            })) : [{
                index: 0,
                value: eventTypes.length > 0 ? eventTypes[0] : '',
                error: {},
                params: [] // Keep it empty or initialize with default objects if necessary
            }],
            addAttribute,
            enableTreeView: props.editDecision,
            enableFieldView: false,
            enableOutcomeView: false,
            node,
            metadata: {
                ruleName: props.editCondition.ruleName ? props.editCondition.ruleName : '',
                description: '',
                enabled: props.editCondition.enabled ? props.editCondition.enabled : false,
                ruleIndex: props.editCondition.ruleIndex ? props.editCondition.ruleIndex : 0
            },
            topLevelOptions,
            factsButton: factsButton.map(f => ({ ...f, disable: true })),
            outcomeOptions: outcomeOptions.map(f => ({ ...f, disable: true })),
            editOutcomeOptions: editOutcomeOptions.map(f => ({ ...f, disable: true })),

            formError: '',
            addPathflag: false,
            activeNodeDepth: [activeNode],
            isOperatorInList: false,
            isListActive: false,
            isCharacteristics: false,
            inputValue: '',
            isInputValue: true,

            //Upload file related states
            uploadedFilesCount: 0,
            files: [],
            uploadError: false,
            fileExist: false,
            listContent: {},
            message: {}
        };
        this.handleAdd = this.handleAdd.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.onChangeNewFact = this.onChangeNewFact.bind(this);
        this.onChangeOutcomeValue = this.onChangeOutcomeValue.bind(this);
        this.handleTopNode = this.handleTopNode.bind(this);
        this.handleActiveNode = this.handleActiveNode.bind(this);
        this.handleChildrenNode = this.handleChildrenNode.bind(this);
        this.handleFieldCancel = this.handleFieldCancel.bind(this);
        this.handleOutputPanel = this.handleOutputPanel.bind(this);
        this.handleOutputParams = this.handleOutputParams.bind(this);
        this.addParams = this.addParams.bind(this);
        this.handleRemoveParam = this.handleRemoveParam.bind(this);
        this.addPath = this.addPath.bind(this);
        this.addOutcome = this.addOutcome.bind(this);
        this.mergeEvent = this.mergeEvent.bind(this);
        this.onChangeInput = this.onChangeInput.bind(this);
        this.onChangeNewOperator = this.onChangeNewOperator.bind(this);
        this.onChangeInputSelector = this.onChangeInputSelector.bind(this);
        this.replaceTypeWithValue = this.replaceTypeWithValue.bind(this);

    }

    handleAdd(e) {
        e.preventDefault();
        console.log(`Printing props =========> ${JSON.stringify(this.props)}`);
        console.log(`Printing this.state.node =========> ${JSON.stringify(this.state.node)}`);
        const errors = this.state.outcome.map(outcome => decisionValidations(this.state.node, outcome));
        console.log(`Printing errors =========> ${JSON.stringify(errors)}`);
        const formError = errors.some(error => error.formError);
        console.log(`Printing outcome =========> ${JSON.stringify(this.state.outcome)}`);

        if (formError) {
            const updatedOutcomes = this.state.outcome.map((outcome, index) => ({ ...outcome, error: errors[index].outcome }));
            this.setState({ formError, outcome: updatedOutcomes });
        } else {
            const conditions = this.state.outcome.map((outcome, index) => {
                console.log(`Printing conditions =========> ${JSON.stringify(conditions)}`);
                let outcomeParams = [];
                outcome.params.forEach(param => {
                    const { key, operator, ovalue, tvalue } = param;
                    console.log(`param: key: ${key}; operator: ${operator}; ovalue: ${ovalue}; tvalue: ${tvalue}`);
                    // Assuming outcomeParams is an array now, given the new structure. Adjust as necessary.
                    outcomeParams.push({ key, operator, ovalue, tvalue });
                });
                console.log(`Printing outcome params ==========> ${JSON.stringify(outcomeParams)}`);
                console.log(`Printing node =========> ${JSON.stringify(this.state.node)}`);
                outcome = this.replaceTypeWithValue(outcome);
                console.log(`Printing outcome =========> ${JSON.stringify(outcome)}`);
                return transformTreeToRule(this.state.node, outcome, outcomeParams);
                //return event;
            });
            console.log(`Printing new events =========> ${JSON.stringify(conditions)}`);

            const mergedConditions = this.mergeEvent(conditions);
            console.log(`Printing mergedConditions =========> ${JSON.stringify(mergedConditions)}`);
            // console.log(`Printing metadata =========> ${JSON.stringify(this.state.metadata)}`);
            this.props.addCondition(mergedConditions, this.state.metadata);
            //conditions.forEach(condition => this.props.addCondition(condition));
        }
    }

    replaceTypeWithValue(obj) { //Hack to replace type with value
        const { type, ...rest } = obj;
        return { ...rest, value: type };
    }

    mergeEvent(conditions) {
        let merged = []
        let firstCondition = conditions[0];

        firstCondition.event = [firstCondition.event];

        for (let i = 1; i < conditions.length; i++) {
            firstCondition.event.push(conditions[i].event);
        }
        firstCondition.event = firstCondition.event.map((event, index) => ({ ...event, index: index + 1 }));

        merged.push(firstCondition);
        return merged;
    }

    handleCancel() {
        this.props.cancel();
    }

    onChangeInput(e, name) {
        const newValue = e.target.value.replace(/,/g, ';');
        const addAttribute = { ...this.state.addAttribute };
        addAttribute[name] = newValue;
        addAttribute['valueType'] = "string";
        this.setState({ addAttribute });
    }

    onChangeInputSelector(e, name) {
        const newValue = e.target.value.replace(/,/g, ';');
        const addAttribute = { ...this.state.addAttribute };
        addAttribute[name] = newValue;
        addAttribute['valueType'] = "list";

        this.setState({ addAttribute });
    }


    onChangeNewFact(e, name) {
        const addAttribute = { ...this.state.addAttribute };
        addAttribute[name] = e.target.value;

        if (e.target.value === 'CHARACTERISTICS') {
            this.setState({ isCharacteristics: true });
        } else {
            this.setState({ isCharacteristics: false });
        }

        this.setState({ addAttribute });

    }

    onChangeNewOperator(e, name) {
        const addAttribute = { ...this.state.addAttribute };
        addAttribute[name] = e.target.value;

        // Define the operators to exclude
        const excludeOperators = [
            'longerThan',
            'shorterThan',
            'match',
            "isMO",
            "isMT",
            "isAO",
            "isAT",
            "isConcatenated",
            "isHomerouting"];

        // If the operator is not in the excludeOperators list, set a flag in the state
        console.log(`printing name=${name}, event=${e.target.value}`);
        if (name === 'operator' && excludeOperators.includes(e.target.value)) {
            this.setState({ isOperatorInList: false });
        } else {
            this.setState({ isOperatorInList: true });
        }

        this.setState({ addAttribute });
    }


    onChangeOutcomeValue(e, type, index) {
        const outcomes = [...this.state.outcome];
        outcomes[index][type] = e.target.value;
        console.log(`Printing outcomes[${index}] =========> ${JSON.stringify(outcomes[index])}`);
        this.setState({ outcome: outcomes });
    }

    addParams(outcomeIndex) {
        console.log(`Printing outcomeIndex in addParams =========> ${outcomeIndex}`);
        const { outcome: outcomes } = this.state;
        // Create a new parameter object with default or empty values
        const newParam = { key: '', operator: '', ovalue: '', tvalue: '' };
        // Add the new parameter object to the params array of the specified outcome
        outcomes[outcomeIndex].params.push(newParam);
        // Update the state with the modified outcomes array
        this.setState({ outcome: outcomes });
        console.log(`Printing outcomes in addParams =========> ${JSON.stringify(outcomes)}`);
    }

    handleRemoveParam(index, outcomeIndex) {
        const { outcome: outcomes } = this.state;
        // Remove the parameter object at the specified index from the params array
        outcomes[outcomeIndex].params.splice(index, 1);
        // Update the state with the modified outcomes array
        this.setState({ outcome: outcomes });
    }

    addPath() {
        this.setState({ addPathflag: true });
    }

    addOutcome = () => {
        this.setState(prevState => {
            const lastIndex = prevState.outcome.length > 0 ? prevState.outcome[prevState.outcome.length - 1].index : -1;
            // Initialize a new outcome with an empty params array, ready to hold objects with the structure { key, operator, ovalue, tvalue }
            return {
                outcome: [...prevState.outcome, { value: '', params: [], index: lastIndex + 1 }],
            };
        });
    }

    handleOutputParams(e, type, index, outcomeIndex) {
        const { outcome: outcomes } = this.state;
        const params = [...outcomes[outcomeIndex].params];
        console.log(`Printing index =========> ${index}`);
        console.log(`Printing outcomeIndex =========> ${outcomeIndex}`);
        console.log(`Printing type =========> ${type}`);
        console.log(`Printing e.target.value =========> ${e.target.value}`);
        console.log(`Printing outcomes =========> ${JSON.stringify(outcomes)}`);

        if (type === 'pkey') {
            // Update the key property of the specific param object
            outcomes[outcomeIndex].params[index].key = e.target.value;
        } else if (type === 'operator') {
            // Update the operator property of the specific param object
            outcomes[outcomeIndex].params[index].operator = e.target.value;
        } else if (type === 'originalValue') {
            // Update the ovalue property of the specific param object
            outcomes[outcomeIndex].params[index].ovalue = e.target.value;
        } else if (type === 'targetValue') {
            // Update the tvalue property of the specific param object
            outcomes[outcomeIndex].params[index].tvalue = e.target.value;
        }
        outcomes[outcomeIndex].params = params;
        this.setState({ outcome: outcomes });
    }

    handleTopNode(value) {
        let parentNode = { ...this.state.node };
        const activeNode = { index: 0, depth: 0 };
        if (has(parentNode, 'name')) {
            parentNode.name = value === 'All' ? 'all' : 'any';
        } else {
            parentNode = { name: value === 'All' ? 'all' : 'any', nodeSvgShape: nodeStyle, children: [] };
        }
        const topLevelOptions = this.state.topLevelOptions.map(option => {
            if (option.label === value) {
                return { ...option, active: true };
            }
            return { ...option, active: false };
        })

        const factsButton = this.state.factsButton.map(button => ({ ...button, disable: false }));
        const outcomeOptions = this.state.outcomeOptions.map(button => ({ ...button, disable: false }));
        const editOutcomeOptions = this.state.editOutcomeOptions.map(button => ({ ...button, disable: false }));

        this.setState({
            enableTreeView: true, topNodeName: value, node: parentNode,
            activeNodeDepth: [activeNode], topLevelOptions, factsButton, outcomeOptions, editOutcomeOptions
        });
    }

    mapNodeName(val) {
        const node = {};
        const { addAttribute: { name, operator, value, valueType, path }, attributes } = this.state;
        console.log(`Printing addAttribute =========> ${JSON.stringify(this.state.addAttribute)}`);
        console.log(`Printing attributes =========> ${JSON.stringify(attributes)}`);
        if (val === 'Add All' || val === 'Add Any') {
            node['name'] = val === 'Add All' ? 'all' : 'any';
            node['nodeSvgShape'] = nodeStyle;
            node['children'] = [];
        } else {
            node['name'] = name;
            // node['valueType'] = valueType;
            let factValue = value.trim();
            const attProps = attributes.find(att => att.name === name);
            if (attProps.type === 'number') {
                factValue = Number(value.trim());
            }
            let fact = { [operator]: factValue };
            fact['valueType'] = valueType;
            if (path) {
                fact['path'] = `.${path}`;
            }
            node['attributes'] = { ...fact };
        }
        console.log(`Printing node =========> ${JSON.stringify(node)}`);
        return node;
    }

    handleChildrenNode(value) {
        let factOptions = [...factsButton];
        if (value === 'Add Condition') {
            this.setState({ enableFieldView: true });
        } else {
            const { activeNodeDepth, node, attributes } = this.state;
            const addAttribute = { error: {}, name: '', operator: '', value: '' };
            if (value === 'Add fact node') {
                const error = validateAttribute(this.state.addAttribute, attributes);
                console.log(`Printing error =========> ${JSON.stringify(error)}`);
                if (Object.keys(error).length > 0) {
                    let addAttribute = this.state.addAttribute;
                    addAttribute.error = error;
                    this.setState({ addAttribute });
                    return undefined;
                }
            }
            if (activeNodeDepth && node) {
                const newNode = { ...node };

                const getActiveNode = (pNode, depthIndex) => pNode[depthIndex];

                let activeNode = newNode;
                const cloneDepth = value === 'Remove' ? activeNodeDepth.slice(0, activeNodeDepth.length - 1) : [...activeNodeDepth]
                cloneDepth.forEach(nodeDepth => {
                    if (nodeDepth.depth !== 0) {
                        activeNode = getActiveNode(activeNode.children, nodeDepth.index);
                    }
                });
                const childrens = activeNode['children'] || [];
                if (value !== 'Remove') {
                    activeNode['children'] = childrens.concat(this.mapNodeName(value));
                } else {
                    const lastNode = activeNodeDepth[activeNodeDepth.length - 1];
                    childrens.splice(lastNode.index, 1);
                    factOptions = this.state.factsButton.map(button =>
                        ({ ...button, disable: true }));
                }

                this.setState({ node: newNode, enableFieldView: false, addAttribute, factsButton: factOptions });
            }
        }
    }


    handleActiveNode(node) {
        const depthArr = getNodeDepthDetails(node);
        const sortedArr = sortBy(depthArr, 'depth');

        const factsNodemenu = this.state.factsButton.map(button => {
            if (button.label !== 'Remove') {
                return { ...button, disable: true };
            }
            return { ...button, disable: false };
        });

        const parentNodeMenu = this.state.factsButton.map(button => {
            if (sortedArr.length < 1 && button.label === 'Remove') {
                return { ...button, disable: true };
            }
            return { ...button, disable: false };
        });

        const facts = node.name === 'all' || node.name === 'any' ? parentNodeMenu : factsNodemenu;
        const outcomeMenus = outcomeOptions.map(option => ({ ...option, disable: false }));
        const editOutcomeMenus = editOutcomeOptions.map(option => ({ ...option, disable: false }));
        this.setState({ activeNodeDepth: sortedArr, factsButton: facts, outcomeOptions: outcomeMenus, editOutcomeOptions: editOutcomeMenus });
    }

    handleFieldCancel() {
        const addAttribute = { error: {}, name: '', operator: '', value: '' };
        this.setState({ enableFieldView: false, addAttribute });
    }

    handleOutputPanel(value) {
        if (value === 'Add Action') {
            const factsOptions = this.state.factsButton.map(fact => ({ ...fact, disable: true }))
            console.log('Printing outcomeOptions =========> ' + JSON.stringify(this.state.outcomeOptions));
            console.log('Printing factOptions =========> ' + JSON.stringify(factsOptions));
            const options = this.props.editDecision ? this.state.editOutcomeOptions : this.state.outcomeOptions.map(opt => {
                if (opt.label === 'Add Action') {
                    return { ...opt, active: true };
                }
                return { ...opt, active: false };
            });
            this.setState({
                enableOutcomeView: true, enableTreeView: false,
                enableFieldView: false, outcomeOptions: options,
                editOutcomeOptions: options, factsButton: factsOptions
            });
        }
        if (value === 'Edit Action') {
            console.log('Printing editOutcomeOptions =========> ' + JSON.stringify(this.state.editOutcomeOptions));
            const options = this.state.editOutcomeOptions.map(opt => {
                if (opt.label === 'Edit Action') {
                    return { ...opt, active: true };
                }
                return { ...opt, active: false };
            });
            this.setState({ enableOutcomeView: true, enableTreeView: false, enableFieldView: false, outcomeOptions: options });
        }
        if (value === 'Edit Conditions') {
            const options = this.state.editOutcomeOptions.map(opt => {
                if (opt.label === 'Edit Conditions') {
                    return { ...opt, active: true };
                }
                return { ...opt, active: false };
            });
            this.setState({ enableOutcomeView: false, enableTreeView: true, enableFieldView: false, outcomeOptions: options });
        }
    }

    topPanel() {
        const { topLevelOptions, factsButton, outcomeOptions, editOutcomeOptions, metadata } = this.state;
        // console.log(`Printing node =========> ${JSON.stringify(this.state.node)}`);
        // console.log(`Printing metadata =========> ${JSON.stringify(metadata)}`);
        return (<div className="add-decision-step">
            <div className="step0">
                <div>Rule Name:</div>
                <InputField
                    value={metadata.ruleName}
                    onChange={(e) => {
                        const newMetadata = { ...this.state.metadata, ruleName: e.target.value };
                        this.setState({ metadata: newMetadata });
                    }}
                />
            </div>
            <div className="step1"><div>Step 1: Add Toplevel</div><ButtonGroup buttons={topLevelOptions} onConfirm={this.handleTopNode} /></div>
            <div className="step2"><div> Step 2: Add / Remove Condition</div><ButtonGroup buttons={factsButton} onConfirm={this.handleChildrenNode} /></div>
            <div className="step3">
                <div> Step 3: Add Action</div>
                <ButtonGroup buttons={this.props.editDecision ? editOutcomeOptions : outcomeOptions} onConfirm={this.handleOutputPanel} />
            </div>
        </div>)
    }

    filterOperatorOptions(operatorOptions, fact = '') {
        console.log(`operatorOptions in function: ${operatorOptions}`);
        console.log(`fact: ${fact}`);

        if (!fact) {
            return operatorOptions;
        }

        let filteredOperatorOptions;
        if (fact !== 'CHARACTERISTICS') {
            // If the fact is not 'abstract', then exclude the 'abstract' operator
            if (operatorOptions && operatorOptions.length > 0) {
                switch (fact) {
                    case 'CONTENT':
                        let keywords = [];
                        filteredOperatorOptions = operatorOptions.filter(option => !keywords.includes(option));
                        break;
                    // Add more cases as needed
                    // Replace 'someOtherFact' with the actual fact value you want to check
                    // Replace 'someOption' with the actual option you want to exclude
                    case 'CHARACTERISTICS':
                        filteredOperatorOptions = abstractOperator;
                        break;
                    default:
                        keywords = ['inList', 'notInList'];
                        filteredOperatorOptions = operatorOptions.filter(option => !keywords.includes(option));
                        break;
                }
                console.log(`filtered (operatorOptions): ${filteredOperatorOptions}`);
            } else {
                console.log(`operatorOptions is empty`);
                filteredOperatorOptions = operatorOptions;
            }
        } else {
            // If the fact is 'abstract', then only allow the 'abstract' operator
            filteredOperatorOptions = operator['abstract'];
        }
        return filteredOperatorOptions;
    }

    fieldPanel() {
        const { attributes, addAttribute, addPathflag } = this.state;
        const attributeOptions = attributes.map(attr => attr.name);
        const attribute = addAttribute.name && attributes.find(attr => attr.name === addAttribute.name);
        let operatorOptions = attribute && operator[attribute.type];
        const { background } = this.context;
        const klNames = this.props.getKlnames();


        const placeholder = addAttribute.operator === 'contains' || addAttribute.operator === 'doesNotContain' ?
            PLACEHOLDER['string'] : PLACEHOLDER[attribute.type]

        return (<Panel>

            <div className={`attributes-header ${background}`}>
                <div className="attr-link" onClick={this.addPath}>
                    <span className="plus-icon" /><span className="text">Add Path</span>
                </div>
            </div>

            <div className="add-field-panel">
                <div>
                    <SelectField
                        options={attributeOptions}
                        onChange={(e) => this.onChangeNewFact(e, 'name')}
                        value={addAttribute.name}
                        error={addAttribute.error.name}
                        label="Facts"
                    />
                </div>
                <div>
                    <SelectField
                        options={addAttribute.name ? this.filterOperatorOptions(operatorOptions, addAttribute.name) : []}
                        onChange={(e) => this.onChangeNewOperator(e, 'operator')}
                        value={addAttribute.operator}
                        error={addAttribute.error.operator}
                        label="Operator"
                    />
                </div>
                {this.state.isOperatorInList ? (
                    <div>
                        <InputField
                            onChange={(value) => {
                                this.onChangeInput(value, 'value');
                                this.setState({ isInputValue: true });
                            }}
                            value={addAttribute.value ? '' : this.state.inputValue}
                            error={addAttribute.error.value}
                            label="Input Value"
                            placeholder={placeholder}
                            disabled={!this.state.isInputValue}
                        />
                        <SelectField
                            options={klNames}
                            onChange={(e) => {
                                this.onChangeInputSelector(e, 'value');
                                this.setState({ isInputValue: false });
                            }}
                            value={this.state.inputValue ? '' : addAttribute.value}
                            error={addAttribute.error.value}
                            label="Or Select a List"
                            disabled={this.state.isInputValue}
                        />

                    </div>
                ) : this.state.isCharacteristics ? (
                    <div>
                        <SelectField
                            options={['true', 'false']}
                            onChange={(e) => this.onChangeInputSelector(e, 'value')}
                            value={addAttribute.value}
                            error={addAttribute.error.value}
                            label="Value"
                        />
                    </div>
                ) : (
                    <div>
                        <InputField
                            onChange={(value) => this.onChangeInput(value, 'value')}
                            value={addAttribute.value}
                            error={addAttribute.error.value}
                            label="Value"
                            placeholder={placeholder}
                        />
                    </div>
                )}
            </div>

            {addPathflag && <div className="add-field-panel half-width">
                <div>
                    {/*<InputField onChange={(value) => this.onChangeNewFact(value, 'path')} value={addAttribute.path}
                        label="Path" placeholder={"Enter path value - dont give prefix ' . ' "}/> */}
                    <SelectField options={attributeOptions} onChange={(e) => this.onChangeNewFact(e, 'path')}
                        value={addAttribute.path} label="Path" />
                </div>
            </div>}

            <div className="btn-group">
                <Button label={'Add'} onConfirm={() => this.handleChildrenNode('Add fact node')} classname="btn-toolbar" type="submit" />
                <Button label={'Cancel'} onConfirm={this.handleFieldCancel} classname="btn-toolbar" />
            </div>
        </Panel>)
    }

    outputPanel() {
        const { outcome: outcomes } = this.state;
        console.log(`Printing outcomes in outputPanel =========> ${JSON.stringify(outcomes)}`);
        const { editDecision } = this.props;
        const { background } = this.context;
        const paramOptions = paramsOptions["param-type"];
        const eventTypes = paramsOptions["event-type"];
        const operators = paramsOptions["operator"];


        return (<Panel>

            <div className={`attributes-header ${background}`}>
                <div className="attr-link" onClick={() => this.addOutcome()}>
                    <span className="plus-icon" /><span className="text">Add More Outcome</span>
                </div>
            </div>

            {outcomes.map((outcome, index) => (
                <div key={index}>
                    <div className="add-field-panel half-width" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <SelectField options={eventTypes} value={outcome.type} onChange={(e) => this.onChangeOutcomeValue(e, 'type', index)} />
                        </div>
                        <div className={`attributes-header ${background}`}>
                            <div className="attr-link" onClick={() => this.addParams(index)} style={{ marginRight: '10px' }}>
                                <span className="plus-icon" /><span className="text">Add Params</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        {outcome.params && Object.keys(outcome.params).map((key, ind) =>
                            <div key={ind} className="add-field-panel" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                marginBottom: '10px',
                                border: '2px solid #ccc', // Add a light grey border for a subtle box effect
                                borderRadius: '8px', // Optional: adds rounded corners for a softer look
                                padding: '15px', // Add some padding inside the box to separate the content from the borders
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)' // Optional: adds a subtle shadow for depth
                            }}>
                                {/* First Row: Key and Operator */}
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <div style={{ flex: 1, marginRight: '10px' }}>
                                        <label style={{ marginRight: '10px' }}>Key</label>
                                        <select value={outcome.params[key].key} onChange={(e) => this.handleOutputParams(e, 'pkey', ind, index)}>
                                            <option value="" disabled selected={!outcome.params[key].key}>Please select</option>
                                            {paramOptions.map((keyOption, keyIndex) =>
                                                <option key={keyIndex} value={keyOption}>{keyOption}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ marginRight: '10px' }}>Operator</label>
                                        <select value={outcome.params[key].operator} onChange={(e) => this.handleOutputParams(e, 'operator', ind, index)}>
                                            <option value="" disabled selected={!outcome.params[key].operator}>Please select</option>
                                            {operators.map((operator, operatorIndex) =>
                                                <option key={operatorIndex} value={operator}>{operator}</option>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                {/* Second Row: Original Value, Target Value, and Remove */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1, marginRight: '10px' }}>
                                        <label style={{ marginRight: '10px' }}>Original Value</label>
                                        <input type="text" onChange={(e) => this.handleOutputParams(e, 'originalValue', ind, index)} value={outcome.params[key].ovalue} disabled={outcome.params[key].operator === 'SET'} />
                                    </div>
                                    <div style={{ flex: 1, marginRight: '10px' }}>
                                        <label style={{ marginRight: '10px' }}>Target Value</label>
                                        <input type="text" onChange={(e) => this.handleOutputParams(e, 'targetValue', ind, index)} value={outcome.params[key].tvalue} />
                                    </div>
                                    <div style={{ flex: 0 }}>
                                        <button onClick={() => this.handleRemoveParam(ind, index)}>Remove</button>
                                    </div>
                                </div>
                            </div>)
                        }
                    </div>
                </div>
            ))}
        </Panel>)
    }

    treePanel() {
        const { node } = this.state;
        const depthCount = getNodeDepth(node);

        return (<Panel>
            <Tree treeData={node} count={depthCount} onConfirm={this.handleActiveNode} />
        </Panel>)
    }


    addPanel() {
        const { enableTreeView, enableFieldView, enableOutcomeView } = this.state;

        return (<div>
            {this.topPanel()}
            {enableFieldView && this.fieldPanel()}
            {enableOutcomeView && this.outputPanel()}
            {enableTreeView && this.treePanel()}
        </div>);

    }

    render() {
        const { buttonProps } = this.props;
        return (
            <form>
                <div className="add-rulecase-wrapper">
                    {this.addPanel()}
                    {this.state.formError && <p className="form-error"> {this.state.formError}</p>}
                    <div className="btn-group">
                        <Button label={buttonProps.primaryLabel} onConfirm={this.handleAdd} classname="primary-btn" type="submit" title="Finalize and set the rule" />
                        <Button label={buttonProps.secondaryLabel} onConfirm={this.handleCancel} classname="cancel-btn" />
                    </div>

                </div>
            </form>
        );
    }
}

AddDecision.contextType = ApperanceContext;

AddDecision.defaultProps = ({
    addCondition: () => false,
    cancel: () => false,
    attribute: {},
    buttonProps: {},
    attributes: [],
    outcome: {},
    editDecision: false,
    editCondition: {},
    getKlNames: () => false
});

AddDecision.propTypes = ({
    addCondition: PropTypes.func,
    cancel: PropTypes.func,
    uploadList: PropTypes.func,
    getKlNames: PropTypes.func,
    attribute: PropTypes.object,
    buttonProps: PropTypes.object,
    attributes: PropTypes.array,
    outcome: PropTypes.object,
    editDecision: PropTypes.bool,
    editCondition: PropTypes.object
});


export default AddDecision;